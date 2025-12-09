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

module.exports = {
  getProfile,
  updateProfile,
  getMyTickets
};


