'use strict';

const { sql, poolPromise } = require('../db');
const { verifyToken, publicUser } = require('../utils/security');

async function auth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    const payload = verifyToken(token);
    if (!payload?.UserID) return res.status(401).json({ message: 'Chưa đăng nhập hoặc token không hợp lệ.' });

    const pool = await poolPromise;
    const result = await pool.request()
      .input('UserID', sql.Int, payload.UserID)
      .query(`
        SELECT UserID, Username, FullName, Role, Phone, Email, Status, CreatedAt
        FROM Users
        WHERE UserID = @UserID
      `);
    const user = result.recordset[0];
    if (!user || user.Status !== 'ACTIVE') return res.status(401).json({ message: 'Tài khoản không còn hoạt động.' });
    req.user = publicUser(user);
    next();
  } catch (error) {
    next(error);
  }
}

function allow(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.Role)) return res.status(403).json({ message: 'Bạn không có quyền thực hiện thao tác này.' });
    next();
  };
}

module.exports = { auth, allow };
