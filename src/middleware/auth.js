const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Check authorization token from cookies (primary) or header (fallback)
  let token = req.cookies && req.cookies.token;
  if (!token) {
    const authHeader = req.headers['authorization'];
    token = authHeader && authHeader.split(' ')[1]; // Bearer <token>
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authorization token required.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'vell_print_tech_secure_jwt_secret_key_2026');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Invalid or expired authorization token.' });
  }
};
