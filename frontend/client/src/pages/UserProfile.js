import React, { useState, useEffect, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { FiUser, FiMail, FiPhone, FiDollarSign, FiCreditCard, FiRefreshCw } from 'react-icons/fi';

const UserProfile = () => {
  const { user, refreshUser } = useContext(AuthContext);
  const location = useLocation();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  // Refresh data when navigating to this page (user returns from claiming offer)
  useEffect(() => {
    if (user && location.pathname === '/profile') {
      // Small delay to ensure backend has saved the data
      const timer = setTimeout(() => {
        fetchUserData();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, user]);

  // Refresh when page becomes visible (user returns from another tab/window)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        fetchUserData();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      // Use user._id if available, otherwise user.id
      const userId = user._id || user.id;
      const res = await axios.get(`/api/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setUserData(res.data);
      setFormData({
        name: res.data.name,
        email: res.data.email,
        phone: res.data.phone || ''
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userId = user._id || user.id;
      await axios.put(`/api/users/${userId}`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setEditing(false);
      await fetchUserData();
      // Refresh AuthContext user data
      if (refreshUser) {
        await refreshUser();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating profile');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">My Profile</h1>
          <button
            onClick={fetchUserData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
            title="Refresh data"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center mb-6">
            <div className="bg-primary-100 rounded-full p-4">
              <FiUser className="text-3xl text-primary-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-2xl font-semibold">{userData?.name}</h2>
              <p className="text-gray-600">{userData?.email}</p>
            </div>
          </div>

          {!editing ? (
            <div className="space-y-4">
              <div className="flex items-center">
                <FiMail className="text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{userData?.email}</p>
                </div>
              </div>
              {userData?.phone && (
                <div className="flex items-center">
                  <FiPhone className="text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium">{userData?.phone}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center">
                <FiDollarSign className="text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Total Cashback</p>
                  <p className="font-medium text-primary-600">₹{userData?.totalCashback || 0}</p>
                </div>
              </div>
              <div className="flex items-center">
                <FiCreditCard className="text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Wallet Balance</p>
                  <p className="font-medium text-green-600">₹{userData?.wallet || 0}</p>
                  <p className="text-xs text-gray-400 mt-1">Money will not be deducted until the app is installed.</p>
                </div>
              </div>
              <button
                onClick={() => setEditing(true)}
                className="mt-4 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
              >
                Edit Profile
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500"
                />
              </div>
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setFormData({
                      name: userData?.name,
                      email: userData?.email,
                      phone: userData?.phone || ''
                    });
                  }}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Claimed Offers */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">My Claimed Offers</h3>
            <span className="text-sm text-gray-600">
              {userData?.offersClaimed?.length || 0} offers
            </span>
          </div>
          {userData?.offersClaimed && userData.offersClaimed.length > 0 ? (
            <div className="space-y-4">
              {userData.offersClaimed.map((claim, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                  {claim.offerId && typeof claim.offerId === 'object' ? (
                    <>
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-semibold text-gray-900">
                          {claim.offerId.title || 'Offer'}
                        </h4>
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          claim.status === 'approved' ? 'bg-green-100 text-green-800' :
                          claim.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {claim.status || 'pending'}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                        <div>
                          <p className="text-sm text-gray-600">Cashback Amount</p>
                          <p className="text-lg font-semibold text-green-600">
                            ₹{claim.offerId.cashbackAmount || 10}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">Money will not be deducted until the app is installed.</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">UPI ID</p>
                          <p className="text-sm font-medium text-gray-900">
                            {claim.upiId || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Claimed Date</p>
                          <p className="text-sm font-medium text-gray-900">
                            {claim.claimedAt ? new Date(claim.claimedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            }) : 'N/A'}
                          </p>
                        </div>
                        {claim.offerId.category && (
                          <div>
                            <p className="text-sm text-gray-600">Category</p>
                            <p className="text-sm font-medium text-gray-900 capitalize">
                              {claim.offerId.category}
                            </p>
                          </div>
                        )}
                      </div>
                      {claim.offerId.description && (
                        <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                          {claim.offerId.description}
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="text-gray-500">
                      <p className="font-medium">Offer ID: {claim.offerId || 'N/A'}</p>
                      <p className="text-sm">Status: {claim.status || 'pending'}</p>
                      <p className="text-sm">UPI ID: {claim.upiId || 'N/A'}</p>
                      <p className="text-sm">
                        Claimed: {claim.claimedAt ? new Date(claim.claimedAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FiDollarSign className="mx-auto text-4xl text-gray-300 mb-2" />
              <p className="text-gray-600">No claimed offers yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;

