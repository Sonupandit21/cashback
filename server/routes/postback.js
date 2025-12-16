const express = require('express');
const router = express.Router();
const Postback = require('../models/Postback');
const Click = require('../models/Click');
const Offer = require('../models/Offer');
const User = require('../models/User');

/**
 * POST /api/postback
 * Receive postback from Trackier (Server-to-Server)
 * 
 * Postbacks are server-to-server callbacks triggered by events.
 * When a conversion happens, Trackier sends data to this URL.
 * 
 * Trackier will send postbacks to this endpoint when conversions occur
 * Format: GET or POST with query params or body
 * 
 * Common parameters:
 * - click_id: The click ID from Trackier
 * - conversion_id: Conversion ID (optional)
 * - payout: Payout amount
 * - status: 1 = approved, 0 = rejected
 * - offer_id: Trackier offer ID
 * - publisher_id: Publisher/Affiliate ID
 * - advertiser_id: Advertiser ID
 * 
 * Best Practices Implemented:
 * - Idempotency: Handles duplicate postbacks gracefully
 * - Error Handling: Always returns 200 to prevent retries
 * - Logging: Comprehensive logging for debugging
 * - Validation: Validates required parameters
 * - Data Storage: Stores all raw data for audit trail
 */
router.post('/', async (req, res) => {
  const startTime = Date.now();
  let postbackId = null;
  
  try {
    // Log incoming postback request
    console.log('📥 Postback received:', {
      method: req.method,
      query: req.query,
      body: req.body,
      headers: {
        'user-agent': req.headers['user-agent'],
        'x-forwarded-for': req.headers['x-forwarded-for']
      },
      timestamp: new Date().toISOString()
    });

    // Accept both GET query params and POST body
    // POST body takes precedence over query params
    const params = { ...req.query, ...req.body };
    
    const {
      click_id,
      clickid, // Alternative parameter name
      conversion_id,
      conversionid,
      payout,
      status,
      offer_id,
      offerid,
      publisher_id,
      publisherid,
      advertiser_id,
      advertiserid,
      conversion_type,
      conversiontype,
      ip,
      ip_address,
      user_agent,
      useragent,
      referrer
    } = params;

    // Use click_id or clickid (both are common)
    const clickId = click_id || clickid;
    
    // Validate required parameters
    if (!clickId) {
      console.warn('⚠️ Postback rejected: Missing click ID', params);
      // Return 200 to prevent retries, but log the issue
      return res.status(200).json({ 
        success: false,
        message: 'Click ID is required',
        received_params: Object.keys(params)
      });
    }

    // Normalize clickId FIRST (trim whitespace, handle case sensitivity)
    // This ensures consistent matching throughout the handler
    const normalizedClickId = clickId ? clickId.trim() : null;
    
    // Check for duplicate postback (idempotency)
    // Ensure install click_id uniqueness - each click ID can only have ONE approved payout
    const conversionId = conversion_id || conversionid;
    const postbackStatus = status !== undefined && status !== null ? parseInt(status) : 1;
    
    // Check if this click ID already has an approved payout (status = 1)
    // Use normalized clickId for consistent matching
    if (postbackStatus === 1) {
      // Try exact match first
      let existingApprovedPostback = await Postback.findOne({ 
        clickId: normalizedClickId,
        status: 1 // Only check approved payouts
      });
      
      // If not found, try case-insensitive match
      if (!existingApprovedPostback && normalizedClickId) {
        existingApprovedPostback = await Postback.findOne({ 
          clickId: { $regex: new RegExp(`^${normalizedClickId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
          status: 1
        });
      }
      
      if (existingApprovedPostback) {
        console.log('⚠️ Duplicate approved payout detected (click_id already has payout):', {
          clickId: normalizedClickId,
          existingPostbackId: existingApprovedPostback._id,
          existingPayout: existingApprovedPostback.payout,
          newPayout: payout
        });
        // Return success but don't process duplicate payout
        return res.status(200).json({ 
          success: true,
          message: 'Payout already exists for this click ID (duplicate prevented)',
          postbackId: existingApprovedPostback._id,
          duplicate: true,
          reason: 'click_id_unique_constraint'
        });
      }
    }
    
    // Check for duplicate conversion (if conversionId provided)
    // This ensures install uniqueness per conversion
    if (conversionId) {
      // Try exact match first
      let existingConversion = await Postback.findOne({ 
        clickId: normalizedClickId,
        conversionId: conversionId
      });
      
      // If not found, try case-insensitive match
      if (!existingConversion && normalizedClickId) {
        existingConversion = await Postback.findOne({ 
          clickId: { $regex: new RegExp(`^${normalizedClickId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
          conversionId: conversionId
        });
      }
      
      if (existingConversion) {
        console.log('✅ Duplicate conversion detected (idempotent):', {
          clickId: normalizedClickId,
          conversionId: conversionId,
          existingId: existingConversion._id
        });
        // Return success for duplicate (idempotent operation)
        return res.status(200).json({ 
          success: true,
          message: 'Conversion already processed (duplicate)',
          postbackId: existingConversion._id,
          duplicate: true
        });
      }
    }
    
    // Find the click record to get user and offer info
    // Try multiple methods to find the click record
    let clickRecord = null;
    
    // Method 1: Exact match
    if (normalizedClickId) {
      clickRecord = await Click.findOne({ clickId: normalizedClickId });
      if (clickRecord) {
        console.log('✅ Found click record (Method 1 - exact match):', normalizedClickId);
      }
    }
    
    // Method 2: Case-insensitive search
    if (!clickRecord && normalizedClickId) {
      clickRecord = await Click.findOne({ 
        clickId: { $regex: new RegExp(`^${normalizedClickId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
      });
      if (clickRecord) {
        console.log('✅ Found click record (Method 2 - case-insensitive):', normalizedClickId);
      }
    }
    
    // Method 3: Try to find from recent postbacks (in case click record exists but clickId format differs)
    if (!clickRecord && normalizedClickId) {
      const recentPostback = await Postback.findOne({ 
        clickId: { $regex: new RegExp(`^${normalizedClickId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
      }).sort({ createdAt: -1 });
      
      if (recentPostback && recentPostback.userId) {
        // Try to find click record by userId and offerId from postback
        if (recentPostback.offerId) {
          clickRecord = await Click.findOne({
            userId: recentPostback.userId,
            offerId: recentPostback.offerId,
            clickId: { $regex: new RegExp(`^${normalizedClickId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
          });
          if (clickRecord) {
            console.log('✅ Found click record (Method 3 - from postback):', normalizedClickId);
          }
        }
      }
    }
    
    // Method 4: Try partial match (in case clickId has extra characters)
    if (!clickRecord && normalizedClickId) {
      // Try to find click records that contain this clickId or vice versa
      const partialMatch = await Click.findOne({
        $or: [
          { clickId: { $regex: normalizedClickId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
          { clickId: normalizedClickId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }
        ]
      });
      if (partialMatch) {
        console.log('✅ Found click record (Method 4 - partial match):', {
          searchId: normalizedClickId,
          foundId: partialMatch.clickId
        });
        clickRecord = partialMatch;
      }
    }
    
    // Method 5: Search by clicking on any postback with this clickId to get userId/offerId
    if (!clickRecord && normalizedClickId) {
      const anyPostback = await Postback.findOne({ 
        clickId: { $regex: new RegExp(`^${normalizedClickId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
      }).sort({ createdAt: -1 });
      
      if (anyPostback && anyPostback.userId && anyPostback.offerId) {
        // Try to find click record with userId and offerId (even if clickId doesn't match exactly)
        clickRecord = await Click.findOne({
          userId: anyPostback.userId,
          offerId: anyPostback.offerId
        }).sort({ createdAt: -1 });
        
        if (clickRecord) {
          console.log('✅ Found click record (Method 5 - from postback userId/offerId):', {
            searchClickId: normalizedClickId,
            foundClickId: clickRecord.clickId,
            userId: clickRecord.userId?.toString(),
            offerId: clickRecord.offerId?.toString()
          });
        }
      }
    }
    
    let userId = null;
    let offerId = null;
    let trackierOfferId = null;

    if (clickRecord) {
      userId = clickRecord.userId;
      offerId = clickRecord.offerId;
      trackierOfferId = clickRecord.trackierOfferId;
      console.log('✅ Found click record:', {
        clickId: clickRecord.clickId,
        userId: userId?.toString(),
        offerId: offerId?.toString(),
        converted: clickRecord.converted
      });
    } else {
      console.log('⚠️ Click record not found, attempting to find from postback or offer data');
      
      // Try to find offer by trackier offer ID if provided
      const trackierOfferIdParam = offer_id || offerid;
      if (trackierOfferIdParam) {
        const offer = await Offer.findOne({ trackierOfferId: trackierOfferIdParam });
        if (offer) {
          offerId = offer._id;
          trackierOfferId = trackierOfferIdParam;
          console.log('✅ Found offer from trackierOfferId:', trackierOfferIdParam);
        }
      }
      
      // Try to extract userId from publisher_id if it's a MongoDB ObjectId
      const publisherIdParam = publisher_id || publisherid;
      if (publisherIdParam && !userId) {
        // Check if publisher_id looks like a MongoDB ObjectId
        if (/^[0-9a-fA-F]{24}$/.test(publisherIdParam)) {
          try {
            const user = await User.findById(publisherIdParam);
            if (user) {
              userId = user._id;
              console.log('✅ Found userId from publisher_id:', userId.toString());
            }
          } catch (err) {
            // Not a valid ObjectId or user not found, ignore
          }
        }
      }
      
      // Try to find userId/offerId from any existing postback with this clickId
      if ((!userId || !offerId) && normalizedClickId) {
        const existingPostback = await Postback.findOne({
          clickId: { $regex: new RegExp(`^${normalizedClickId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
        }).sort({ createdAt: -1 });
        
        if (existingPostback) {
          if (!userId && existingPostback.userId) {
            userId = existingPostback.userId;
            console.log('✅ Found userId from existing postback:', userId.toString());
          }
          if (!offerId && existingPostback.offerId) {
            offerId = existingPostback.offerId;
            console.log('✅ Found offerId from existing postback:', offerId.toString());
          }
          if (!trackierOfferId && existingPostback.trackierOfferId) {
            trackierOfferId = existingPostback.trackierOfferId;
            console.log('✅ Found trackierOfferId from existing postback:', trackierOfferId);
          }
        }
      }
      
      // Try to find click record by searching all clicks with similar patterns
      // This helps when clickId format might have changed slightly
      if (!clickRecord && normalizedClickId) {
        // Try searching for clicks where clickId contains the normalized clickId or vice versa
        const similarClicks = await Click.find({
          $or: [
            { clickId: { $regex: normalizedClickId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
            { clickId: normalizedClickId }
          ]
        }).limit(5);
        
        if (similarClicks.length > 0) {
          // Use the most recent one
          clickRecord = similarClicks[0];
          console.log('✅ Found click record (similar pattern search):', {
            searchId: normalizedClickId,
            foundId: clickRecord.clickId,
            foundCount: similarClicks.length
          });
        }
      }
    }

    // Parse and validate numeric values
    const payoutAmount = payout ? parseFloat(payout) : 0;
    // postbackStatus already defined above (line 94)
    
    // Validate payout is a valid number
    if (isNaN(payoutAmount)) {
      console.warn('⚠️ Invalid payout amount:', payout);
    }
    
    // Validate status is 0 or 1
    if (postbackStatus !== 0 && postbackStatus !== 1) {
      console.warn('⚠️ Invalid status value:', status, 'defaulting to 1');
    }

    // Create postback record - use normalized clickId for consistency
    const postback = new Postback({
      clickId: normalizedClickId || clickId, // Use normalized clickId if available
      conversionId: conversion_id || conversionid || null,
      offerId: offerId,
      trackierOfferId: offer_id || offerid || trackierOfferId,
      userId: userId,
      publisherId: publisher_id || publisherid || null,
      advertiserId: advertiser_id || advertiserid || null,
      payout: payoutAmount,
      status: postbackStatus === 0 ? 0 : 1, // Ensure only 0 or 1
      conversionType: conversion_type || conversiontype || 'install',
      ipAddress: ip || ip_address || req.ip || req.headers['x-forwarded-for'] || null,
      userAgent: user_agent || useragent || req.headers['user-agent'] || null,
      referrer: referrer || req.headers['referer'] || null,
      rawData: {
        ...params,
        received_at: new Date().toISOString(),
        request_method: req.method,
        request_headers: {
          'user-agent': req.headers['user-agent'],
          'x-forwarded-for': req.headers['x-forwarded-for']
        }
      },
      source: 'incoming'
    });

    await postback.save();
    postbackId = postback._id;

    // Update click record - try to find again after saving postback
    // This helps in case the click record was created between the initial search and now
    if (!clickRecord && normalizedClickId) {
      // Try case-insensitive search one more time
      clickRecord = await Click.findOne({ 
        clickId: { $regex: new RegExp(`^${normalizedClickId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
      });
      if (clickRecord) {
        console.log('✅ Found click record after postback save (case-insensitive):', clickRecord.clickId);
        // Update userId and offerId from found click record
        if (!userId) userId = clickRecord.userId;
        if (!offerId) offerId = clickRecord.offerId;
        if (!trackierOfferId) trackierOfferId = clickRecord.trackierOfferId;
      }
    }
    
    // If still not found and we have userId/offerId from postback, try to find by those
    if (!clickRecord && normalizedClickId && userId && offerId) {
      // Try to find click record by userId, offerId, and similar clickId
      clickRecord = await Click.findOne({
        userId: userId,
        offerId: offerId,
        clickId: { $regex: new RegExp(`^${normalizedClickId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
      });
      if (clickRecord) {
        console.log('✅ Found click record by userId/offerId:', clickRecord.clickId);
      }
      
      // If still not found, try to find by userId and offerId only (ignore clickId)
      if (!clickRecord) {
        const recentClick = await Click.findOne({
          userId: userId,
          offerId: offerId
        }).sort({ createdAt: -1 });
        
        if (recentClick) {
          console.log('✅ Found click record by userId/offerId only (ignoring clickId):', {
            searchClickId: normalizedClickId,
            foundClickId: recentClick.clickId
          });
          clickRecord = recentClick;
        }
      }
    }
    
    // Final attempt: Try to find click record by searching all clicks with this exact clickId
    // This is a last resort before creating a new one
    if (!clickRecord && normalizedClickId) {
      const allClicksWithId = await Click.find({
        clickId: normalizedClickId
      }).limit(1);
      
      if (allClicksWithId.length > 0) {
        clickRecord = allClicksWithId[0];
        console.log('✅ Found click record (final attempt - exact match):', clickRecord.clickId);
        // Update userId and offerId from found click record
        if (!userId) userId = clickRecord.userId;
        if (!offerId) offerId = clickRecord.offerId;
        if (!trackierOfferId) trackierOfferId = clickRecord.trackierOfferId;
      }
    }
    
    if (clickRecord) {
      // Only update if postback is approved (status = 1)
      if (postbackStatus === 1) {
        const wasConverted = clickRecord.converted;
        
        // Use direct update for reliability (more reliable than save())
        try {
          const updateResult = await Click.updateOne(
            { _id: clickRecord._id },
            {
              $set: {
                converted: true,
                conversionId: conversion_id || conversionid || postback.conversionId || clickRecord.conversionId,
                conversionValue: payoutAmount > 0 ? payoutAmount : clickRecord.conversionValue || 0,
                convertedAt: clickRecord.convertedAt || new Date()
              }
            }
          );
          
          if (updateResult.modifiedCount > 0 || updateResult.matchedCount > 0) {
            // Verify the update by reading the record back
            const updatedClickRecord = await Click.findById(clickRecord._id);
            console.log('✅ Click record updated to converted:', {
              clickId: normalizedClickId || clickRecord.clickId,
              clickRecordId: clickRecord._id,
              conversionValue: payoutAmount > 0 ? payoutAmount : clickRecord.conversionValue || 0,
              wasAlreadyConverted: wasConverted,
              isNowConverted: updatedClickRecord?.converted || false,
              updateResult: {
                matchedCount: updateResult.matchedCount,
                modifiedCount: updateResult.modifiedCount
              }
            });
            
            if (updatedClickRecord && !updatedClickRecord.converted) {
              console.error('❌ WARNING: Click record update did not set converted=true!', {
                clickId: normalizedClickId || clickRecord.clickId,
                clickRecordId: clickRecord._id
              });
            }
          } else {
            console.log('⚠️ Click record update had no effect (may already be converted):', {
              clickId: normalizedClickId || clickRecord.clickId,
              wasAlreadyConverted: wasConverted,
              updateResult: {
                matchedCount: updateResult.matchedCount,
                modifiedCount: updateResult.modifiedCount
              }
            });
          }
        } catch (updateError) {
          console.error('❌ Error with direct update:', updateError.message);
          // Fallback to save() method
          try {
            clickRecord.converted = true;
            clickRecord.conversionId = conversion_id || conversionid || postback.conversionId || clickRecord.conversionId;
            clickRecord.conversionValue = payoutAmount > 0 ? payoutAmount : clickRecord.conversionValue || 0;
            clickRecord.convertedAt = clickRecord.convertedAt || new Date();
            await clickRecord.save();
            
            // Verify the update
            const updatedClickRecord = await Click.findById(clickRecord._id);
            console.log('✅ Click record updated using save() fallback:', {
              clickId: normalizedClickId || clickRecord.clickId,
              clickRecordId: clickRecord._id,
              isNowConverted: updatedClickRecord?.converted || false,
              conversionValue: updatedClickRecord?.conversionValue || 0
            });
            
            if (updatedClickRecord && !updatedClickRecord.converted) {
              console.error('❌ WARNING: Click record save() did not set converted=true!', {
                clickId: normalizedClickId || clickRecord.clickId,
                clickRecordId: clickRecord._id
              });
            }
          } catch (saveError) {
            console.error('❌ Error saving click record:', {
              error: saveError.message,
              clickId: normalizedClickId || clickRecord.clickId,
              clickRecordId: clickRecord._id
            });
          }
        }
      } else {
        console.log('ℹ️ Postback status is not approved (status=' + postbackStatus + '), click status not updated');
      }
    } else {
      console.log('ℹ️ No matching click record found for clickId:', {
        searchClickId: normalizedClickId || clickId,
        rawClickId: clickId,
        normalizedClickId: normalizedClickId,
        hasUserId: !!userId,
        hasOfferId: !!offerId,
        hasTrackierOfferId: !!trackierOfferId
      });
      
      // Try to create click record if we have user/offer info
      if (userId && offerId && normalizedClickId) {
        try {
          const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
          const userAgent = req.headers['user-agent'] || '';
          const referrer = req.headers['referer'] || '';
          
          clickRecord = new Click({
            userId: userId,
            offerId: offerId,
            trackierOfferId: trackierOfferId,
            clickId: normalizedClickId,
            ipAddress: ipAddress,
            userAgent: userAgent,
            referrer: referrer,
            converted: postbackStatus === 1, // Set converted based on postback status
            conversionId: conversion_id || conversionid || null,
            conversionValue: postbackStatus === 1 ? payoutAmount : 0,
            convertedAt: postbackStatus === 1 ? new Date() : null
          });
          await clickRecord.save();
          console.log('✅ Created new click record from postback:', {
            clickRecordId: clickRecord._id,
            clickId: normalizedClickId,
            userId: userId.toString(),
            offerId: offerId.toString(),
            converted: postbackStatus === 1
          });
        } catch (createError) {
          console.error('❌ Error creating click record from postback:', {
            error: createError.message,
            clickId: normalizedClickId,
            userId: userId?.toString(),
            offerId: offerId?.toString()
          });
        }
      } else {
        console.log('⚠️ Cannot create click record - missing data:', {
          hasUserId: !!userId,
          hasOfferId: !!offerId,
          hasClickId: !!normalizedClickId,
          searchClickId: normalizedClickId || clickId
        });
        
        // Log all available postback data for debugging
        console.log('📋 Postback data available:', {
          clickId: normalizedClickId || clickId,
          offer_id: offer_id || offerid,
          publisher_id: publisher_id || publisherid,
          conversion_id: conversion_id || conversionid,
          payout: payoutAmount,
          status: postbackStatus,
          allParams: Object.keys(params)
        });
        
        // Try one more time to find click record by searching all clicks
        // This is a last-ditch effort before giving up
        if (normalizedClickId) {
          console.log('🔍 Performing final search for click record with clickId:', normalizedClickId);
          const finalSearch = await Click.find({
            $or: [
              { clickId: normalizedClickId },
              { clickId: { $regex: normalizedClickId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } }
            ]
          }).limit(10);
          
          if (finalSearch.length > 0) {
            console.log(`✅ Found ${finalSearch.length} click record(s) in final search:`, 
              finalSearch.map(c => ({ clickId: c.clickId, userId: c.userId?.toString(), offerId: c.offerId?.toString() }))
            );
            // Use the first one (most relevant)
            clickRecord = finalSearch[0];
            userId = clickRecord.userId;
            offerId = clickRecord.offerId;
            trackierOfferId = clickRecord.trackierOfferId;
          } else {
            console.log('❌ No click record found in final search. Click record may need to be created manually.');
          }
        }
        
        // If we found click record in final search, update it now
        if (clickRecord && postbackStatus === 1) {
          console.log('🔄 Updating click record found in final search...');
          try {
            const updateResult = await Click.updateOne(
              { _id: clickRecord._id },
              {
                $set: {
                  converted: true,
                  conversionId: conversion_id || conversionid || postback.conversionId || clickRecord.conversionId,
                  conversionValue: payoutAmount > 0 ? payoutAmount : clickRecord.conversionValue || 0,
                  convertedAt: clickRecord.convertedAt || new Date()
                }
              }
            );
            
            if (updateResult.modifiedCount > 0 || updateResult.matchedCount > 0) {
              const updatedClickRecord = await Click.findById(clickRecord._id);
              console.log('✅ Click record updated (found in final search):', {
                clickId: normalizedClickId || clickRecord.clickId,
                clickRecordId: clickRecord._id,
                isNowConverted: updatedClickRecord?.converted || false,
                conversionValue: updatedClickRecord?.conversionValue || 0
              });
            }
          } catch (updateError) {
            console.error('❌ Error updating click record found in final search:', updateError.message);
          }
        }
      }
    }

    // Add cashback to user's wallet if postback is approved and user exists
    if (postbackStatus === 1 && payoutAmount > 0 && userId) {
      try {
        const user = await User.findById(userId);
        if (user) {
          // Add cashback to wallet
          user.wallet = (user.wallet || 0) + payoutAmount;
          user.totalCashback = (user.totalCashback || 0) + payoutAmount;

          // Update offer status in offersClaimed
          if (user.offersClaimed && user.offersClaimed.length > 0 && offerId) {
            const claimIndex = user.offersClaimed.findIndex(claim => 
              claim.offerId && claim.offerId.toString() === offerId.toString()
            );
            if (claimIndex !== -1) {
              user.offersClaimed[claimIndex].status = 'approved';
              console.log(`✅ Updated offer status to approved for offerId: ${offerId}`);
            }
          }

          await user.save();
          
          console.log(`💰 Cashback added to wallet:`, {
            userId: userId.toString(),
            amount: payoutAmount,
            newWalletBalance: user.wallet,
            clickId: clickId
          });
        } else {
          console.warn(`⚠️ User not found for userId: ${userId}`);
        }
      } catch (walletError) {
        console.error('❌ Error adding cashback to wallet:', {
          error: walletError.message,
          userId: userId,
          payout: payoutAmount,
          clickId: clickId
        });
        // Don't fail the postback if wallet update fails
      }
    } else {
      if (postbackStatus !== 1) {
        console.log('ℹ️ Postback status is not approved, skipping wallet update');
      } else if (payoutAmount <= 0) {
        console.log('ℹ️ Payout amount is 0 or negative, skipping wallet update');
      } else if (!userId) {
        console.log('ℹ️ No userId found, skipping wallet update');
      }
    }

    const processingTime = Date.now() - startTime;
    console.log(`✅ Postback processed successfully:`, {
      postbackId: postback._id,
      clickId: clickId,
      conversionId: postback.conversionId,
      payout: payoutAmount,
      status: postbackStatus === 1 ? 'approved' : 'rejected',
      processingTime: `${processingTime}ms`,
      userId: userId ? userId.toString() : 'N/A',
      offerId: offerId ? offerId.toString() : 'N/A'
    });

    // Return success response (Trackier expects 200 OK)
    // Always return 200 to prevent retries, even on errors
    res.status(200).json({ 
      success: true,
      message: 'Postback received and processed successfully',
      postbackId: postback._id,
      clickId: clickId,
      processingTime: `${processingTime}ms`
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('❌ Error processing postback:', {
      error: error.message,
      stack: error.stack,
      clickId: req.body?.click_id || req.query?.click_id || req.body?.clickid || req.query?.clickid,
      postbackId: postbackId,
      processingTime: `${processingTime}ms`,
      timestamp: new Date().toISOString()
    });
    
    // Still return 200 to Trackier to avoid retries
    // This is important: if we return 4xx/5xx, Trackier will retry
    // We want to accept the postback even if processing fails, then handle it manually
    res.status(200).json({ 
      success: false,
      message: error.message,
      postbackId: postbackId || null,
      error: 'Postback received but processing failed. Check logs for details.'
    });
  }
});

/**
 * GET /api/postback
 * Also support GET requests (some Trackier setups use GET)
 * 
 * Many postback systems use GET requests with query parameters:
 * https://example.com/postback?click_id=123&payout=10&status=1
 */
router.get('/', async (req, res) => {
  // Forward to POST handler (they share the same logic)
  // GET requests will have params in req.query
  return router.post('/', req, res);
});

/**
 * Health check endpoint for postback service
 * Useful for monitoring and testing
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'postback',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

module.exports = router;

