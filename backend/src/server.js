'use strict';

const app = require('./app');
const { PORT } = require('./config');

app.listen(PORT, () => {
  console.log(`QLKTX backend đang chạy tại http://localhost:${PORT}`);
});
