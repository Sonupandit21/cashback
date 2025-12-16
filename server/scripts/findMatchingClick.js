const mongoose = require('mongoose');
const Click = require('../models/Click');
const Postback = require('../models/Postback');
require('dotenv').config();

const findMatching = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cashback', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('🔍 Finding click for postback clickId: CLID-IRV5YYCM\n');

    // Check if click exists
    const click = await Click.findOne({ clickId: 'CLID-IRV5YYCM' });
    if (click) {
      console.log('✅ Found click with CLID-IRV5YYCM');
      console.log('   Converted:', click.converted);
      console.log('   User ID:', click.userId);
      console.log('   Offer ID:', click.offerId);
      console.log('   Created:', click.createdAt);
    } else {
      console.log('❌ No click found with CLID-IRV5YYCM');
    }

    // Get all postbacks with this clickId
    const postbacks = await Postback.find({ clickId: 'CLID-IRV5YYCM' });
    console.log(`\n📊 Found ${postbacks.length} postbacks with CLID-IRV5YYCM`);
    postbacks.forEach((pb, i) => {
      console.log(`   Postback ${i + 1}: Status=${pb.status}, Payout=${pb.payout}, Created=${pb.createdAt}`);
    });

    // Get all CLID- clicks
    const allCLIDClicks = await Click.find({ clickId: /^CLID-/ }).select('clickId converted createdAt').sort({ createdAt: -1 }).limit(10);
    console.log(`\n📊 Sample of ${allCLIDClicks.length} CLID- format clicks:`);
    allCLIDClicks.forEach(c => {
      console.log(`   ${c.clickId} - Converted: ${c.converted} - Created: ${c.createdAt}`);
    });

    // Now try to sync this specific one
    if (!click && postbacks.length > 0) {
      console.log('\n⚠️  Click not found but postback exists! This means the click was never created.');
      console.log('   The postback might have come from an external source (Trackier) with a different clickId format.');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

findMatching();






