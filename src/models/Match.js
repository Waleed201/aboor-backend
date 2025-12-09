const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  homeTeam: {
    type: String,
    required: [true, 'Home team is required'],
    enum: ['الأهلي', 'الهلال', 'الاتفاق', 'الاتحاد', 'النصر', 'الشباب']
  },
  homeTeamIcon: {
    type: String,
    default: '⚽'
  },
  homeTeamLogo: {
    type: String,
    required: [true, 'Home team logo is required']
  },
  awayTeam: {
    type: String,
    required: [true, 'Away team is required'],
    enum: ['الأهلي', 'الهلال', 'الاتفاق', 'الاتحاد', 'النصر', 'الشباب']
  },
  awayTeamIcon: {
    type: String,
    default: '⚽'
  },
  awayTeamLogo: {
    type: String,
    required: [true, 'Away team logo is required']
  },
  date: {
    type: Date,
    required: [true, 'Match date is required']
  },
  time: {
    type: String,
    required: [true, 'Match time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter time in HH:MM format']
  },
  stadium: {
    type: String,
    required: [true, 'Stadium is required']
  },
  basePrice: {
    type: Number,
    required: [true, 'Base price is required'],
    min: [0, 'Price cannot be negative']
  },
  status: {
    type: String,
    enum: ['upcoming', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  totalSeats: {
    type: Number,
    default: 0
  },
  availableSeats: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
matchSchema.index({ date: 1, status: 1 });
matchSchema.index({ homeTeam: 1, awayTeam: 1 });
matchSchema.index({ stadium: 1 });

// Virtual for formatted date
matchSchema.virtual('formattedDate').get(function() {
  return this.date.toISOString().split('T')[0];
});

// Method to check if match is bookable
matchSchema.methods.isBookable = function() {
  return this.status === 'upcoming' && 
         this.availableSeats > 0 && 
         new Date(this.date) > new Date();
};

const Match = mongoose.model('Match', matchSchema);

module.exports = Match;


