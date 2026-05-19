'use strict';

module.exports = function registerRoutes(app, ctx) {
  const { path, FRONTEND_DIR, sql, poolPromise, auth, allow, asyncHandler, requireFields, assertAllowed, toPositiveInt, toPositiveMoney, normalizeText, sha256, signToken, publicUser, getStudentByUser, confirmedPaid, roomOccupancy, getApplicationForAccess } = ctx;

  app.get('/api/applications', auth, asyncHandler(async (req, res) => {
    const pool = await poolPromise;
    const request = pool.request();
    const clauses = ['1=1'];
    if (req.user.Role === 'STUDENT') {
      request.input('UserID', sql.Int, req.user.UserID);
      clauses.push('s.UserID = @UserID');
    }
    if (req.query.status) {
      request.input('Status', sql.VarChar(20), req.query.status);
      clauses.push('a.Status = @Status');
    }
    if (req.query.periodId) {
      request.input('PeriodID', sql.Int, req.query.periodId);
      clauses.push('a.PeriodID = @PeriodID');
    }
    if (req.query.keyword) {
      request.input('Keyword', sql.NVarChar(120), `%${String(req.query.keyword).trim()}%`);
      clauses.push('(u.FullName LIKE @Keyword OR s.StudentCode LIKE @Keyword OR r.RoomCode LIKE @Keyword OR pb.BuildingName LIKE @Keyword OR rb.BuildingName LIKE @Keyword)');
    }
    const result = await request.query(`
      SELECT a.*, s.StudentCode, s.Gender, u.FullName AS StudentName,
             p.PeriodName, pb.BuildingName AS PreferredBuildingName,
             r.RoomCode, rb.BuildingName AS AssignedBuildingName,
             COALESCE(pay.ConfirmedAmount, 0) AS ConfirmedAmount,
             CASE WHEN a.TotalAmount IS NULL THEN NULL ELSE a.TotalAmount - COALESCE(pay.ConfirmedAmount, 0) END AS DebtAmount
      FROM Applications a
      JOIN Students s ON a.StudentID = s.StudentID
      JOIN Users u ON s.UserID = u.UserID
      JOIN RegistrationPeriods p ON a.PeriodID = p.PeriodID
      LEFT JOIN Buildings pb ON a.PreferredBuildingID = pb.BuildingID
      LEFT JOIN Rooms r ON a.AssignedRoomID = r.RoomID
      LEFT JOIN Buildings rb ON r.BuildingID = rb.BuildingID
      LEFT JOIN (
        SELECT ApplicationID, SUM(Amount) AS ConfirmedAmount
        FROM Payments WHERE PaymentStatus='CONFIRMED'
        GROUP BY ApplicationID
      ) pay ON pay.ApplicationID = a.ApplicationID
      WHERE ${clauses.join(' AND ')}
      ORDER BY a.ApplicationID DESC
    `);
    res.json(result.recordset);
  }));

  app.post('/api/applications', auth, allow('STUDENT'), asyncHandler(async (req, res) => {
    requireFields(req.body, ['PeriodID', 'PreferredBuildingID', 'DurationMonths']);
    const durationMonths = toPositiveInt(req.body.DurationMonths, 'So thang dang ky');
    const pool = await poolPromise;
    const student = await getStudentByUser(pool, req.user.UserID);
    if (!student || student.Status !== 'ACTIVE') return res.status(400).json({ message: 'Ho so sinh vien chua hop le.' });
  
    const period = await pool.request().input('PeriodID', sql.Int, req.body.PeriodID).query('SELECT * FROM RegistrationPeriods WHERE PeriodID=@PeriodID');
    const p = period.recordset[0];
    const today = new Date().toISOString().slice(0, 10);
    if (!p || p.Status !== 'OPEN' || today < p.StartDate.toISOString().slice(0, 10) || today > p.EndDate.toISOString().slice(0, 10)) {
      return res.status(400).json({ message: 'Dot dang ky khong mo hoac nam ngoai thoi gian cho phep.' });
    }
  
    const building = await pool.request().input('BuildingID', sql.Int, req.body.PreferredBuildingID).query('SELECT * FROM Buildings WHERE BuildingID=@BuildingID');
    if (!building.recordset[0]) return res.status(400).json({ message: 'Toa nha mong muon khong ton tai.' });
  
    await pool.request()
      .input('StudentID', sql.Int, student.StudentID)
      .input('PeriodID', sql.Int, req.body.PeriodID)
      .input('PreferredBuildingID', sql.Int, req.body.PreferredBuildingID)
      .input('DurationMonths', sql.Int, durationMonths)
      .input('AttachmentUrl', sql.NVarChar(255), normalizeText(req.body.AttachmentUrl))
      .query(`
        INSERT INTO Applications (StudentID, PeriodID, PreferredBuildingID, DurationMonths, AttachmentUrl, Status)
        VALUES (@StudentID, @PeriodID, @PreferredBuildingID, @DurationMonths, @AttachmentUrl, 'PENDING')
      `);
    res.status(201).json({ message: 'Da nop ho so dang ky va cho can bo xu ly.' });
  }));

  app.post('/api/applications/:id/decision', auth, allow('MANAGER'), asyncHandler(async (req, res) => {
    requireFields(req.body, ['Status']);
    if (!['APPROVED', 'REJECTED'].includes(req.body.Status)) return res.status(400).json({ message: 'Trang thai xu ly khong hop le.' });
    const pool = await poolPromise;
    const appRow = await getApplicationForAccess(pool, req.params.id, req.user);
    if (!appRow) return res.status(404).json({ message: 'Khong tim thay ho so.' });
    if (appRow.Status !== 'PENDING') return res.status(400).json({ message: 'Chi duoc duyet hoac tu choi ho so dang o trang thai PENDING.' });
    await pool.request()
      .input('ApplicationID', sql.Int, req.params.id)
      .input('Status', sql.VarChar(20), req.body.Status)
      .input('ApprovedBy', sql.Int, req.user.UserID)
      .input('Note', sql.NVarChar(255), req.body.Note || null)
      .query(`
        UPDATE Applications
        SET Status=@Status, ApprovedBy=@ApprovedBy, ApprovedAt=SYSDATETIME(), Note=@Note
        WHERE ApplicationID=@ApplicationID
      `);
    res.json({ message: req.body.Status === 'APPROVED' ? 'Da duyet ho so.' : 'Da tu choi ho so.' });
  }));

  app.post('/api/applications/:id/assign-room', auth, allow('MANAGER'), asyncHandler(async (req, res) => {
    requireFields(req.body, ['RoomID']);
    const pool = await poolPromise;
    const appRow = await getApplicationForAccess(pool, req.params.id, req.user);
    if (!appRow) return res.status(404).json({ message: 'Khong tim thay ho so.' });
    if (appRow.Status !== 'APPROVED') return res.status(400).json({ message: 'Chi phan phong cho ho so da duyet.' });
  
    const roomResult = await pool.request().input('RoomID', sql.Int, req.body.RoomID).query(`
      SELECT r.*, b.GenderScope AS BuildingGenderScope, b.BuildingName
      FROM Rooms r JOIN Buildings b ON r.BuildingID = b.BuildingID
      WHERE r.RoomID=@RoomID
    `);
    const room = roomResult.recordset[0];
    if (!room || room.RoomStatus !== 'AVAILABLE') return res.status(400).json({ message: 'Phong khong kha dung.' });
    const genderOk = [room.GenderScope, room.BuildingGenderScope].every((scope) => scope === 'ALL' || scope === appRow.Gender || appRow.Gender === 'OTHER');
    if (!genderOk) return res.status(400).json({ message: 'Phong khong phu hop gioi tinh cua sinh vien.' });
    const used = await roomOccupancy(pool, req.body.RoomID);
    if (used >= Number(room.Capacity)) return res.status(400).json({ message: 'Phong da day.' });
  
    const total = Number(appRow.DurationMonths) * Number(room.PricePerMonth);
    const tx = new sql.Transaction(pool);
    await tx.begin();
    try {
      await new sql.Request(tx)
        .input('ApplicationID', sql.Int, req.params.id)
        .input('RoomID', sql.Int, req.body.RoomID)
        .input('TotalAmount', sql.Decimal(18, 2), total)
        .input('Note', sql.NVarChar(255), normalizeText(req.body.Note) || appRow.Note || null)
        .query('UPDATE Applications SET AssignedRoomID=@RoomID, TotalAmount=@TotalAmount, Note=@Note WHERE ApplicationID=@ApplicationID');
      if (used + 1 >= Number(room.Capacity)) {
        await new sql.Request(tx)
          .input('RoomID', sql.Int, req.body.RoomID)
          .query("UPDATE Rooms SET RoomStatus='FULL' WHERE RoomID=@RoomID AND RoomStatus='AVAILABLE'");
      }
      await tx.commit();
    } catch (error) {
      await tx.rollback();
      throw error;
    }
    res.json({ message: 'Da phan phong va tinh tong tien theo cong thuc QD04.', TotalAmount: total });
  }));

  app.post('/api/applications/:id/check-in', auth, allow('MANAGER'), asyncHandler(async (req, res) => {
    const pool = await poolPromise;
    const appRow = await getApplicationForAccess(pool, req.params.id, req.user);
    if (!appRow) return res.status(404).json({ message: 'Khong tim thay ho so.' });
    if (appRow.Status !== 'APPROVED') return res.status(400).json({ message: 'Ho so phai o trang thai da duyet.' });
    if (!appRow.AssignedRoomID) return res.status(400).json({ message: 'Ho so chua duoc phan phong.' });
    const paid = await confirmedPaid(pool, req.params.id);
    if (paid < Number(appRow.TotalAmount || 0)) return res.status(400).json({ message: 'Chua thanh toan du so tien de nhan phong.' });
    await pool.request()
      .input('ApplicationID', sql.Int, req.params.id)
      .input('CheckInDate', sql.Date, req.body.CheckInDate || new Date())
      .query(`
        UPDATE Applications
        SET Status='CHECKED_IN', CheckInDate=@CheckInDate
        WHERE ApplicationID=@ApplicationID
      `);
    res.json({ message: 'Da xac nhan nhan phong.' });
  }));

  app.post('/api/applications/:id/check-out', auth, allow('MANAGER'), asyncHandler(async (req, res) => {
    const pool = await poolPromise;
    const appRow = await getApplicationForAccess(pool, req.params.id, req.user);
    if (!appRow) return res.status(404).json({ message: 'Khong tim thay ho so.' });
    if (appRow.Status !== 'CHECKED_IN') return res.status(400).json({ message: 'Chi tra phong cho ho so da nhan phong.' });
  
    const tx = new sql.Transaction(pool);
    await tx.begin();
    try {
      await new sql.Request(tx)
        .input('ApplicationID', sql.Int, req.params.id)
        .input('CheckOutDate', sql.Date, req.body.CheckOutDate || new Date())
        .query(`
          UPDATE Applications
          SET Status='CHECKED_OUT', CheckOutDate=@CheckOutDate
          WHERE ApplicationID=@ApplicationID
        `);
      if (appRow.AssignedRoomID) {
        await new sql.Request(tx)
          .input('RoomID', sql.Int, appRow.AssignedRoomID)
          .query("UPDATE Rooms SET RoomStatus='AVAILABLE' WHERE RoomID=@RoomID AND RoomStatus='FULL'");
      }
      await tx.commit();
    } catch (error) {
      await tx.rollback();
      throw error;
    }
    res.json({ message: 'Da xac nhan tra phong.' });
  }));
};
