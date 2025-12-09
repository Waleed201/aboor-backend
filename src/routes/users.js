const express = require('express');
const { getProfile, updateProfile, getMyTickets } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { validate, validations } = require('../middleware/validation');

const router = express.Router();

// All routes are protected
router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', validations.updateProfile, validate, updateProfile);
router.get('/tickets', getMyTickets);

module.exports = router;


