const jwt = require('jsonwebtoken');
require('dotenv').config();

/** يتحقق من وجود وصحة JWT في الـ Authorization header */
const authMiddleware = (req, res, next) => {
  const header = req.headers['authorization'];
  const token  = header && header.split(' ')[1];

  if (!token)
    return res.status(401).json({ success: false, message: 'غير مصرح — يجب تسجيل الدخول' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(403).json({ success: false, message: 'الجلسة منتهية — يرجى تسجيل الدخول مجدداً' });
  }
};

/** يسمح فقط للمدير */
const adminOnly = (req, res, next) => {
  if (req.user?.status !== 'Admin')
    return res.status(403).json({ success: false, message: 'هذه العملية للمدير فقط' });
  next();
};

module.exports = { authMiddleware, adminOnly };
