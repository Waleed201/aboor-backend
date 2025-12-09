const express = require('express');
const {
  getMatches,
  getMatch,
  createMatch,
  updateMatch,
  deleteMatch
} = require('../controllers/matchController');
const { protect } = require('../middleware/auth');
const { adminAuth } = require('../middleware/adminAuth');
const { validate, validations } = require('../middleware/validation');

const router = express.Router();

// Public routes
router.get('/', getMatches);
router.get('/:id', validations.mongoId, validate, getMatch);

// Admin routes
router.post('/', protect, adminAuth, validations.createMatch, validate, createMatch);
router.put('/:id', protect, adminAuth, validations.mongoId, validate, updateMatch);
router.delete('/:id', protect, adminAuth, validations.mongoId, validate, deleteMatch);

module.exports = router;


