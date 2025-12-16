/**
 * Utility script to manually update click record status
 * Usage: node server/scripts/updateClickStatus.js CLID-IRV5YYCM
 * 
 * This script helps fix click records that weren't updated when postbacks were received
 */

const mongoose = require('mongoose');
const Click = require('../models/Click');
const Postback = require('../models/Postback');
require('dotenv').config();

async function updateClickStatus(clickId) {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cashback', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Normalize clickId
    const normalizedClickId = clickId.trim();

    // Find click record
    let clickRecord = await Click.findOne({ clickId: normalizedClickId });
    
    if (!clickRecord) {
      // Try case-insensitive search
      clickRecord = await Click.findOne({
        clickId: { $regex: new RegExp(`^${normalizedClickId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
      });
    }

    if (!clickRecord) {
      console.log('❌ Click record not found for:', normalizedClickId);
      
      // Check if there are any postbacks with this clickId
      const postbacks = await Postback.find({
        clickId: { $regex: new RegExp(`^${normalizedClickId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
      }).sort({ createdAt: -1 });

      if (postbacks.length > 0) {
        console.log(`\n📋 Found ${postbacks.length} postback(s) with this clickId:`);
        postbacks.forEach((pb, idx) => {
          console.log(`\nPostback ${idx + 1}:`);
          console.log(`  - ID: ${pb._id}`);
          console.log(`  - ClickId: ${pb.clickId}`);
          console.log(`  - Status: ${pb.status === 1 ? 'Approved' : 'Rejected'}`);
          console.log(`  - Payout: ₹${pb.payout}`);
          console.log(`  - UserId: ${pb.userId || 'N/A'}`);
          console.log(`  - OfferId: ${pb.offerId || 'N/A'}`);
          console.log(`  - Created: ${pb.createdAt}`);
        });

        // Try to find click record using userId and offerId from postback
        const latestPostback = postbacks[0];
        if (latestPostback.userId && latestPostback.offerId) {
          console.log('\n🔍 Searching for click record by userId and offerId...');
          const clicks = await Click.find({
            userId: latestPostback.userId,
            offerId: latestPostback.offerId
          }).sort({ createdAt: -1 });

          if (clicks.length > 0) {
            console.log(`\n✅ Found ${clicks.length} click record(s):`);
            clicks.forEach((click, idx) => {
              console.log(`\nClick ${idx + 1}:`);
              console.log(`  - ClickId: ${click.clickId}`);
              console.log(`  - Converted: ${click.converted}`);
              console.log(`  - ConversionValue: ₹${click.conversionValue || 0}`);
              console.log(`  - Created: ${click.createdAt}`);
            });

            // Update the most recent click record
            const clickToUpdate = clicks[0];
            if (latestPostback.status === 1 && !clickToUpdate.converted) {
              clickToUpdate.converted = true;
              clickToUpdate.conversionValue = latestPostback.payout || clickToUpdate.conversionValue || 0;
              clickToUpdate.convertedAt = latestPostback.createdAt || new Date();
              await clickToUpdate.save();
              console.log('\n✅ Updated click record:', clickToUpdate.clickId);
            } else {
              console.log('\nℹ️ Click record already converted or postback not approved');
            }
          }
        }
      }

      return;
    }

    console.log('\n✅ Found click record:');
    console.log(`  - ClickId: ${clickRecord.clickId}`);
    console.log(`  - UserId: ${clickRecord.userId}`);
    console.log(`  - OfferId: ${clickRecord.offerId}`);
    console.log(`  - Converted: ${clickRecord.converted}`);
    console.log(`  - ConversionValue: ₹${clickRecord.conversionValue || 0}`);

    // Check for postbacks with this clickId
    const postbacks = await Postback.find({
      clickId: { $regex: new RegExp(`^${normalizedClickId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    }).sort({ createdAt: -1 });

    if (postbacks.length > 0) {
      console.log(`\n📋 Found ${postbacks.length} postback(s):`);
      postbacks.forEach((pb, idx) => {
        console.log(`\nPostback ${idx + 1}:`);
        console.log(`  - Status: ${pb.status === 1 ? 'Approved' : 'Rejected'}`);
        console.log(`  - Payout: ₹${pb.payout}`);
        console.log(`  - Created: ${pb.createdAt}`);
      });

      const latestApprovedPostback = postbacks.find(pb => pb.status === 1);
      
      if (latestApprovedPostback && !clickRecord.converted) {
        console.log('\n🔄 Updating click record...');
        clickRecord.converted = true;
        clickRecord.conversionValue = latestApprovedPostback.payout || clickRecord.conversionValue || 0;
        clickRecord.convertedAt = latestApprovedPostback.createdAt || new Date();
        await clickRecord.save();
        console.log('✅ Click record updated successfully!');
      } else if (clickRecord.converted) {
        console.log('\nℹ️ Click record is already marked as converted');
      } else {
        console.log('\nℹ️ No approved postback found');
      }
    } else {
      console.log('\n⚠️ No postbacks found for this clickId');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Get clickId from command line arguments
const clickId = process.argv[2];

if (!clickId) {
  console.log('Usage: node server/scripts/updateClickStatus.js <clickId>');
  console.log('Example: node server/scripts/updateClickStatus.js CLID-IRV5YYCM');
  process.exit(1);
}

updateClickStatus(clickId);

