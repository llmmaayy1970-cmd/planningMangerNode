const sql = require('mssql');
require('dotenv').config();

// إعدادات الاتصال بـ SQL Server السحابية
const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_HOST, // مثال: myserver.database.windows.net
  port: parseInt(process.env.DB_PORT) || 1433,
  database: process.env.DB_NAME,
  options: {
    encrypt: true, // إجباري لاتصالات السحاب (Azure/AWS)
    trustServerCertificate: true // للتوافق مع الشهادات الذاتية
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

// إدارة حوض الاتصالات لخوادم Serverless (Vercel)
let poolPromise = null;
function getPool() {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(config).connect();
  }
  return poolPromise;
}

// دالة تنفيذ الاستعلامات العامة
async function query(queryStr, params = {}) {
  try {
    const pool = await getPool();
    const request = pool.request();

    if (Array.isArray(params)) {
      params.forEach((val, idx) => {
        request.input(`param${idx}`, val);
      });
    } else if (typeof params === 'object' && params !== null) {
      for (const [key, val] of Object.entries(params)) {
        request.input(key, val);
      }
    }

    const result = await request.query(queryStr);
    return result.recordset;
  } catch (err) {
    console.error('❌ خطأ استعلام SQL Server:', err.message);
    throw err;
  }
}

// دالة جلب عنصر واحد
async function queryOne(queryStr, params = {}) {
  const records = await query(queryStr, params);
  return records && records.length > 0 ? records[0] : null;
}

module.exports = {
  sql,
  getPool,
  query,
  queryOne
};
