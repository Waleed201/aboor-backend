const express = require('express');
const {
  bookTicket,
  getTicket,
  processPayment,
  cancelTicket,
  verifyQRCode,
  markTicketAsUsed,
  switchTicketQRCode,
  verifySecondaryQRCode
} = require('../controllers/ticketController');
const { protect } = require('../middleware/auth');
const { adminAuth } = require('../middleware/adminAuth');
const { validate, validations } = require('../middleware/validation');

const router = express.Router();

// Public routes for QR code scanning (scanner app access)
// Scanner sends the QR code string, not the ticket ID
router.post('/switch-qr', switchTicketQRCode);  // Scan QR Code 1 at entrance
router.post('/verify-secondary-qr', verifySecondaryQRCode);  // Scan QR Code 2 at gate

// All other routes require authentication
router.use(protect);

router.post('/book', validations.bookTicket, validate, bookTicket);
router.get('/:id', validations.mongoId, validate, getTicket);
router.post('/:id/payment', validations.mongoId, validate, processPayment);
router.put('/:id/cancel', validations.mongoId, validate, cancelTicket);

// Admin/Staff routes for QR verification
router.post('/verify', adminAuth, verifyQRCode);
router.put('/:id/use', adminAuth, validations.mongoId, validate, markTicketAsUsed);

module.exports = router;


