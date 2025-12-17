const mongoose = require('mongoose');
require('dotenv').config();

(async () => {
  try {
    console.log('Using MONGODB_URI:', process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cashback', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connection successful');
    process.exit(0);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
})();


