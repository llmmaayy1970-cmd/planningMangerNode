const sql = require('mssql');

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_HOST,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT) || 1433,
    options: {
        encrypt: true,
        trustServerCertificate: true,
        connectTimeout: 30000,
        requestTimeout: 30000
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('Connected to MSSQL Database successfully');
        return pool;
    })
    .catch(err => {
        console.error('Database Connection Failed:', err);
        throw err;
    });

// دالة مساعدة لتنفيذ الاستعلام وإرجاع أول صف فقط
async function queryOne(queryString, params = {}) {
    const pool = await poolPromise;
    const request = pool.request();
    
    // ربط البرامترات تلقائياً إن وجدت
    Object.keys(params).forEach(key => {
        request.input(key, params[key]);
    });

    const result = await request.query(queryString);
    return result.recordset[0] || null; // إرجاع الصف الأول أو null
}

module.exports = {
    sql,
    poolPromise,
    queryOne // <-- تأكد من إضافة queryOne للتصدير
};
