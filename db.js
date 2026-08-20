const sql = require('mssql/msnodesqlv8');
require('dotenv').config();

const config = {
  connectionString: 
    `Driver={SQL Server Native Client 11.0};` +
    `Server=${process.env.DB_SERVER};` +
    `Database=${process.env.DB_NAME};` +
    `Trusted_Connection=yes;`
};

const pool        = new sql.ConnectionPool(config);
const poolConnect = pool.connect();

pool.on('error', err => {
  console.error('❌ خطأ في قاعدة البيانات:', err.message);
});

poolConnect
  .then(() => console.log('✅ تم الاتصال بـ SQL Server (Windows Auth)'))
  .catch(err => {
    console.error('❌ فشل الاتصال:', err.message);
  });

async function query(queryStr, params = {}) {
  await poolConnect;
  const request = pool.request();
  for (const [key, val] of Object.entries(params)) {
    request.input(key, val);
  }
  return request.query(queryStr);
}

async function queryOne(queryStr, params = {}) {
  const result = await query(queryStr, params);
  return result.recordset[0] || null;
}

module.exports = { pool, poolConnect, query, queryOne, sql };
