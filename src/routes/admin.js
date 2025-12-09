const express = require('express');
const {
  getAllBookings,
  getAnalytics,
  updateTicketStatus,
  getAllUsers
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { adminAuth } = require('../middleware/adminAuth');
const { validate, validations } = require('../middleware/validation');

const router = express.Router();

// All routes require authentication and admin role
router.use(protect);
router.use(adminAuth);

router.get('/bookings', getAllBookings);
router.get('/analytics', getAnalytics);
router.put('/tickets/:id/status', validations.mongoId, validate, updateTicketStatus);
router.get('/users', getAllUsers);

module.exports = router;


