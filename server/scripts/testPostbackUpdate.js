const mongoose = require('mongoose');
const Click = require('../models/Click');
const Postback = require('../models/Postback');
require('dotenv').config();

const testUpdate = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cashback', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('🧪 Testing click status update mechanism...\n');

    // Find a pending click
    const pendingClick = await Click.findOne({ converted: false });
    if (!pendingClick) {
      console.log('❌ No pending clicks found to test');
      process.exit(0);
    }

    console.log(`📊 Found pending click: ${pendingClick.clickId}`);
    console.log(`   Converted: ${pendingClick.converted}`);
    console.log(`   Created: ${pendingClick.createdAt}\n`);

    // Check if there's a postback for this click
    const postback = await Postback.findOne({
      clickId: pendingClick.clickId,
      status: 1
    });

    if (postback) {
      console.log(`✅ Found approved postback for this click`);
      console.log(`   Postback Click ID: ${postback.clickId}`);
      console.log(`   Payout: ${postback.payout}`);
      console.log(`   Status: ${postback.status}\n`);

      // Try to update the click
      console.log('🔄 Attempting to update click...');
      const normalizedClickId = pendingClick.clickId ? pendingClick.clickId.trim() : null;
      
      // Try exact match update
      const updateResult = await Click.updateOne(
        { _id: pendingClick._id },
        {
          $set: {
            converted: true,
            conversionId: postback.conversionId || pendingClick.conversionId,
            conversionValue: postback.payout || pendingClick.conversionValue || 0,
            convertedAt: postback.createdAt || new Date()
          }
        }
      );

      console.log(`✅ Update result:`, updateResult);
      
      // Verify update
      const updatedClick = await Click.findById(pendingClick._id);
      console.log(`\n📊 Updated click status:`);
      console.log(`   Converted: ${updatedClick.converted}`);
      console.log(`   Conversion Value: ${updatedClick.conversionValue}`);
      console.log(`   Converted At: ${updatedClick.convertedAt}`);
    } else {
      console.log(`❌ No approved postback found for click: ${pendingClick.clickId}`);
      console.log(`   This click is correctly pending (no conversion yet)`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

testUpdate();







