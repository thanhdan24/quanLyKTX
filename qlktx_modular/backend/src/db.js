'use strict';

const sql = require('mssql');
require('dotenv').config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_DATABASE || 'QLKTX_RutGon',
  options: {
    encrypt: String(process.env.DB_ENCRYPT || 'false').toLowerCase() === 'true',
    trustServerCertificate: String(process.env.DB_TRUST_SERVER_CERTIFICATE || 'true').toLowerCase() === 'true'
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

if (process.env.DB_PORT) {
  config.port = Number(process.env.DB_PORT);
}

if (process.env.DB_INSTANCE) {
  config.options.instanceName = process.env.DB_INSTANCE;
  delete config.port;
}

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then((pool) => {
    console.log('Đã kết nối SQL Server:', config.server, config.database);
    return pool;
  })
  .catch((error) => {
    console.error('Lỗi kết nối SQL Server:', error.message);
    throw error;
  });

module.exports = { sql, poolPromise };
