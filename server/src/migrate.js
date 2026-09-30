/** Apply the database schema and exit: `npm run migrate` */
require('dotenv').config();
const { migrate, closePool } = require('./db');

migrate()
  .then(() => {
    console.log('[migrate] schema applied ✔');
    return closePool();
  })
  .catch((err) => {
    console.error('[migrate] failed:', err.message);
    process.exitCode = 1;
    return closePool();
  });
