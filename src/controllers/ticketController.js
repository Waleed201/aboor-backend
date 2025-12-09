const Ticket = require('../models/Ticket');
const Match = require('../models/Match');
const seatService = require('../services/seatService');
const paymentService = require('../services/paymentService');
const emailService = require('../services/emailService');
const qrCodeService = require('../services/qrCodeService');
const { emitSeatReserved, emitSeatBooked, emitSeatReleased } = require('../websocket/seatSocket');

// @desc    Book a ticket (reserve seat)
// @route   POST /api/tickets/book
// @access  Private
const bookTicket = async (req, res, next) => {
  try {
    const { matchId, seatInfo } = req.body;
    const { zone, areaNumber } = seatInfo;

    // Check if match exists and is bookable
    const match = await Match.findById(matchId);

    if (!match) {
      return res.status(404).json({
        error: 'Match not found'
      });
    }

    if (!match.isBookable()) {
      return res.status(400).json({
        error: 'Match is not available for booking',
        message: 'Match may be completed, cancelled, or fully booked'
      });
    }

    // Check if user already has a ticket for this match
    const existingTicket = await Ticket.findOne({
      userId: req.user._id,
      matchId,
      status: { $in: ['reserved', 'active'] }
    });

    if (existingTicket) {
      return res.status(400).json({
        error: 'Already booked',
        message: 'You already have a ticket for this match'
      });
    }

    // Check if seat is available and reserve it
    try {
      await seatService.reserveSeat(matchId, zone, areaNumber, req.user._id);
    } catch (error) {
      return res.status(400).json({
        error: 'Seat unavailable',
        message: error.message
      });
    }

    // Create ticket with reserved status
    const ticket = await Ticket.create({
      userId: req.user._id,
      matchId,
      seatInfo: { zone, areaNumber },
      price: match.basePrice,
      status: 'reserved',
      paymentStatus: 'pending'
    });

    // Populate match details
    await ticket.populate('matchId');

    // Emit WebSocket event
    emitSeatReserved(matchId, zone, areaNumber, req.user._id);

    res.status(201).json({
      success: true,
      message: 'Seat reserved successfully. Complete payment within 5 minutes.',
      ticket,
      reservedUntil: ticket.reservedUntil
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get ticket details
// @route   GET /api/tickets/:id
// @access  Private
const getTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('matchId')
      .populate('userId', 'name email phone');

    if (!ticket) {
      return res.status(404).json({
        error: 'Ticket not found'
      });
    }

    // Check if user owns this ticket or is admin
    if (ticket.userId._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to view this ticket'
      });
    }

    res.json({
      success: true,
      ticket
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Process payment and confirm booking
// @route   POST /api/tickets/:id/payment
// @access  Private
const processPayment = async (req, res, next) => {
  try {
    const { paymentMethod = 'mada' } = req.body;

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        error: 'Ticket not found'
      });
    }

    // Check ownership
    if (ticket.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }

    // Check if ticket is in reserved status
    if (ticket.status !== 'reserved') {
      return res.status(400).json({
        error: 'Invalid ticket status',
        message: 'Ticket is not in reserved status'
      });
    }

    // Check if reservation expired
    if (ticket.isReservationExpired()) {
      // Release seat and cancel ticket
      await seatService.releaseSeat(
        ticket.matchId,
        ticket.seatInfo.zone,
        ticket.seatInfo.areaNumber
      );
      ticket.status = 'cancelled';
      await ticket.save();

      return res.status(400).json({
        error: 'Reservation expired',
        message: 'Your seat reservation has expired. Please book again.'
      });
    }

    // Process payment (mock)
    const paymentResult = await paymentService.processPayment(ticket.price, paymentMethod);

    if (!paymentResult.success) {
      return res.status(400).json({
        error: 'Payment failed',
        message: 'Payment processing failed. Please try again.'
      });
    }

    // Confirm booking
    ticket.confirmBooking();
    await ticket.save();

    // Confirm seat booking
    await seatService.confirmBooking(
      ticket.matchId,
      ticket.seatInfo.zone,
      ticket.seatInfo.areaNumber,
      ticket._id
    );

    // Populate match details first (needed for QR code generation)
    await ticket.populate('matchId');

    // Generate QR code image with ticket details
    try {
      const ticketData = {
        _id: ticket._id,
        user: ticket.userId,
        match: ticket.matchId,
        seatNumber: `${ticket.seatInfo.zone}-${ticket.seatInfo.areaNumber}`,
        zone: ticket.seatInfo.zone,
        area: ticket.seatInfo.areaNumber,
        qrCode: ticket.qrCode,
        createdAt: ticket.createdAt
      };
      
      ticket.qrCodeImage = await qrCodeService.generateTicketQRCode(ticketData);
      await ticket.save();
    } catch (qrError) {
      console.error('Failed to generate QR code:', qrError);
      // Continue even if QR generation fails - ticket is still valid
    }

    // Emit WebSocket event
    emitSeatBooked(
      ticket.matchId._id,
      ticket.seatInfo.zone,
      ticket.seatInfo.areaNumber,
      ticket._id
    );

    // Send confirmation email
    await ticket.populate('userId');
    emailService.sendBookingConfirmation(
      ticket.userId,
      ticket,
      ticket.matchId
    ).catch(err => console.error('Failed to send confirmation email:', err));

    res.json({
      success: true,
      message: 'Payment successful. Booking confirmed!',
      ticket,
      payment: {
        transactionId: paymentResult.transactionId,
        amount: paymentResult.amount,
        method: paymentResult.method
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel ticket
// @route   PUT /api/tickets/:id/cancel
// @access  Private
const cancelTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        error: 'Ticket not found'
      });
    }

    // Check ownership
    if (ticket.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Access denied'
      });
    }

    // Check if ticket can be cancelled
    if (ticket.status === 'cancelled' || ticket.status === 'used') {
      return res.status(400).json({
        error: 'Cannot cancel ticket',
        message: `Ticket is already ${ticket.status}`
      });
    }

    // Release seat
    await seatService.releaseSeat(
      ticket.matchId,
      ticket.seatInfo.zone,
      ticket.seatInfo.areaNumber
    );

    // Update ticket status
    ticket.status = 'cancelled';
    
    // Process refund if payment was completed
    if (ticket.paymentStatus === 'completed') {
      ticket.paymentStatus = 'refunded';
      // In production, process actual refund here
    }

    await ticket.save();

    // Emit WebSocket event
    emitSeatReleased(
      ticket.matchId,
      ticket.seatInfo.zone,
      ticket.seatInfo.areaNumber
    );

    // Populate match and user for email
    await ticket.populate('matchId');
    await ticket.populate('userId');

    // Send cancellation email
    emailService.sendCancellationConfirmation(
      ticket.userId,
      ticket,
      ticket.matchId
    ).catch(err => console.error('Failed to send cancellation email:', err));

    res.json({
      success: true,
      message: 'Ticket cancelled successfully',
      ticket
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify QR code
// @route   POST /api/tickets/verify
// @access  Private (Admin/Staff)
const verifyQRCode = async (req, res, next) => {
  try {
    const { qrData } = req.body;

    if (!qrData) {
      return res.status(400).json({
        error: 'QR data required',
        message: 'Please provide QR code data to verify'
      });
    }

    // Verify QR code format
    const verification = qrCodeService.verifyQRCode(qrData);

    if (!verification.valid) {
      return res.status(400).json({
        error: 'Invalid QR code',
        message: verification.error
      });
    }

    // Get ticket from database
    const ticket = await Ticket.findById(verification.data.ticketId)
      .populate('matchId')
      .populate('userId', 'name email phone');

    if (!ticket) {
      return res.status(404).json({
        error: 'Ticket not found',
        message: 'This ticket does not exist in our system'
      });
    }

    // Check ticket status
    if (ticket.status === 'cancelled') {
      return res.status(400).json({
        error: 'Ticket cancelled',
        message: 'This ticket has been cancelled',
        ticket: {
          qrCode: ticket.qrCode,
          status: ticket.status
        }
      });
    }

    if (ticket.status === 'used') {
      return res.status(400).json({
        error: 'Ticket already used',
        message: 'This ticket has already been used for entry',
        ticket: {
          qrCode: ticket.qrCode,
          status: ticket.status,
          usedAt: ticket.updatedAt
        }
      });
    }

    if (ticket.paymentStatus !== 'completed') {
      return res.status(400).json({
        error: 'Payment not completed',
        message: 'This ticket has not been paid for',
        ticket: {
          qrCode: ticket.qrCode,
          paymentStatus: ticket.paymentStatus
        }
      });
    }

    // Valid ticket
    res.json({
      success: true,
      message: 'Valid ticket',
      ticket: {
        id: ticket._id,
        qrCode: ticket.qrCode,
        status: ticket.status,
        paymentStatus: ticket.paymentStatus,
        user: {
          name: ticket.userId.name,
          email: ticket.userId.email,
          phone: ticket.userId.phone
        },
        match: {
          homeTeam: ticket.matchId.homeTeam,
          awayTeam: ticket.matchId.awayTeam,
          dateTime: ticket.matchId.dateTime,
          stadium: ticket.matchId.stadium
        },
        seat: {
          zone: ticket.seatInfo.zone,
          area: ticket.seatInfo.areaNumber
        },
        bookingDate: ticket.bookingDate
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark ticket as used (after entry scan)
// @route   PUT /api/tickets/:id/use
// @access  Private (Admin/Staff)
const markTicketAsUsed = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        error: 'Ticket not found'
      });
    }

    if (ticket.status === 'used') {
      return res.status(400).json({
        error: 'Ticket already used',
        message: 'This ticket was already scanned for entry'
      });
    }

    if (ticket.status !== 'active') {
      return res.status(400).json({
        error: 'Invalid ticket status',
        message: `Cannot use ticket with status: ${ticket.status}`
      });
    }

    ticket.status = 'used';
    await ticket.save();

    res.json({
      success: true,
      message: 'Ticket marked as used. Entry granted.',
      ticket
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  bookTicket,
  getTicket,
  processPayment,
  cancelTicket,
  verifyQRCode,
  markTicketAsUsed
};

