const express = require('express');
const { 
  getProfile, 
  updateProfile, 
  getMyTickets,
  addDependent,
  getDependents,
  removeDependent,
  updateDependent
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { validate, validations } = require('../middleware/validation');

const router = express.Router();

// All routes are protected
router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', validations.updateProfile, validate, updateProfile);
router.get('/tickets', getMyTickets);

// Dependents routes
router.post('/dependents', addDependent);
router.get('/dependents', getDependents);
router.put('/dependents/:dependentId', updateDependent);
router.delete('/dependents/:dependentId', removeDependent);

module.exports = router;


