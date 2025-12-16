const mongoose = require('mongoose');

const postbackSchema = new mongoose.Schema({
  clickId: {
    type: String,
    required: true,
    index: true
  },
  conversionId: {
    type: String,
    index: true
  },
  offerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Offer',
    index: true
  },
  trackierOfferId: {
    type: String,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  publisherId: {
    type: String,
    index: true
  },
  advertiserId: {
    type: String
  },
  payout: {
    type: Number,
    default: 0
  },
  status: {
    type: Number,
    default: 1, // 1 = approved, 0 = rejected
    index: true
  },
  conversionType: {
    type: String,
    default: 'install' // install, sale, signup, etc.
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  referrer: {
    type: String
  },
  // Raw postback data from Trackier
  rawData: {
    type: mongoose.Schema.Types.Mixed
  },
  // Track if this postback was sent by us or received from Trackier
  source: {
    type: String,
    enum: ['outgoing', 'incoming'],
    default: 'incoming'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Indexes for faster queries
postbackSchema.index({ clickId: 1, createdAt: -1 });
postbackSchema.index({ offerId: 1, createdAt: -1 });
postbackSchema.index({ userId: 1, createdAt: -1 });
postbackSchema.index({ status: 1, createdAt: -1 });

// Unique constraint: Each clickId can only have ONE approved payout (status = 1)
// This ensures install click_id uniqueness for payouts
postbackSchema.index(
  { clickId: 1, status: 1 },
  { 
    unique: true, 
    partialFilterExpression: { status: 1 } // Only enforce uniqueness for approved payouts
  }
);

// Unique constraint: Each clickId + conversionId combination should be unique
// This ensures install uniqueness (prevents duplicate conversions)
postbackSchema.index(
  { clickId: 1, conversionId: 1 },
  { 
    unique: true,
    sparse: true // Allow null conversionId values
  }
);

module.exports = mongoose.model('Postback', postbackSchema);





