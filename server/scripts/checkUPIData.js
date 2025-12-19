const mongoose = require('mongoose');
const UPI = require('../models/UPI');
require('dotenv').config();

const checkUPIData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cashback', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB\n');

    // Get all UPI records
    const upiRecords = await UPI.find({})
      .populate('userId', 'name email')
      .populate('offerId', 'title')
      .sort({ createdAt: -1 });

    console.log(`Total UPI records: ${upiRecords.length}\n`);

    if (upiRecords.length === 0) {
      console.log('No UPI records found in the database.');
      process.exit(0);
    }

    // Display all UPI records
    console.log('=== UPI Collection Data ===\n');
    upiRecords.forEach((record, index) => {
      console.log(`Record ${index + 1}:`);
      console.log(`  ID: ${record._id}`);
      console.log(`  User: ${record.userId?.name || 'N/A'} (${record.userId?.email || 'N/A'})`);
      console.log(`  Offer: ${record.offerId?.title || 'N/A'}`);
      console.log(`  UPI ID: ${record.upiId}`);
      console.log(`  Status: ${record.status}`);
      console.log(`  Claimed At: ${record.claimedAt}`);
      console.log(`  Created At: ${record.createdAt}`);
      console.log('---');
    });

    // Summary
    console.log('\n=== Summary ===');
    const statusCounts = {
      pending: 0,
      approved: 0,
      rejected: 0
    };
    upiRecords.forEach(record => {
      statusCounts[record.status] = (statusCounts[record.status] || 0) + 1;
    });
    console.log(`Pending: ${statusCounts.pending}`);
    console.log(`Approved: ${statusCounts.approved}`);
    console.log(`Rejected: ${statusCounts.rejected}`);

    process.exit(0);
  } catch (error) {
    console.error('Error checking UPI data:', error);
    process.exit(1);
  }
};

checkUPIData();



























