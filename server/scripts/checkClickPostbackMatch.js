const mongoose = require('mongoose');
const Click = require('../models/Click');
const Postback = require('../models/Postback');
require('dotenv').config();

const checkMatching = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cashback', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('🔍 Checking click and postback matching...\n');

    // Get all unconverted clicks
    const unconvertedClicks = await Click.find({ converted: false }).limit(10);
    console.log(`📊 Sample of ${unconvertedClicks.length} unconverted clicks:`);
    unconvertedClicks.forEach(click => {
      console.log(`  Click ID: "${click.clickId}" (length: ${click.clickId?.length || 0})`);
    });

    console.log('\n');

    // Get all approved postbacks
    const approvedPostbacks = await Postback.find({ status: 1 }).limit(10);
    console.log(`📊 Sample of ${approvedPostbacks.length} approved postbacks:`);
    approvedPostbacks.forEach(postback => {
      console.log(`  Postback Click ID: "${postback.clickId}" (length: ${postback.clickId?.length || 0})`);
    });

    console.log('\n');

    // Try to find matches
    console.log('🔍 Checking for matches...\n');
    let matchCount = 0;
    
    for (const click of unconvertedClicks) {
      const normalizedClickId = click.clickId ? click.clickId.trim() : null;
      if (!normalizedClickId) continue;

      // Try exact match
      let postback = await Postback.findOne({
        clickId: normalizedClickId,
        status: 1
      });

      // Try case-insensitive
      if (!postback) {
        postback = await Postback.findOne({
          clickId: { $regex: new RegExp(`^${normalizedClickId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
          status: 1
        });
      }

      // Try partial match
      if (!postback) {
        postback = await Postback.findOne({
          clickId: { $regex: normalizedClickId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') },
          status: 1
        });
      }

      if (postback) {
        matchCount++;
        console.log(`✅ MATCH FOUND:`);
        console.log(`   Click ID: "${normalizedClickId}"`);
        console.log(`   Postback Click ID: "${postback.clickId}"`);
        console.log(`   Payout: ${postback.payout}`);
        console.log('');
      }
    }

    console.log(`\n📊 Summary: ${matchCount} matches found out of ${unconvertedClicks.length} clicks checked`);

    // Show all unique clickIds from postbacks
    console.log('\n📋 All unique clickIds from approved postbacks:');
    const uniquePostbackClickIds = await Postback.distinct('clickId', { status: 1 });
    uniquePostbackClickIds.forEach(id => {
      console.log(`  "${id}"`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkMatching();










