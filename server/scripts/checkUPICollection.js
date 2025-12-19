const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const checkUPICollection = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cashback', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB\n');

    // Get collection name
    const collectionName = User.collection.name;
    console.log(`📦 Collection Name: "${collectionName}"`);
    console.log(`📊 Database: cashback\n`);

    // Query directly from MongoDB collection
    const db = mongoose.connection.db;
    const usersCollection = db.collection(collectionName);

    // Find all documents with UPI IDs
    const usersWithUPI = await usersCollection.find({
      'offersClaimed.upiId': { $exists: true, $ne: null, $ne: '' }
    }).toArray();

    console.log(`✅ Found ${usersWithUPI.length} user(s) with UPI IDs saved:\n`);
    console.log('='.repeat(80));

    usersWithUPI.forEach((user, index) => {
      console.log(`\n${index + 1}. User: ${user.name} (${user.email})`);
      console.log(`   User ID: ${user._id}`);
      
      // Filter claims with UPI ID
      const claimsWithUPI = user.offersClaimed.filter(claim => claim.upiId);
      
      console.log(`   Claims with UPI ID: ${claimsWithUPI.length} out of ${user.offersClaimed.length}`);
      console.log('-'.repeat(80));

      claimsWithUPI.forEach((claim, claimIndex) => {
        console.log(`   Claim ${claimIndex + 1}:`);
        console.log(`   - Offer ID: ${claim.offerId}`);
        console.log(`   - UPI ID: ${claim.upiId} ✅`);
        console.log(`   - Status: ${claim.status}`);
        console.log(`   - Claimed At: ${new Date(claim.claimedAt).toLocaleString()}`);
        console.log('');
      });
    });

    // Also show total count
    const totalUsers = await usersCollection.countDocuments();
    const usersWithClaims = await usersCollection.countDocuments({
      'offersClaimed.0': { $exists: true }
    });
    const usersWithUPIIds = await usersCollection.countDocuments({
      'offersClaimed.upiId': { $exists: true, $ne: null, $ne: '' }
    });

    console.log('='.repeat(80));
    console.log('\n📈 Statistics:');
    console.log(`   Total Users: ${totalUsers}`);
    console.log(`   Users with Claims: ${usersWithClaims}`);
    console.log(`   Users with UPI IDs: ${usersWithUPIIds}`);
    console.log(`\n💾 Collection: "${collectionName}" in database "cashback"`);
    console.log(`📍 Field Path: offersClaimed[].upiId`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking collection:', error);
    process.exit(1);
  }
};

checkUPICollection();


 

























