const express = require('express');
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validate, validations } = require('../middleware/validation');

const router = express.Router();

// Public routes
router.post('/register', validations.register, validate, register);
router.post('/login', validations.login, validate, login);

// Protected routes
router.get('/me', protect, getMe);

module.exports = router;


