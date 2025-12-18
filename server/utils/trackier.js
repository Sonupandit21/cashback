const axios = require('axios');
const crypto = require('crypto');

const TRACKIER_API_URL = process.env.TRACKIER_API_URL || 'https://brandshapers.gotrackier.com';
const TRACKIER_API_KEY = process.env.TRACKIER_API_KEY;
const TRACKIER_PUBLISHER_ID = process.env.TRACKIER_PUBLISHER_ID; // Your publisher/affiliate ID
const TRACKIER_ADVERTISER_ID = process.env.TRACKIER_ADVERTISER_ID; // Your advertiser ID
const TRACKIER_POSTBACK_URL = process.env.TRACKIER_POSTBACK_URL || 'https://brandshapers.gotrackier.com/postback';

/**
 * Generate a unique click ID in CLID- format
 * Format: CLID-{random_string}
 * Example: CLID-kd82jlp9s, CLID-8273GH, CLID-9fh73g2
 */
const generateClickId = () => {
  // Generate random string: 9 characters (alphanumeric)
  const randomString = crypto.randomBytes(6).toString('base64')
    .replace(/[+/=]/g, '') // Remove special characters
    .substring(0, 9)
    .toUpperCase();
  
  return `CLID-${randomString}`;
};

/**
 * Track offer click with Trackier
 * Returns click ID for conversion tracking
 *
 * NOTE:
 * - We ALWAYS generate a clickId so we can store the click in MongoDB,
 *   even if Trackier configuration is missing or API call fails.
 * - If Trackier config is missing, we simply skip the external API call.
 */
const trackClick = async (trackierOfferId, userId, additionalData = {}) => {
  // Always generate a clickId for local tracking
  const clickId = generateClickId();

  // If Trackier config or offer ID is missing, skip API call but still return clickId
  if (!TRACKIER_API_KEY || !trackierOfferId) {
    return { 
      success: false, 
      message: 'Missing Trackier configuration (local click tracking only)',
      clickId
    };
  }

  // Skip external Trackier API call - clicks are tracked locally in MongoDB
  // Trackier will receive conversion data via postback when installs happen
  // The click_id is passed in the tracking URL and returned via postback
  return { 
    success: true, 
    clickId: clickId,
    message: 'Click tracked locally (Trackier receives data via tracking URL redirect)'
  };
};

/**
 * Track conversion with Trackier using click ID (S2S Postback - GET request)
 * This is the recommended method for server-to-server tracking
 */
const trackConversion = async (clickId, payout, status = 1) => {
  if (!clickId) {
    return { 
      success: false, 
      message: 'Click ID is required' 
    };
  }

  try {
    // S2S Postback URL format: https://brandshapers.gotrackier.com/postback?click_id={clickid}&payout={payout}&status={status}
    const postbackUrl = `${TRACKIER_POSTBACK_URL}?click_id=${encodeURIComponent(clickId)}&payout=${encodeURIComponent(payout)}&status=${encodeURIComponent(status)}`;
    
    // Send GET request to Trackier postback URL
    const response = await axios.get(postbackUrl, {
      timeout: 10000, // 10 second timeout
      validateStatus: function (status) {
        // Accept 200-299 and 302 (redirect) as success
        return (status >= 200 && status < 300) || status === 302;
      }
    });

    return { 
      success: true, 
      message: 'Postback sent successfully',
      data: response.data 
    };
  } catch (error) {
    console.error('Trackier postback error:', error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Postback failed'
    };
  }
};

/**
 * Legacy conversion tracking (POST API method) - kept for backward compatibility
 */
