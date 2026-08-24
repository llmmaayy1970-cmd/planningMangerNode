const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const { query, queryOne } = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');
require('dotenv').config();

// =============================================
// بيانات الأدمن ثابتة في الكود
// =============================================
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'Admin@2024';

// ── POST /api/auth/login ────────────────────
// صفحة الدخول الواحدة — تتحقق من الأدمن أولاً ثم المستخدمين
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ success: false, message: 'أدخل اسم المستخدم وكلمة المرور' });

  // التحقق من الأدمن
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = jwt.sign(
      { id: 0, username: ADMIN_USERNAME, full_name: 'مدير النظام', status: 'Admin' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES || '8h' }
    );
    return res.json({
      success: true, token,
      user: { id: 0, username: ADMIN_USERNAME, full_name: 'مدير النظام', status: 'Admin' }
    });
  }

  // التحقق من المستخدمين العاديين في قاعدة البيانات
  try {
    const user = await queryOne(
      'SELECT * FROM users WHERE username = @username',
      { username }
    );
    if (!user)
      return res.status(401).json({ success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(401).json({ success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });

    const token = jwt.sign(
      { id: user.id, username: user.username, full_name: user.full_name, status: user.status },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES || '8h' }
    );
    res.json({
      success: true, token,
      user: { id: user.id, username: user.username, full_name: user.full_name, status: user.status }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/auth/users ─────────────────────
router.get('/users', authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, username, full_name, status, created_at FROM users ORDER BY full_name'
    );
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/auth/users ────────────────────
router.post('/users', authMiddleware, adminOnly, async (req, res) => {
  const { username, password, full_name, status } = req.body;
  if (!username || !password)
    return res.status(400).json({ success: false, message: 'اسم المستخدم وكلمة المرور مطلوبان' });
  try {
    const hashed = await bcrypt.hash(password, 10);
    await query(
      `INSERT INTO users (username, password, full_name, status)
       VALUES (@username, @password, @full_name, @status)`,
      { username, password: hashed, full_name: full_name || username, status: status || 'User' }
    );
    res.json({ success: true, message: 'تم إضافة المستخدم بنجاح' });
  } catch (err) {
    if (err.number === 2627 || err.number === 2601)
      return res.status(400).json({ success: false, message: 'اسم المستخدم موجود مسبقاً' });
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/auth/users/:id ─────────────────
router.put('/users/:id', authMiddleware, adminOnly, async (req, res) => {
  const { full_name, password, status } = req.body;
  try {
    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      await query(
        'UPDATE users SET full_name=@full_name, password=@password, status=@status WHERE id=@id',
        { full_name, password: hashed, status, id: parseInt(req.params.id) }
      );
    } else {
      await query(
        'UPDATE users SET full_name=@full_name, status=@status WHERE id=@id',
        { full_name, status, id: parseInt(req.params.id) }
      );
    }
    res.json({ success: true, message: 'تم تحديث المستخدم' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/auth/users/:id ──────────────
router.delete('/users/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    await query('DELETE FROM users WHERE id=@id', { id: parseInt(req.params.id) });
    res.json({ success: true, message: 'تم حذف المستخدم' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
