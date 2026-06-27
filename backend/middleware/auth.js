const jwt = require('jsonwebtoken');

function requireAdmin(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (!token) {
    return res.status(401).json({ success: false, error: 'No token provided' });
  }
  try {
    jwt.verify(token, process.env.ADMIN_SECRET);
    next();
  } catch(err) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}

module.exports = requireAdmin;