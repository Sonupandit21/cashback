const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Offer = require('../models/Offer');
const User = require('../models/User');
const UPI = require('../models/UPI');
const Click = require('../models/Click');
const Postback = require('../models/Postback');
const { auth } = require('../middleware/auth');
const { trackClick, trackConversion } = require('../utils/trackier');

// Get all active offers
router.get('/', async (req, res) => {
  try {
    const { category, featured } = req.query;
    const query = { isActive: true };
    
    if (category) {
      query.category = category;
    }
    
    if (featured === 'true') {
      query.isFeatured = true;
    }

    const offers = await Offer.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(req.query.limit) || 100);
    
    res.json(offers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Landing page route to capture Click ID from URL parameters
// IMPORTANT: This must come before /:id route to avoid route conflicts
// This route captures click_id, sub1, or p1 from URL and stores it
// Example: /api/offers/landing?click_id=CLID-123&offer_id=xyz
router.get('/landing', async (req, res) => {
  try {
    const { click_id, clickid, sub1, p1, offer_id, offerid } = req.query;
    
    // Get Click ID from various parameter names
    const clickId = click_id || clickid || sub1 || p1;
    
    if (!clickId) {
      return res.status(400).json({ 
        success: false,
        message: 'Click ID is required in URL parameters (click_id, sub1, or p1)' 
      });
    }

    // Get offer ID if provided
    const offerId = offer_id || offerid;

    // Get user info from request (if authenticated)
    const userId = req.user?._id || null;

    // Get IP and user agent
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';
    const referrer = req.headers['referer'] || '';

    // Try to find existing click record
    let clickRecord = await Click.findOne({ clickId: clickId });

    if (!clickRecord && offerId) {
      // Create new click record if offer ID is provided
      try {
        const offer = await Offer.findById(offerId);
        if (offer) {
          clickRecord = new Click({
            userId: userId,
            offerId: offer._id,
            trackierOfferId: offer.trackierOfferId || null,
            clickId: clickId,
            ipAddress: ipAddress,
            userAgent: userAgent,
            referrer: referrer
          });
          await clickRecord.save();
        }
      } catch (error) {
        console.error('Error creating click record:', error);
      }
    }

    // Return success response (frontend will store in localStorage)
    res.json({ 
      success: true,
      message: 'Click ID captured successfully',
      clickId: clickId,
      offerId: offerId || null
    });
  } catch (error) {
    console.error('Error capturing click ID:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Get single offer
router.get('/:id', async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }
    res.json(offer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Generate Click ID and return offer URL with Click ID appended
// This endpoint generates a unique Click ID and appends it to the offer URL
// NOTE: Click ID is generated server-side but not exposed to frontend until installation
router.get('/:id/generate-click', auth, async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer || !offer.isActive) {
      return res.status(404).json({ message: 'Offer not found or inactive' });
    }

    // Get user IP and user agent for tracking
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';
    const referrer = req.headers['referer'] || '';

    // Generate Click ID
    const { generateClickId } = require('../utils/trackier');
    let clickId = generateClickId();

    // Track with Trackier if offer has trackierOfferId (optional)
    if (offer.trackierOfferId) {
      const trackResult = await trackClick(
        offer.trackierOfferId,
        req.user._id.toString(),
        {
          ipAddress: ipAddress,
          userAgent: userAgent,
          referrer: referrer
        }
      );
      // Use Trackier click ID if available, otherwise use generated one
      if (trackResult.clickId) {
        clickId = trackResult.clickId;
      }
    }

    // Store click in database for conversion tracking
    try {
      const click = new Click({
        userId: req.user._id,
        offerId: offer._id,
        trackierOfferId: offer.trackierOfferId || null,
        clickId: clickId,
        ipAddress: ipAddress,
        userAgent: userAgent,
        referrer: referrer
      });
      await click.save();
    } catch (dbError) {
      // Log but don't fail the request if click already exists
      console.error('Error saving click to database:', dbError.message);
    }

    // Generate a secure token to hide Click ID from frontend
    // Frontend will use this token to redirect, and server will append Click ID
    const crypto = require('crypto');
    const redirectToken = crypto.randomBytes(16).toString('hex');
    
    // Store token-to-clickId mapping temporarily (you can use Redis or in-memory store)
    // For now, we'll use a simple approach: return proxy URL instead of direct URL with Click ID
    
    // Return proxy redirect URL instead of direct URL with Click ID
    // This way Click ID is not visible to user until installation
    const proxyUrl = `${req.protocol}://${req.get('host')}/api/offers/${offer._id}/redirect?token=${redirectToken}`;
    
    // Store token mapping in database (add to Click record or use separate collection)
    // For simplicity, we'll store it in the click record
    const clickRecord = await Click.findOne({ clickId: clickId });
    if (clickRecord) {
      clickRecord.redirectToken = redirectToken;
      await clickRecord.save();
    }

    res.json({ 
      success: true,
      message: 'Click ID generated successfully (hidden until installation)',
      redirectUrl: proxyUrl, // Proxy URL that will append Click ID server-side
      // Don't return clickId to frontend - keep it hidden
    });
  } catch (error) {
    console.error('Error generating click ID:', error);
    res.status(500).json({ message: error.message });
  }
});

// Proxy redirect endpoint - appends Click ID server-side (hidden from user)
// This endpoint redirects to the actual offer URL with Click ID appended
// Click ID is not visible in browser URL until installation
// NOTE: No auth required - token provides security
router.get('/:id/redirect', async (req, res) => {
  try {
    const { token } = req.query;
    const offer = await Offer.findById(req.params.id);
    
    if (!offer || !offer.isActive) {
      return res.status(404).json({ message: 'Offer not found or inactive' });
    }

    if (!token) {
      return res.status(400).json({ message: 'Redirect token is required' });
    }

    // Find click record by token (token is unique and secure)
    const clickRecord = await Click.findOne({ 
      redirectToken: token,
      offerId: offer._id
    });

    if (!clickRecord) {
      return res.status(404).json({ message: 'Invalid or expired redirect token' });
    }

    // Build offer URL with Click ID (this happens server-side)
    // Click ID is appended but user doesn't see it in the initial redirect URL
    const offerUrl = new URL(offer.offerLink);
    offerUrl.searchParams.set('click_id', clickRecord.clickId);
    offerUrl.searchParams.set('sub1', clickRecord.clickId); // Trackier/Impact standard
    offerUrl.searchParams.set('p1', clickRecord.clickId); // Alternative parameter

    // Server-side redirect - Click ID is appended server-side
    // Note: Click ID will be in the final URL, but user doesn't see it until they're redirected
    // This provides better security than showing it in the initial redirect
    res.redirect(offerUrl.toString());
  } catch (error) {
    console.error('Error in redirect:', error);
    res.status(500).json({ message: error.message });
  }
});

// Save clickid from Trackier URL parameter (p1)
// This endpoint is called when user lands from Trackier tracking link
router.post('/save-clickid', async (req, res) => {
  try {
    const { clickid, click_id, sub1, p1 } = req.body;

    // Accept multiple parameter names
    const clickId = clickid || click_id || sub1 || p1;

    if (!clickId) {
      return res.status(400).json({ message: 'Click ID is required' });
    }

    // Store clickid in response (frontend will save to localStorage)
    res.json({ 
      success: true,
      message: 'Click ID received',
      clickid: clickId 
    });
  } catch (error) {
    console.error('Error saving click ID:', error);
    res.status(500).json({ message: error.message });
  }
});

// Track offer click
router.post('/:id/track', auth, async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer || !offer.isActive) {
      return res.status(404).json({ message: 'Offer not found or inactive' });
    }

    // Get user IP and user agent for tracking
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';
    const referrer = req.headers['referer'] || '';

    let clickId = null;

  // Track with Trackier if offer has trackierOfferId (optional)
  if (offer.trackierOfferId) {
    const trackResult = await trackClick(
      offer.trackierOfferId,
      req.user._id.toString(),
      {
        ipAddress: ipAddress,
        userAgent: userAgent,
        referrer: referrer
      }
    );
    clickId = trackResult.clickId;
  } else {
    // Even if Trackier offer ID is missing, generate a local clickId for MongoDB tracking
    const localTrack = await trackClick(null, req.user._id.toString(), {
      ipAddress,
      userAgent,
      referrer
    });
    clickId = localTrack.clickId;
  }

  // Store click in database for conversion tracking (always, as long as we have clickId)
  if (clickId) {
    try {
      const click = new Click({
        userId: req.user._id,
        offerId: offer._id,
        trackierOfferId: offer.trackierOfferId || null,
        clickId: clickId,
        ipAddress: ipAddress,
        userAgent: userAgent,
        referrer: referrer
      });
      await click.save();
    } catch (dbError) {
      // Log but don't fail the request if click already exists
      console.error('Error saving click to database:', dbError.message);
    }
  }

    res.json({ 
      message: 'Click tracked successfully',
      clickId: clickId 
    });
  } catch (error) {
    console.error('Error tracking click:', error);
    res.status(500).json({ message: error.message });
  }
});

// Claim offer (user action)
router.post('/:id/claim', auth, async (req, res) => {
  try {
    const { upiId } = req.body;

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

    const offer = await Offer.findById(req.params.id);
    if (!offer || !offer.isActive) {
      return res.status(404).json({ message: 'Offer not found or inactive' });
    }

    // Check if max users reached
    if (offer.maxUsers && offer.currentUsers >= offer.maxUsers) {
      return res.status(400).json({ message: 'Maximum users reached for this offer' });
    }

    // Fetch user first to check for duplicate claims
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user already claimed this offer
    // Use both MongoDB query and in-memory check for reliability
    const offerIdString = offer._id.toString();
    const alreadyClaimed = user.offersClaimed.some(claim => {
      if (!claim.offerId) return false;
      // Convert both to strings for comparison
      const claimOfferIdString = claim.offerId.toString();
      return claimOfferIdString === offerIdString;
    });

    if (alreadyClaimed) {
      return res.status(400).json({ message: 'You have already claimed this offer' });
    }

    // Check if UPI already exists in 'upi' collection for this user and offer
    const existingUPI = await UPI.findOne({
      userId: req.user._id,
      offerId: offer._id
    });

    if (existingUPI) {
      return res.status(400).json({ message: 'You have already claimed this offer' });
    }

    // Get clickid from request body (sent from frontend localStorage)
    const { clickid } = req.body;
    
    // Find the click ID for this user and offer (for conversion tracking)
    let clickId = clickid || null; // Use clickid from request if available
    let clickRecord = null;
    
    // If no clickid in request, try to find from database
    if (!clickId) {
      try {
        clickRecord = await Click.findOne({
          userId: req.user._id,
          offerId: offer._id,
          converted: false
        }).sort({ createdAt: -1 });

        if (clickRecord) {
          clickId = clickRecord.clickId;
        }
      } catch (error) {
        console.error('Error finding click record:', error);
      }
    } else {
      // If clickid from URL, try to find or create click record
      try {
        clickRecord = await Click.findOne({ clickId: clickId });
        if (!clickRecord) {
          // Create new click record with the clickid from URL
          const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
          const userAgent = req.headers['user-agent'] || '';
          const referrer = req.headers['referer'] || '';
          
          clickRecord = new Click({
            userId: req.user._id,
            offerId: offer._id,
            trackierOfferId: offer.trackierOfferId || null,
            clickId: clickId,
            ipAddress: ipAddress,
            userAgent: userAgent,
            referrer: referrer
          });
          await clickRecord.save();
        }
      } catch (error) {
        console.error('Error creating/finding click record:', error);
      }
    }



    // Update current users count
    offer.currentUsers += 1;
    await offer.save();

    // Add to user's claimed offers with UPI ID
    user.offersClaimed.push({
      offerId: offer._id,
      upiId: upiId.trim(),
      status: 'pending'
    });
    
    await user.save();

    // Save UPI data in separate 'upi' collection
    const upiData = new UPI({
      userId: req.user._id,
      offerId: offer._id,
      upiId: upiId.trim(),
      status: 'pending'
    });
    await upiData.save();

    res.json({ message: 'Offer claimed successfully', offer });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;


