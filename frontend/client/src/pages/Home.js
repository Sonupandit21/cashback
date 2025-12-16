import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiArrowRight, FiDollarSign, FiSearch, FiCheckCircle, FiUserPlus, FiGift } from 'react-icons/fi';

const Home = () => {
  const [featuredOffers, setFeaturedOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFeaturedOffers();
  }, []);

  const fetchFeaturedOffers = async () => {
    try {
      const res = await axios.get('/api/offers?featured=true&limit=6');
      setFeaturedOffers(res.data);
    } catch (error) {
      console.error('Error fetching offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const openOfferDetail = (offerId) => {
    navigate(`/offers/${offerId}`);
  };

  const isOfferOver = (offer) => {
    if (offer.maxUsers && offer.currentUsers >= offer.maxUsers) {
      return true;
    }
    return !offer.isActive;
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">
              Earn Real Cash Rewards On Every Purchase
            </h1>
            <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 text-primary-100">
              Discover exclusive deals and earn real cashback on your favorite brands. 
              Join our community of smart shoppers today.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:space-x-4">
              <Link
                to="/offers"
                className="bg-white text-primary-600 px-6 sm:px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition flex items-center justify-center"
              >
                Explore Offers
                <FiArrowRight className="ml-2" />
              </Link>
              <a
                // href="https://t.me/yourtelegram"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-primary-700 text-white px-6 sm:px-8 py-3 rounded-lg font-semibold hover:bg-primary-600 transition"
              >
                Join Telegram
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Browse Offers */}
            <div className="bg-white rounded-xl p-6 text-center">
              <div className="bg-purple-500 rounded-lg w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <FiSearch className="text-4xl text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Browse Offers</h3>
              <p className="text-gray-600">
                Explore exclusive deals and offers from top brands
              </p>
            </div>

            {/* Complete Tasks */}
            <div className="bg-white rounded-xl p-6 text-center">
              <div className="bg-green-500 rounded-lg w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <FiCheckCircle className="text-4xl text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Complete Tasks</h3>
              <p className="text-gray-600">
                Follow simple instructions to complete offer requirements
              </p>
            </div>

            {/* Get Cashback */}
            <div className="bg-white rounded-xl p-6 text-center">
              <div className="bg-orange-500 rounded-lg w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <FiDollarSign className="text-4xl text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Get Cashback</h3>
              <p className="text-gray-600">
                Receive cashback directly to your account within 24 hours
              </p>
            </div>

            {/* Refer & Earn */}
            <div className="bg-white rounded-xl p-6 text-center">
              <div className="bg-purple-500 rounded-lg w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <FiUserPlus className="text-4xl text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Refer & Earn</h3>
              <p className="text-gray-600">
                Invite friends and earn additional rewards
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Offers */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-4">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Featured Offers</h2>
            <p className="text-gray-600 text-lg">Limited time deals with exclusive cashback rates.</p>
          </div>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              {featuredOffers.map((offer) => {
                const offerOver = isOfferOver(offer);
                return (
                  <div
                    key={offer._id}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition relative"
                  >
                    {offerOver && (
                      <div className="absolute top-2 right-2 z-10">
                        <span className="bg-red-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                          Offer Over
                        </span>
                      </div>
                    )}
                    {offer.imageUrl ? (
                      <div className="w-full h-32 bg-gray-200 flex items-center justify-center">
                        <img
                          src={offer.imageUrl}
                          alt={offer.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-32 bg-gradient-to-r from-primary-400 to-primary-600 flex items-center justify-center">
                        <span className="text-white text-2xl font-bold">{offer.title.charAt(0)}</span>
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="text-lg font-semibold mb-2 text-gray-900">{offer.title}</h3>
                      <div className="mb-3">
                        <span className="bg-blue-600 text-white text-sm font-semibold px-3 py-1 rounded-full">
                          {offer.currency === 'INR' ? 'Rs' : '$'} {offer.cashbackAmount} Cashback
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">{offer.instructions || 'Complete the offer to get cashback'}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => !offerOver && openOfferDetail(offer._id)}
                          disabled={offerOver}
                          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-semibold transition ${
                            offerOver
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          <FiGift className="text-sm" />
                          {offerOver ? 'Offer Ended' : 'Claim Now'}
                        </button>
                        <button
                          onClick={() => !offerOver && navigate('/refer')}
                          disabled={offerOver}
                          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-semibold transition ${
                            offerOver
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-orange-500 text-white hover:bg-orange-600'
                          }`}
                        >
                          <FiGift className="text-sm" />
                          {offerOver ? 'Offer Ended' : 'Refer Now'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {!loading && featuredOffers.length === 0 && (
            <p className="text-center text-gray-600 py-12">No featured offers available</p>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Earning?</h2>
          <p className="text-xl mb-8 text-primary-100">
            Join thousands of users who are earning daily with our exclusive offers.
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              to="/offers"
              className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition"
            >
              Browse Offers
            </Link>
            <a
              // href="https://t.me/yourtelegram"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-800 transition"
            >
              Join Telegram
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

