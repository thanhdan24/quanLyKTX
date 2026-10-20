'use strict';

const crypto = require('crypto');
const { APP_SECRET } = require('../config');

function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function base64url(input) {
  return Buffer.from(input).toString('base64url');
}

function signToken(payload) {
  const body = base64url(JSON.stringify({ ...payload, iat: Date.now() }));
  const signature = crypto.createHmac('sha256', APP_SECRET).update(body).digest('base64url');
  return `${body}.${signature}`;
}

function verifyToken(token) {
  if (!token || !token.includes('.')) return null;
  const [body, signature] = token.split('.');
  const expected = crypto.createHmac('sha256', APP_SECRET).update(body).digest('base64url');
  if (!signature || signature.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  return JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
}

function publicUser(row) {
  if (!row) return null;
  return {
    UserID: row.UserID,
    Username: row.Username,
    FullName: row.FullName,
    Role: row.Role,
    Phone: row.Phone,
    Email: row.Email,
    Status: row.Status,
    CreatedAt: row.CreatedAt
  };
}

module.exports = { sha256, signToken, verifyToken, publicUser };
