const mongoose = require('mongoose');
const User = require('../models/User');
const Offer = require('../models/Offer');
require('dotenv').config();

const checkUPI = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cashback', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB\n');

    // Find all users with claimed offers
    const users = await User.find({ 'offersClaimed.0': { $exists: true } })
      .populate('offersClaimed.offerId', 'title cashbackAmount')
      .select('name email offersClaimed');

    if (users.length === 0) {
      console.log('No users with claimed offers found.');
      process.exit(0);
    }

    console.log(`Found ${users.length} user(s) with claimed offers:\n`);
    console.log('='.repeat(80));

    users.forEach((user, index) => {
      console.log(`\n${index + 1}. User: ${user.name} (${user.email})`);
      console.log(`   Total Claims: ${user.offersClaimed.length}`);
      console.log('-'.repeat(80));

      user.offersClaimed.forEach((claim, claimIndex) => {
        console.log(`   Claim ${claimIndex + 1}:`);
        console.log(`   - Offer: ${claim.offerId?.title || 'N/A'} (ID: ${claim.offerId?._id || 'N/A'})`);
        console.log(`   - UPI ID: ${claim.upiId || 'NOT SAVED ❌'}`);
        console.log(`   - Status: ${claim.status}`);
        console.log(`   - Claimed At: ${claim.claimedAt}`);
        console.log('');
      });
    });

    console.log('='.repeat(80));
    console.log('\n✅ Database check complete!');

    process.exit(0);
  } catch (error) {
    console.error('Error checking database:', error);
    process.exit(1);
  }
};

checkUPI();




























