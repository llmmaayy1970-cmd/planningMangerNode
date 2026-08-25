const sql = require('mssql');
require('dotenv').config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 1433,
  database: process.env.DB_NAME,
  options: {
    encrypt: true, // إجباري للسيرفرات السحابية (مثل Azure أو Aiven)
    trustServerCertificate: true
  }
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => pool)
  .catch(err => console.error('❌ خطأ اتصال MSSQL:', err));

async function query(queryStr, params = {}) {
  const pool = await poolPromise;
  const request = pool.request();
  for (const [key, val] of Object.entries(params)) {
    request.input(key, val);
  }
  return request.query(queryStr);
}

module.exports = { sql, poolPromise, query };
