/**
 * Utility script to sync all pending clicks with postbacks
 * Usage: node server/scripts/syncAllClicks.js
 * 
 * This script finds all unconverted clicks and updates them if they have approved postbacks
 */

const mongoose = require('mongoose');
const Click = require('../models/Click');
const Postback = require('../models/Postback');
require('dotenv').config();

async function syncAllClicks() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cashback', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB\n');

    // Find all unconverted clicks
    const unconvertedClicks = await Click.find({ converted: false });
    console.log(`📊 Found ${unconvertedClicks.length} unconverted clicks to check\n`);

    if (unconvertedClicks.length === 0) {
      console.log('✅ No pending clicks to sync!');
      await mongoose.disconnect();
      return;
    }

    let syncedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const click of unconvertedClicks) {
      try {
        const normalizedClickId = click.clickId ? click.clickId.trim() : null;
        if (!normalizedClickId) {
          skippedCount++;
          continue;
        }

        // Try multiple search methods to find approved postback
        let approvedPostback = null;

        // Method 1: Exact match
        approvedPostback = await Postback.findOne({
          clickId: normalizedClickId,
          status: 1
        });

        // Method 2: Case-insensitive match
        if (!approvedPostback && normalizedClickId) {
          const escapedClickId = normalizedClickId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          approvedPostback = await Postback.findOne({
            clickId: { $regex: new RegExp(`^${escapedClickId}$`, 'i') },
            status: 1
          });
        }

        // Method 3: Contains match
        if (!approvedPostback && normalizedClickId) {
          const escapedClickId = normalizedClickId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          approvedPostback = await Postback.findOne({
            clickId: { $regex: escapedClickId, $options: 'i' },
            status: 1
          });
        }

        if (approvedPostback) {
          // Update click to converted
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
            console.log(`✅ Synced: ${normalizedClickId} → Converted (Payout: ₹${approvedPostback.payout || 0})`);
          } else {
            skippedCount++;
          }
        } else {
          skippedCount++;
          // Show first few skipped clicks for debugging
          if (skippedCount <= 10) {
            console.log(`ℹ️  No postback: ${normalizedClickId}`);
          }
        }
      } catch (clickError) {
        errorCount++;
        console.error(`❌ Error syncing click ${click.clickId}:`, clickError.message);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Sync Summary:');
    console.log(`   ✅ Synced: ${syncedCount} clicks`);
    console.log(`   ⏭️  Skipped: ${skippedCount} clicks (no postback)`);
    console.log(`   ❌ Errors: ${errorCount} clicks`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Run the sync
syncAllClicks();

