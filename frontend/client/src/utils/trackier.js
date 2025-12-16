import axios from 'axios';

/**
 * Click ID Tracking Utility
 * Handles Click ID capture from URL parameters and storage
 * Supports multiple parameter names: click_id, clickid, sub1, p1
 */

/**
 * Capture Click ID from URL parameters
 * Supports multiple parameter names:
 * - click_id (standard)
 * - clickid (alternative)
 * - sub1 (Trackier/Impact standard)
 * - p1 (alternative parameter)
 * 
 * Example URLs:
 * - /offer?click_id=CLID-8273GH
 * - /offer?sub1=CLID-8293KD
 * - /offer?p1=CLID-9fh73g2
 */
export const captureClickId = () => {
  try {
    const params = new URLSearchParams(window.location.search);
    
    // Try multiple parameter names (priority order)
    const clickId = params.get('click_id') || 
                    params.get('clickid') || 
                    params.get('sub1') || 
                    params.get('p1');
    
    if (clickId) {
      // Store in localStorage with multiple keys for compatibility
      localStorage.setItem('click_id', clickId);
      localStorage.setItem('trackier_clickid', clickId); // Legacy support
      localStorage.setItem('clickId', clickId); // Alternative key
      
      console.log('✅ Click ID captured from URL:', clickId);
      
      // Optionally send to backend for server-side tracking
      sendClickIdToBackend(clickId).catch(err => {
        console.warn('Failed to send Click ID to backend:', err);
      });
      
      return clickId;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error capturing Click ID:', error);
    return null;
  }
};

/**
 * Capture Click ID on page load (auto-capture)
 * Call this in your main App component or landing page
 */
export const autoCaptureClickId = () => {
  // Only capture if not already stored (to avoid overwriting)
  const existingClickId = getStoredClickId();
  if (!existingClickId) {
    return captureClickId();
  }
  return existingClickId;
};

/**
 * Get stored Click ID from localStorage
 * Checks multiple keys for compatibility
 */
export const getStoredClickId = () => {
  try {
    return localStorage.getItem('click_id') || 
           localStorage.getItem('trackier_clickid') || 
           localStorage.getItem('clickId');
  } catch (error) {
    console.error('❌ Error getting stored Click ID:', error);
    return null;
  }
};

/**
 * Clear stored Click ID (after conversion is sent)
 * Removes from all storage keys
 */
export const clearStoredClickId = () => {
  try {
    localStorage.removeItem('click_id');
    localStorage.removeItem('trackier_clickid');
    localStorage.removeItem('clickId');
    console.log('✅ Click ID cleared from storage');
  } catch (error) {
    console.error('❌ Error clearing Click ID:', error);
  }
};

/**
 * Send Click ID to backend (optional - for server-side tracking)
 * Also supports landing page endpoint
 */
export const sendClickIdToBackend = async (clickId, offerId = null) => {
  try {
    // Try landing page endpoint first (more comprehensive)
    if (offerId) {
      const response = await axios.get('/api/offers/landing', {
        params: {
          click_id: clickId,
          offer_id: offerId
        }
      });
      return response.data;
    }
    
    // Fallback to save-clickid endpoint
    const response = await axios.post('/api/offers/save-clickid', { 
      clickid: clickId,
      click_id: clickId,
      sub1: clickId,
      p1: clickId
    });
    return response.data;
  } catch (error) {
    console.error('❌ Error sending Click ID to backend:', error);
    return null;
  }
};

