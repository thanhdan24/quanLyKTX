'use strict';

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

function requireFields(body, fields) {
  const missing = fields.filter((field) => body[field] === undefined || body[field] === null || String(body[field]).trim() === '');
  if (missing.length) {
    const error = new Error(`Thiếu thông tin bắt buộc: ${missing.join(', ')}`);
    error.status = 400;
    throw error;
  }
}

function assertAllowed(value, allowed, label) {
  if (!allowed.includes(value)) {
    const error = new Error(`${label || 'Giá trị'} không hợp lệ. Giá trị cho phép: ${allowed.join(', ')}`);
    error.status = 400;
    throw error;
  }
}

function toPositiveInt(value, label) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    const error = new Error(`${label || 'Giá trị'} phải là số nguyên dương.`);
    error.status = 400;
    throw error;
  }
  return n;
}

function toPositiveMoney(value, label) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) {
    const error = new Error(`${label || 'Số tiền'} phải lớn hơn 0.`);
    error.status = 400;
    throw error;
  }
  return n;
}

function normalizeText(value) {
  const text = String(value ?? '').trim();
  return text || null;
}

module.exports = { asyncHandler, requireFields, assertAllowed, toPositiveInt, toPositiveMoney, normalizeText };
