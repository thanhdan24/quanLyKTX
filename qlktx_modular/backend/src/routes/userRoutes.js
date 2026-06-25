'use strict';

module.exports = function registerRoutes(app, ctx) {
  const { path, FRONTEND_DIR, sql, poolPromise, auth, allow, asyncHandler, requireFields, assertAllowed, toPositiveInt, toPositiveMoney, normalizeText, sha256, signToken, publicUser, getStudentByUser, confirmedPaid, roomOccupancy, getApplicationForAccess } = ctx;

  app.get('/api/users', auth, allow('ADMIN'), asyncHandler(async (req, res) => {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT UserID, Username, FullName, Role, Phone, Email, Status, CreatedAt
      FROM Users
      ORDER BY UserID DESC
    `);
    res.json(result.recordset);
  }));

  app.post('/api/users', auth, allow('ADMIN'), asyncHandler(async (req, res) => {
    requireFields(req.body, ['Username', 'Password', 'FullName', 'Role']);
    assertAllowed(req.body.Role, ['STUDENT', 'MANAGER', 'ACCOUNTANT', 'ADMIN'], 'Vai tro');
    assertAllowed(req.body.Status || 'ACTIVE', ['ACTIVE', 'INACTIVE', 'LOCKED'], 'Trạng thái tài khoản');
  
    const pool = await poolPromise;
    const tx = new sql.Transaction(pool);
    await tx.begin();
    try {
      const created = await new sql.Request(tx)
        .input('Username', sql.NVarChar(50), normalizeText(req.body.Username))
        .input('PasswordHash', sql.NVarChar(255), sha256(req.body.Password))
        .input('FullName', sql.NVarChar(120), normalizeText(req.body.FullName))
        .input('Role', sql.VarChar(20), req.body.Role)
        .input('Phone', sql.VarChar(20), normalizeText(req.body.Phone))
        .input('Email', sql.VarChar(120), normalizeText(req.body.Email))
        .input('Status', sql.VarChar(20), req.body.Status || 'ACTIVE')
        .query(`
          INSERT INTO Users (Username, PasswordHash, FullName, Role, Phone, Email, Status)
          OUTPUT INSERTED.UserID
          VALUES (@Username, @PasswordHash, @FullName, @Role, @Phone, @Email, @Status)
        `);
      const userId = created.recordset[0].UserID;
  
      // UC12: khi tạo tài khoản sinh viên, có thể tạo luôn hồ sơ Students tương ứng.
      if (req.body.Role === 'STUDENT') {
        requireFields(req.body, ['StudentCode']);
        assertAllowed(req.body.Gender || 'OTHER', ['MALE', 'FEMALE', 'OTHER'], 'Gioi tinh');
        await new sql.Request(tx)
          .input('UserID', sql.Int, userId)
          .input('StudentCode', sql.VarChar(20), normalizeText(req.body.StudentCode))
          .input('Gender', sql.VarChar(10), req.body.Gender || 'OTHER')
          .input('DateOfBirth', sql.Date, normalizeText(req.body.DateOfBirth))
          .input('Faculty', sql.NVarChar(100), normalizeText(req.body.Faculty))
          .input('ClassName', sql.NVarChar(50), normalizeText(req.body.ClassName))
          .input('Status', sql.VarChar(20), 'ACTIVE')
          .query(`
            INSERT INTO Students (UserID, StudentCode, Gender, DateOfBirth, Faculty, ClassName, Status)
            VALUES (@UserID, @StudentCode, @Gender, @DateOfBirth, @Faculty, @ClassName, @Status)
          `);
      }
  
      await tx.commit();
      res.status(201).json({ message: req.body.Role === 'STUDENT' ? 'Đã tạo tài khoản và hồ sơ sinh viên.' : 'Đã tạo tài khoản.', UserID: userId });
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }));

  app.put('/api/users/:id', auth, allow('ADMIN'), asyncHandler(async (req, res) => {
    const pool = await poolPromise;
    const request = pool.request()
      .input('UserID', sql.Int, req.params.id)
      .input('FullName', sql.NVarChar(120), req.body.FullName)
      .input('Role', sql.VarChar(20), req.body.Role)
      .input('Phone', sql.VarChar(20), req.body.Phone || null)
      .input('Email', sql.VarChar(120), req.body.Email || null)
      .input('Status', sql.VarChar(20), req.body.Status || 'ACTIVE');
    let setPassword = '';
    if (req.body.Password) {
      request.input('PasswordHash', sql.NVarChar(255), sha256(req.body.Password));
      setPassword = ', PasswordHash=@PasswordHash';
    }
    await request.query(`
      UPDATE Users
      SET FullName=@FullName, Role=@Role, Phone=@Phone, Email=@Email, Status=@Status ${setPassword}
      WHERE UserID=@UserID
    `);
    res.json({ message: 'Đã cập nhật tài khoản.' });
  }));

  app.delete('/api/users/:id', auth, allow('ADMIN'), asyncHandler(async (req, res) => {
    const userId = Number(req.params.id);
    if (userId === req.user.UserID) {
      return res.status(400).json({ message: 'Không thể xóa/khóa tài khoản đang đăng nhập.' });
    }
    const pool = await poolPromise;
    const refs = await pool.request()
      .input('UserID', sql.Int, userId)
      .query(`
        SELECT
          (SELECT COUNT(*) FROM Students WHERE UserID=@UserID) AS StudentCount,
          (SELECT COUNT(*) FROM Applications WHERE ApprovedBy=@UserID) AS ApprovedCount,
          (SELECT COUNT(*) FROM Payments WHERE ConfirmedBy=@UserID) AS PaymentCount,
          (SELECT COUNT(*) FROM Requests WHERE ProcessedBy=@UserID) AS RequestCount
      `);
    const r = refs.recordset[0];
    const hasRefs = Number(r.StudentCount) + Number(r.ApprovedCount) + Number(r.PaymentCount) + Number(r.RequestCount) > 0;
    if (hasRefs) {
      await pool.request().input('UserID', sql.Int, userId).query("UPDATE Users SET Status='LOCKED' WHERE UserID=@UserID");
      return res.json({ message: 'Tài khoản có dữ liệu liên quan nên đã được khóa thay vì xóa vật lý.' });
    }
    const result = await pool.request().input('UserID', sql.Int, userId).query('DELETE FROM Users WHERE UserID=@UserID');
    if (!result.rowsAffected[0]) return res.status(404).json({ message: 'Không tìm thấy tài khoản cần xóa.' });
    res.json({ message: 'Đã xóa tài khoản.' });
  }));

  app.get('/api/students', auth, allow('ADMIN', 'MANAGER', 'ACCOUNTANT'), asyncHandler(async (req, res) => {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT s.*, u.Username, u.FullName, u.Phone, u.Email
      FROM Students s JOIN Users u ON s.UserID = u.UserID
      ORDER BY s.StudentID DESC
    `);
    res.json(result.recordset);
  }));

  app.post('/api/students', auth, allow('ADMIN'), asyncHandler(async (req, res) => {
    requireFields(req.body, ['UserID', 'StudentCode']);
    const pool = await poolPromise;
    await pool.request()
      .input('UserID', sql.Int, req.body.UserID)
      .input('StudentCode', sql.VarChar(20), req.body.StudentCode)
      .input('Gender', sql.VarChar(10), req.body.Gender || null)
      .input('DateOfBirth', sql.Date, req.body.DateOfBirth || null)
      .input('Faculty', sql.NVarChar(100), req.body.Faculty || null)
      .input('ClassName', sql.NVarChar(50), req.body.ClassName || null)
      .input('Status', sql.VarChar(20), req.body.Status || 'ACTIVE')
      .query(`
        INSERT INTO Students (UserID, StudentCode, Gender, DateOfBirth, Faculty, ClassName, Status)
        VALUES (@UserID, @StudentCode, @Gender, @DateOfBirth, @Faculty, @ClassName, @Status)
      `);
    res.status(201).json({ message: 'Đã tạo hồ sơ sinh viên.' });
  }));

  app.put('/api/students/:id', auth, allow('ADMIN'), asyncHandler(async (req, res) => {
    const pool = await poolPromise;
    await pool.request()
      .input('StudentID', sql.Int, req.params.id)
      .input('StudentCode', sql.VarChar(20), req.body.StudentCode)
      .input('Gender', sql.VarChar(10), req.body.Gender || null)
      .input('DateOfBirth', sql.Date, req.body.DateOfBirth || null)
      .input('Faculty', sql.NVarChar(100), req.body.Faculty || null)
      .input('ClassName', sql.NVarChar(50), req.body.ClassName || null)
      .input('Status', sql.VarChar(20), req.body.Status || 'ACTIVE')
      .query(`
        UPDATE Students
        SET StudentCode=@StudentCode, Gender=@Gender, DateOfBirth=@DateOfBirth,
            Faculty=@Faculty, ClassName=@ClassName, Status=@Status
        WHERE StudentID=@StudentID
      `);
    res.json({ message: 'Đã cập nhật sinh viên.' });
  }));

  app.delete('/api/students/:id', auth, allow('ADMIN'), asyncHandler(async (req, res) => {
    const pool = await poolPromise;
    const studentId = Number(req.params.id);
    const refs = await pool.request().input('StudentID', sql.Int, studentId).query('SELECT COUNT(*) AS Total FROM Applications WHERE StudentID=@StudentID');
    if (Number(refs.recordset[0].Total) > 0) {
      await pool.request().input('StudentID', sql.Int, studentId).query("UPDATE Students SET Status='INACTIVE' WHERE StudentID=@StudentID");
      return res.json({ message: 'Sinh viên có hồ sơ đăng ký liên quan nên đã chuyển sang ngừng hoạt động.' });
    }
    const result = await pool.request().input('StudentID', sql.Int, studentId).query('DELETE FROM Students WHERE StudentID=@StudentID');
    if (!result.rowsAffected[0]) return res.status(404).json({ message: 'Không tìm thấy sinh viên cần xóa.' });
    res.json({ message: 'Đã xóa sinh viên.' });
  }));
};