const trackConversionLegacy = async (clickId, trackierOfferId, userId, conversionData = {}) => {
  if (!TRACKIER_API_KEY || !clickId || !trackierOfferId) {
    return { 
      success: false, 
      message: 'Missing Trackier configuration' 
    };
  }

  try {
    // Prepare conversion tracking data
    const conversionPayload = {
      click_id: clickId,
      offer_id: trackierOfferId,
      publisher_id: TRACKIER_PUBLISHER_ID || userId.toString(),
      advertiser_id: TRACKIER_ADVERTISER_ID,
      user_id: userId.toString(),
      conversion_type: conversionData.conversionType || 'sale',
      conversion_value: conversionData.conversionValue || 0,
      currency: conversionData.currency || 'INR',
      timestamp: new Date().toISOString(),
      ...conversionData.customParams
    };

    // Track conversion via Trackier API
    const response = await axios.post(
      `${TRACKIER_API_URL}/api/v1/conversions`,
      conversionPayload,
      {
        headers: {
          'Authorization': `Bearer ${TRACKIER_API_KEY}`,
          'Content-Type': 'application/json',
          'X-API-Key': TRACKIER_API_KEY
        }
      }
    );

    return { 
      success: true, 
      conversionId: response.data?.conversion_id,
      data: response.data 
    };
  } catch (error) {
    console.error('Trackier conversion tracking error:', error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || 'Conversion tracking failed'
    };
  }
};

/**
 * Track payout with Trackier
 */
const trackPayout = async (publisherId, amount, currency = 'INR', payoutData = {}) => {
  if (!TRACKIER_API_KEY || !publisherId) {
    return { 
      success: false, 
      message: 'Missing Trackier configuration' 
    };
  }

  try {
    const payoutPayload = {
      publisher_id: publisherId,
      amount: amount,
      currency: currency,
      payout_date: new Date().toISOString(),
      ...payoutData
    };

    const response = await axios.post(
      `${TRACKIER_API_URL}/api/v1/payouts`,
      payoutPayload,
      {
        headers: {
          'Authorization': `Bearer ${TRACKIER_API_KEY}`,
          'Content-Type': 'application/json',
          'X-API-Key': TRACKIER_API_KEY
        }
      }
    );

    return { 
      success: true, 
      payoutId: response.data?.payout_id,
      data: response.data 
    };
  } catch (error) {
    console.error('Trackier payout tracking error:', error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || 'Payout tracking failed'
    };
  }
};

/**
 * Get publisher/affiliate statistics from Trackier
 */
const getPublisherStats = async (publisherId, dateRange = {}) => {
  if (!TRACKIER_API_KEY || !publisherId) {
    return { success: false, message: 'Missing Trackier configuration' };
  }

  try {
    const params = {
      publisher_id: publisherId,
      ...dateRange
    };

    const response = await axios.get(
      `${TRACKIER_API_URL}/api/v1/publishers/${publisherId}/stats`,
      {
        params: params,
        headers: {
          'Authorization': `Bearer ${TRACKIER_API_KEY}`,
          'X-API-Key': TRACKIER_API_KEY
        }
      }
    );

    return { success: true, data: response.data };
  } catch (error) {
    console.error('Trackier publisher stats error:', error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch publisher stats'
    };
  }
};

/**
 * Get offer statistics from Trackier
 */
const getOfferStats = async (trackierOfferId, dateRange = {}) => {
  if (!TRACKIER_API_KEY || !trackierOfferId) {
    return { success: false, message: 'Missing Trackier configuration' };
  }

  try {
    const params = {
      offer_id: trackierOfferId,
      ...dateRange
    };

    const response = await axios.get(
      `${TRACKIER_API_URL}/api/v1/offers/${trackierOfferId}/stats`,
      {
        params: params,
        headers: {
          'Authorization': `Bearer ${TRACKIER_API_KEY}`,
          'X-API-Key': TRACKIER_API_KEY
        }
      }
    );

    return { success: true, data: response.data };
  } catch (error) {
    console.error('Trackier offer stats error:', error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch offer stats'
    };
  }
};

/**
 * Legacy function for backward compatibility
 */
const trackOffer = async (trackierOfferId, userId, eventType = 'click', additionalData = {}) => {
  if (eventType === 'click') {
    return await trackClick(trackierOfferId, userId, additionalData);
  } else if (eventType === 'conversion') {
    // For conversions, we need a click ID - try to find it or generate one
    const clickId = additionalData.clickId || generateClickId();
    return await trackConversion(clickId, trackierOfferId, userId, additionalData);
  }
  return { success: false, message: 'Invalid event type' };
};

module.exports = {
  trackClick,
  trackConversion, // S2S Postback method (GET request)
  trackConversionLegacy, // Legacy POST API method
  trackPayout,
  getPublisherStats,
  getOfferStats,
  trackOffer, // Legacy function
  generateClickId
};
