const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  phone: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        // Allow empty phone (optional field)
        if (!v || v.trim() === '') return true;
        // If provided, must be exactly 10 digits
        const digitsOnly = v.replace(/\D/g, '');
        return digitsOnly.length === 10;
      },
      message: 'Phone number must be exactly 10 digits'
    }
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  offersClaimed: [{
    offerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Offer'
    },
    upiId: {
      type: String,
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
    }
  }],
  totalCashback: {
    type: Number,
    default: 0
  },
  wallet: {
    type: Number,
    default: 0
  },
  referralCode: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    uppercase: true
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  referralsCount: {
    type: Number,
    default: 0
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

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Generate referral code before saving (if not exists)
userSchema.pre('save', async function(next) {
  // Generate referral code if not exists and user is being created (not updated)
  if (!this.referralCode && this.isNew) {
    const crypto = require('crypto');
    let code;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (!isUnique && attempts < maxAttempts) {
      // Generate 8 character code: mix of random characters
      const randomBytes = crypto.randomBytes(4);
      code = randomBytes.toString('hex').toUpperCase().slice(0, 8);
      
      // Check if code already exists using this.constructor (the model)
      const existing = await this.constructor.findOne({ referralCode: code });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }
    
    // Fallback: use timestamp-based code if all attempts fail
    if (!isUnique) {
      const timestamp = Date.now().toString(36).toUpperCase().slice(-6);
      const random = crypto.randomBytes(1).toString('hex').toUpperCase();
      code = (timestamp + random).slice(0, 8);
    }
    
    this.referralCode = code;
  }
  
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);


