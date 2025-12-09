// Middleware to check if user is admin
const adminAuth = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ 
      error: 'Access denied',
      message: 'Admin privileges required'
    });
  }
};

module.exports = { adminAuth };


