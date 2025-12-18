const axios = require('axios');

const getOffers = async () => {
  try {
    const res = await axios.get('http://localhost:5000/api/offers');
    console.log(JSON.stringify(res.data, null, 2));
  } catch (error) {
    console.error('Error fetching offers:', error.message);
  }
  process.exit(0);
};

getOffers();
  



























