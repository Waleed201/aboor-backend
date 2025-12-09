const Ticket = require('../models/Ticket');
const User = require('../models/User');
const Match = require('../models/Match');

// @desc    Get all bookings with filters
// @route   GET /api/admin/bookings
// @access  Private/Admin
const getAllBookings = async (req, res, next) => {
  try {
    const { status, matchId, userId, startDate, endDate, page = 1, limit = 20 } = req.query;

    // Build query
    const query = {};

    if (status) {
      query.status = status;
    }

    if (matchId) {
      query.matchId = matchId;
    }

    if (userId) {
      query.userId = userId;
    }

    if (startDate || endDate) {
      query.bookingDate = {};
      if (startDate) query.bookingDate.$gte = new Date(startDate);
      if (endDate) query.bookingDate.$lte = new Date(endDate);
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const tickets = await Ticket.find(query)
      .populate('userId', 'name email phone nationalId')
      .populate('matchId')
      .sort({ bookingDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Ticket.countDocuments(query);

    res.json({
      success: true,
      count: tickets.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      tickets
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get booking analytics
// @route   GET /api/admin/analytics
// @access  Private/Admin
const getAnalytics = async (req, res, next) => {
  try {
    // Total bookings
    const totalBookings = await Ticket.countDocuments({ status: { $in: ['active', 'used'] } });

    // Total revenue
    const revenueData = await Ticket.aggregate([
      {
        $match: { paymentStatus: 'completed' }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$price' }
        }
      }
    ]);

    const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

    // Bookings by status
    const bookingsByStatus = await Ticket.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Popular matches
    const popularMatches = await Ticket.aggregate([
      {
        $match: { status: { $in: ['active', 'reserved'] } }
      },
      {
        $group: {
          _id: '$matchId',
          ticketsSold: { $sum: 1 },
          revenue: { $sum: '$price' }
        }
      },
      {
        $sort: { ticketsSold: -1 }
      },
      {
        $limit: 5
      }
    ]);

    // Populate match details
    await Match.populate(popularMatches, { path: '_id' });

    // Recent bookings
    const recentBookings = await Ticket.find()
      .populate('userId', 'name email')
      .populate('matchId', 'homeTeam awayTeam date')
      .sort({ bookingDate: -1 })
      .limit(10);

    // User statistics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });

    res.json({
      success: true,
      analytics: {
        bookings: {
          total: totalBookings,
          byStatus: bookingsByStatus
        },
        revenue: {
          total: totalRevenue,
          currency: 'SAR'
        },
        popularMatches,
        recentBookings,
        users: {
          total: totalUsers,
          active: activeUsers
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update ticket status
// @route   PUT /api/admin/tickets/:id/status
// @access  Private/Admin
const updateTicketStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        error: 'Status is required'
      });
    }

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        error: 'Ticket not found'
      });
    }

    ticket.status = status;
    await ticket.save();

    await ticket.populate('matchId');
    await ticket.populate('userId', 'name email');

    res.json({
      success: true,
      message: 'Ticket status updated successfully',
      ticket
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res, next) => {
  try {
    const { role, isActive, page = 1, limit = 20 } = req.query;

    // Build query
    const query = {};

    if (role) {
      query.role = role;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      count: users.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      users
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllBookings,
  getAnalytics,
  updateTicketStatus,
  getAllUsers
};


