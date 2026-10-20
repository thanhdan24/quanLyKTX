'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const express = require('express');
const { serveFrontend } = require('../src/middleware/serveFrontend');

test('SPA fallback serves direct routes while preserving API and asset errors', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'qlktx-spa-'));
  fs.writeFileSync(path.join(directory, 'index.html'), '<div id="root">React</div>');
  fs.writeFileSync(path.join(directory, 'app.js'), 'console.log("React");');
  const app = express();
  app.get('/api/existing', (req, res) => res.json({ ok: true }));
  serveFrontend(app, directory);
  app.use((req, res) => res.status(404).json({ message: 'Not found' }));
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    for (const route of ['/', '/dang-nhap', '/student-profile', '/manager-apps', '/unknown-page']) {
      const response = await fetch(base + route, { headers: { Accept: 'text/html' } });
      assert.equal(response.status, 200, route);
      assert.match(await response.text(), /id="root"/);
    }
    assert.deepEqual(await (await fetch(base + '/api/existing')).json(), { ok: true });
    const missingApi = await fetch(base + '/api/missing');
    assert.equal(missingApi.status, 404);
    assert.match(missingApi.headers.get('content-type'), /json/);
    const asset = await fetch(base + '/app.js');
    assert.equal(asset.status, 200);
    assert.match(asset.headers.get('content-type'), /javascript/);
    assert.equal((await fetch(base + '/missing.js')).status, 404);
    assert.equal((await fetch(base + '/student-profile', { method: 'POST' })).status, 404);
    fs.unlinkSync(path.join(directory, 'index.html'));
    assert.equal((await fetch(base + '/student-profile')).status, 503);
  } finally {
    await new Promise(resolve => server.close(resolve));
    if (fs.existsSync(path.join(directory, 'index.html'))) fs.unlinkSync(path.join(directory, 'index.html'));
    fs.unlinkSync(path.join(directory, 'app.js'));
    fs.rmdirSync(directory);
  }
});
