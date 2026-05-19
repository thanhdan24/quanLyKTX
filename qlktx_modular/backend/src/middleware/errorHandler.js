'use strict';

function notFoundHandler(req, res) {
  res.status(404).json({ message: 'Khong tim thay API hoac trang yeu cau.' });
}

function errorHandler(error, req, res, next) {
  console.error(error);
  let status = error.status || 500;
  let sqlMessage = error.originalError?.info?.message || error.message || 'Loi he thong.';
  const number = error.originalError?.info?.number || error.number;
  if (number === 2627 || number === 2601 || /UNIQUE/i.test(sqlMessage)) {
    status = 400;
    sqlMessage = 'Du lieu bi trung. Vui long kiem tra Username, Email, Ma sinh vien, Ma phong hoac ten danh muc.';
  }
  if (number === 547 || /REFERENCE constraint/i.test(sqlMessage) || /FOREIGN KEY/i.test(sqlMessage)) {
    status = 400;
    sqlMessage = 'Khong the xoa/cap nhat vi ban ghi dang duoc du lieu khac su dung.';
  }
  res.status(status).json({ message: sqlMessage });
}

module.exports = { notFoundHandler, errorHandler };
