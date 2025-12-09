const jwt = require('jsonwebtoken');
const User = require('../models/User');
const jwtConfig = require('../config/jwt');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ 
        error: 'Not authorized to access this route',
        message: 'No token provided'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, jwtConfig.secret);

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ 
          error: 'Not authorized',
          message: 'User not found'
        });
      }

      if (!req.user.isActive) {
        return res.status(401).json({ 
          error: 'Not authorized',
          message: 'Account is deactivated'
        });
      }

      next();
    } catch (err) {
      return res.status(401).json({ 
        error: 'Not authorized',
        message: 'Invalid token'
      });
    }
  } catch (error) {
    return res.status(500).json({ 
      error: 'Server error',
      message: error.message
    });
  }
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn
  });
};

module.exports = { protect, generateToken };


