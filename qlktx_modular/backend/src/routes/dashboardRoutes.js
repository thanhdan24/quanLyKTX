'use strict';

module.exports = function registerRoutes(app, ctx) {
  const { path, FRONTEND_DIR, sql, poolPromise, auth, allow, asyncHandler, requireFields, assertAllowed, toPositiveInt, toPositiveMoney, normalizeText, sha256, signToken, publicUser, getStudentByUser, confirmedPaid, roomOccupancy, getApplicationForAccess } = ctx;

  app.get('/api/dashboard', auth, asyncHandler(async (req, res) => {
    const pool = await poolPromise;
    const data = {};
    if (req.user.Role === 'STUDENT') {
      const student = await getStudentByUser(pool, req.user.UserID);
      if (!student) return res.json({ cards: [], recent: [] });
      const apps = await pool.request().input('StudentID', sql.Int, student.StudentID).query(`
        SELECT a.*, p.PeriodName, r.RoomCode, b.BuildingName
        FROM Applications a
        JOIN RegistrationPeriods p ON a.PeriodID = p.PeriodID
        LEFT JOIN Rooms r ON a.AssignedRoomID = r.RoomID
        LEFT JOIN Buildings b ON r.BuildingID = b.BuildingID
        WHERE a.StudentID = @StudentID
        ORDER BY a.SubmittedAt DESC
      `);
      const payments = await pool.request().input('StudentID', sql.Int, student.StudentID).query(`
        SELECT pay.* FROM Payments pay
        JOIN Applications a ON pay.ApplicationID = a.ApplicationID
        WHERE a.StudentID = @StudentID
      `);
      data.cards = [
        { label: 'Ho so da nop', value: apps.recordset.length },
        { label: 'Da nhan phong', value: apps.recordset.filter((x) => x.Status === 'CHECKED_IN').length },
        { label: 'Thanh toan cho xac nhan', value: payments.recordset.filter((x) => x.PaymentStatus === 'PENDING').length }
      ];
      data.recent = apps.recordset;
    } else {
      const [apps, payments, requests, rooms] = await Promise.all([
        pool.request().query('SELECT Status, COUNT(*) AS Total FROM Applications GROUP BY Status'),
        pool.request().query('SELECT PaymentStatus, COUNT(*) AS Total, COALESCE(SUM(Amount),0) AS Amount FROM Payments GROUP BY PaymentStatus'),
        pool.request().query('SELECT Status, COUNT(*) AS Total FROM Requests GROUP BY Status'),
        pool.request().query('SELECT RoomStatus, COUNT(*) AS Total FROM Rooms GROUP BY RoomStatus')
      ]);
      const count = (rows, key, value) => rows.find((x) => x[key] === value)?.Total || 0;
      const confirmedAmount = payments.recordset.find((x) => x.PaymentStatus === 'CONFIRMED')?.Amount || 0;
      data.cards = [
        { label: 'Ho so cho duyet', value: count(apps.recordset, 'Status', 'PENDING') },
        { label: 'Da nhan phong', value: count(apps.recordset, 'Status', 'CHECKED_IN') },
        { label: 'Thanh toan cho xac nhan', value: count(payments.recordset, 'PaymentStatus', 'PENDING') },
        { label: 'Tong tien da thu', value: confirmedAmount, money: true },
        { label: 'Yeu cau cho xu ly', value: count(requests.recordset, 'Status', 'PENDING') },
        { label: 'Phong kha dung', value: count(rooms.recordset, 'RoomStatus', 'AVAILABLE') }
      ];
    }
    res.json(data);
  }));

  app.get('/api/me/student', auth, allow('STUDENT'), asyncHandler(async (req, res) => {
    const pool = await poolPromise;
    const result = await pool.request().input('UserID', sql.Int, req.user.UserID).query(`
      SELECT s.*, u.FullName, u.Phone, u.Email, u.Username
      FROM Students s JOIN Users u ON s.UserID = u.UserID
      WHERE s.UserID = @UserID
    `);
    res.json(result.recordset[0] || null);
  }));

  app.put('/api/me/student', auth, allow('STUDENT'), asyncHandler(async (req, res) => {
    const pool = await poolPromise;
    const tx = new sql.Transaction(pool);
    await tx.begin();
    try {
      const student = await getStudentByUser(pool, req.user.UserID);
      if (!student) throw Object.assign(new Error('Khong tim thay ho so sinh vien.'), { status: 404 });
      await new sql.Request(tx)
        .input('UserID', sql.Int, req.user.UserID)
        .input('FullName', sql.NVarChar(120), req.body.FullName || req.user.FullName)
        .input('Phone', sql.VarChar(20), req.body.Phone || null)
        .input('Email', sql.VarChar(120), req.body.Email || null)
        .query('UPDATE Users SET FullName=@FullName, Phone=@Phone, Email=@Email WHERE UserID=@UserID');
      await new sql.Request(tx)
        .input('StudentID', sql.Int, student.StudentID)
        .input('Gender', sql.VarChar(10), req.body.Gender || null)
        .input('DateOfBirth', sql.Date, req.body.DateOfBirth || null)
        .input('Faculty', sql.NVarChar(100), req.body.Faculty || null)
        .input('ClassName', sql.NVarChar(50), req.body.ClassName || null)
        .query(`
          UPDATE Students
          SET Gender=@Gender, DateOfBirth=@DateOfBirth, Faculty=@Faculty, ClassName=@ClassName
          WHERE StudentID=@StudentID
        `);
      await tx.commit();
      res.json({ message: 'Da cap nhat ho so sinh vien.' });
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }));
};
