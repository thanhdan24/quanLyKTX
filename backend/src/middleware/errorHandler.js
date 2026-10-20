'use strict';

function notFoundHandler(req, res) {
  res.status(404).json({ message: 'Không tìm thấy API hoặc trang yêu cầu.' });
}

function errorHandler(error, req, res, next) {
  console.error(error);
  let status = error.status || 500;
  let sqlMessage = error.originalError?.info?.message || error.message || 'Lỗi hệ thống.';
  const number = error.originalError?.info?.number || error.number;
  if (number === 2627 || number === 2601 || /UNIQUE/i.test(sqlMessage)) {
    status = 400;
    sqlMessage = 'Dữ liệu bị trùng. Vui lòng kiểm tra Username, Email, Mã sinh viên, Mã phòng hoặc tên danh mục.';
  }
  if (number === 547 || /REFERENCE constraint/i.test(sqlMessage) || /FOREIGN KEY/i.test(sqlMessage)) {
    status = 400;
    sqlMessage = 'Không thể xóa/cập nhật vì bản ghi đang được dữ liệu khác sử dụng.';
  }
  res.status(status).json({ message: sqlMessage });
}

module.exports = { notFoundHandler, errorHandler };
