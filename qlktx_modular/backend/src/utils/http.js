'use strict';

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

function requireFields(body, fields) {
  const missing = fields.filter((field) => body[field] === undefined || body[field] === null || String(body[field]).trim() === '');
  if (missing.length) {
    const error = new Error(`Thieu thong tin bat buoc: ${missing.join(', ')}`);
    error.status = 400;
    throw error;
  }
}

function assertAllowed(value, allowed, label) {
  if (!allowed.includes(value)) {
    const error = new Error(`${label || 'Gia tri'} khong hop le. Gia tri cho phep: ${allowed.join(', ')}`);
    error.status = 400;
    throw error;
  }
}

function toPositiveInt(value, label) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    const error = new Error(`${label || 'Gia tri'} phai la so nguyen duong.`);
    error.status = 400;
    throw error;
  }
  return n;
}

function toPositiveMoney(value, label) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) {
    const error = new Error(`${label || 'So tien'} phai lon hon 0.`);
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
