const User = require('../models/User');
const Ticket = require('../models/Ticket');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getProfile = async (req, res, next) => {
  try {
    res.json({
      success: true,
      user: req.user.toPublicProfile()
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { name, email, phone, favoriteTeam } = req.body;

    // Build update object
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (favoriteTeam !== undefined) updateData.favoriteTeam = favoriteTeam;

    // Update user
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: user.toPublicProfile()
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's tickets
// @route   GET /api/users/tickets
// @access  Private
const getMyTickets = async (req, res, next) => {
  try {
    const tickets = await Ticket.find({ 
      userId: req.user._id,
      status: { $in: ['reserved', 'active'] }
    })
      .populate('matchId')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: tickets.length,
      tickets
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a dependent
// @route   POST /api/users/dependents
// @access  Private
const addDependent = async (req, res, next) => {
  try {
    const { name, nationalId } = req.body;

    // Validation
    if (!name || !nationalId) {
      return res.status(400).json({
        success: false,
        message: 'Name and National ID are required'
      });
    }

    // Validate national ID format
    if (!/^\d{10}$/.test(nationalId)) {
      return res.status(400).json({
        success: false,
        message: 'National ID must be 10 digits'
      });
    }

    // Check if dependent with this national ID already exists for this user
    const user = await User.findById(req.user._id);
    const existingDependent = user.dependents.find(
      dep => dep.nationalId === nationalId
    );

    if (existingDependent) {
      return res.status(400).json({
        success: false,
        message: 'A dependent with this National ID already exists'
      });
    }

    // Add dependent
    user.dependents.push({
      name: name.trim(),
      nationalId
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'Dependent added successfully',
      user: user.toPublicProfile()
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all dependents
// @route   GET /api/users/dependents
// @access  Private
const getDependents = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    res.json({
      success: true,
      count: user.dependents.length,
      dependents: user.dependents
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove a dependent
// @route   DELETE /api/users/dependents/:dependentId
// @access  Private
const removeDependent = async (req, res, next) => {
  try {
    const { dependentId } = req.params;

    const user = await User.findById(req.user._id);

    // Find and remove the dependent
    const dependentIndex = user.dependents.findIndex(
      dep => dep._id.toString() === dependentId
    );

    if (dependentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Dependent not found'
      });
    }

    user.dependents.splice(dependentIndex, 1);
    await user.save();

    res.json({
      success: true,
      message: 'Dependent removed successfully',
      user: user.toPublicProfile()
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a dependent
// @route   PUT /api/users/dependents/:dependentId
// @access  Private
const updateDependent = async (req, res, next) => {
  try {
    const { dependentId } = req.params;
    const { name, nationalId } = req.body;

    const user = await User.findById(req.user._id);

    // Find the dependent
    const dependent = user.dependents.id(dependentId);

    if (!dependent) {
      return res.status(404).json({
        success: false,
        message: 'Dependent not found'
      });
    }

    // Update fields
    if (name) dependent.name = name.trim();
    if (nationalId) {
      // Validate national ID format
      if (!/^\d{10}$/.test(nationalId)) {
        return res.status(400).json({
          success: false,
          message: 'National ID must be 10 digits'
        });
      }

      // Check if another dependent has this national ID
      const duplicateDependent = user.dependents.find(
        dep => dep._id.toString() !== dependentId && dep.nationalId === nationalId
      );

      if (duplicateDependent) {
        return res.status(400).json({
          success: false,
          message: 'Another dependent with this National ID already exists'
        });
      }

      dependent.nationalId = nationalId;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Dependent updated successfully',
      user: user.toPublicProfile()
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getMyTickets,
  addDependent,
  getDependents,
  removeDependent,
  updateDependent
};


