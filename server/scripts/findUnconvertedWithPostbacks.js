const mongoose = require('mongoose');
const Click = require('../models/Click');
const Postback = require('../models/Postback');
require('dotenv').config();

const findUnconverted = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cashback', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('🔍 Finding unconverted clicks that have approved postbacks...\n');

    // Get all approved postbacks
    const approvedPostbacks = await Postback.find({ status: 1 });
    console.log(`📊 Total approved postbacks: ${approvedPostbacks.length}\n`);

    // Get unique clickIds from postbacks
    const postbackClickIds = [...new Set(approvedPostbacks.map(pb => pb.clickId))];
    console.log(`📊 Unique clickIds in postbacks: ${postbackClickIds.length}`);
    postbackClickIds.forEach(id => console.log(`   "${id}"`));

    console.log('\n🔍 Checking clicks...\n');

    let foundCount = 0;
    for (const postbackClickId of postbackClickIds) {
      const normalizedClickId = postbackClickId ? postbackClickId.trim() : null;
      if (!normalizedClickId) continue;

      // Find click with this clickId
      let click = await Click.findOne({ clickId: normalizedClickId });
      
      // Try case-insensitive
      if (!click) {
        click = await Click.findOne({ 
          clickId: { $regex: new RegExp(`^${normalizedClickId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
        });
      }

      if (click) {
        if (!click.converted) {
          foundCount++;
          const postback = approvedPostbacks.find(pb => pb.clickId === postbackClickId);
          console.log(`❌ FOUND UNCONVERTED CLICK WITH POSTBACK:`);
          console.log(`   Click ID: "${click.clickId}"`);
          console.log(`   Converted: ${click.converted}`);
          console.log(`   Postback Payout: ${postback?.payout || 'N/A'}`);
          console.log(`   Postback Status: ${postback?.status || 'N/A'}`);
          console.log('');
        } else {
          console.log(`✅ Click "${normalizedClickId}" is already converted`);
        }
      } else {
        console.log(`⚠️  No click found for postback clickId: "${normalizedClickId}"`);
      }
    }

    console.log(`\n📊 Summary: Found ${foundCount} unconverted clicks that have approved postbacks`);

    if (foundCount > 0) {
      console.log('\n💡 These clicks should be updated to converted=true');
      console.log('   Run: npm run sync-click-status');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

findUnconverted();








