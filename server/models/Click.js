const mongoose = require('mongoose');

const clickSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  offerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Offer',
    required: true
  },
  trackierOfferId: {
    type: String,
    // Make optional so we can still store clicks even if Trackier offer ID is not set
    required: false,
    default: null
  },
  clickId: {
    type: String,
    required: true,
    unique: true
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
  conversionId: {
    type: String
  },
  converted: {
    type: Boolean,
    default: false
  },
  conversionValue: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  convertedAt: {
    type: Date
  },
  redirectToken: {
    type: String,
    index: true,
    sparse: true
  }
});

// Indexes for faster queries
clickSchema.index({ userId: 1, offerId: 1 });
clickSchema.index({ clickId: 1 });
clickSchema.index({ trackierOfferId: 1 });
clickSchema.index({ createdAt: -1 });
clickSchema.index({ redirectToken: 1 });

module.exports = mongoose.model('Click', clickSchema);


