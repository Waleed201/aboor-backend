const Match = require('../models/Match');
const Seat = require('../models/Seat');

// @desc    Get all matches
// @route   GET /api/matches
// @access  Public
const getMatches = async (req, res, next) => {
  try {
    const { team, stadium, status = 'upcoming', startDate, endDate } = req.query;

    // Build query
    const query = {};

    if (team) {
      query.$or = [
        { homeTeam: team },
        { awayTeam: team }
      ];
    }

    if (stadium) {
      query.stadium = new RegExp(stadium, 'i');
    }

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const matches = await Match.find(query)
      .sort({ date: 1, time: 1 });

    res.json({
      success: true,
      count: matches.length,
      matches
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single match
// @route   GET /api/matches/:id
// @access  Public
const getMatch = async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id);

    if (!match) {
      return res.status(404).json({
        error: 'Match not found'
      });
    }

    // Get available seats count by zone
    const seatsByZone = await Seat.aggregate([
      { 
        $match: { 
          matchId: match._id,
          isAvailable: true
        }
      },
      {
        $group: {
          _id: '$zone',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      match,
      availableSeatsByZone: seatsByZone
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create match
// @route   POST /api/matches
// @access  Private/Admin
const createMatch = async (req, res, next) => {
  try {
    const {
      homeTeam,
      homeTeamIcon,
      homeTeamLogo,
      awayTeam,
      awayTeamIcon,
      awayTeamLogo,
      date,
      time,
      stadium,
      basePrice
    } = req.body;

    // Validate teams are different
    if (homeTeam === awayTeam) {
      return res.status(400).json({
        error: 'Invalid match',
        message: 'Home team and away team must be different'
      });
    }

    const match = await Match.create({
      homeTeam,
      homeTeamIcon,
      homeTeamLogo,
      awayTeam,
      awayTeamIcon,
      awayTeamLogo,
      date,
      time,
      stadium,
      basePrice
    });

    // Create seats for the match (based on frontend area numbers)
    const zones = ['Red', 'Yellow', 'Green', 'Blue', 'Pink', 'Orange', 'Cyan'];
    const areaNumbers = [
      '104', '105', '106', '107', '108', '109', '110', '111', '112', '113', 
      '114', '115', '116', '119', '120', '121', '125', '126', '130', '131',
      '132', '133', '134', '135', '136', '137', '138', '139', '140',
      '201', '202', '203', '204', '205', '206', '207', '208', '209', '210',
      '211', '212', '213', '214', '215', '216', '217', '218', '219', '220',
      '221', '222', '223', '224', '225', '226'
    ];

    const seats = [];
    for (const zone of zones) {
      for (const areaNumber of areaNumbers) {
        seats.push({
          matchId: match._id,
          zone,
          areaNumber,
          isAvailable: true
        });
      }
    }

    await Seat.insertMany(seats);

    // Update match with seat counts
    match.totalSeats = seats.length;
    match.availableSeats = seats.length;
    await match.save();

    res.status(201).json({
      success: true,
      message: 'Match created successfully',
      match
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update match
// @route   PUT /api/matches/:id
// @access  Private/Admin
const updateMatch = async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id);

    if (!match) {
      return res.status(404).json({
        error: 'Match not found'
      });
    }

    const {
      homeTeam,
      homeTeamIcon,
      homeTeamLogo,
      awayTeam,
      awayTeamIcon,
      awayTeamLogo,
      date,
      time,
      stadium,
      basePrice,
      status
    } = req.body;

    // Update fields
    if (homeTeam) match.homeTeam = homeTeam;
    if (homeTeamIcon) match.homeTeamIcon = homeTeamIcon;
    if (homeTeamLogo) match.homeTeamLogo = homeTeamLogo;
    if (awayTeam) match.awayTeam = awayTeam;
    if (awayTeamIcon) match.awayTeamIcon = awayTeamIcon;
    if (awayTeamLogo) match.awayTeamLogo = awayTeamLogo;
    if (date) match.date = date;
    if (time) match.time = time;
    if (stadium) match.stadium = stadium;
    if (basePrice) match.basePrice = basePrice;
    if (status) match.status = status;

    await match.save();

    res.json({
      success: true,
      message: 'Match updated successfully',
      match
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete match
// @route   DELETE /api/matches/:id
// @access  Private/Admin
const deleteMatch = async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id);

    if (!match) {
      return res.status(404).json({
        error: 'Match not found'
      });
    }

    // Delete associated seats
    await Seat.deleteMany({ matchId: match._id });

    await match.deleteOne();

    res.json({
      success: true,
      message: 'Match deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMatches,
  getMatch,
  createMatch,
  updateMatch,
  deleteMatch
};


