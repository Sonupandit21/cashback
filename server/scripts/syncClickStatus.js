const mongoose = require('mongoose');
const Click = require('../models/Click');
const Postback = require('../models/Postback');
require('dotenv').config();

const syncClickStatus = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cashback', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('🔄 Starting click status sync...');

    // Find all clicks that are not converted
    const unconvertedClicks = await Click.find({ converted: false });
    console.log(`Found ${unconvertedClicks.length} unconverted clicks`);

    let syncedCount = 0;
    let errorCount = 0;

    for (const click of unconvertedClicks) {
      try {
        // Normalize clickId for matching
        const normalizedClickId = click.clickId ? click.clickId.trim() : null;
        if (!normalizedClickId) {
          console.log(`⚠️ Skipping click with empty clickId: ${click._id}`);
          continue;
        }
        
        // Check if there's an approved postback for this clickId (exact match first)
        let approvedPostback = await Postback.findOne({
          clickId: normalizedClickId,
          status: 1 // Approved
        });
        
        // If not found, try case-insensitive match
        if (!approvedPostback) {
          approvedPostback = await Postback.findOne({
            clickId: { $regex: new RegExp(`^${normalizedClickId}$`, 'i') },
            status: 1
          });
        }

        if (approvedPostback) {
          // Update click to converted using direct update for reliability
          await Click.updateOne(
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
          syncedCount++;
          console.log(`✅ Synced click ${normalizedClickId} to converted (Payout: ${approvedPostback.payout})`);
        }
      } catch (error) {
        errorCount++;
        console.error(`❌ Error syncing click ${click.clickId}:`, error.message);
      }
    }

    console.log('\n📊 Sync Summary:');
    console.log(`✅ Successfully synced: ${syncedCount} clicks`);
    console.log(`❌ Errors: ${errorCount} clicks`);
    console.log(`📝 Total processed: ${unconvertedClicks.length} clicks`);

    // Show statistics
    const totalClicks = await Click.countDocuments();
    const convertedClicks = await Click.countDocuments({ converted: true });
    const pendingClicks = await Click.countDocuments({ converted: false });
    const totalPostbacks = await Postback.countDocuments({ status: 1 });

    console.log('\n📈 Current Statistics:');
    console.log(`Total Clicks: ${totalClicks}`);
    console.log(`Converted: ${convertedClicks}`);
    console.log(`Pending: ${pendingClicks}`);
    console.log(`Approved Postbacks: ${totalPostbacks}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error syncing click status:', error);
    process.exit(1);
  }
};

syncClickStatus();
