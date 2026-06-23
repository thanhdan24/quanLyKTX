'use strict';

module.exports = function registerRoutes(app, ctx) {
  const { path, FRONTEND_DIR, sql, poolPromise, auth, allow, asyncHandler, requireFields, assertAllowed, toPositiveInt, toPositiveMoney, normalizeText, sha256, signToken, publicUser, getStudentByUser, confirmedPaid, roomOccupancy, getApplicationForAccess } = ctx;

  app.get('/api/buildings', auth, asyncHandler(async (req, res) => {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM Buildings ORDER BY BuildingName');
    res.json(result.recordset);
  }));

  app.post('/api/buildings', auth, allow('ADMIN'), asyncHandler(async (req, res) => {
    requireFields(req.body, ['BuildingName', 'GenderScope']);
    const pool = await poolPromise;
    await pool.request()
      .input('BuildingName', sql.NVarChar(100), req.body.BuildingName)
      .input('GenderScope', sql.VarChar(10), req.body.GenderScope)
      .input('Notes', sql.NVarChar(255), req.body.Notes || null)
      .query('INSERT INTO Buildings (BuildingName, GenderScope, Notes) VALUES (@BuildingName, @GenderScope, @Notes)');
    res.status(201).json({ message: 'Đã thêm tòa nhà.' });
  }));

  app.put('/api/buildings/:id', auth, allow('ADMIN'), asyncHandler(async (req, res) => {
    const pool = await poolPromise;
    await pool.request()
      .input('BuildingID', sql.Int, req.params.id)
      .input('BuildingName', sql.NVarChar(100), req.body.BuildingName)
      .input('GenderScope', sql.VarChar(10), req.body.GenderScope)
      .input('Notes', sql.NVarChar(255), req.body.Notes || null)
      .query('UPDATE Buildings SET BuildingName=@BuildingName, GenderScope=@GenderScope, Notes=@Notes WHERE BuildingID=@BuildingID');
    res.json({ message: 'Đã cập nhật tòa nhà.' });
  }));

  app.delete('/api/buildings/:id', auth, allow('ADMIN'), asyncHandler(async (req, res) => {
    const pool = await poolPromise;
    const buildingId = Number(req.params.id);
    const refs = await pool.request().input('BuildingID', sql.Int, buildingId).query(`
      SELECT
        (SELECT COUNT(*) FROM Rooms WHERE BuildingID=@BuildingID) AS RoomCount,
        (SELECT COUNT(*) FROM Applications WHERE PreferredBuildingID=@BuildingID) AS AppCount
    `);
    const r = refs.recordset[0];
    if (Number(r.RoomCount) + Number(r.AppCount) > 0) {
      return res.status(400).json({ message: 'Không thể xóa tòa nhà đã có phòng hoặc hồ sơ đăng ký liên quan. Hãy xóa/chuyển phòng liên quan trước.' });
    }
    const result = await pool.request().input('BuildingID', sql.Int, buildingId).query('DELETE FROM Buildings WHERE BuildingID=@BuildingID');
    if (!result.rowsAffected[0]) return res.status(404).json({ message: 'Không tìm thấy tòa nhà cần xóa.' });
    res.json({ message: 'Đã xóa tòa nhà.' });
  }));

  app.get('/api/rooms', auth, asyncHandler(async (req, res) => {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT r.*, b.BuildingName,
        (SELECT COUNT(*) FROM Applications a WHERE a.AssignedRoomID = r.RoomID AND a.Status IN ('APPROVED','CHECKED_IN')) AS UsedBeds
      FROM Rooms r JOIN Buildings b ON r.BuildingID = b.BuildingID
      ORDER BY b.BuildingName, r.RoomCode
    `);
    res.json(result.recordset);
  }));

  app.post('/api/rooms', auth, allow('ADMIN'), asyncHandler(async (req, res) => {
    requireFields(req.body, ['BuildingID', 'RoomCode', 'Capacity', 'PricePerMonth', 'GenderScope', 'RoomStatus']);
    const pool = await poolPromise;
    await pool.request()
      .input('BuildingID', sql.Int, req.body.BuildingID)
      .input('RoomCode', sql.VarChar(20), req.body.RoomCode)
      .input('FloorNo', sql.Int, req.body.FloorNo || null)
      .input('Capacity', sql.Int, req.body.Capacity)
      .input('PricePerMonth', sql.Decimal(18, 2), req.body.PricePerMonth)
      .input('GenderScope', sql.VarChar(10), req.body.GenderScope)
      .input('RoomStatus', sql.VarChar(20), req.body.RoomStatus)
      .input('Notes', sql.NVarChar(255), req.body.Notes || null)
      .query(`
        INSERT INTO Rooms (BuildingID, RoomCode, FloorNo, Capacity, PricePerMonth, GenderScope, RoomStatus, Notes)
        VALUES (@BuildingID, @RoomCode, @FloorNo, @Capacity, @PricePerMonth, @GenderScope, @RoomStatus, @Notes)
      `);
    res.status(201).json({ message: 'Đã thêm phòng.' });
  }));

  app.put('/api/rooms/:id', auth, allow('ADMIN'), asyncHandler(async (req, res) => {
    const pool = await poolPromise;
    await pool.request()
      .input('RoomID', sql.Int, req.params.id)
      .input('BuildingID', sql.Int, req.body.BuildingID)
      .input('RoomCode', sql.VarChar(20), req.body.RoomCode)
      .input('FloorNo', sql.Int, req.body.FloorNo || null)
      .input('Capacity', sql.Int, req.body.Capacity)
      .input('PricePerMonth', sql.Decimal(18, 2), req.body.PricePerMonth)
      .input('GenderScope', sql.VarChar(10), req.body.GenderScope)
      .input('RoomStatus', sql.VarChar(20), req.body.RoomStatus)
      .input('Notes', sql.NVarChar(255), req.body.Notes || null)
      .query(`
        UPDATE Rooms
        SET BuildingID=@BuildingID, RoomCode=@RoomCode, FloorNo=@FloorNo, Capacity=@Capacity,
            PricePerMonth=@PricePerMonth, GenderScope=@GenderScope, RoomStatus=@RoomStatus, Notes=@Notes
        WHERE RoomID=@RoomID
      `);
    res.json({ message: 'Đã cập nhật phòng.' });
  }));

  app.delete('/api/rooms/:id', auth, allow('ADMIN'), asyncHandler(async (req, res) => {
    const pool = await poolPromise;
    const roomId = Number(req.params.id);
    const refs = await pool.request().input('RoomID', sql.Int, roomId).query('SELECT COUNT(*) AS Total FROM Applications WHERE AssignedRoomID=@RoomID');
    if (Number(refs.recordset[0].Total) > 0) {
      await pool.request().input('RoomID', sql.Int, roomId).query("UPDATE Rooms SET RoomStatus='INACTIVE' WHERE RoomID=@RoomID");
      return res.json({ message: 'Phòng có hồ sơ liên quan nên đã chuyển sang ngừng dùng thay vì xóa vật lý.' });
    }
    const result = await pool.request().input('RoomID', sql.Int, roomId).query('DELETE FROM Rooms WHERE RoomID=@RoomID');
    if (!result.rowsAffected[0]) return res.status(404).json({ message: 'Không tìm thấy phòng cần xóa.' });
    res.json({ message: 'Đã xóa phòng.' });
  }));

  app.get('/api/periods', auth, asyncHandler(async (req, res) => {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM RegistrationPeriods ORDER BY StartDate DESC');
    res.json(result.recordset);
  }));

  app.post('/api/periods', auth, allow('ADMIN'), asyncHandler(async (req, res) => {
    requireFields(req.body, ['PeriodName', 'StartDate', 'EndDate', 'Status']);
    const pool = await poolPromise;
    await pool.request()
      .input('PeriodName', sql.NVarChar(100), req.body.PeriodName)
      .input('StartDate', sql.Date, req.body.StartDate)
      .input('EndDate', sql.Date, req.body.EndDate)
      .input('Status', sql.VarChar(20), req.body.Status)
      .input('Notes', sql.NVarChar(255), req.body.Notes || null)
      .query(`
        INSERT INTO RegistrationPeriods (PeriodName, StartDate, EndDate, Status, Notes)
        VALUES (@PeriodName, @StartDate, @EndDate, @Status, @Notes)
      `);
    res.status(201).json({ message: 'Đã thêm đợt đăng ký.' });
  }));

  app.put('/api/periods/:id', auth, allow('ADMIN'), asyncHandler(async (req, res) => {
    const pool = await poolPromise;
    await pool.request()
      .input('PeriodID', sql.Int, req.params.id)
      .input('PeriodName', sql.NVarChar(100), req.body.PeriodName)
      .input('StartDate', sql.Date, req.body.StartDate)
      .input('EndDate', sql.Date, req.body.EndDate)
      .input('Status', sql.VarChar(20), req.body.Status)
      .input('Notes', sql.NVarChar(255), req.body.Notes || null)
      .query(`
        UPDATE RegistrationPeriods
        SET PeriodName=@PeriodName, StartDate=@StartDate, EndDate=@EndDate, Status=@Status, Notes=@Notes
        WHERE PeriodID=@PeriodID
      `);
    res.json({ message: 'Đã cập nhật đợt đăng ký.' });
  }));

  app.delete('/api/periods/:id', auth, allow('ADMIN'), asyncHandler(async (req, res) => {
    const pool = await poolPromise;
    const periodId = Number(req.params.id);
    const refs = await pool.request().input('PeriodID', sql.Int, periodId).query('SELECT COUNT(*) AS Total FROM Applications WHERE PeriodID=@PeriodID');
    if (Number(refs.recordset[0].Total) > 0) {
      await pool.request().input('PeriodID', sql.Int, periodId).query("UPDATE RegistrationPeriods SET Status='CLOSED' WHERE PeriodID=@PeriodID");
      return res.json({ message: 'Đợt đăng ký có hồ sơ liên quan nên đã đóng đợt thay vì xóa vật lý.' });
    }
    const result = await pool.request().input('PeriodID', sql.Int, periodId).query('DELETE FROM RegistrationPeriods WHERE PeriodID=@PeriodID');
    if (!result.rowsAffected[0]) return res.status(404).json({ message: 'Không tìm thấy đợt đăng ký cần xóa.' });
    res.json({ message: 'Đã xóa đợt đăng ký.' });
  }));
};
