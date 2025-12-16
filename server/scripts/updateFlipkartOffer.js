// const mongoose = require('mongoose');
// const Offer = require('../models/Offer');
// require('dotenv').config();

// const updateFlipkartOffer = async () => {
//   try {
//     // Connect to MongoDB
//     await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cashback', {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     });

//     // Delete ALL Flipkart Cashback offers
//     const deleteResult = await Offer.deleteMany({ 
//       title: 'flipkart Cashback',
//       category: 'Shopping'
//     });
//     console.log('Deleted', deleteResult.deletedCount, 'Flipkart offer(s)');
    
//     Create new offer with same data (MongoDB will auto-generate new ID)
//     const newOffer = new Offer({
//       title: 'flipkart Cashback',
//       description: 'Get 10% cashback',
//       category: 'Shopping',
//       cashbackAmount: 10,
//       currency: 'USD',
//       instructions: 'Complete purchase',
//       offerLink: 'https://flipkart.com',
//       imageUrl: '/uploads/offers/offer-123.jpg',
//       trackierOfferId: 'track124',
//       isActive: true,
//       isFeatured: true,
//       minAmount: 50,
//       maxUsers: 100,
//       currentUsers: 25,
//     });

//     await newOffer.save();
//     console.log('New Flipkart offer created with new ID:', newOffer._id.toString());
//     console.log(JSON.stringify(newOffer.toJSON(), null, 2));

//     process.exit(0);
//   } catch (error) {
//     console.error('Error updating offer:', error);
//     process.exit(1);
//   }
// };

// updateFlipkartOffer();

