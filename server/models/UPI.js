const mongoose = require('mongoose');

const upiSchema = new mongoose.Schema({
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
  upiId: {
    type: String,
    required: true,
    trim: true
  },
  claimedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
upiSchema.index({ userId: 1, offerId: 1 });
upiSchema.index({ upiId: 1 });

module.exports = mongoose.model('UPI', upiSchema, 'upi');





























