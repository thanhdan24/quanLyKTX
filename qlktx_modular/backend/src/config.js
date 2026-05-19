'use strict';

const path = require('path');
require('dotenv').config();

module.exports = {
  PORT: Number(process.env.PORT || 3000),
  APP_SECRET: process.env.APP_SECRET || 'dev-secret-change-me',
  FRONTEND_DIR: path.join(__dirname, '..', '..', 'frontend')
};
