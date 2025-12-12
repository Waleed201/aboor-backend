const express = require('express');
const {
  bookTicket,
  getTicket,
  processPayment,
  cancelTicket,
  verifyQRCode,
  markTicketAsUsed,
  switchTicketQRCode,
  verifySecondaryQRCode,
  verifyQRCode1,
  verifyQRCode2
} = require('../controllers/ticketController');
const { protect } = require('../middleware/auth');
const { adminAuth } = require('../middleware/adminAuth');
const { validate, validations } = require('../middleware/validation');

const router = express.Router();

// Public routes for QR code scanning (scanner app access)
// Scanner sends the QR code string, not the ticket ID
router.post('/verify-qr1', verifyQRCode1);  // NEW: Scan QR Code 1 at entrance
router.post('/verify-qr2', verifyQRCode2);  // NEW: Scan QR Code 2 at gate
router.post('/switch-qr', switchTicketQRCode);  // LEGACY: Accepts both codes
router.post('/verify-secondary-qr', verifySecondaryQRCode);  // LEGACY: Accepts both codes

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


