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

// Helper function to generate UNIQUE random string
function generateUniqueQRCode(ticketId, type = 'primary') {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const timestamp = Date.now().toString(36).toUpperCase(); // Base36 timestamp
  const randomPart = Array.from({ length: 12 }, () => 
    characters.charAt(Math.floor(Math.random() * characters.length))
  ).join('');
  
  // Combine: timestamp + random + ticketId suffix + type indicator
  const typePrefix = type === 'primary' ? '1' : '2';
  const idSuffix = ticketId ? ticketId.toString().slice(-4).toUpperCase() : 'XXXX';
  
  return `${typePrefix}${timestamp}${randomPart}${idSuffix}`;
}

// Generate QR codes on save
ticketSchema.pre('save', function() {
  const ticketId = this._id ? this._id.toString() : mongoose.Types.ObjectId().toString();
  
  if (!this.qrCode1) {
    // Generate first QR code with UNIQUE string
    this.qrCode1 = generateUniqueQRCode(ticketId, 'primary');
  }
  if (!this.qrCode2) {
    // Generate second QR code with UNIQUE string (different from first)
    this.qrCode2 = generateUniqueQRCode(ticketId, 'secondary');
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


