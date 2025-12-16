import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { FiCreditCard, FiGift, FiCheckCircle, FiClock, FiXCircle, FiUser, FiRefreshCw } from 'react-icons/fi';

const UserAdmin = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    wallet: 0,
    totalClaims: 0,
    approvedClaims: 0,
    pendingClaims: 0
  });

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  // Refresh data when navigating to this page (user returns from claiming offer)
  useEffect(() => {
    if (user && location.pathname === '/usersadmin') {
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
      const res = await axios.get(`/api/users/${userId}`);
      
      // Normalize status values in offersClaimed (handle undefined/null and ensure lowercase)
      const claims = res.data.offersClaimed || [];
      const normalizedClaims = claims.map(claim => ({
        ...claim,
        status: (claim.status || 'pending').toLowerCase()
      }));
      
      // Set userData with normalized claims
      setUserData({
        ...res.data,
        offersClaimed: normalizedClaims
      });
      
      // Calculate stats from normalized claims
      setStats({
        wallet: res.data.wallet || 0,
        totalClaims: normalizedClaims.length,
        approvedClaims: normalizedClaims.filter(c => c.status === 'approved').length,
        pendingClaims: normalizedClaims.filter(c => c.status === 'pending').length
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
      console.error('User object:', user);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    // Normalize status: handle undefined/null and ensure lowercase
    const normalizedStatus = (status || 'pending').toLowerCase();
    const badges = {
      approved: 'bg-green-100 text-green-800 border-green-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      rejected: 'bg-red-100 text-red-800 border-red-200'
    };
    return badges[normalizedStatus] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusIcon = (status) => {
    // Normalize status: handle undefined/null and ensure lowercase
    const normalizedStatus = (status || 'pending').toLowerCase();
    switch (normalizedStatus) {
      case 'approved':
        return <FiCheckCircle className="text-green-600" />;
      case 'pending':
        return <FiClock className="text-yellow-600" />;
      case 'rejected':
        return <FiXCircle className="text-red-600" />;
      default:
        return <FiClock className="text-gray-600" />;
    }
  };

  const getNormalizedStatus = (status) => {
    return (status || 'pending').toLowerCase();
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Wallet & Offers</h1>
            <p className="text-gray-600">Manage your cashback and claimed offers</p>
          </div>
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Wallet Balance */}
          <div 
            onClick={() => navigate('/withdraw')}
            className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white cursor-pointer hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-105"
            title="Click to withdraw balance"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm mb-1">Wallet Balance</p>
                <p className="text-3xl font-bold">₹{stats.wallet}</p>
                <p className="text-green-100 text-xs mt-1">Click to withdraw</p>
              </div>
              <FiCreditCard className="text-4xl text-green-200 opacity-80" />
            </div>
          </div>

          {/* Total Claims */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <FiGift className="text-3xl text-blue-600 mr-4" />
              <div>
                <p className="text-gray-600 text-sm">Total Claims</p>
                <p className="text-2xl font-bold">{stats.totalClaims}</p>
              </div>
            </div>
          </div>

          {/* Approved Claims */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <FiCheckCircle className="text-3xl text-green-600 mr-4" />
              <div>
                <p className="text-gray-600 text-sm">Approved</p>
                <p className="text-2xl font-bold">{stats.approvedClaims}</p>
              </div>
            </div>
          </div>

          {/* Pending Claims */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <FiClock className="text-3xl text-yellow-600 mr-4" />
              <div>
                <p className="text-gray-600 text-sm">Pending</p>
                <p className="text-2xl font-bold">{stats.pendingClaims}</p>
              </div>
            </div>
          </div>
        </div>

        {/* User Info Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center mb-4">
            <div className="bg-primary-100 rounded-full p-3">
              <FiUser className="text-2xl text-primary-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-semibold">{userData?.name}</h2>
              <p className="text-gray-600">{userData?.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm text-gray-600">Total Cashback</p>
              <p className="text-lg font-semibold text-primary-600">
                ₹{userData?.totalCashback || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Wallet Balance</p>
              <p className="text-lg font-semibold text-green-600">
                ₹{userData?.wallet || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Member Since</p>
              <p className="text-lg font-semibold">
                {userData?.createdAt ? formatDate(userData.createdAt) : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Claimed Offers */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold">Claimed Offers</h3>
            <span className="text-sm text-gray-600">
              {userData?.offersClaimed?.length || 0} offers
            </span>
          </div>

          {userData?.offersClaimed && userData.offersClaimed.length > 0 ? (
            <div className="space-y-4">
              {userData.offersClaimed.map((claim, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {claim.offerId && typeof claim.offerId === 'object' ? (
                        <>
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-lg font-semibold text-gray-900">
                              {claim.offerId?.title || 'Offer'}
                            </h4>
                            <span
                              className={`px-3 py-1 text-xs font-semibold rounded-full border flex items-center gap-1 ${getStatusBadge(
                                claim.status
                              )}`}
                            >
                              {getStatusIcon(claim.status)}
                              <span className="capitalize">{getNormalizedStatus(claim.status)}</span>
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                            <div>
                              <p className="text-sm text-gray-600">Cashback Amount</p>
                              <p className="text-lg font-semibold text-green-600">
                                ₹{claim.offerId?.cashbackAmount || 10}
                              </p>
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
                                {formatDate(claim.claimedAt)}
                              </p>
                            </div>
                            {claim.offerId?.category && (
                              <div>
                                <p className="text-sm text-gray-600">Category</p>
                                <p className="text-sm font-medium text-gray-900 capitalize">
                                  {claim.offerId.category}
                                </p>
                              </div>
                            )}
                          </div>

                          {claim.offerId?.description && (
                            <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                              {claim.offerId.description}
                            </p>
                          )}
                        </>
                      ) : (
                        <div className="text-gray-500">
                          <div className="mb-2">
                            <p className="font-medium">Offer ID: {typeof claim.offerId === 'object' ? claim.offerId?._id : claim.offerId || 'N/A'}</p>
                            <p className="text-sm">Status: <span className="capitalize">{getNormalizedStatus(claim.status)}</span></p>
                            <p className="text-sm">UPI ID: {claim.upiId || 'N/A'}</p>
                            <p className="text-sm">Claimed: {formatDate(claim.claimedAt)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FiGift className="mx-auto text-4xl text-gray-300 mb-4" />
              <p className="text-gray-600 mb-2">No claimed offers yet</p>
              <p className="text-sm text-gray-500">
                Start claiming offers to see them here
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserAdmin;

