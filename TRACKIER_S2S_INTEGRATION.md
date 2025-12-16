# Trackier S2S Postback Integration Guide

This document explains the complete Trackier Server-to-Server (S2S) postback integration for the cashback website.

## Overview

This integration follows the Trackier S2S postback flow where:
1. Users click a Trackier tracking link (with `p1=clickid` parameter)
2. The clickid is captured from the URL and stored in localStorage
3. When a user completes a cashback action, a postback is sent to Trackier via GET request

## Setup Instructions

### 1. Create Project in Trackier (Advertiser Project)

1. Login to Trackier dashboard
2. Go to **Advertisers → Add New Advertiser**
3. Fill details:
   - **Advertiser Name**: Cashback Website
   - **Domain**: your cashback website domain
   - **Postback / API allowed**: YES
4. Save

### 2. Add Campaign for Cashback Tracking

1. Go to **Campaigns → Add Campaign**
2. Fill details:
   - **Campaign Name**: Cashback Offer
   - **Advertiser**: your created advertiser
   - **Tracking Type**: Server-to-server (Recommended)
   - **Goal / Conversion Type**: Cashback / Signup / Sale (choose)
   - **Payout**: Example: ₹10 per signup OR % cashback
3. Save Campaign

### 3. Generate Tracking Link

After saving the campaign:
1. Go to **Campaign → Click Tracking**
2. Your link will look like:
   ```
   https://brandshapers.gotrackier.com/click?campaign_id=4815&pub_id=2&p1={clickid}
   ```
3. Keep this link safe — you will redirect users from your MERN website using this link

### 4. Environment Variables

Add to your `.env` file:

```env
# Trackier Configuration
TRACKIER_POSTBACK_URL=https://brandshapers.gotrackier.com/postback
TRACKIER_API_URL=https://brandshapers.gotrackier.com
TRACKIER_API_KEY=your-api-key-here (optional, for API-based tracking)
TRACKIER_PUBLISHER_ID=your-publisher-id (optional)
TRACKIER_ADVERTISER_ID=your-advertiser-id (optional)
```

**Note**: For S2S postback, you only need `TRACKIER_POSTBACK_URL`. Other variables are optional and used for API-based tracking.

## How It Works

### Complete Flow

```
1️⃣ User clicks Trackier link
   Trackier → Your Cashback Website
   URL contains: ?p1=ABCD1234CLICKID

2️⃣ Frontend captures clickid
   - App.js captures p1 parameter on page load
   - Stores in localStorage as 'trackier_clickid'

3️⃣ User browses and claims offer
   - User enters UPI ID and submits
   - Frontend sends clickid to backend with claim request

4️⃣ Backend sends S2S postback to Trackier
   GET: https://brandshapers.gotrackier.com/postback?click_id=XXXX&payout=10&status=1

5️⃣ Trackier shows conversion in dashboard
   Campaign → Conversions tab
```

## Code Implementation

### Backend (Node.js)

#### 1. Trackier Utility (`server/utils/trackier.js`)

The `trackConversion()` function sends S2S postback:

```javascript
const trackConversion = async (clickId, payout, status = 1) => {
  const postbackUrl = `${TRACKIER_POSTBACK_URL}?click_id=${clickId}&payout=${payout}&status=${status}`;
  const response = await axios.get(postbackUrl);
  return { success: true, data: response.data };
};
```

#### 2. Save ClickID Endpoint (`server/routes/offers.js`)

```javascript
// POST /api/offers/save-clickid
router.post('/save-clickid', async (req, res) => {
  const { clickid } = req.body;
  // Store clickid (frontend handles localStorage)
  res.json({ success: true, clickid });
});
```

#### 3. Cashback Confirmation (`server/routes/offers.js`)

When user claims offer:

```javascript
// POST /api/offers/:id/claim
router.post('/:id/claim', auth, async (req, res) => {
  const { upiId, clickid } = req.body;
  
  // ... validation and offer processing ...
  
  // Send postback to Trackier
  if (clickid) {
    const payout = offer.cashbackAmount || 10;
    await trackConversion(clickid, payout, 1);
  }
  
  // ... rest of the code ...
});
```

