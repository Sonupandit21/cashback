import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { FiCopy, FiShare2, FiUserPlus, FiGift, FiDollarSign, FiCheckCircle, FiArrowLeft } from 'react-icons/fi';

const Refer = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [referralCode, setReferralCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [referralStats, setReferralStats] = useState({
    referralsCount: 0,
    totalEarnings: 0
  });

  useEffect(() => {
    if (user) {
      fetchUserData();
    } else {
      navigate('/login');
    }
  }, [user, navigate]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const userId = user._id || user.id;
      const res = await axios.get(`/api/users/${userId}`);
      
      if (res.data.referralCode) {
        setReferralCode(res.data.referralCode);
      } else {
        // If no referral code, generate one by updating user
        await axios.put(`/api/users/${userId}`, {});
        const updatedRes = await axios.get(`/api/users/${userId}`);
        setReferralCode(updatedRes.data.referralCode || '');
      }
      
      setReferralStats({
        referralsCount: res.data.referralsCount || 0,
        totalEarnings: res.data.totalCashback || 0
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const referralLink = `${window.location.origin}/register?ref=${referralCode}`;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shareReferral = async () => {
    const shareData = {
      title: 'Join Cashback Website and Earn Rewards!',
      text: `Use my referral code ${referralCode} to get started and earn cashback!`,
      url: referralLink
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        copyToClipboard(referralLink);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        copyToClipboard(referralLink);
      }
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <FiArrowLeft />
          <span>Back</span>
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mb-4">
            <FiUserPlus className="text-4xl text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Refer & Earn</h1>
          <p className="text-xl text-gray-600">Invite friends and earn rewards together!</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Referrals</p>
                <p className="text-3xl font-bold text-gray-900">{referralStats.referralsCount}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <FiUserPlus className="text-2xl text-purple-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Earnings</p>
                <p className="text-3xl font-bold text-gray-900">₹{referralStats.totalEarnings}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <FiDollarSign className="text-2xl text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Referral Code Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Referral Code</h2>
            <p className="text-gray-600">Share this code with your friends to earn rewards</p>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg p-6 mb-6">
            <div className="text-center">
              <p className="text-white text-sm mb-2">Referral Code</p>
              <p className="text-4xl font-bold text-white tracking-wider mb-4">{referralCode}</p>
              <button
                onClick={() => copyToClipboard(referralCode)}
                className="bg-white text-purple-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition flex items-center gap-2 mx-auto"
              >
                {copied ? (
                  <>
                    <FiCheckCircle className="text-green-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <FiCopy />
                    Copy Code
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Referral Link */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Referral Link</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={referralLink}
                readOnly
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-sm"
              />
              <button
                onClick={() => copyToClipboard(referralLink)}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center gap-2"
              >
                {copied ? <FiCheckCircle /> : <FiCopy />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Share Button */}
          <button
            onClick={shareReferral}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:opacity-90 transition flex items-center justify-center gap-2"
          >
            <FiShare2 />
            Share Referral Link
          </button>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">1</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Share Your Code</h3>
              <p className="text-gray-600 text-sm">Share your referral code or link with friends</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">They Sign Up</h3>
              <p className="text-gray-600 text-sm">Your friends register using your referral code</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">3</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Earn Rewards</h3>
              <p className="text-gray-600 text-sm">You both earn rewards when they complete offers</p>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="mt-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl shadow-lg p-8 text-white">
          <h2 className="text-2xl font-bold mb-4 text-center">Referral Benefits</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <FiGift className="text-2xl flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Earn Cashback</h3>
                <p className="text-purple-100 text-sm">Get rewards when your referrals complete offers</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FiDollarSign className="text-2xl flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">No Limits</h3>
                <p className="text-purple-100 text-sm">Refer as many friends as you want</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Refer;













