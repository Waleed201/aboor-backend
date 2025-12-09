const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema({
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: [true, 'Match ID is required']
  },
  zone: {
    type: String,
    required: [true, 'Zone is required'],
    enum: ['Red', 'Yellow', 'Green', 'Blue', 'Pink', 'Orange', 'Cyan']
  },
  areaNumber: {
    type: String,
    required: [true, 'Area number is required']
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  reservedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reservedUntil: {
    type: Date,
    default: null
  },
  ticketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    default: null
  }
}, {
  timestamps: true
});

// Compound index for unique seat per match
seatSchema.index({ matchId: 1, zone: 1, areaNumber: 1 }, { unique: true });
seatSchema.index({ matchId: 1, isAvailable: 1 });
seatSchema.index({ reservedUntil: 1 });

// Method to reserve seat temporarily
seatSchema.methods.reserve = function(userId, minutes = 5) {
  this.isAvailable = false;
  this.reservedBy = userId;
  this.reservedUntil = new Date(Date.now() + minutes * 60 * 1000);
};

// Method to confirm booking
seatSchema.methods.confirmBooking = function(ticketId) {
  this.ticketId = ticketId;
  this.reservedUntil = null; // Clear temporary reservation
};

// Method to release seat
seatSchema.methods.release = function() {
  this.isAvailable = true;
  this.reservedBy = null;
  this.reservedUntil = null;
  this.ticketId = null;
};

// Method to check if reservation is expired
seatSchema.methods.isReservationExpired = function() {
  return !this.isAvailable && 
         this.reservedUntil && 
         new Date() > this.reservedUntil &&
         !this.ticketId; // Not confirmed yet
};

// Static method to release expired reservations
seatSchema.statics.releaseExpiredReservations = async function() {
  const expiredSeats = await this.find({
    isAvailable: false,
    reservedUntil: { $lt: new Date() },
    ticketId: null
  });

  for (const seat of expiredSeats) {
    seat.release();
    await seat.save();
  }

  return expiredSeats.length;
};

const Seat = mongoose.model('Seat', seatSchema);

module.exports = Seat;


