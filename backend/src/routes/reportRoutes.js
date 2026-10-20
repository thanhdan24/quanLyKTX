'use strict';

module.exports = function registerRoutes(app, ctx) {
  const { path, FRONTEND_DIR, sql, poolPromise, auth, allow, asyncHandler, requireFields, assertAllowed, toPositiveInt, toPositiveMoney, normalizeText, sha256, signToken, publicUser, getStudentByUser, confirmedPaid, roomOccupancy, getApplicationForAccess } = ctx;

  app.get('/api/reports/debts', auth, allow('ACCOUNTANT', 'ADMIN', 'MANAGER'), asyncHandler(async (req, res) => {
    const pool = await poolPromise;
    const request = pool.request();
    const clauses = ['a.TotalAmount IS NOT NULL'];
    if (req.query.periodId) {
      request.input('PeriodID', sql.Int, req.query.periodId);
      clauses.push('a.PeriodID = @PeriodID');
    }
    if (req.query.keyword) {
      request.input('Keyword', sql.NVarChar(120), `%${String(req.query.keyword).trim()}%`);
      clauses.push('(u.FullName LIKE @Keyword OR s.StudentCode LIKE @Keyword)');
    }
    const having = req.query.debtStatus === 'PAID' ? 'HAVING COALESCE(a.TotalAmount,0) - COALESCE(MAX(pay.ConfirmedAmount),0) <= 0'
      : req.query.debtStatus === 'DEBT' ? 'HAVING COALESCE(a.TotalAmount,0) - COALESCE(MAX(pay.ConfirmedAmount),0) > 0'
      : '';
    const result = await request.query(`
      SELECT a.ApplicationID, s.StudentCode, u.FullName AS StudentName, p.PeriodName,
             a.TotalAmount, COALESCE(MAX(pay.ConfirmedAmount),0) AS ConfirmedAmount,
             COALESCE(a.TotalAmount,0) - COALESCE(MAX(pay.ConfirmedAmount),0) AS DebtAmount,
             a.Status
      FROM Applications a
      JOIN Students s ON a.StudentID=s.StudentID
      JOIN Users u ON s.UserID=u.UserID
      JOIN RegistrationPeriods p ON a.PeriodID=p.PeriodID
      LEFT JOIN (
        SELECT ApplicationID, SUM(Amount) AS ConfirmedAmount
        FROM Payments WHERE PaymentStatus='CONFIRMED'
        GROUP BY ApplicationID
      ) pay ON pay.ApplicationID=a.ApplicationID
      WHERE ${clauses.join(' AND ')}
      GROUP BY a.ApplicationID, s.StudentCode, u.FullName, p.PeriodName, a.TotalAmount, a.Status
      ${having}
      ORDER BY DebtAmount DESC, a.ApplicationID DESC
    `);
    res.json(result.recordset);
  }));

  app.get('/api/reports/fees', auth, allow('ACCOUNTANT', 'ADMIN'), asyncHandler(async (req, res) => {
    const pool = await poolPromise;
    const request = pool.request();
    const clauses = ['1=1'];
    if (req.query.periodId) {
      request.input('PeriodID', sql.Int, req.query.periodId);
      clauses.push('a.PeriodID = @PeriodID');
    }
    if (req.query.method) {
      request.input('PaymentMethod', sql.VarChar(20), req.query.method);
      clauses.push('pay.PaymentMethod = @PaymentMethod');
    }
    if (req.query.status) {
      request.input('PaymentStatus', sql.VarChar(20), req.query.status);
      clauses.push('pay.PaymentStatus = @PaymentStatus');
    }
    const result = await request.query(`
      SELECT pay.PaymentMethod, pay.PaymentStatus, COUNT(*) AS TotalTransactions, COALESCE(SUM(pay.Amount),0) AS TotalAmount
      FROM Payments pay
      JOIN Applications a ON pay.ApplicationID=a.ApplicationID
      WHERE ${clauses.join(' AND ')}
      GROUP BY pay.PaymentMethod, pay.PaymentStatus
      ORDER BY pay.PaymentMethod, pay.PaymentStatus
    `);
    res.json(result.recordset);
  }));

  app.get('/api/reports/residence', auth, allow('MANAGER', 'ADMIN'), asyncHandler(async (req, res) => {
    const pool = await poolPromise;
    const request = pool.request();
    const periodJoinFilter = req.query.periodId ? 'AND a.PeriodID = @PeriodID' : '';
    const summaryFilter = req.query.periodId ? 'WHERE PeriodID = @PeriodID' : '';
    if (req.query.periodId) request.input('PeriodID', sql.Int, req.query.periodId);
  
    const rooms = await request.query(`
      SELECT b.BuildingName, r.RoomCode, r.Capacity, r.RoomStatus,
             COUNT(CASE WHEN a.Status IN ('APPROVED','CHECKED_IN') THEN 1 END) AS UsedBeds,
             r.Capacity - COUNT(CASE WHEN a.Status IN ('APPROVED','CHECKED_IN') THEN 1 END) AS AvailableBeds
      FROM Rooms r
      JOIN Buildings b ON r.BuildingID=b.BuildingID
      LEFT JOIN Applications a ON a.AssignedRoomID=r.RoomID ${periodJoinFilter}
      GROUP BY b.BuildingName, r.RoomCode, r.Capacity, r.RoomStatus
      ORDER BY b.BuildingName, r.RoomCode
    `);
    const summary = await pool.request()
      .input('PeriodID', sql.Int, req.query.periodId || null)
      .query(`
        SELECT
          COUNT(*) AS TotalApplications,
          SUM(CASE WHEN Status='APPROVED' THEN 1 ELSE 0 END) AS ApprovedApplications,
          SUM(CASE WHEN Status='CHECKED_IN' THEN 1 ELSE 0 END) AS CheckedInApplications,
          SUM(CASE WHEN Status='PENDING' THEN 1 ELSE 0 END) AS PendingApplications
        FROM Applications
        ${summaryFilter}
      `);
    res.json({ summary: summary.recordset[0] || {}, rooms: rooms.recordset });
  }));
};
