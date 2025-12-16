const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Withdrawal = require('../models/Withdrawal');
const { auth } = require('../middleware/auth');

const MIN_WITHDRAWAL = 10;

// Create withdrawal request
router.post('/', auth, async (req, res) => {
  try {
    const { amount, upiId } = req.body;

    // Validate amount
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Please enter a valid amount' });
    }

    const withdrawalAmount = parseFloat(amount);
    if (withdrawalAmount < MIN_WITHDRAWAL) {
      return res.status(400).json({ 
        message: `Minimum withdrawal amount is ₹${MIN_WITHDRAWAL}` 
      });
    }

    // Validate UPI ID
    if (!upiId || !upiId.trim()) {
      return res.status(400).json({ message: 'UPI ID is required' });
    }

    // UPI ID format validation
    const upiPattern = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
    if (!upiPattern.test(upiId.trim())) {
      return res.status(400).json({ 
        message: 'Invalid UPI ID format. Example: username@paytm or username@ybl' 
      });
    }

    // Get user with current wallet balance and check for approved claims
    const user = await User.findById(req.user._id)
      .populate('offersClaimed.offerId');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has at least one approved claim (required for withdrawal)
    const hasApprovedClaim = user.offersClaimed.some(claim => claim.status === 'approved');
    if (!hasApprovedClaim) {
      return res.status(400).json({ 
        message: 'You cannot withdraw until at least one offer claim is approved by admin. Please wait for approval.' 
      });
    }

    // Check if user has sufficient balance
    const currentBalance = user.wallet || 0;
    if (withdrawalAmount > currentBalance) {
      return res.status(400).json({ 
        message: `Insufficient balance. Available: ₹${currentBalance}` 
      });
    }

    // Check for pending withdrawal requests
    const pendingWithdrawals = await Withdrawal.countDocuments({
      userId: req.user._id,
      status: 'pending'
    });

    if (pendingWithdrawals > 0) {
      return res.status(400).json({ 
        message: 'You already have a pending withdrawal request. Please wait for it to be processed.' 
      });
    }

    // Create withdrawal request
    const withdrawal = new Withdrawal({
      userId: req.user._id,
      amount: withdrawalAmount,
      upiId: upiId.trim(),
      status: 'pending'
    });

    await withdrawal.save();

    // Deduct amount from wallet immediately (balance is held)
    // If rejected, balance will be returned by admin
    user.wallet = currentBalance - withdrawalAmount;
    await user.save();

    res.status(201).json({
      message: 'Withdrawal request submitted successfully',
      withdrawal: {
        _id: withdrawal._id,
        amount: withdrawal.amount,
        upiId: withdrawal.upiId,
        status: withdrawal.status,
        createdAt: withdrawal.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating withdrawal:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get user's withdrawal history
router.get('/history', auth, async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(withdrawals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single withdrawal (user can only view their own)
router.get('/:id', auth, async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id);
    
    if (!withdrawal) {
      return res.status(404).json({ message: 'Withdrawal not found' });
    }

    // Users can only view their own withdrawals unless admin
    if (withdrawal.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(withdrawal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

