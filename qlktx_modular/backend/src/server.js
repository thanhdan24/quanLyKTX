'use strict';

const app = require('./app');
const { PORT } = require('./config');

app.listen(PORT, () => {
  console.log(`QLKTX backend dang chay tai http://localhost:${PORT}`);
});
