import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { FiGift, FiCheckCircle, FiX } from 'react-icons/fi';
import { getStoredClickId } from '../utils/trackier';
import SupportModal from '../components/SupportModal';

const OfferDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, refreshUser } = useContext(AuthContext);
  const [offer, setOffer] = useState(null);
  const [upiId, setUpiId] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [upiError, setUpiError] = useState('');
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [redirectCountdown, setRedirectCountdown] = useState(2);
  const [showSupportModal, setShowSupportModal] = useState(false);

  // UPI ID validation function
  const validateUPI = (upi) => {
    // UPI ID format: username@bankname or username@upi
    // Examples: user@paytm, user@ybl, user@okaxis, user@upi
    const upiPattern = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
    return upiPattern.test(upi);
  };

  useEffect(() => {
    const fetchOffer = async () => {
      try {
        const res = await axios.get(`/api/offers/${id}`);
        setOffer(res.data);
        
        // Track click when offer detail page is loaded (if user is logged in)
        if (user) {
          try {
            await axios.post(`/api/offers/${id}/track`, {}, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
              }
            });
            console.log('✅ Click tracked successfully');
          } catch (trackError) {
            console.error('❌ Error tracking click:', trackError);
            // Don't fail the page load if tracking fails
          }
        }
      } catch (error) {
        console.error('Error loading offer:', error);
        navigate('/offers');
      } finally {
        setLoading(false);
      }
    };

    fetchOffer();
  }, [id, navigate, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpiError('');
    setErrorMessage('');
    setSuccess(false);

    if (!user) {
      setErrorMessage('Please login to claim this offer');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    if (!upiId.trim()) {
      setUpiError('Please enter your UPI ID');
      return;
    }

    // Validate UPI ID format
    if (!validateUPI(upiId.trim())) {
      setUpiError('Invalid UPI ID format. Example: username@paytm or username@ybl');
      return;
    }

    try {
      setSubmitting(true);
      
      // Get stored clickid from localStorage (from URL or previous tracking)
      let clickid = getStoredClickId();
      
      // If no click ID stored, generate one by calling the generate-click endpoint
      if (!clickid && user) {
        try {
          const clickResponse = await axios.get(`/api/offers/${id}/generate-click`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          });
          if (clickResponse.data.clickId) {
            clickid = clickResponse.data.clickId;
            // Store in localStorage for future use
            localStorage.setItem('click_id', clickid);
          }
        } catch (clickError) {
          console.warn('⚠️ Could not generate Click ID:', clickError);
        }
      }
      
      // API: POST /api/offers/:id/claim
      // Send clickid along with UPI ID for Trackier postback
      const response = await axios.post(`/api/offers/${id}/claim`, { 
        upiId: upiId.trim(),
        clickid: clickid // Send clickid to backend for Trackier postback
      });
      
      // Refresh user data to get updated wallet and claimed offers
      if (refreshUser) {
        try {
          await refreshUser();
        } catch (refreshError) {
          console.error('Error refreshing user:', refreshError);
        }
      }
      
      setSuccess(true);
      setRedirectCountdown(3);
      
      // Use proxy redirect URL if available (Click ID hidden until installation)
      // Otherwise fallback to direct URL
      let offerUrl = offer?.offerLink;
      
      // Try to get redirect URL from generate-click endpoint (hides Click ID)
      if (!clickid && user) {
        try {
          const clickResponse = await axios.get(`/api/offers/${id}/generate-click`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          });
          if (clickResponse.data.redirectUrl) {
            // Use proxy redirect URL - Click ID will be appended server-side
            offerUrl = clickResponse.data.redirectUrl;
          } else if (clickResponse.data.offerUrl) {
            // Fallback to direct URL with Click ID (if endpoint returns it)
            offerUrl = clickResponse.data.offerUrl;
          }
        } catch (clickError) {
          console.warn('⚠️ Could not get redirect URL:', clickError);
        }
      }
      
      // If we have clickid and no redirect URL, append directly (fallback)
      if (offerUrl === offer?.offerLink && clickid) {
        try {
          const url = new URL(offerUrl);
          // Append Click ID to multiple parameters for compatibility
          url.searchParams.set('click_id', clickid);
          url.searchParams.set('sub1', clickid); // Trackier/Impact standard
          url.searchParams.set('p1', clickid); // Alternative parameter
          offerUrl = url.toString();
        } catch (urlError) {
          console.warn('⚠️ Could not append Click ID to URL:', urlError);
          // Fallback: append as query string
          const separator = offerUrl.includes('?') ? '&' : '?';
          offerUrl = `${offerUrl}${separator}click_id=${encodeURIComponent(clickid)}&sub1=${encodeURIComponent(clickid)}`;
        }
      }
      
      // Countdown timer
      const countdownInterval = setInterval(() => {
        setRedirectCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            // Redirect to offer link with Click ID (external URL)
            if (offerUrl) {
              window.location.href = offerUrl;
            } else if (offer && offer.offerLink) {
              window.location.href = offer.offerLink;
            } else {
              navigate('/offers');
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      // Auto redirect to offer link after 3 seconds
      setTimeout(() => {
        clearInterval(countdownInterval);
        if (offerUrl) {
          window.location.href = offerUrl;
        } else if (offer && offer.offerLink) {
          window.location.href = offer.offerLink;
        } else {
          navigate('/offers');
        }
      }, 3000);
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to claim offer';
      setErrorMessage(errorMsg);
      // Auto-dismiss error after 5 seconds
      setTimeout(() => {
        setErrorMessage('');
      }, 5000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpiChange = (e) => {
    const value = e.target.value;
    setUpiId(value);
    // Clear error when user starts typing
    if (upiError) {
      setUpiError('');
    }
  };

  if (loading || !offer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const currencySymbol =
    offer.currency === 'INR' ? '₹' : offer.currency === 'USD' ? '$' : offer.currency;

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center py-8 px-4 relative">
      {/* Success Message Modal */}
      {success && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg border border-gray-200 shadow-xl max-w-md w-full p-8 animate-fade-in">
            <div className="text-center">
              {/* Success Icon */}
              <div className="mb-6">
                <svg
                  className="w-20 h-20 mx-auto text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="3"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {/* Decorative dots */}
                <div className="relative -mt-12">
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 flex gap-1">
                    <div className="w-1 h-1 bg-green-400 rounded-full opacity-60"></div>
                    <div className="w-1 h-1 bg-green-400 rounded-full opacity-40"></div>
                    <div className="w-1 h-1 bg-green-400 rounded-full opacity-60"></div>
                  </div>
                </div>
              </div>

              {/* Heading */}
              <h2 className="text-3xl font-bold text-gray-900 mb-3">SUCCESS!</h2>

              {/* Primary Message */}
              <p className="text-gray-700 text-base mb-2">
                Your cashback request has been submitted successfully
              </p>

              {/* Secondary Message */}
              <p className="text-gray-500 text-sm mb-6">
                Preparing your offer...
              </p>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: '75%' }}
                  ></div>
                </div>
              </div>

              {/* Redirect Timer */}
              <p className="text-gray-400 text-sm mb-4">
                Redirecting to offer in {redirectCountdown} second{redirectCountdown !== 1 ? 's' : ''}
              </p>
              
              {/* Manual redirect button */}
              {offer && offer.offerLink && (
                <button
                  onClick={async () => {
                    // Use proxy redirect to hide Click ID until installation
                    try {
                      const clickResponse = await axios.get(`/api/offers/${id}/generate-click`, {
                        headers: {
                          Authorization: `Bearer ${localStorage.getItem('token')}`
                        }
                      });
                      if (clickResponse.data.redirectUrl) {
                        // Use proxy redirect URL - Click ID hidden
                        window.location.href = clickResponse.data.redirectUrl;
                      } else {
                        // Fallback to direct URL
                        window.location.href = offer.offerLink;
                      }
                    } catch (error) {
                      console.error('Error getting redirect URL:', error);
                      window.location.href = offer.offerLink;
                    }
                  }}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2.5 rounded-lg font-semibold hover:opacity-90 transition"
                >
                  Go to Offer Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <FiX className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-red-800 text-sm font-medium">{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage('')}
              className="text-red-600 hover:text-red-800"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-4 flex items-center justify-between">
          <div>
            <h1 className="text-white text-xl font-semibold">{offer.title}</h1>
            <p className="text-purple-100 text-xs">Only For New Users</p>
          </div>
          {offer.imageUrl && (
            <img
              src={offer.imageUrl}
              alt={offer.title}
              className="w-10 h-10 rounded-lg object-cover"
            />
          )}
        </div>

        {/* Cashback card */}
        <div className="p-4">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl p-4 text-white flex items-center justify-between mb-4">
            <div>
              <p className="text-xs opacity-80">Your Cashback</p>
              <p className="text-3xl font-bold">{offer.cashbackAmount}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <FiGift className="text-2xl" />
            </div>
          </div>

          {/* Check if already claimed */
          user && user.offersClaimed && user.offersClaimed.some(claim => claim.offerId === offer._id) ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FiCheckCircle className="text-2xl text-green-600" />
              </div>
              <h3 className="text-green-800 font-bold mb-1">Offer Claimed!</h3>
              <p className="text-green-700 text-sm mb-2">
                Status: <span className="font-semibold capitalize">
                  {user.offersClaimed.find(claim => claim.offerId === offer._id).status}
                </span>
              </p>
              <p className="text-xs text-green-600">
                Claimed on: {new Date(user.offersClaimed.find(claim => claim.offerId === offer._id).claimedAt).toLocaleDateString()}
              </p>
            </div>
          ) : (
            /* UPI input form */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Enter Your UPI ID
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={handleUpiChange}
                  placeholder="example@paytm or example@ybl"
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                    upiError
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-purple-500'
                  }`}
                />
                {upiError && (
                  <p className="mt-1 text-xs text-red-600">{upiError}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2.5 rounded-lg font-semibold text-sm shadow-md hover:opacity-90 disabled:opacity-60"
              >
                {submitting ? 'Submitting...' : `${currencySymbol} Submit`}
              </button>
              <p className="text-xs text-center text-gray-500 mt-2">
                Money will not be deducted until the app is installed.
              </p>
            </form>
          )}

          {/* How to claim */}
          <div className="mt-6">
            <h2 className="text-sm font-bold text-gray-800 mb-2">HOW TO CLAIM</h2>
            <ol className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center mt-0.5">
                  1
                </span>
                <span>Enter your UPI ID and click on Submit.</span>
              </li>
              <li className="flex items-start gap-2">
                <FiCheckCircle className="text-green-500 mt-0.5" />
                <span>
                  You'll receive cashback in your UPI account within 2–10 minutes after successful
                  completion.
                </span>
              </li>
            </ol>
          </div>

          {/* Terms & Conditions */}
          <div className="mt-6">
            <h2 className="text-sm font-bold text-gray-800 mb-2">TERMS & CONDITIONS</h2>
            <ul className="space-y-2 text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-xl p-3">
              <li>Offer valid only once per user/UPI ID/IP address and device.</li>
              <li>Multiple registrations from same user/UPI ID/IP address will not be paid.</li>
              <li>Use only genuine Indian mobile numbers and email IDs (if applicable).</li>
              <li>Merchant may verify your account before approving cashback.</li>
              <li>
                For support, email
                {/* <a href="mailto:support@camploots.site" className="text-blue-600 ml-1">
                  support@camploots.site
                </a> */}
              </li>
            </ul>
          </div>

          {/* Bottom buttons */}
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowSupportModal(true)}
              className="w-full border border-gray-300 rounded-lg py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
            >
              Support
            </button>
          </div>
        </div>
      </div>

      {/* Support Modal */}
      <SupportModal
        isOpen={showSupportModal}
        onClose={() => setShowSupportModal(false)}
      />
    </div>
  );
};

export default OfferDetail;
 