const mongoose = require('mongoose');
const Click = require('../models/Click');
const User = require('../models/User');
const Offer = require('../models/Offer');
require('dotenv').config();

const checkClickIds = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cashback', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB\n');
    console.log('='.repeat(80));
    console.log('CHECKING CLICK IDs IN DATABASE');
    console.log('='.repeat(80));

    // Get all clicks
    const clicks = await Click.find()
      .populate('userId', 'name email')
      .populate('offerId', 'title trackierOfferId')
      .sort({ createdAt: -1 });

    if (clicks.length === 0) {
      console.log('\n❌ No click records found in database.');
      console.log('\nThis means:');
      console.log('1. No offers have been clicked yet, OR');
      console.log('2. Click tracking is not working properly');
      console.log('\nTo test:');
      console.log('- Make sure offers have trackierOfferId set');
      console.log('- Click on an offer (should call POST /api/offers/:id/track)');
      console.log('- Check server logs for any errors');
      process.exit(0);
    }

    console.log(`\n✅ Found ${clicks.length} click record(s):\n`);
    console.log('='.repeat(80));

    clicks.forEach((click, index) => {
      console.log(`\n${index + 1}. Click Record:`);
      console.log(`   - Click ID: ${click.clickId}`);
      console.log(`   - User: ${click.userId?.name || 'N/A'} (${click.userId?.email || 'N/A'})`);
      console.log(`   - Offer: ${click.offerId?.title || 'N/A'}`);
      console.log(`   - Trackier Offer ID: ${click.trackierOfferId || 'N/A'}`);
      console.log(`   - IP Address: ${click.ipAddress || 'N/A'}`);
      console.log(`   - User Agent: ${click.userAgent?.substring(0, 50) || 'N/A'}...`);
      console.log(`   - Referrer: ${click.referrer || 'N/A'}`);
      console.log(`   - Converted: ${click.converted ? '✅ Yes' : '❌ No'}`);
      if (click.converted) {
        console.log(`   - Conversion ID: ${click.conversionId || 'N/A'}`);
        console.log(`   - Conversion Value: ₹${click.conversionValue || 0}`);
        console.log(`   - Converted At: ${click.convertedAt || 'N/A'}`);
      }
      console.log(`   - Created At: ${click.createdAt}`);
      console.log('');
    });

    // Statistics
    const totalClicks = clicks.length;
    const convertedClicks = clicks.filter(c => c.converted).length;
    const conversionRate = totalClicks > 0 ? ((convertedClicks / totalClicks) * 100).toFixed(2) : 0;

    console.log('='.repeat(80));
    console.log('\n📊 STATISTICS:');
    console.log(`   Total Clicks: ${totalClicks}`);
    console.log(`   Converted: ${convertedClicks}`);
    console.log(`   Conversion Rate: ${conversionRate}%`);
    console.log('='.repeat(80));

    // Check for issues
    console.log('\n🔍 CHECKING FOR ISSUES:\n');

    const clicksWithoutTrackierOfferId = clicks.filter(c => !c.trackierOfferId);
    if (clicksWithoutTrackierOfferId.length > 0) {
      console.log(`⚠️  ${clicksWithoutTrackierOfferId.length} click(s) without Trackier Offer ID`);
    }

    const clicksWithoutClickId = clicks.filter(c => !c.clickId);
    if (clicksWithoutClickId.length > 0) {
      console.log(`❌ ${clicksWithoutClickId.length} click(s) without Click ID - THIS IS A PROBLEM!`);
    } else {
      console.log('✅ All clicks have Click IDs');
    }

    const clicksWithoutUser = clicks.filter(c => !c.userId);
    if (clicksWithoutUser.length > 0) {
      console.log(`⚠️  ${clicksWithoutUser.length} click(s) without User reference`);
    }

    const clicksWithoutOffer = clicks.filter(c => !c.offerId);
    if (clicksWithoutOffer.length > 0) {
      console.log(`⚠️  ${clicksWithoutOffer.length} click(s) without Offer reference`);
    }

    console.log('\n✅ Database check complete!');
    console.log('\n💡 TIP: Check your Trackier dashboard to verify if clicks are being tracked there as well.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking database:', error);
    process.exit(1);
  }
};

checkClickIds();






















