const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * Authenticate middleware - verifies JWT token and attaches user to req
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    next(error);
  }
}

/**
 * Authorize middleware - checks if user has one of the allowed roles
 * @param  {...string} roles - Allowed roles (e.g. 'admin', 'organiser', 'customer')
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: `Role '${req.user.role}' is not authorized. Required: ${roles.join(', ')}`,
      });
    }
    next();
  };
}

module.exports = { authenticate, authorize };
