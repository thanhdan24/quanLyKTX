'use strict';

module.exports = function registerRoutes(app, ctx) {
  const { path, FRONTEND_DIR, sql, poolPromise, auth, allow, asyncHandler, requireFields, assertAllowed, toPositiveInt, toPositiveMoney, normalizeText, sha256, signToken, publicUser, getStudentByUser, confirmedPaid, roomOccupancy, getApplicationForAccess } = ctx;

  app.get('/api/payments', auth, asyncHandler(async (req, res) => {
    const pool = await poolPromise;
    const request = pool.request();
    const clauses = ['1=1'];
    if (req.user.Role === 'STUDENT') {
      request.input('UserID', sql.Int, req.user.UserID);
      clauses.push('s.UserID = @UserID');
    }
    if (req.query.status) {
      request.input('PaymentStatus', sql.VarChar(20), req.query.status);
      clauses.push('pay.PaymentStatus = @PaymentStatus');
    }
    if (req.query.method) {
      request.input('PaymentMethod', sql.VarChar(20), req.query.method);
      clauses.push('pay.PaymentMethod = @PaymentMethod');
    }
    if (req.query.keyword) {
      request.input('Keyword', sql.NVarChar(120), `%${String(req.query.keyword).trim()}%`);
      clauses.push('(u.FullName LIKE @Keyword OR s.StudentCode LIKE @Keyword OR pay.TransactionCode LIKE @Keyword)');
    }
    const result = await request.query(`
      SELECT pay.*, a.TotalAmount, a.Status AS ApplicationStatus, s.StudentCode, u.FullName AS StudentName,
             COALESCE(conf.FullName, '') AS ConfirmedByName
      FROM Payments pay
      JOIN Applications a ON pay.ApplicationID = a.ApplicationID
      JOIN Students s ON a.StudentID = s.StudentID
      JOIN Users u ON s.UserID = u.UserID
      LEFT JOIN Users conf ON pay.ConfirmedBy = conf.UserID
      WHERE ${clauses.join(' AND ')}
      ORDER BY pay.PaymentID DESC
    `);
    res.json(result.recordset);
  }));

  app.post('/api/payments', auth, allow('STUDENT'), asyncHandler(async (req, res) => {
    requireFields(req.body, ['ApplicationID', 'Amount', 'PaymentMethod']);
    assertAllowed(req.body.PaymentMethod, ['CASH', 'TRANSFER', 'ONLINE'], 'Phương thức thanh toán');
    const amount = toPositiveMoney(req.body.Amount, 'Số tiền thanh toán');
    if (['TRANSFER', 'ONLINE'].includes(req.body.PaymentMethod) && !normalizeText(req.body.TransactionCode)) {
      return res.status(400).json({ message: 'Thanh toan chuyen khoan/truc tuyen phai co ma giao dich.' });
    }
    const pool = await poolPromise;
    const appRow = await getApplicationForAccess(pool, req.body.ApplicationID, req.user);
    if (!appRow) return res.status(404).json({ message: 'Hồ sơ không tồn tại hoặc không thuộc sinh viên đang đăng nhập.' });
    if (!appRow.TotalAmount) return res.status(400).json({ message: 'Hồ sơ chưa có tổng tiền, vui lòng chờ cán bộ phân phòng.' });
    if (!['APPROVED', 'CHECKED_IN'].includes(appRow.Status)) return res.status(400).json({ message: 'Chỉ gửi thanh toán cho hồ sơ đã duyệt hoặc đang ở KTX.' });
    await pool.request()
      .input('ApplicationID', sql.Int, req.body.ApplicationID)
      .input('Amount', sql.Decimal(18, 2), amount)
      .input('PaymentMethod', sql.VarChar(20), req.body.PaymentMethod)
      .input('TransactionCode', sql.VarChar(50), normalizeText(req.body.TransactionCode))
      .input('Note', sql.NVarChar(255), normalizeText(req.body.Note))
      .query(`
        INSERT INTO Payments (ApplicationID, Amount, PaymentMethod, TransactionCode, PaymentStatus, PaidAt, Note)
        VALUES (@ApplicationID, @Amount, @PaymentMethod, @TransactionCode, 'PENDING', SYSDATETIME(), @Note)
      `);
    res.status(201).json({ message: 'Đã gửi thông tin thanh toán, chờ kế toán xác nhận.' });
  }));

  app.post('/api/payments/:id/confirm', auth, allow('ACCOUNTANT'), asyncHandler(async (req, res) => {
    requireFields(req.body, ['PaymentStatus']);
    assertAllowed(req.body.PaymentStatus, ['CONFIRMED', 'REJECTED'], 'Trạng thái thanh toán');
    const pool = await poolPromise;
    const payment = await pool.request().input('PaymentID', sql.Int, req.params.id).query('SELECT * FROM Payments WHERE PaymentID=@PaymentID');
    const row = payment.recordset[0];
    if (!row) return res.status(404).json({ message: 'Không tìm thấy thanh toán.' });
    if (row.PaymentStatus !== 'PENDING') return res.status(400).json({ message: 'Chỉ đối soát thanh toán đang chờ xác nhận.' });
    if (Number(row.Amount) <= 0 || !row.PaymentMethod || !row.ApplicationID) return res.status(400).json({ message: 'Thanh toán thiếu Amount, PaymentMethod hoặc hồ sơ liên quan.' });
    if (['TRANSFER', 'ONLINE'].includes(row.PaymentMethod) && !normalizeText(row.TransactionCode)) {
      return res.status(400).json({ message: 'Thanh toán chuyển khoản/trực tuyến phải có mã giao dịch mới được xác nhận.' });
    }
    await pool.request()
      .input('PaymentID', sql.Int, req.params.id)
      .input('PaymentStatus', sql.VarChar(20), req.body.PaymentStatus)
      .input('ConfirmedBy', sql.Int, req.user.UserID)
      .input('Note', sql.NVarChar(255), normalizeText(req.body.Note))
      .query(`
        UPDATE Payments
        SET PaymentStatus=@PaymentStatus, ConfirmedBy=@ConfirmedBy, PaidAt=SYSDATETIME(), Note=COALESCE(@Note, Note)
        WHERE PaymentID=@PaymentID
      `);
    res.json({ message: req.body.PaymentStatus === 'CONFIRMED' ? 'Đã xác nhận thanh toán.' : 'Đã từ chối thanh toán.' });
  }));
};
