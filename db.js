const mysql = require('mysql2/promise');
require('dotenv').config();

// إنشاء حوض اتصالات (Pool) يتوافق مع Aiven وVercel
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 14775,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false // إجباري لاتصال Aiven الآمن
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// دالة تنفيذ الاستعلامات
async function query(sqlText, params = []) {
  try {
    const [rows] = await pool.execute(sqlText, Array.isArray(params) ? params : Object.values(params));
    return { recordset: rows };
  } catch (err) {
    console.error('❌ خطأ في الاستعلام:', err.message);
    throw err;
  }
}

// دالة جلب عنصر واحد
async function queryOne(sqlText, params = []) {
  const result = await query(sqlText, params);
  return result.recordset[0] || null;
}

module.exports = { pool, query, queryOne };
