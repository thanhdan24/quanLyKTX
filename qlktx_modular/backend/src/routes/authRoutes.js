'use strict';

module.exports = function registerRoutes(app, ctx) {
  const { path, FRONTEND_DIR, sql, poolPromise, auth, allow, asyncHandler, requireFields, assertAllowed, toPositiveInt, toPositiveMoney, normalizeText, sha256, signToken, publicUser, getStudentByUser, confirmedPaid, roomOccupancy, getApplicationForAccess } = ctx;

  app.get('/', (req, res) => {
    res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
  });

  app.post('/api/auth/login', asyncHandler(async (req, res) => {
    requireFields(req.body, ['username', 'password']);
    const { username, password } = req.body;
    const pool = await poolPromise;
    const result = await pool.request()
      .input('Username', sql.NVarChar(50), String(username).trim())
      .query('SELECT * FROM Users WHERE Username = @Username');
    const row = result.recordset[0];
    if (!row) return res.status(401).json({ message: 'Sai ten dang nhap hoac mat khau.' });
    if (row.Status !== 'ACTIVE') return res.status(403).json({ message: 'Tai khoan dang bi khoa hoac khong hoat dong.' });
  
    const stored = String(row.PasswordHash || '').trim();
    const pass = String(password);
    const ok = stored === pass || stored.toLowerCase() === sha256(pass).toLowerCase();
    if (!ok) return res.status(401).json({ message: 'Sai ten dang nhap hoac mat khau.' });
  
    const user = publicUser(row);
    res.json({ token: signToken(user), user });
  }));

  app.get('/api/auth/me', auth, asyncHandler(async (req, res) => {
    res.json({ user: req.user });
  }));

  app.get('/api/lookups', auth, asyncHandler(async (req, res) => {
    const pool = await poolPromise;
    const [buildings, rooms, periods] = await Promise.all([
      pool.request().query('SELECT * FROM Buildings ORDER BY BuildingName'),
      pool.request().query(`
        SELECT r.*, b.BuildingName
        FROM Rooms r JOIN Buildings b ON r.BuildingID = b.BuildingID
        ORDER BY b.BuildingName, r.RoomCode
      `),
      pool.request().query('SELECT * FROM RegistrationPeriods ORDER BY StartDate DESC')
    ]);
    res.json({ Buildings: buildings.recordset, Rooms: rooms.recordset, RegistrationPeriods: periods.recordset });
  }));
};
