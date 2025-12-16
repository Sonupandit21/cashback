// const mongoose = require('mongoose');
// const Offer = require('../models/Offer');
// require('dotenv').config();

// const seedOffers = async () => {
//   try {
//     // Connect to MongoDB
//     await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cashback', {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     });

//     // Amazon Cashback Offer
//     const amazonOffer = {
//       title: 'Amazon Cashback',
//       description: 'Get 10% cashback',
//       category: 'Shopping',
//       cashbackAmount: 10,
//       currency: 'USD',
//       instructions: 'Complete purchase',
//       offerLink: 'https://amazon.com',
//       imageUrl: '/uploads/offers/offer-123.jpg',
//       trackierOfferId: 'track123',
//       isActive: true,
//       isFeatured: true,
//       minAmount: 50,
//       maxUsers: 100,
//       currentUsers: 25,
//     };

//     // Check if Amazon offer already exists
//     let existingAmazon = await Offer.findOne({
//       title: amazonOffer.title,
//       category: amazonOffer.category,
//     });

//     if (!existingAmazon) {
//       const offer = new Offer(amazonOffer);
//       await offer.save();
//       console.log('Amazon Cashback offer created successfully with id:', offer._id.toString());
//     } else {
//       console.log('Amazon Cashback offer already exists with id:', existingAmazon._id.toString());
//     }

//     // Flipkart Cashback Offer with specific ID
//     const flipkartOfferId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');
//     const flipkartOffer = {
//       _id: flipkartOfferId,
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
//       createdAt: new Date('2024-01-01T00:00:00.000Z'),
//       updatedAt: new Date('2024-01-01T00:00:00.000Z'),
//     };

//     // Check if Flipkart offer with this ID already exists
//     let existingFlipkart = await Offer.findById(flipkartOfferId);

//     if (!existingFlipkart) {
//       // Check if Flipkart offer exists by title
//       existingFlipkart = await Offer.findOne({
//         title: flipkartOffer.title,
//         category: flipkartOffer.category,
//       });

//       if (existingFlipkart) {
//         console.log('Flipkart Cashback offer already exists with id:', existingFlipkart._id.toString());
//         console.log('To use the specific ID 507f1f77bcf86cd799439011, please delete the existing offer first.');
//       } else {
//         const offer = new Offer(flipkartOffer);
//         await offer.save();
//         console.log('Flipkart Cashback offer created successfully with id:', offer._id.toString());
//         console.log(JSON.stringify(offer.toJSON(), null, 2));
//       }
//     } else {
//       console.log('Flipkart Cashback offer with id 507f1f77bcf86cd799439011 already exists');
//     }

//     process.exit(0);
//   } catch (error) {
//     console.error('Error seeding offers:', error);
//     process.exit(1);
//   }
// };

// seedOffers();


