import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { FiArrowLeft, FiCreditCard, FiAlertCircle, FiCheckCircle, FiDollarSign } from 'react-icons/fi';

const Withdraw = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [walletBalance, setWalletBalance] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [upiId, setUpiId] = useState('');
  const [amount, setAmount] = useState('');
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');

  const MIN_WITHDRAWAL = 10;

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
      setWalletBalance(res.data.wallet || 0);
      setTotalEarnings(res.data.totalCashback || 0);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setMessage('Error loading wallet balance');
    } finally {
      setLoading(false);
    }
  };

  const validateUPI = (upi) => {
    const upiPattern = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
    return upiPattern.test(upi.trim());
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    // Only allow numbers and one decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      if (errors.amount) {
        setErrors({ ...errors, amount: '' });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setMessage('');
    setSuccess(false);

    // Validation
    const validationErrors = {};

    if (!upiId.trim()) {
      validationErrors.upiId = 'UPI ID is required';
    } else if (!validateUPI(upiId.trim())) {
      validationErrors.upiId = 'Invalid UPI ID format. Example: username@paytm or username@ybl';
    }

    if (!amount || amount.trim() === '') {
      validationErrors.amount = 'Amount is required';
    } else {
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        validationErrors.amount = 'Please enter a valid amount';
      } else if (amountNum < MIN_WITHDRAWAL) {
        validationErrors.amount = `Minimum withdrawal amount is ₹${MIN_WITHDRAWAL}`;
      } else if (amountNum > walletBalance) {
        validationErrors.amount = `Insufficient balance. Available: ₹${walletBalance}`;
      }
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setSubmitting(true);
      const response = await axios.post('/api/withdraw', {
        amount: parseFloat(amount),
        upiId: upiId.trim()
      });

      setSuccess(true);
      setMessage('Withdrawal request submitted successfully! It will be processed within 24-48 hours.');
      setAmount('');
      setUpiId('');
      
      // Refresh wallet balance
      await fetchUserData();

      // Redirect after 3 seconds
      setTimeout(() => {
        navigate('/usersadmin');
      }, 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error submitting withdrawal request');
      setSuccess(false);
    } finally {
      setSubmitting(false);
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
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/usersadmin')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <FiArrowLeft />
            <span>Back to Wallet</span>
          </button>
          <h1 className="text-3xl font-bold mb-2">Withdraw Balance</h1>
          <p className="text-gray-600">Withdraw your wallet balance via UPI</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Total Earnings Card */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm mb-1">Total Earnings</p>
                <p className="text-3xl font-bold">₹{totalEarnings}</p>
                <p className="text-blue-100 text-xs mt-1">All-time cashback earned</p>
              </div>
              <FiDollarSign className="text-4xl text-blue-200 opacity-80" />
            </div>
          </div>

          {/* Available Balance Card */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm mb-1">Available Balance</p>
                <p className="text-3xl font-bold">₹{walletBalance}</p>
                <p className="text-green-100 text-xs mt-1">Ready to withdraw</p>
                <p className="text-green-100 text-xs mt-1 opacity-80">Money will not be deducted until the app is installed.</p>
              </div>
              <FiCreditCard className="text-4xl text-green-200 opacity-80" />
            </div>
          </div>
        </div>

        {/* Info Alert */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <FiAlertCircle className="text-blue-600 mt-1 mr-3 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Withdrawal Information</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Minimum withdrawal amount: ₹{MIN_WITHDRAWAL}</li>
                <li>Withdrawals are processed via UPI only</li>
                <li>Processing time: 24-48 hours</li>
                <li>You can only withdraw your available wallet balance</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Withdrawal Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <FiCheckCircle className="text-green-600 mr-3" />
                <p className="text-green-800">{message}</p>
              </div>
            </div>
          )}

          {message && !success && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <FiAlertCircle className="text-red-600 mr-3" />
                <p className="text-red-800">{message}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Amount Input */}
            <div className="mb-6">
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                Withdrawal Amount (₹)
              </label>
              <input
                type="text"
                id="amount"
                value={amount}
                onChange={handleAmountChange}
                placeholder={`Minimum ₹${MIN_WITHDRAWAL}`}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.amount ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={submitting || walletBalance < MIN_WITHDRAWAL}
              />
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
              )}
              {walletBalance > 0 && !errors.amount && (
                <p className="mt-1 text-sm text-gray-500">
                  Available: ₹{walletBalance} | Max: ₹{walletBalance}
                </p>
              )}
            </div>

            {/* UPI ID Input */}
            <div className="mb-6">
              <label htmlFor="upiId" className="block text-sm font-medium text-gray-700 mb-2">
                UPI ID
              </label>
              <input
                type="text"
                id="upiId"
                value={upiId}
                onChange={(e) => {
                  setUpiId(e.target.value);
                  if (errors.upiId) {
                    setErrors({ ...errors, upiId: '' });
                  }
                }}
                placeholder="username@paytm or username@ybl"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.upiId ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={submitting}
              />
              {errors.upiId && (
                <p className="mt-1 text-sm text-red-600">{errors.upiId}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Format: username@bankname (e.g., user@paytm, user@ybl)
              </p>
            </div>

            {/* Quick Amount Buttons */}
            {walletBalance >= MIN_WITHDRAWAL && (
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-2">Quick Select:</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setAmount(MIN_WITHDRAWAL.toString())}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition"
                    disabled={submitting}
                  >
                    ₹{MIN_WITHDRAWAL}
                  </button>
                  {walletBalance >= 500 && (
                    <button
                      type="button"
                      onClick={() => setAmount('500')}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition"
                      disabled={submitting}
                    >
                      ₹500
                    </button>
                  )}
                  {walletBalance >= 1000 && (
                    <button
                      type="button"
                      onClick={() => setAmount('1000')}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition"
                      disabled={submitting}
                    >
                      ₹1000
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setAmount(walletBalance.toString())}
                    className="px-4 py-2 bg-primary-100 hover:bg-primary-200 text-primary-700 rounded-lg text-sm transition font-medium"
                    disabled={submitting}
                  >
                    All (₹{walletBalance})
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || walletBalance < MIN_WITHDRAWAL}
              className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Withdrawal Request'}
            </button>

            {walletBalance < MIN_WITHDRAWAL && (
              <p className="mt-4 text-center text-sm text-gray-500">
                Minimum balance of ₹{MIN_WITHDRAWAL} required for withdrawal
              </p>
            )}
            
            <p className="mt-4 text-center text-xs text-gray-500">
              Note: Withdrawal is only available after at least one offer claim is approved by admin.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Withdraw;

