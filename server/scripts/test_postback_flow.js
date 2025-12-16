const mongoose = require('mongoose');
const axios = require('axios');
const Click = require('../models/Click');
const User = require('../models/User');
const Offer = require('../models/Offer');
const Postback = require('../models/Postback');
require('dotenv').config();

const SERVER_URL = 'http://localhost:5000';

async function testPostbackFlow() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cashback';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // 1. Create a test user
    const testUser = new User({
      name: 'Test Postback User',
      email: `test_postback_${Date.now()}@example.com`,
      password: 'password123',
      phone: '1234567890',
      role: 'user',
      wallet: 0
    });
    await testUser.save();
    console.log(`✅ Created test user: ${testUser._id}`);

    // 2. Create a test offer
    const testOffer = new Offer({
      title: 'Test Offer',
      description: 'Test Description',
      cashbackAmount: 10,
      category: 'Test',
      trackierOfferId: 'TEST_OFFER_123',
      offerLink: 'http://example.com',
      imageUrl: 'test.jpg',
      instructions: 'Test instructions',
      currency: 'INR'
    });
    await testOffer.save();
    console.log(`✅ Created test offer: ${testOffer._id}`);

    // 3. Create a test click (Pending status)
    const clickId = `CLICK_TEST_${Date.now()}`;
    const testClick = new Click({
      userId: testUser._id,
      offerId: testOffer._id,
      trackierOfferId: testOffer.trackierOfferId,
      clickId: clickId,
      converted: false
    });
    await testClick.save();
    console.log(`✅ Created test click: ${clickId} (Status: Pending)`);

    // 4. Send Postback Request
    console.log('🔄 Sending postback request...');
    try {
      const response = await axios.post(`${SERVER_URL}/api/postback`, {
        click_id: clickId,
        payout: 10,
        status: 1,
        offer_id: testOffer.trackierOfferId
      });
      console.log('✅ Postback response:', response.data);
    } catch (err) {
      console.error('❌ Error sending postback request. Is the server running on port 5000?');
      console.error(err.message);
      process.exit(1);
    }

    // 5. Verify Click Status
    const updatedClick = await Click.findOne({ clickId: clickId });
    if (updatedClick.converted) {
      console.log('✅ SUCCESS: Click status updated to Converted!');
    } else {
      console.error('❌ FAILURE: Click status is still Pending!');
    }

    // 6. Verify Wallet Balance
    const updatedUser = await User.findById(testUser._id);
    if (updatedUser.wallet === 10) {
      console.log('✅ SUCCESS: User wallet updated!');
    } else {
      console.error(`❌ FAILURE: User wallet not updated! Balance: ${updatedUser.wallet}`);
    }

    // Cleanup
    await User.findByIdAndDelete(testUser._id);
    await Offer.findByIdAndDelete(testOffer._id);
    await Click.findByIdAndDelete(testClick._id);
    await Postback.deleteMany({ clickId: clickId });
    console.log('✅ Cleanup completed');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testPostbackFlow();
