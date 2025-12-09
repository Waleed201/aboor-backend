const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: [true, 'Match ID is required']
  },
  seatInfo: {
    zone: {
      type: String,
      required: [true, 'Seat zone is required'],
      enum: ['Red', 'Yellow', 'Green', 'Blue', 'Pink', 'Orange', 'Cyan']
    },
    areaNumber: {
      type: String,
      required: [true, 'Area number is required']
    }
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  bookingDate: {
    type: Date,
    default: Date.now
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  qrCode: {
    type: String,
    unique: true
  },
  qrCodeImage: {
    type: String, // Base64 encoded QR code image (data URI)
    default: null
  },
  status: {
    type: String,
    enum: ['reserved', 'active', 'cancelled', 'used'],
    default: 'reserved'
  },
  reservedUntil: {
    type: Date,
    // Temporary reservation expires after 5 minutes
    default: function() {
      return new Date(Date.now() + 5 * 60 * 1000);
    }
  }
}, {
  timestamps: true
});

// Indexes
ticketSchema.index({ userId: 1, matchId: 1 });
ticketSchema.index({ qrCode: 1 });
ticketSchema.index({ status: 1 });
ticketSchema.index({ reservedUntil: 1 });

// Generate QR code on save
ticketSchema.pre('save', function() {
  if (!this.qrCode) {
    // Generate a unique QR code (simplified version)
    this.qrCode = `AB${this._id.toString().slice(-6).toUpperCase()}${Date.now().toString(36).toUpperCase()}`;
  }
});

// Method to check if reservation is expired
ticketSchema.methods.isReservationExpired = function() {
  return this.status === 'reserved' && new Date() > this.reservedUntil;
};

// Method to confirm booking
ticketSchema.methods.confirmBooking = function() {
  this.status = 'active';
  this.paymentStatus = 'completed';
  this.reservedUntil = null;
};

const Ticket = mongoose.model('Ticket', ticketSchema);

module.exports = Ticket;


