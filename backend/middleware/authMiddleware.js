const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'edufast_super_secure_jwt_token_secret_key_2026_xyz';

/**
 * Generates signed JWT for authenticated user
 */
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Middleware: Verifies Authorization Bearer JWT
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization || req.headers['authorization'];
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authentication token is required. Please log in.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired session token. Please log in again.'
    });
  }
}

/**
 * Middleware: Role-Based Access Control
 * e.g., requireRole('admin') or requireRole('teacher', 'admin')
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.'
      });
    }

    const userRole = (req.user.role || '').toLowerCase();
    const normalizedRoles = roles.map(r => r.toLowerCase());

    if (!normalizedRoles.includes(userRole) && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: `Access denied. Requires one of roles: [${roles.join(', ')}].`
      });
    }

    return next();
  };
}

/**
 * Middleware: Optional authentication (attaches req.user if token valid, but does not block)
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization || req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch {}
  }
  return next();
}

module.exports = {
  JWT_SECRET,
  generateToken,
  verifyToken,
  requireRole,
  optionalAuth
};