### Frontend (React)

#### 1. Trackier Utility (`frontend/client/src/utils/trackier.js`)

```javascript
// Capture clickid from URL
export const captureClickId = () => {
  const params = new URLSearchParams(window.location.search);
  const clickid = params.get('p1');
  if (clickid) {
    localStorage.setItem('trackier_clickid', clickid);
    return clickid;
  }
  return null;
};

// Get stored clickid
export const getStoredClickId = () => {
  return localStorage.getItem('trackier_clickid');
};
```

#### 2. App.js - Capture on Load

```javascript
import { captureClickId } from './utils/trackier';

function App() {
  useEffect(() => {
    captureClickId(); // Capture clickid from URL on app load
  }, []);
  // ... rest of the code ...
}
```

#### 3. OfferDetail.js - Send ClickID

```javascript
import { getStoredClickId } from '../utils/trackier';

const handleSubmit = async (e) => {
  const clickid = getStoredClickId();
  
  await axios.post(`/api/offers/${id}/claim`, { 
    upiId: upiId.trim(),
    clickid: clickid // Send to backend
  });
};
```

## Postback URL Format

The postback is sent as a GET request:

```
https://brandshapers.gotrackier.com/postback?click_id={clickid}&payout={payout}&status={status}
```

**Parameters:**
- `click_id`: The click ID from Trackier (from `p1` parameter)
- `payout`: Cashback amount (e.g., 10 for ₹10)
- `status`: 1 for approved, 0 for rejected

## Testing

### 1. Test ClickID Capture

1. Visit your website with Trackier link:
   ```
   http://localhost:3000/?p1=TEST123
   ```
2. Check browser console - should see: "Trackier clickid captured: TEST123"
3. Check localStorage: `localStorage.getItem('trackier_clickid')` should return "TEST123"

### 2. Test Postback

1. Claim an offer with a stored clickid
2. Check server logs - should see: "Trackier postback sent successfully"
3. Check Trackier dashboard - conversion should appear in Conversions tab

### 3. Test Complete Flow

1. Use Trackier tracking link to visit your site
2. Browse offers
3. Claim an offer (enter UPI ID)
4. Verify conversion appears in Trackier dashboard

## Troubleshooting

### ClickID Not Captured

- Check URL has `?p1=clickid` parameter
- Check browser console for errors
- Verify `captureClickId()` is called in App.js

### Postback Not Sent

- Verify `clickid` is sent in claim request
- Check server logs for postback errors
- Verify `TRACKIER_POSTBACK_URL` is set correctly
- Check Trackier dashboard for postback URL format

### Conversion Not Showing in Trackier

- Verify postback URL is correct
- Check click_id matches the one from tracking link
- Verify payout and status parameters
- Check Trackier campaign settings (postback allowed)

## Database Model

The `Click` model stores click tracking data:

```javascript
{
  userId: ObjectId,
  offerId: ObjectId,
  trackierOfferId: String,
  clickId: String (unique),
  ipAddress: String,
  userAgent: String,
  referrer: String,
  converted: Boolean,
  conversionValue: Number,
  convertedAt: Date
}
```

## API Endpoints

### POST `/api/offers/save-clickid`
Save clickid from URL parameter (optional endpoint)

**Request:**
```json
{
  "clickid": "ABCD1234CLICKID"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Click ID received",
  "clickid": "ABCD1234CLICKID"
}
```

### POST `/api/offers/:id/claim`
Claim offer and send Trackier postback

**Request:**
```json
{
  "upiId": "user@paytm",
  "clickid": "ABCD1234CLICKID"
}
```

**Response:**
```json
{
  "message": "Offer claimed successfully",
  "offer": { ... }
}
```

## Notes

- ClickID is stored in localStorage and persists across page navigations
- Postback is sent automatically when user claims an offer
- If no clickid is found, the offer claim still works (postback is skipped)
- Multiple offers can use the same clickid (one clickid per user session)

## Support

For issues or questions:
- Check Trackier dashboard for postback logs
- Review server logs for postback errors
- Verify environment variables are set correctly
- Test with Trackier's test postback URL if available

