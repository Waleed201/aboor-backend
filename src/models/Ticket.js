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
  // First QR Code
  qrCode1: {
    type: String,
    unique: true
  },
  qrCodeImage1: {
    type: String, // Base64 encoded QR code image (data URI)
    default: null
  },
  // Second QR Code
  qrCode2: {
    type: String,
    unique: true
  },
  qrCodeImage2: {
    type: String, // Base64 encoded QR code image (data URI)
    default: null
  },
  // Track which QR code is currently active
  activeQRCode: {
    type: String,
    enum: ['primary', 'secondary'],
    default: 'primary'
  },
  // Track scan history
  qrCode1ScannedAt: {
    type: Date,
    default: null
  },
  qrCode2ScannedAt: {
    type: Date,
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
ticketSchema.index({ qrCode1: 1 });
ticketSchema.index({ qrCode2: 1 });
ticketSchema.index({ status: 1 });
ticketSchema.index({ reservedUntil: 1 });

// Helper function to generate random 20-character string
function generateRandomString(length = 20) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// Generate QR codes on save
ticketSchema.pre('save', function() {
  if (!this.qrCode1) {
    // Generate first QR code with random 20-character string
    this.qrCode1 = generateRandomString(20);
  }
  if (!this.qrCode2) {
    // Generate second QR code with random 20-character string
    this.qrCode2 = generateRandomString(20);
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


