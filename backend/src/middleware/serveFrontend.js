'use strict';

const fs = require('node:fs');
const path = require('node:path');
const express = require('express');

function serveFrontend(app, frontendDir) {
  // Unknown API endpoints must keep returning JSON, never the React HTML shell.
  app.use('/api', (req, res) => res.status(404).json({ message: 'Không tìm thấy API yêu cầu.' }));
  app.use(express.static(frontendDir, { index: false }));
  app.get('*', (req, res, next) => {
    if (path.extname(req.path) || !req.accepts('html')) return next();
    const index = path.join(frontendDir, 'index.html');
    if (!fs.existsSync(index)) {
      return res.status(503).type('text').send('Chưa có bản build React. Chạy npm install và npm run build trong thư mục frontend, sau đó tải lại trang.');
    }
    res.sendFile(index);
  });
}

module.exports = { serveFrontend };
