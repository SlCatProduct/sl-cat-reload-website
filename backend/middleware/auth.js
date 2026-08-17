const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production';

/**
 * JWT Authentication Middleware for Admin routes
 */
function authenticateAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'ප්‍රවේශය ප්‍රතික්ෂේප විය. කරුණාකර Login වන්න (Unauthorized access. Token required)'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'මෙම ක්‍රියාව සඳහා Admin අවසරය අවශ්‍ය වේ (Admin privileges required)'
      });
    }

    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'වලංගු නොවන හෝ කල් ඉකුත් වූ Token එකක් (Invalid or expired token)'
    });
  }
}

module.exports = {
  authenticateAdmin,
  JWT_SECRET
};
