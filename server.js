const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files (Frontend)
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));

// ===== صفحات مستقلة =====
app.get('/reports.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/reports.html'));
});

app.get('/users.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/users.html'));
});

// Serve frontend for all other routes (SPA)
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, 'public/index.html'));
    }
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'خطأ داخلي في الخادم' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`\n🚀 الخادم يعمل على: http://localhost:${PORT}`);
    console.log(`📊 واجهة المستخدم: http://localhost:${PORT}`);
    console.log(`📈 التقارير: http://localhost:${PORT}/reports.html`);
    console.log(`🔌 API: http://localhost:${PORT}/api\n`);
});