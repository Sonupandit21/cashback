/**
 * Postback Examples - Ready-to-use postback handlers
 * 
 * This file contains example implementations for various postback scenarios:
 * - CPALead postback handler
 * - CPABuild postback handler
 * - Offerwall postback handler
 * - Payment gateway postback handler
 * - Campaign postback handler
 * 
 * NOTE: These are examples. Your main postback handler is in postback.js
 * which already handles most of these scenarios.
 */

const express = require('express');
const router = express.Router();
const Postback = require('../models/Postback');
const Click = require('../models/Click');
const Offer = require('../models/Offer');
const User = require('../models/User');

/**
 * CPALead Postback Handler Example
 * CPALead sends GET requests with query parameters
 */
router.post('/cpalead', async (req, res) => {
  try {
    // CPALead sends parameters in query string or POST body
    const {
      click_id,
      offer_id,
      payout,
      status,
      conversion_id,
      ip,
      user_agent
    } = { ...req.query, ...req.body };
    
    // Validate required parameter
    if (!click_id) {
      return res.status(200).json({
        success: false,
        message: 'click_id is required'
      });
    }
    
    // Find click record
    const clickRecord = await Click.findOne({ 
      clickId: click_id.trim() 
    });
    
    // Check for duplicate
    const existingPostback = await Postback.findOne({
      clickId: click_id.trim(),
      status: 1
    });
    
    if (existingPostback) {
      return res.status(200).json({
        success: true,
        message: 'Duplicate postback',
        duplicate: true
      });
    }
    
    // Create postback record
    const postback = new Postback({
      clickId: click_id.trim(),
      conversionId: conversion_id,
      offerId: clickRecord?.offerId,
      userId: clickRecord?.userId,
      payout: parseFloat(payout || 0),
      status: parseInt(status || 1),
      ipAddress: ip,
      userAgent: user_agent,
      source: 'incoming',
      rawData: { ...req.query, ...req.body }
    });
    
    await postback.save();
    
    // Update click record if approved
    if (parseInt(status) === 1 && clickRecord) {
      clickRecord.converted = true;
      clickRecord.conversionValue = parseFloat(payout || 0);
      clickRecord.convertedAt = new Date();
      await clickRecord.save();
    }
    
    // Credit user wallet if approved
    if (parseInt(status) === 1 && parseFloat(payout) > 0 && clickRecord?.userId) {
      const user = await User.findById(clickRecord.userId);
      if (user) {
        user.wallet = (user.wallet || 0) + parseFloat(payout);
        user.totalCashback = (user.totalCashback || 0) + parseFloat(payout);
        await user.save();
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'CPALead postback processed',
      postbackId: postback._id
    });
    
  } catch (error) {
    console.error('CPALead postback error:', error);
    res.status(200).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * CPABuild Postback Handler Example
 * CPABuild sends POST requests with JSON body
 */
router.post('/cpabuild', async (req, res) => {
  try {
    const {
      click_id,
      offer_id,
      payout,
      status,
      conversion_id,
      publisher_id
    } = req.body;
    
    // Validate required parameter
    if (!click_id) {
      return res.status(200).json({
        success: false,
        message: 'click_id is required'
      });
    }
    
    // Find click record
    const clickRecord = await Click.findOne({ 
      clickId: click_id.trim() 
    });
    
    // Check for duplicate
    const existingPostback = await Postback.findOne({
      clickId: click_id.trim(),
      status: 1
    });
    
    if (existingPostback) {
      return res.status(200).json({
        success: true,
        message: 'Duplicate postback',
        duplicate: true
      });
    }
    
    // Create postback record
    const postback = new Postback({
      clickId: click_id.trim(),
      conversionId: conversion_id,
      offerId: clickRecord?.offerId,
      userId: clickRecord?.userId,
      publisherId: publisher_id,
      payout: parseFloat(payout || 0),
      status: parseInt(status || 1),
      source: 'incoming',
      rawData: req.body
    });
    
    await postback.save();
    
    // Update click record if approved
    if (parseInt(status) === 1 && clickRecord) {
      clickRecord.converted = true;
      clickRecord.conversionValue = parseFloat(payout || 0);
      clickRecord.convertedAt = new Date();
      await clickRecord.save();
    }
    
    // Credit user wallet if approved
    if (parseInt(status) === 1 && parseFloat(payout) > 0 && clickRecord?.userId) {
      const user = await User.findById(clickRecord.userId);
      if (user) {
        user.wallet = (user.wallet || 0) + parseFloat(payout);
        user.totalCashback = (user.totalCashback || 0) + parseFloat(payout);
        await user.save();
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'CPABuild postback processed',
      postbackId: postback._id
    });
    
  } catch (error) {
    console.error('CPABuild postback error:', error);
    res.status(200).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Offerwall Postback Handler Example
 * Handles postbacks from offerwall networks
 */
router.post('/offerwall', async (req, res) => {
  try {
    const {
      click_id,
      offer_id,
      payout,
      status,
      user_id, // Offerwall's user ID
      conversion_id,
      network_name // Name of the offerwall network
    } = req.body;
    
    // Validate required parameters
    if (!click_id || !user_id) {
      return res.status(200).json({
        success: false,
        message: 'click_id and user_id are required'
      });
    }
    
    // Find your user by offerwall user ID
    // You may need to store offerwallUserId in User model
    const user = await User.findOne({ 
      offerwallUserId: user_id 
    });
    
    if (!user) {
      // Try to find by regular userId if offerwallUserId not set
      const userById = await User.findById(user_id);
      if (!userById) {
        return res.status(200).json({
          success: false,
          message: 'User not found'
        });
      }
    }
    
    const finalUser = user || await User.findById(user_id);
    
    // Find click record
    const clickRecord = await Click.findOne({ 
      clickId: click_id.trim() 
    });
    
    // Check for duplicate
    const existingPostback = await Postback.findOne({
      clickId: click_id.trim(),
      status: 1
    });
    
    if (existingPostback) {
      return res.status(200).json({
        success: true,
        message: 'Duplicate postback',
        duplicate: true
      });
    }
    
    // Create postback record
    const postback = new Postback({
      clickId: click_id.trim(),
      conversionId: conversion_id,
      offerId: clickRecord?.offerId,
      userId: finalUser._id,
      payout: parseFloat(payout || 0),
      status: parseInt(status || 1),
      source: 'incoming',
      rawData: {
        ...req.body,
        network_name: network_name
      }
    });
    
    await postback.save();
    
    // Update click record if approved
    if (parseInt(status) === 1 && clickRecord) {
      clickRecord.converted = true;
      clickRecord.conversionValue = parseFloat(payout || 0);
      clickRecord.convertedAt = new Date();
      await clickRecord.save();
    }
    
    // Credit user wallet if approved
    if (parseInt(status) === 1 && parseFloat(payout) > 0) {
      finalUser.wallet = (finalUser.wallet || 0) + parseFloat(payout);
      finalUser.totalCashback = (finalUser.totalCashback || 0) + parseFloat(payout);
      await finalUser.save();
    }
    
    res.status(200).json({
      success: true,
      message: 'Offerwall postback processed',
      postbackId: postback._id
    });
    
  } catch (error) {
    console.error('Offerwall postback error:', error);
    res.status(200).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Payment Gateway Postback Handler Example
 * Handles postbacks from payment gateways (Razorpay, Stripe, etc.)
 */
router.post('/payment', async (req, res) => {
  try {
    const {
      transaction_id,
      user_id,
      amount,
      status, // success, failed, pending
      payment_method,
      payment_gateway,
      signature // For signature verification
    } = req.body;
    
    // Validate required parameters
    if (!transaction_id || !user_id || !amount) {
      return res.status(200).json({
        success: false,
        message: 'transaction_id, user_id, and amount are required'
      });
    }
    
    // Verify payment signature (IMPORTANT for security)
    // Each payment gateway has different signature verification
    // Example for Razorpay:
    // const crypto = require('crypto');
    // const expectedSignature = crypto
    //   .createHmac('sha256', process.env.RAZORPAY_SECRET)
    //   .update(JSON.stringify(req.body))
    //   .digest('hex');
    // if (signature !== expectedSignature) {
    //   return res.status(200).json({ success: false, message: 'Invalid signature' });
    // }
    
    // Find user
    const user = await User.findById(user_id);
    if (!user) {  
        
      return res.status(200).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check for duplicate transaction
    const existingPayment = await Postback.findOne({
      conversionId: transaction_id,
      source: 'payment'
    });
    
    if (existingPayment) {
      return res.status(200).json({
        success: true,
        message: 'Duplicate payment postback',
        duplicate: true
      });
    }
    
    // Create payment postback record
    const paymentPostback = new Postback({
      clickId: `PAYMENT-${transaction_id}`,
      conversionId: transaction_id,
      userId: user._id,
      payout: parseFloat(amount),
      status: status === 'success' ? 1 : 0,
      conversionType: 'payment',
      source: 'payment',
      rawData: {
        ...req.body,
        payment_method: payment_method,
        payment_gateway: payment_gateway
      }
    });
    
    await paymentPostback.save();
    
    // Update user wallet if payment successful
    if (status === 'success') {
      user.wallet = (user.wallet || 0) + parseFloat(amount);
      await user.save();
    }
    
    res.status(200).json({
      success: true,
      message: 'Payment postback processed',
      postbackId: paymentPostback._id
    });
    
  } catch (error) {
    console.error('Payment postback error:', error);
    res.status(200).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Campaign Postback Handler Example
 * Handles postbacks for campaigns with multiple offers
 */
router.post('/campaign', async (req, res) => {
  try {
    const {
      campaign_id,
      click_id,
      offer_id,
      payout,
      status,
      conversion_id
    } = req.body;
    
    // Validate required parameters
    if (!campaign_id || !click_id) {
      return res.status(200).json({
        success: false,
        message: 'campaign_id and click_id are required'
      });
    }
    
    // Find all offers in campaign
    // Note: You may need to add campaignId field to Offer model
    const campaignOffers = await Offer.find({ 
      campaignId: campaign_id 
    });
    
    if (campaignOffers.length === 0) {
      return res.status(200).json({
        success: false,
        message: 'Campaign not found or has no offers'
      });
    }
    
    // Find click record
    const clickRecord = await Click.findOne({ 
      clickId: click_id.trim() 
    });
    
    // Check for duplicate
    const existingPostback = await Postback.findOne({
      clickId: click_id.trim(),
      status: 1
    });
    
    if (existingPostback) {
      return res.status(200).json({
        success: true,
        message: 'Duplicate postback',
        duplicate: true
      });
    }
    
    // Process postback for the specific offer in campaign
    const targetOffer = campaignOffers.find(o => 
      o._id.toString() === offer_id || 
      o.trackierOfferId === offer_id
    ) || campaignOffers[0];
    
    // Create postback record
    const postback = new Postback({
      clickId: click_id.trim(),
      conversionId: conversion_id,
      offerId: targetOffer._id,
      userId: clickRecord?.userId,
      payout: parseFloat(payout || 0),
      status: parseInt(status || 1),
      source: 'incoming',
      rawData: {
        ...req.body,
        campaign_id: campaign_id
      }
    });
    
    await postback.save();
    
    // Update click record if approved
    if (parseInt(status) === 1 && clickRecord) {
      clickRecord.converted = true;
      clickRecord.conversionValue = parseFloat(payout || 0);
      clickRecord.convertedAt = new Date();
      await clickRecord.save();
    }
    
    // Credit user wallet if approved
    if (parseInt(status) === 1 && parseFloat(payout) > 0 && clickRecord?.userId) {
      const user = await User.findById(clickRecord.userId);
      if (user) {
        user.wallet = (user.wallet || 0) + parseFloat(payout);
        user.totalCashback = (user.totalCashback || 0) + parseFloat(payout);
        await user.save();
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'Campaign postback processed',
      postbackId: postback._id,
      campaignId: campaign_id,
      offerId: targetOffer._id
    });
    
  } catch (error) {
    console.error('Campaign postback error:', error);
    res.status(200).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Generic Postback Handler
 * Handles any postback format with flexible parameter mapping
 */
router.post('/generic', async (req, res) => {
  try {
    // Extract parameters from query or body
    const params = { ...req.query, ...req.body };
    
    // Map various parameter name formats
    const clickId = params.click_id || params.clickid || params.clickId || params.clid;
    const payout = params.payout || params.amount || params.reward || params.cashback;
    const status = params.status || params.approved || params.converted;
    const conversionId = params.conversion_id || params.conversionid || params.conv_id;
    const offerId = params.offer_id || params.offerid || params.offerId;
    const userId = params.user_id || params.userid || params.userId || params.publisher_id;
    
    // Validate required parameter
    if (!clickId) {
      return res.status(200).json({
        success: false,
        message: 'Click ID is required',
        received_params: Object.keys(params)
      });
    }
    
    // Find click record
    const clickRecord = await Click.findOne({ 
      clickId: clickId.trim() 
    });
    
    // Check for duplicate
    const existingPostback = await Postback.findOne({
      clickId: clickId.trim(),
      status: 1
    });
    
    if (existingPostback) {
      return res.status(200).json({
        success: true,
        message: 'Duplicate postback',
        duplicate: true
      });
    }
    
    // Normalize status (handle various formats)
    let normalizedStatus = 1; // Default to approved
    if (status !== undefined && status !== null) {
      if (typeof status === 'string') {
        normalizedStatus = ['1', 'true', 'approved', 'success'].includes(status.toLowerCase()) ? 1 : 0;
      } else {
        normalizedStatus = parseInt(status) === 1 ? 1 : 0;
      }
    }
    
    // Create postback record
    const postback = new Postback({
      clickId: clickId.trim(),
      conversionId: conversionId,
      offerId: clickRecord?.offerId || offerId,
      userId: clickRecord?.userId || userId,
      payout: parseFloat(payout || 0),
      status: normalizedStatus,
      source: 'incoming',
      rawData: params
    });
    
    await postback.save();
    
    // Update click record if approved
    if (normalizedStatus === 1 && clickRecord) {
      clickRecord.converted = true;
      clickRecord.conversionValue = parseFloat(payout || 0);
      clickRecord.convertedAt = new Date();
      await clickRecord.save();
    }
    
    // Credit user wallet if approved
    if (normalizedStatus === 1 && parseFloat(payout) > 0 && clickRecord?.userId) {
      const user = await User.findById(clickRecord.userId);
      if (user) {
        user.wallet = (user.wallet || 0) + parseFloat(payout);
        user.totalCashback = (user.totalCashback || 0) + parseFloat(payout);
        await user.save();
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'Generic postback processed',
      postbackId: postback._id
    });
    
  } catch (error) {
    console.error('Generic postback error:', error);
    res.status(200).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;


