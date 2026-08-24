const express = require('express');
const router  = express.Router({ mergeParams: true });
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const contentDisposition = require('content-disposition');
const { query, queryOne } = require('../db');
const { authMiddleware } = require('../middleware/auth');
// مجلد الرفع
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// إعداد multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const unique = Date.now() + '_' + Math.round(Math.random() * 1e6);
    const ext    = path.extname(file.originalname);
    cb(null, unique + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = [
    'image/jpeg','image/png','image/gif','image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('نوع الملف غير مسموح'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB
});

// ── GET /api/projects/:id/attachments ────────
router.get('/', authMiddleware, async (req, res) => {
  try {
    const r = await query(
      'SELECT * FROM attachments WHERE project_id=@pid ORDER BY uploaded_at DESC',
      { pid: parseInt(req.params.id) }
    );
    res.json({ success: true, data: r.recordset });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/projects/:id/attachments ───────
router.post('/', authMiddleware, upload.single('file'), async (req, res) => {
  if (!req.file)
    return res.status(400).json({ success: false, message: 'لم يتم رفع أي ملف' });

  try {
    await query(
      `INSERT INTO attachments (project_id, file_name, stored_name, file_type, file_size, uploaded_by)
       VALUES (@pid, @fname, @sname, @ftype, @fsize, @by)`,
      {
        pid:   parseInt(req.params.id),
        fname: Buffer.from(req.file.originalname, 'latin1').toString('utf8'),
        sname: req.file.filename,
        ftype: req.file.mimetype,
        fsize: req.file.size,
        by:    req.user.full_name
      }
    );
    res.json({ success: true, message: 'تم رفع الملف بنجاح' });
  } catch (err) {
    // حذف الملف إذا فشل الحفظ في DB
    fs.unlink(path.join(UPLOAD_DIR, req.file.filename), () => {});
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/projects/:id/attachments/:aid/view ── عرض أو تحميل
// ── GET /api/projects/:id/attachments/:aid/view ── عرض أو تحميل
// ── GET /api/projects/:id/attachments/:aid/view ── عرض أو تحميل
router.get('/:aid/view', (req, res, next) => {
  if (req.query.token && !req.headers['authorization']) {
    req.headers['authorization'] = 'Bearer ' + req.query.token;
  }
  next();
}, authMiddleware, async (req, res) => {
  try {
    const att = await queryOne(
      'SELECT * FROM attachments WHERE id=@aid AND project_id=@pid',
      { aid: parseInt(req.params.aid), pid: parseInt(req.params.id) }
    );
    if (!att) return res.status(404).json({ success: false, message: 'الملف غير موجود' });

    const filePath = path.join(UPLOAD_DIR, att.stored_name);
    if (!fs.existsSync(filePath))
      return res.status(404).json({ success: false, message: 'الملف محذوف من السيرفر' });

    // ترميز اسم الملف باستخدام RFC 5987
    const fileName = att.file_name || 'file';
    // استخدام ASCII فقط للاسم الأساسي
    const asciiName = fileName.replace(/[^\x00-\x7F]/g, '');
    const encodedName = encodeURIComponent(fileName);

    const viewable = ['image/jpeg','image/png','image/gif','image/webp','application/pdf'];
    
    // تعيين الترويسات بشكل صحيح
    if (viewable.includes(att.file_type)) {
      res.setHeader('Content-Type', att.file_type);
    }
    
    // استخدام filename* لتشفير الأحرف غير ASCII
    if (asciiName) {
      res.setHeader(
        'Content-Disposition',
        `${viewable.includes(att.file_type) ? 'inline' : 'attachment'}; filename="${asciiName}"; filename*=UTF-8''${encodedName}`
      );
    } else {
      res.setHeader(
        'Content-Disposition',
        `${viewable.includes(att.file_type) ? 'inline' : 'attachment'}; filename*=UTF-8''${encodedName}`
      );
    }
    
    res.sendFile(filePath);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
// ── DELETE /api/projects/:id/attachments/:aid ─
router.delete('/:aid', authMiddleware, async (req, res) => {
  try {
    const att = await queryOne(
      'SELECT * FROM attachments WHERE id=@aid AND project_id=@pid',
      { aid: parseInt(req.params.aid), pid: parseInt(req.params.id) }
    );
    if (!att) return res.status(404).json({ success: false, message: 'الملف غير موجود' });

    // حذف من السيرفر
    const filePath = path.join(UPLOAD_DIR, att.stored_name);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    // حذف من قاعدة البيانات
    await query('DELETE FROM attachments WHERE id=@aid', { aid: parseInt(req.params.aid) });
    res.json({ success: true, message: 'تم حذف الملف' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


module.exports = router;
