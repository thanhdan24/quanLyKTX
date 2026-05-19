'use strict';

async function getStudentByUser(pool, sql, userId) {
  const result = await pool.request()
    .input('UserID', sql.Int, userId)
    .query('SELECT * FROM Students WHERE UserID = @UserID');
  return result.recordset[0] || null;
}

async function confirmedPaid(pool, sql, applicationId) {
  const result = await pool.request()
    .input('ApplicationID', sql.Int, applicationId)
    .query(`
      SELECT COALESCE(SUM(Amount), 0) AS Paid
      FROM Payments
      WHERE ApplicationID = @ApplicationID AND PaymentStatus = 'CONFIRMED'
    `);
  return Number(result.recordset[0]?.Paid || 0);
}

async function roomOccupancy(pool, sql, roomId) {
  const result = await pool.request()
    .input('RoomID', sql.Int, roomId)
    .query(`
      SELECT COUNT(*) AS UsedBeds
      FROM Applications
      WHERE AssignedRoomID = @RoomID AND Status IN ('APPROVED', 'CHECKED_IN')
    `);
  return Number(result.recordset[0]?.UsedBeds || 0);
}

async function getApplicationForAccess(pool, sql, applicationId, user) {
  const request = pool.request().input('ApplicationID', sql.Int, applicationId);
  let query = `
    SELECT a.*, s.UserID AS StudentUserID, s.StudentCode, s.Gender, u.FullName AS StudentName
    FROM Applications a
    JOIN Students s ON a.StudentID = s.StudentID
    JOIN Users u ON s.UserID = u.UserID
    WHERE a.ApplicationID = @ApplicationID
  `;
  if (user.Role === 'STUDENT') {
    request.input('UserID', sql.Int, user.UserID);
    query += ' AND s.UserID = @UserID';
  }
  const result = await request.query(query);
  return result.recordset[0] || null;
}

module.exports = { getStudentByUser, confirmedPaid, roomOccupancy, getApplicationForAccess };
