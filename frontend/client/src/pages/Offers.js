import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { FiDollarSign, FiClock, FiUsers } from 'react-icons/fi';

const Offers = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchOffers();
  }, [category]);

  // API: GET /api/offers
  // - Returns all active offers
  // - Supports optional query params:
  //   - category (e.g. /api/offers?category=Shopping)
  //   - featured, limit (used in other pages)
  const fetchOffers = async () => {
    try {
      setLoading(true);
      const url = category
        ? `/api/offers?category=${category}`
        : '/api/offers';
      const res = await axios.get(url);
      setOffers(res.data);
    } catch (error) {
      console.error('Error fetching offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const openOfferDetail = async (offerId) => {
    // Track click when user clicks on offer card (if logged in)
    if (user) {
      try {
        await axios.post(`/api/offers/${offerId}/track`, {}, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        console.log('Click tracked successfully');
      } catch (trackError) {
        console.error('Error tracking click:', trackError);
        // Don't prevent navigation if tracking fails
      }
    }
    navigate(`/offers/${offerId}`);
  };

  const categories = ['All', 'Shopping', 'Food', 'Travel', 'Entertainment', 'Finance'];

  return (
    <div className="min-h-screen py-10 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 text-center">
          Available Offers
        </h1>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat === 'All' ? '' : cat)}
              className={`px-6 py-2 rounded-lg transition ${
                (cat === 'All' && !category) || category === cat
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offers.map((offer) => (
              <div
                key={offer._id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition"
              >
                {offer.imageUrl && (
                  <img
                    src={offer.imageUrl}
                    alt={offer.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="bg-primary-100 text-primary-800 text-xs font-semibold px-2 py-1 rounded">
                      {offer.category}
                    </span>
                    {offer.isFeatured && (
                      <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded">
                        Featured
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{offer.title}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-3">{offer.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-gray-600">
                      <FiDollarSign className="mr-2" />
                      <span className="font-semibold text-primary-600">
                        {offer.cashbackAmount}% Cashback
                      </span>
                    </div>
                    {offer.minAmount > 0 && (
                      <div className="text-sm text-gray-600">
                        Min. Purchase: {offer.currency} {offer.minAmount}
                      </div>
                    )}
                    {offer.maxUsers && (
                      <div className="flex items-center text-sm text-gray-600">
                        <FiUsers className="mr-2" />
                        {offer.currentUsers}/{offer.maxUsers} claimed
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => openOfferDetail(offer._id)}
                    className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition"
                  >
                    Claim Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && offers.length === 0 && (
          <p className="text-center text-gray-600 py-12">No offers available</p>
        )}
      </div>
    </div>
  );
};

export default Offers;

