const jwt = require('jsonwebtoken');
const User = require('../models/user');

// ✅ Middleware verifikasi token login
const verifyToken = async (req, res, next) => {
  const bearer = req.headers.authorization;
  if (!bearer || !bearer.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token tidak ditemukan' });
  }

  const token = bearer.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ message: 'Pengguna tidak ditemukan' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token tidak valid' });
  }
};

// ✅ Middleware khusus admin
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Akses ditolak: Bukan admin' });
  }
  next();
};

// ✅ Middleware gabungan
const verifyTokenAdmin = [verifyToken, isAdmin];


module.exports = {
  verifyToken,
  isAdmin,
  verifyTokenAdmin
};