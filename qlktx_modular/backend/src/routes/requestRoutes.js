'use strict';

module.exports = function registerRoutes(app, ctx) {
  const { path, FRONTEND_DIR, sql, poolPromise, auth, allow, asyncHandler, requireFields, assertAllowed, toPositiveInt, toPositiveMoney, normalizeText, sha256, signToken, publicUser, getStudentByUser, confirmedPaid, roomOccupancy, getApplicationForAccess } = ctx;

  app.get('/api/requests', auth, asyncHandler(async (req, res) => {
    const pool = await poolPromise;
    const request = pool.request();
    const clauses = ['1=1'];
    if (req.user.Role === 'STUDENT') {
      request.input('UserID', sql.Int, req.user.UserID);
      clauses.push('s.UserID = @UserID');
    }
    if (req.query.status) {
      request.input('Status', sql.VarChar(20), req.query.status);
      clauses.push('rq.Status = @Status');
    }
    if (req.query.type) {
      request.input('RequestType', sql.VarChar(20), req.query.type);
      clauses.push('rq.RequestType = @RequestType');
    }
    if (req.query.keyword) {
      request.input('Keyword', sql.NVarChar(120), `%${String(req.query.keyword).trim()}%`);
      clauses.push('(u.FullName LIKE @Keyword OR s.StudentCode LIKE @Keyword OR rq.Title LIKE @Keyword OR rq.Content LIKE @Keyword)');
    }
    const result = await request.query(`
      SELECT rq.*, s.StudentCode, u.FullName AS StudentName, a.Status AS ApplicationStatus,
             COALESCE(proc.FullName, '') AS ProcessedByName
      FROM Requests rq
      JOIN Applications a ON rq.ApplicationID = a.ApplicationID
      JOIN Students s ON a.StudentID = s.StudentID
      JOIN Users u ON s.UserID = u.UserID
      LEFT JOIN Users proc ON rq.ProcessedBy = proc.UserID
      WHERE ${clauses.join(' AND ')}
      ORDER BY rq.RequestID DESC
    `);
    res.json(result.recordset);
  }));

  app.post('/api/requests', auth, allow('STUDENT'), asyncHandler(async (req, res) => {
    requireFields(req.body, ['ApplicationID', 'RequestType', 'Title', 'Content']);
    assertAllowed(req.body.RequestType, ['EXTEND', 'TRANSFER', 'CHECKOUT', 'INCIDENT', 'FEEDBACK'], 'Loai yeu cau');
    const pool = await poolPromise;
    const appRow = await getApplicationForAccess(pool, req.body.ApplicationID, req.user);
    if (!appRow) return res.status(404).json({ message: 'Ho so khong ton tai hoac khong thuoc sinh vien dang nhap.' });
    if (!['APPROVED', 'CHECKED_IN'].includes(appRow.Status)) return res.status(400).json({ message: 'Chi gui yeu cau khi ho so da duoc duyet hoac dang o KTX.' });
    await pool.request()
      .input('ApplicationID', sql.Int, req.body.ApplicationID)
      .input('RequestType', sql.VarChar(20), req.body.RequestType)
      .input('Title', sql.NVarChar(150), normalizeText(req.body.Title))
      .input('Content', sql.NVarChar(1000), normalizeText(req.body.Content))
      .query(`
        INSERT INTO Requests (ApplicationID, RequestType, Title, Content, Status)
        VALUES (@ApplicationID, @RequestType, @Title, @Content, 'PENDING')
      `);
    res.status(201).json({ message: 'Da gui yeu cau phat sinh.' });
  }));

  app.post('/api/requests/:id/process', auth, allow('MANAGER'), asyncHandler(async (req, res) => {
    requireFields(req.body, ['Status', 'ResultNote']);
    assertAllowed(req.body.Status, ['APPROVED', 'REJECTED', 'DONE'], 'Trang thai yeu cau');
    const pool = await poolPromise;
    const existing = await pool.request().input('RequestID', sql.Int, req.params.id).query('SELECT * FROM Requests WHERE RequestID=@RequestID');
    const row = existing.recordset[0];
    if (!row) return res.status(404).json({ message: 'Khong tim thay yeu cau.' });
    if (row.Status !== 'PENDING' && row.Status !== 'APPROVED') return res.status(400).json({ message: 'Yeu cau da xu ly xong, khong the xu ly lai.' });
    await pool.request()
      .input('RequestID', sql.Int, req.params.id)
      .input('Status', sql.VarChar(20), req.body.Status)
      .input('ProcessedBy', sql.Int, req.user.UserID)
      .input('ResultNote', sql.NVarChar(255), normalizeText(req.body.ResultNote))
      .query(`
        UPDATE Requests
        SET Status=@Status, ProcessedBy=@ProcessedBy, ProcessedAt=SYSDATETIME(), ResultNote=@ResultNote
        WHERE RequestID=@RequestID
      `);
    res.json({ message: 'Da cap nhat yeu cau.' });
  }));
};
