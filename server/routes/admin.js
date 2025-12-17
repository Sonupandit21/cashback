const express = require('express');
const router = express.Router();
const Offer = require('../models/Offer');
const User = require('../models/User');
const UPI = require('../models/UPI');
const Withdrawal = require('../models/Withdrawal');
const Click = require('../models/Click');
const Postback = require('../models/Postback');
const SupportTicket = require('../models/SupportTicket');
const { auth, adminAuth } = require('../middleware/auth');
const { getOfferStats, getPublisherStats } = require('../utils/trackier');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');





// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/offers');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'offer-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// All admin routes require authentication
router.use(auth);
router.use(adminAuth);

// Get dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalOffers = await Offer.countDocuments();
    const activeOffers = await Offer.countDocuments({ isActive: true });
    const featuredOffers = await Offer.countDocuments({ isFeatured: true });
    const totalClaims = await User.aggregate([
      { $unwind: '$offersClaimed' },
      { $count: 'total' }
    ]);

    // Support ticket statistics
    const totalSupportTickets = await SupportTicket.countDocuments();
    const openSupportTickets = await SupportTicket.countDocuments({ status: 'open' });
    const inProgressSupportTickets = await SupportTicket.countDocuments({ status: 'in_progress' });
    const resolvedSupportTickets = await SupportTicket.countDocuments({ status: 'resolved' });

    const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    const lastPostback = await Postback.findOne().sort({ createdAt: -1 }).select('createdAt');
    
    res.json({
      mongoStatus,
      recentPostback: lastPostback ? lastPostback.createdAt : null,
      totalUsers,
      totalOffers,
      activeOffers,
      featuredOffers,
      totalClaims: totalClaims[0]?.total || 0,
      totalSupportTickets,
      openSupportTickets,
      inProgressSupportTickets,
      resolvedSupportTickets
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all offers (admin)
router.get('/offers', async (req, res) => {
  try {
    const offers = await Offer.find().sort({ createdAt: -1 });
    res.json(offers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create offer
router.post('/offers', upload.single('image'), async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      cashbackAmount,
      currency,
      instructions,
      offerLink,
      trackierOfferId,
      isActive,
      isFeatured,
      minAmount,
      maxUsers
    } = req.body;

    const imageUrl = req.file ? `/uploads/offers/${req.file.filename}` : '';

    const offer = new Offer({
      title,
      description,
      category,
      cashbackAmount: parseFloat(cashbackAmount),
      currency,
      instructions,
      offerLink,
      imageUrl,
      trackierOfferId,
      isActive: isActive === 'true' || isActive === true,
      isFeatured: isFeatured === 'true' || isFeatured === true,
      minAmount: parseFloat(minAmount) || 0,
      maxUsers: maxUsers ? parseInt(maxUsers) : null
    });

    await offer.save();
    res.status(201).json(offer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update offer
router.put('/offers/:id', upload.single('image'), async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    const {
      title,
      description,
      category,
      cashbackAmount,
      currency,
      instructions,
      offerLink,
      trackierOfferId,
      isActive,
      isFeatured,
      minAmount,
      maxUsers
    } = req.body;

    // Update fields
    offer.title = title || offer.title;
    offer.description = description || offer.description;
    offer.category = category || offer.category;
    offer.cashbackAmount = cashbackAmount ? parseFloat(cashbackAmount) : offer.cashbackAmount;
    offer.currency = currency || offer.currency;
    offer.instructions = instructions || offer.instructions;
    offer.offerLink = offerLink || offer.offerLink;
    offer.trackierOfferId = trackierOfferId || offer.trackierOfferId;
    offer.isActive = isActive !== undefined ? (isActive === 'true' || isActive === true) : offer.isActive;
    offer.isFeatured = isFeatured !== undefined ? (isFeatured === 'true' || isFeatured === true) : offer.isFeatured;
    offer.minAmount = minAmount ? parseFloat(minAmount) : offer.minAmount;
    offer.maxUsers = maxUsers ? parseInt(maxUsers) : offer.maxUsers;

    // Update image if new one is uploaded
    if (req.file) {
      // Delete old image if exists
      const oldImagePath = path.join(__dirname, '../../', offer.imageUrl);
      if (offer.imageUrl && fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
      offer.imageUrl = `/uploads/offers/${req.file.filename}`;
    }

    await offer.save();
    res.json(offer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete offer
router.delete('/offers/:id', async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    // Delete image if exists
    if (offer.imageUrl) {
      const imagePath = path.join(__dirname, '../../', offer.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Offer.findByIdAndDelete(req.params.id);
    res.json({ message: 'Offer deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Regenerate offer ID (delete and recreate with new ID)
// API: POST /api/admin/offers/:id/regenerate-id
router.post('/offers/:id/regenerate-id', async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    // Save offer data
    const offerData = {
      title: offer.title,
      description: offer.description,
      category: offer.category,
      cashbackAmount: offer.cashbackAmount,
      currency: offer.currency,
      instructions: offer.instructions,
      offerLink: offer.offerLink,
      imageUrl: offer.imageUrl,
      trackierOfferId: offer.trackierOfferId,
      isActive: offer.isActive,
      isFeatured: offer.isFeatured,
      minAmount: offer.minAmount,
      maxUsers: offer.maxUsers,
      currentUsers: offer.currentUsers,
    };

    // Delete old offer (don't delete image, we're reusing it)
    await Offer.findByIdAndDelete(req.params.id);

    // Create new offer with same data (MongoDB will auto-generate new ID)
    const newOffer = new Offer(offerData);
    await newOffer.save();

    res.json({
      message: 'Offer ID regenerated successfully',
      oldId: req.params.id,
      newId: newOffer._id.toString(),
      offer: newOffer
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all UPI records
// API: GET /api/admin/upi
router.get('/upi', async (req, res) => {
  try {
    const upiRecords = await UPI.find({})
      .populate('userId', 'name email')
      .populate('offerId', 'title cashbackAmount')
      .sort({ createdAt: -1 });
    
    res.json(upiRecords);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete UPI record
// API: DELETE /api/admin/upi/:id
// IMPORTANT: This does NOT delete tracker/postback data - those records are preserved
router.delete('/upi/:id', async (req, res) => {
  try {
    const upiRecord = await UPI.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('offerId', 'title');

    if (!upiRecord) {
      return res.status(404).json({ message: 'UPI record not found' });
    }

    const userId = upiRecord.userId._id ? upiRecord.userId._id : upiRecord.userId;
    const offerId = upiRecord.offerId._id ? upiRecord.offerId._id : upiRecord.offerId;

    // IMPORTANT: Check if there are any postback/tracker records linked to this user/offer
    // We want to preserve tracker data even when UPI is deleted
    const clickCount = await Click.countDocuments({ userId: userId, offerId: offerId });
    const postbackCount = await Postback.countDocuments({ userId: userId, offerId: offerId });

    console.log(`Deleting UPI record:`, {
      upiId: upiRecord.upiId,
      userId: userId,
      offerId: offerId,
      clickRecords: clickCount,
      postbackRecords: postbackCount,
      note: 'Tracker data will be preserved'
    });

    // Remove corresponding entry from user's offersClaimed array
    try {
      const user = await User.findById(userId);
      if (user) {
        const offerIdStr = offerId.toString();
        const recordUpiId = (upiRecord.upiId || '').trim().toLowerCase();

        // Remove matching claim from user's offersClaimed array
        user.offersClaimed = user.offersClaimed.filter(claim => {
          if (!claim.offerId) return true;
          const claimOfferIdStr = claim.offerId.toString();
          const claimUpiId = (claim.upiId || '').trim().toLowerCase();
          
          // Keep the claim if it doesn't match this UPI record
          return !(claimOfferIdStr === offerIdStr && claimUpiId === recordUpiId);
        });

        await user.save();
        console.log(`Removed claim from user ${userId} for offer ${offerIdStr}`);
      }
    } catch (syncError) {
      console.error('Error removing claim from user offersClaimed:', syncError);
      // Continue with deletion even if sync fails
    }

    // Delete the UPI record
    // NOTE: This does NOT cascade delete Click or Postback records
    // Tracker data (clicks, postbacks, conversions) are preserved for analytics
    await UPI.findByIdAndDelete(req.params.id);

    // Log that tracker data is preserved
    console.log(`✅ UPI record deleted. Tracker data preserved:`, {
      clicks: clickCount,
      postbacks: postbackCount,
      userId: userId,
      offerId: offerId,
      message: 'Click and Postback records remain intact for analytics'
    });

    res.json({ 
      message: 'UPI record deleted successfully',
      trackerDataPreserved: {
        clicks: clickCount,
        postbacks: postbackCount,
        note: 'Tracker/Postback records are preserved for analytics and will remain visible in Trackier Stats'
      }
    });
  } catch (error) {
    console.error('Error deleting UPI record:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update UPI status
// API: PUT /api/admin/upi/:id
// Also keeps user's offersClaimed status in sync so that
// UserAdmin / profile pages show correct pending / approved / rejected state.
router.put('/upi/:id', async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Find the UPI record first so we can use its userId / offerId to
    // update the corresponding entry in the User document.
    const upiRecord = await UPI.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('offerId', 'title');

    if (!upiRecord) {
      return res.status(404).json({ message: 'UPI record not found' });
    }

    // Update status and timestamp on the UPI document
    const oldStatus = upiRecord.status;
    upiRecord.status = status;
    upiRecord.updatedAt = Date.now();
    await upiRecord.save();

    // Keep user's offersClaimed array in sync with this status
    try {
      // Handle both populated and non-populated userId
      const userId = upiRecord.userId._id ? upiRecord.userId._id : upiRecord.userId;
      const user = await User.findById(userId);
      if (user) {
        // Handle both populated and non-populated offerId
        const offerId = upiRecord.offerId._id ? upiRecord.offerId._id : upiRecord.offerId;
        const offerIdStr = offerId.toString();
        let changed = false;
        let claimFound = false;

        user.offersClaimed.forEach(claim => {
          if (!claim.offerId) return;
          const claimOfferIdStr = claim.offerId.toString();
          // Normalize UPI IDs for comparison (trim whitespace, case-insensitive)
          const claimUpiId = (claim.upiId || '').trim().toLowerCase();
          const recordUpiId = (upiRecord.upiId || '').trim().toLowerCase();
          
          if (claimOfferIdStr === offerIdStr && claimUpiId === recordUpiId) {
            claim.status = status;
            changed = true;
            claimFound = true;
          }
        });

        // No additional wallet balance on approval - ₹10 was already added when user claimed
        // Wallet balance remains ₹10 only

        if (changed) {
          await user.save();
          console.log(`Successfully synced status "${status}" to user ${userId} for offer ${offerIdStr}`);
          
          // Give referral reward to referrer when offer is approved
          if (status === 'approved' && user.referredBy) {
            try {
              const referrer = await User.findById(user.referredBy);
              if (referrer) {
                // Give referrer ₹5 for each approved offer claimed by their referral
                const referralReward = 5;
                referrer.wallet = (referrer.wallet || 0) + referralReward;
                referrer.totalCashback = (referrer.totalCashback || 0) + referralReward;
                await referrer.save();
                console.log(`Referral reward of ₹${referralReward} added to referrer ${referrer.email} for referral ${user.email} getting offer approved`);
              }
            } catch (referralError) {
              // Log error but don't fail the main request
              console.error('Error adding referral reward on approval:', referralError);
            }
          }
        } else {
          console.warn(`No matching claim found to sync status for user ${userId} and offer ${offerIdStr}`);
        }
      }
    } catch (syncError) {
      // Log but don't fail the main response – admin UI will still show updated UPI status
      console.error('Error syncing user offersClaimed status with UPI record:', syncError);
    }

    res.json(upiRecord);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all withdrawals (admin only)
router.get('/withdrawals', async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find()
      .populate('userId', 'name email wallet')
      .sort({ createdAt: -1 });
    
    res.json(withdrawals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get wallet statistics
router.get('/wallet-stats', async (req, res) => {
  try {
    // Calculate total wallet balance across all users
    const users = await User.find({}, 'wallet');
    const totalBalance = users.reduce((sum, user) => sum + (user.wallet || 0), 0);

    // Calculate total withdrawn (completed withdrawals)
    const completedWithdrawals = await Withdrawal.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalWithdrawn = completedWithdrawals[0]?.total || 0;

    // Calculate pending withdrawal amount
    const pendingWithdrawals = await Withdrawal.aggregate([
      { $match: { status: { $in: ['pending', 'approved'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const pendingAmount = pendingWithdrawals[0]?.total || 0;

    res.json({
      totalBalance,
      totalWithdrawn,
      pendingAmount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete withdrawal (admin only)
router.delete('/withdrawals/:id', async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id)
      .populate('userId', 'name email wallet');

    if (!withdrawal) {
      return res.status(404).json({ message: 'Withdrawal not found' });
    }

    // If withdrawal is pending or approved, return the amount to user's wallet
    if (withdrawal.status === 'pending' || withdrawal.status === 'approved') {
      const user = await User.findById(withdrawal.userId);
      if (user) {
        user.wallet = (user.wallet || 0) + withdrawal.amount;
        await user.save();
        console.log(`Returned ₹${withdrawal.amount} to user ${user.email} wallet after deleting withdrawal`);
      }
    }

    // Delete the withdrawal record
    await Withdrawal.findByIdAndDelete(req.params.id);

    res.json({ message: 'Withdrawal deleted successfully' });
  } catch (error) {
    console.error('Error deleting withdrawal:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update withdrawal status (admin only)
router.put('/withdrawals/:id', async (req, res) => {
  try {
    const { status, rejectedReason } = req.body;
    
    if (!['pending', 'approved', 'rejected', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const withdrawal = await Withdrawal.findById(req.params.id)
      .populate('userId', 'name email wallet');

    if (!withdrawal) {
      return res.status(404).json({ message: 'Withdrawal not found' });
    }

    const oldStatus = withdrawal.status;
    withdrawal.status = status;
    withdrawal.updatedAt = Date.now();

    // Set processedAt when status changes from pending
    if (oldStatus === 'pending' && status !== 'pending') {
      withdrawal.processedAt = Date.now();
    }

    // Handle rejected reason
    if (status === 'rejected' && rejectedReason) {
      withdrawal.rejectedReason = rejectedReason;
    }

    // Handle wallet balance updates
    const user = await User.findById(withdrawal.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If rejecting, return the balance to user
    if (oldStatus !== 'rejected' && status === 'rejected') {
      user.wallet = (user.wallet || 0) + withdrawal.amount;
      await user.save();
    }

    // If completing, the balance was already deducted when request was created
    // So no need to deduct again
    if (status === 'completed') {
      withdrawal.processedAt = Date.now();
    }

    await withdrawal.save();

    res.json({
      message: `Withdrawal ${status} successfully`,
      withdrawal
    });
  } catch (error) {
    console.error('Error updating withdrawal status:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get Trackier statistics for an offer
router.get('/trackier/offers/:trackierOfferId/stats', async (req, res) => {
  try {
    const { trackierOfferId } = req.params;
    const { startDate, endDate } = req.query;

    const dateRange = {};
    if (startDate) dateRange.startDate = startDate;
    if (endDate) dateRange.endDate = endDate;

    const stats = await getOfferStats(trackierOfferId, dateRange);
    
    if (!stats.success) {
      return res.status(500).json({ message: stats.message });
    }

    res.json(stats.data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Trackier statistics for a publisher
router.get('/trackier/publishers/:publisherId/stats', async (req, res) => {
  try {
    const { publisherId } = req.params;
    const { startDate, endDate } = req.query;

    const dateRange = {};
    if (startDate) dateRange.startDate = startDate;
    if (endDate) dateRange.endDate = endDate;

    const stats = await getPublisherStats(publisherId, dateRange);
    
    if (!stats.success) {
      return res.status(500).json({ message: stats.message });
    }

    res.json(stats.data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all support tickets (admin only)
router.get('/support-tickets', async (req, res) => {
  try {
    const { status, issueType } = req.query;
    const query = {};
    
    if (status) {
      query.status = status;
    }
    if (issueType) {
      query.issueType = issueType;
    }

    const tickets = await SupportTicket.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update support ticket status (admin only)
router.put('/support-tickets/:id', async (req, res) => {
  try {
    const { status, adminResponse } = req.body;
    
    if (!['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    ticket.status = status;
    if (adminResponse) {
      ticket.adminResponse = adminResponse;
    }
    if (status === 'resolved' || status === 'closed') {
      ticket.resolvedAt = new Date();
    }
    ticket.updatedAt = Date.now();

    await ticket.save();

    res.json({
      message: `Ticket ${status} successfully`,
      ticket
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete support ticket (admin only)
router.delete('/support-tickets/:id', async (req, res) => {
  try {
    const ticket = await SupportTicket.findByIdAndDelete(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    res.json({ message: 'Support ticket deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get click tracking statistics
router.get('/trackier/clicks', async (req, res) => {
  try {
    const { offerId, userId, converted, startDate, endDate, sync } = req.query;
    
    const query = {};
    if (offerId) query.offerId = offerId;
    if (userId) query.userId = userId;
    if (converted !== undefined) query.converted = converted === 'true';
    
    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Sync click status with postbacks if requested
    if (sync === 'true' || sync === true) {
      console.log('🔄 Syncing click status with postbacks...');
      try {
        // Find all clicks that are not converted but have approved postbacks
        const unconvertedClicks = await Click.find({ converted: false });
        console.log(`Found ${unconvertedClicks.length} unconverted clicks to check`);
        let syncedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;
        
        for (const click of unconvertedClicks) {
          try {
            // Normalize clickId for matching
            const normalizedClickId = click.clickId ? click.clickId.trim() : null;
            if (!normalizedClickId) {
              skippedCount++;
              continue;
            }
            
            // Use multiple search methods to find approved postback (same as postback handler)
            let approvedPostback = null;
            
            // Method 1: Exact match
            approvedPostback = await Postback.findOne({
              clickId: normalizedClickId,
              status: 1 // Approved
            });
            
            // Method 2: Case-insensitive match
            if (!approvedPostback && normalizedClickId) {
              approvedPostback = await Postback.findOne({
                clickId: { $regex: new RegExp(`^${normalizedClickId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
                status: 1
              });
            }
            
            // Method 3: Partial match (in case clickId has extra characters)
            if (!approvedPostback && normalizedClickId) {
              const partialMatches = await Postback.find({
                clickId: { $regex: normalizedClickId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' },
                status: 1
              }).limit(1);
              
              if (partialMatches.length > 0) {
                approvedPostback = partialMatches[0];
              }
            }
            
            // Method 4: Try contains match (clickId contains normalizedClickId)
            if (!approvedPostback && normalizedClickId) {
              // Escape special regex characters
              const escapedClickId = normalizedClickId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              approvedPostback = await Postback.findOne({
                clickId: { $regex: escapedClickId, $options: 'i' },
                status: 1
              });
            }
            
            if (approvedPostback) {
              // Update click to converted using direct update for reliability
              try {
                const updateResult = await Click.updateOne(
                  { _id: click._id },
                  {
                    $set: {
                      converted: true,
                      conversionId: approvedPostback.conversionId || click.conversionId,
                      conversionValue: approvedPostback.payout || click.conversionValue || 0,
                      convertedAt: approvedPostback.createdAt || new Date()
                    }
                  }
                );
                
                if (updateResult.modifiedCount > 0 || updateResult.matchedCount > 0) {
                  syncedCount++;
                  console.log(`✅ Synced click ${normalizedClickId} to converted (Payout: ₹${approvedPostback.payout || 0}, Postback ClickId: ${approvedPostback.clickId})`);
                } else {
                  // Click might already be converted (race condition)
                  const updatedClick = await Click.findById(click._id);
                  if (updatedClick && updatedClick.converted) {
                    console.log(`ℹ️ Click ${normalizedClickId} already converted (skipped)`);
                    skippedCount++;
                  } else {
                    errorCount++;
                    console.error(`❌ Click ${normalizedClickId} update had no effect`);
                  }
                }
              } catch (updateError) {
                errorCount++;
                console.error(`❌ Error updating click ${normalizedClickId}:`, updateError.message);
              }
            } else {
              skippedCount++;
              // Log for debugging (only first few to avoid spam)
              if (skippedCount <= 5) {
                console.log(`ℹ️ No approved postback found for click ${normalizedClickId}`);
              }
            }
          } catch (clickError) {
            errorCount++;
            console.error(`❌ Error syncing click ${click.clickId}:`, clickError.message);
          }
        }
        
        console.log(`✅ Sync complete: ${syncedCount} clicks updated, ${skippedCount} skipped (no postback), ${errorCount} errors`);
      } catch (syncError) {
        console.error('❌ Error syncing click status:', syncError);
        console.error('Sync error stack:', syncError.stack);
      }
    }

    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Accurate stats should reflect the full dataset, not just the current page
    const totalClicks = await Click.countDocuments(query);
    const convertedCount = await Click.countDocuments({ ...query, converted: true });
    const totalPages = Math.ceil(totalClicks / limit);

    // Paginated list for table display
    const clicks = await Click.find(query)
      .populate('userId', 'name email')
      .populate('offerId', 'title trackierOfferId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const stats = {
      total: totalClicks,
      converted: convertedCount,
      conversionRate: totalClicks > 0 
        ? ((convertedCount / totalClicks) * 100).toFixed(2)
        : 0,
      returned: clicks.length, // helps debug pagination vs totals
      page: page,
      limit: limit,
      totalPages: totalPages
    };

    res.json({
      clicks,
      stats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete click record
// API: DELETE /api/admin/trackier/clicks/:id
router.delete('/trackier/clicks/:id', async (req, res) => {
  try {
    const click = await Click.findById(req.params.id);
    
    if (!click) {
      return res.status(404).json({ message: 'Click record not found' });
    }

    // Check if there are associated postbacks
    const postbackCount = await Postback.countDocuments({ clickId: click.clickId });
    
    if (postbackCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete click. There are ${postbackCount} associated postback(s). Delete postbacks first.`,
        postbackCount: postbackCount
      });
    }

    await Click.findByIdAndDelete(req.params.id);
    
    console.log(`✅ Click record deleted:`, {
      clickId: click.clickId,
      userId: click.userId,
      offerId: click.offerId
    });

    res.json({ 
      message: 'Click record deleted successfully',
      deletedClickId: click.clickId
    });
  } catch (error) {
    console.error('Error deleting click record:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get installs/conversions statistics (from Postbacks)
// Includes both incoming (from Trackier) and outgoing (to Trackier) postbacks
router.get('/trackier/installs', async (req, res) => {
  try {
    const { offerId, userId, status, startDate, endDate, source } = req.query;
    
    const query = {};
    if (offerId) query.offerId = offerId;
    if (userId) query.userId = userId;
    if (status !== undefined) query.status = parseInt(status);
    // Filter by source if provided (incoming/outgoing), otherwise include both
    if (source) {
      query.source = source;
    }
    
    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const installs = await Postback.find(query)
      .populate('userId', 'name email')
      .populate('offerId', 'title trackierOfferId')
      .sort({ createdAt: -1 })
      .limit(parseInt(req.query.limit) || 100);

    const stats = {
      total: installs.length,
      approved: installs.filter(i => i.status === 1).length,
      rejected: installs.filter(i => i.status === 0).length,
      totalPayout: installs
        .filter(i => i.status === 1)
        .reduce((sum, i) => sum + (i.payout || 0), 0),
      incoming: installs.filter(i => i.source === 'incoming').length,
      outgoing: installs.filter(i => i.source === 'outgoing').length
    };

    res.json({
      installs,
      stats
    });
  } catch (error) {
    console.error('Error fetching installs:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete install/postback record
// API: DELETE /api/admin/trackier/installs/:id
router.delete('/trackier/installs/:id', async (req, res) => {
  try {
    const postback = await Postback.findById(req.params.id);
    
    if (!postback) {
      return res.status(404).json({ message: 'Install/Postback record not found' });
    }

    // Note: We don't delete associated click records as they may be used for other purposes
    // Only delete the postback record
    await Postback.findByIdAndDelete(req.params.id);
    
    console.log(`✅ Postback record deleted:`, {
      postbackId: postback._id,
      clickId: postback.clickId,
      userId: postback.userId,
      offerId: postback.offerId,
      payout: postback.payout,
      source: postback.source
    });

    res.json({ 
      message: 'Install/Postback record deleted successfully',
      deletedPostbackId: postback._id,
      clickId: postback.clickId
    });
  } catch (error) {
    console.error('Error deleting postback record:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete payout/postback record and reverse wallet update
// API: DELETE /api/admin/trackier/payouts/:id
router.delete('/trackier/payouts/:id', async (req, res) => {
  try {
    const postback = await Postback.findById(req.params.id);
    
    if (!postback) {
      return res.status(404).json({ message: 'Payout record not found' });
    }

    // If payout was approved and user exists, reverse the wallet update
    if (postback.status === 1 && postback.payout > 0 && postback.userId) {
      try {
        const user = await User.findById(postback.userId);
        if (user) {
          // Reverse the wallet update
          const payoutAmount = postback.payout || 0;
          user.wallet = Math.max(0, (user.wallet || 0) - payoutAmount);
          user.totalCashback = Math.max(0, (user.totalCashback || 0) - payoutAmount);
          await user.save();
          
          console.log(`💰 Wallet reversed for payout deletion:`, {
            userId: user._id,
            payoutAmount: payoutAmount,
            newWalletBalance: user.wallet,
            newTotalCashback: user.totalCashback
          });
        }
      } catch (walletError) {
        console.error('❌ Error reversing wallet update:', walletError);
        // Continue with deletion even if wallet update fails
      }
    }

    // Update click record if it exists
    if (postback.clickId) {
      try {
        const clickRecord = await Click.findOne({ clickId: postback.clickId });
        if (clickRecord) {
          clickRecord.converted = false;
          clickRecord.conversionValue = 0;
          clickRecord.convertedAt = null;
          await clickRecord.save();
          console.log('✅ Click record updated (conversion reversed)');
        }
      } catch (clickError) {
        console.error('❌ Error updating click record:', clickError);
        // Continue with deletion even if click update fails
      }
    }

    // Delete the postback record
    await Postback.findByIdAndDelete(req.params.id);
    
    console.log(`✅ Payout record deleted:`, {
      postbackId: postback._id,
      clickId: postback.clickId,
      userId: postback.userId,
      offerId: postback.offerId,
      payout: postback.payout,
      source: postback.source
    });

    res.json({ 
      message: 'Payout record deleted successfully and wallet updated',
      deletedPostbackId: postback._id,
      clickId: postback.clickId,
      walletReversed: postback.status === 1 && postback.payout > 0 && postback.userId ? true : false
    });
  } catch (error) {
    console.error('Error deleting payout record:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get payouts statistics
router.get('/trackier/payouts', async (req, res) => {
  try {
    const { offerId, userId, startDate, endDate } = req.query;
    
    const query = { status: 1 }; // Only approved conversions
    if (offerId) query.offerId = offerId;
    if (userId) query.userId = userId;
    
    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const payouts = await Postback.find(query)
      .populate('userId', 'name email')
      .populate('offerId', 'title trackierOfferId')
      .sort({ createdAt: -1 })
      .limit(parseInt(req.query.limit) || 100);

    const stats = {
      totalPayouts: payouts.length,
      totalAmount: payouts.reduce((sum, p) => sum + (p.payout || 0), 0),
      averagePayout: payouts.length > 0 
        ? (payouts.reduce((sum, p) => sum + (p.payout || 0), 0) / payouts.length).toFixed(2)
        : 0
    };

    res.json({
      payouts,
      stats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get comprehensive Trackier statistics (clicks + installs + payouts)
router.get('/trackier/stats', async (req, res) => {
  try {
    const { startDate, endDate, offerId } = req.query;
    
    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Build offer filter
    const offerFilter = {};
    if (offerId) {
      offerFilter.offerId = offerId;
    }

    // Get clicks
    const clicksQuery = { ...dateFilter, ...offerFilter };
    const totalClicks = await Click.countDocuments(clicksQuery);
    const convertedClicks = await Click.countDocuments({ ...clicksQuery, converted: true });

    // Get installs (postbacks) - include both incoming and outgoing
    const installsQuery = { ...dateFilter, ...offerFilter };
    const totalInstalls = await Postback.countDocuments(installsQuery);
    const approvedInstalls = await Postback.countDocuments({ ...installsQuery, status: 1 });
    const incomingInstalls = await Postback.countDocuments({ ...installsQuery, source: 'incoming' });
    const outgoingInstalls = await Postback.countDocuments({ ...installsQuery, source: 'outgoing' });

    // Get payouts (approved postbacks)
    const payoutsQuery = { ...dateFilter, ...offerFilter, status: 1 };
    const totalPayouts = await Postback.countDocuments(payoutsQuery);
    const payoutAggregation = await Postback.aggregate([
      { $match: payoutsQuery },
      { $group: { _id: null, total: { $sum: '$payout' } } }
    ]);
    const totalPayoutAmount = payoutAggregation[0]?.total || 0;

    // Calculate conversion rate
    const conversionRate = totalClicks > 0 
      ? ((approvedInstalls / totalClicks) * 100).toFixed(2)
      : 0;

    // Get top offers by clicks
    const topOffersByClicks = await Click.aggregate([
      { $match: clicksQuery },
      { $group: { _id: '$offerId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Get top offers by installs
    const topOffersByInstalls = await Postback.aggregate([
      { $match: installsQuery },
      { $group: { _id: '$offerId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      clicks: {
        total: totalClicks,
        converted: convertedClicks,
        conversionRate: totalClicks > 0 
          ? ((convertedClicks / totalClicks) * 100).toFixed(2)
          : 0
      },
      installs: {
        total: totalInstalls,
        approved: approvedInstalls,
        rejected: totalInstalls - approvedInstalls,
        approvalRate: totalInstalls > 0 
          ? ((approvedInstalls / totalInstalls) * 100).toFixed(2)
          : 0,
        incoming: incomingInstalls,
        outgoing: outgoingInstalls
      },
      payouts: {
        total: totalPayouts,
        totalAmount: totalPayoutAmount,
        averageAmount: totalPayouts > 0 
          ? (totalPayoutAmount / totalPayouts).toFixed(2)
          : 0
      },
      overall: {
        conversionRate: conversionRate,
        clickToInstallRate: totalClicks > 0 
          ? ((totalInstalls / totalClicks) * 100).toFixed(2)
          : 0
      },
      topOffers: {
        byClicks: topOffersByClicks,
        byInstalls: topOffersByInstalls
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

