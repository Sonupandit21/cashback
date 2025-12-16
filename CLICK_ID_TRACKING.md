# Click ID Tracking System - Complete Implementation Guide

## Overview

This document explains the complete Click ID tracking system implemented for the cashback website. The system tracks user clicks, generates unique Click IDs, and processes postbacks to add cashback to user wallets.

## What is Click ID?

Click ID is a unique identifier generated for each user click on an offer. It's used to:
- Track which user clicked on which offer
- Link postbacks from networks (Trackier, etc.) back to the original user
- Add cashback to the correct user's wallet when a conversion occurs

**Format**: `CLID-{random_string}` (e.g., `CLID-kd82jlp9s`, `CLID-8273GH`, `CLID-9fh73g2`)

## System Architecture

### 1. Click ID Generation

**Location**: `server/utils/trackier.js`

```javascript
const generateClickId = () => {
  const randomString = crypto.randomBytes(6).toString('base64')
    .replace(/[+/=]/g, '')
    .substring(0, 9)
    .toUpperCase();
  return `CLID-${randomString}`;
};
```

**Features**:
- Generates unique 9-character alphanumeric string
- Prefixes with "CLID-" for easy identification
- Uses cryptographically secure random generation

### 2. Click Tracking Flow

#### Step 1: User Clicks Offer

When a user clicks on an offer:

1. **Frontend** (`frontend/client/src/pages/Offers.js`):
   - Calls `/api/offers/:id/track` endpoint
   - Tracks the click in the database

2. **Backend** (`server/routes/offers.js`):
   - Generates Click ID using `generateClickId()`
   - Stores click in MongoDB `clicks` collection
   - Returns Click ID to frontend

#### Step 2: Generate Click ID for Offer URL

**Endpoint**: `GET /api/offers/:id/generate-click`

**Authentication**: Required (user must be logged in)

**Response**:
```json
{
  "success": true,
  "message": "Click ID generated successfully",
  "clickId": "CLID-8273GH",
  "offerUrl": "https://example.com/offer?click_id=CLID-8273GH&sub1=CLID-8273GH&p1=CLID-8273GH"
}
```

**Features**:
- Generates unique Click ID
- Appends Click ID to offer URL with multiple parameter names:
  - `click_id` (standard)
  - `sub1` (Trackier/Impact standard)
  - `p1` (alternative parameter)
- Stores click record in database

#### Step 3: User Submits UPI ID

When user submits UPI ID to claim offer:

1. **Frontend** (`frontend/client/src/pages/OfferDetail.js`):
   - Gets stored Click ID from localStorage
   - If no Click ID, calls `/api/offers/:id/generate-click`
   - Sends Click ID along with UPI ID to `/api/offers/:id/claim`

2. **Backend** (`server/routes/offers.js`):
   - Receives Click ID and UPI ID
   - Creates claim record
   - Sends postback to Trackier (if configured)
   - Adds cashback to user wallet immediately

#### Step 4: Redirect to Offer with Click ID

The offer URL is modified to include Click ID:
```
Original: https://paytm.com/install
With Click ID: https://paytm.com/install?click_id=CLID-9fh73g2&sub1=CLID-9fh73g2&p1=CLID-9fh73g2
```

### 3. Landing Page Click ID Capture

**Endpoint**: `GET /api/offers/landing`

**Purpose**: Capture Click ID from URL when user lands on your site from an external source

**URL Parameters**:
- `click_id` or `clickid` or `sub1` or `p1` - The Click ID
- `offer_id` or `offerid` - Optional offer ID

**Example**:
```
https://yoursite.com/api/offers/landing?click_id=CLID-8273GH&offer_id=60abc123
```

**Response**:
```json
{
  "success": true,
  "message": "Click ID captured successfully",
  "clickId": "CLID-8273GH",
  "offerId": "60abc123"
}
```

**Features**:
- Captures Click ID from multiple parameter names
- Creates click record in database if offer ID provided
- Stores Click ID for later use

### 4. Frontend Click ID Capture

**Location**: `frontend/client/src/utils/trackier.js`

**Functions**:

#### `captureClickId()`
Captures Click ID from URL parameters and stores in localStorage:
```javascript
const clickId = captureClickId();
// Checks for: click_id, clickid, sub1, p1
// Stores in: localStorage['click_id']
```

#### `getStoredClickId()`
Retrieves stored Click ID from localStorage:
```javascript
const clickId = getStoredClickId();
```

#### `autoCaptureClickId()`
Auto-captures Click ID on page load (only if not already stored):
```javascript
// Called automatically in App.js
useEffect(() => {
  captureClickId();
}, []);
```

### 5. Postback Processing

**Endpoint**: `POST /api/postback` or `GET /api/postback`

**Purpose**: Receive postbacks from networks (Trackier, etc.) when conversions occur

**Request Parameters**:
- `click_id` or `clickid` - The Click ID from original click
- `payout` - Cashback amount
- `status` - 1 = approved, 0 = rejected
- `conversion_id` - Optional conversion ID
- `offer_id` - Optional offer ID

**Example Postback**:
```
POST https://yoursite.com/api/postback
{
  "click_id": "CLID-9fh73g2",
  "payout": 25,
  "status": 1
}
```

**Processing Flow**:

1. **Receive Postback**:
   - Accepts both GET and POST requests
   - Extracts Click ID from parameters

2. **Find Click Record**:
   - Searches `clicks` collection for matching Click ID
   - Retrieves user ID and offer ID

3. **Create Postback Record**:
   - Saves postback to `postbacks` collection
   - Stores all raw data for audit trail

4. **Update Click Record**:
   - Marks click as converted
   - Updates conversion value and timestamp

5. **Add Cashback to Wallet**:
   - If status = 1 (approved) and payout > 0:
     - Finds user by user ID
     - Adds payout amount to `user.wallet`
     - Adds payout amount to `user.totalCashback`
     - Saves user record

**Response**:
```json
{
  "success": true,
  "message": "Postback received and processed successfully",
  "postbackId": "60abc123",
  "clickId": "CLID-9fh73g2",
  "processingTime": "45ms"
}
```

**Important**: Always returns HTTP 200 to prevent network retries, even on errors.

## Database Models

### Click Model (`server/models/Click.js`)

```javascript
{
  userId: ObjectId,        // User who clicked
  offerId: ObjectId,       // Offer clicked
  trackierOfferId: String, // Optional Trackier offer ID
  clickId: String,         // Unique Click ID (CLID-xxx)
  ipAddress: String,       // User IP
  userAgent: String,       // User agent
  referrer: String,        // Referrer URL
  converted: Boolean,      // Whether conversion occurred
  conversionValue: Number, // Cashback amount
  createdAt: Date,         // Click timestamp
  convertedAt: Date        // Conversion timestamp
}
```

### Postback Model (`server/models/Postback.js`)

```javascript
{
  clickId: String,          // Click ID from postback
  conversionId: String,    // Optional conversion ID
  offerId: ObjectId,       // Offer ID
  userId: ObjectId,        // User ID
  payout: Number,          // Cashback amount
  status: Number,          // 1 = approved, 0 = rejected
  conversionType: String,  // install, sale, signup, etc.
  rawData: Object,         // Complete postback data
  source: String,          // 'incoming' or 'outgoing'
  createdAt: Date          // Postback timestamp
}
```

## Complete Workflow Example

### Scenario: User Claims Paytm Offer

1. **User Clicks Offer**:
   ```
   User → Clicks "Paytm Offer" → /api/offers/:id/track
   → Click ID Generated: CLID-9fh73g2
   → Stored in database
   ```

2. **User Views Offer Detail**:
   ```
   User → /offers/:id
   → Click tracked (if not already)
   → Click ID stored in localStorage
   ```

3. **User Submits UPI ID**:
   ```
   User → Enters UPI ID → Submits
   → Frontend gets Click ID from localStorage
   → Sends to /api/offers/:id/claim
   → Backend processes claim
   → Cashback added to wallet immediately
   ```

4. **Redirect to Offer**:
   ```
   User → Redirected to: https://paytm.com/install?click_id=CLID-9fh73g2&sub1=CLID-9fh73g2
   → Paytm/Network stores Click ID
   ```

5. **User Completes Offer**:
   ```
   User → Installs/Completes Paytm offer
   → Network detects conversion
   ```

6. **Postback Received**:
   ```
   Network → POST /api/postback
   {
     "click_id": "CLID-9fh73g2",
     "payout": 25,
     "status": 1
   }
   → Backend finds user by Click ID
   → Adds ₹25 to user wallet
   → Updates click record
   ```

## Simple Diagram Understanding

```
User → Click → Your Website → Generate Click ID
            ↓
Redirect to Offer → Save Click ID in Network
            ↓
Offer Completed
            ↓
Network Fires Postback → Send Click ID back
            ↓
Your DB → Find User → Add Cashback
```

**Step-by-Step Flow:**

1. **User Clicks** → User clicks on an offer in your website
2. **Your Website** → System generates unique Click ID (e.g., `CLID-9fh73g2`)
3. **Redirect to Offer** → User is redirected to offer URL with Click ID appended
4. **Network Saves** → Merchant/Network (Paytm, Amazon, etc.) stores the Click ID
5. **Offer Completed** → User completes the offer (install, purchase, signup)
6. **Network Fires Postback** → Network sends postback with Click ID back to your server
7. **Your DB Finds User** → System searches database for user by Click ID
8. **Add Cashback** → Cashback amount is added to user's wallet

## Example Real-Life Working

### Scenario: User Clicks Paytm Offer

**Step 1: User Clicks Offer**
```
User clicks "Paytm Offer" on your website
→ System generates Click ID: CLID-9fh73g2
```

**Step 2: Offer URL with Click ID**
```
Original URL: https://paytm.com/install
Modified URL: https://paytm.com/install?sub1=CLID-9fh73g2
```

**Step 3: Network Stores Click ID**
```
Paytm / Network receives the URL with Click ID
→ Network stores: click_id = CLID-9fh73g2
→ Links it to user's session
```

**Step 4: User Completes Offer**
```
User installs Paytm app
→ Completes registration
→ Makes first transaction
→ Network detects conversion
```

**Step 5: Postback Received**
```
Network sends postback to your server:
POST https://yourwebsite.com/api/postback
{
  "click_id": "CLID-9fh73g2",
  "payout": 25,
  "status": 1
}
```

**Step 6: Cashback Added to Wallet**
```
Your backend:
1. Receives postback with click_id = CLID-9fh73g2
2. Searches database for Click ID
3. Finds user who clicked
4. Adds ₹25 to user.wallet
5. Adds ₹25 to user.totalCashback
6. Updates click record as converted
```

**Result:**
- User receives ₹25 cashback in their wallet
- Click record shows as converted
- Postback record saved for audit trail
- User can withdraw the cashback

## API Endpoints Summary

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/offers/:id/track` | POST | Yes | Track offer click |
| `/api/offers/:id/generate-click` | GET | Yes | Generate Click ID and get offer URL |
| `/api/offers/landing` | GET | No | Capture Click ID from URL |
| `/api/offers/save-clickid` | POST | No | Save Click ID to backend |
| `/api/offers/:id/claim` | POST | Yes | Claim offer with UPI ID |
| `/api/postback` | GET/POST | No | Receive postbacks from networks |

## Frontend Utilities

### Import
```javascript
import { 
  captureClickId, 
  getStoredClickId, 
  clearStoredClickId,
  sendClickIdToBackend 
} from './utils/trackier';
```

### Usage Examples

**Capture Click ID on page load**:
```javascript
useEffect(() => {
  captureClickId(); // Auto-captures from URL
}, []);
```

**Get stored Click ID**:
```javascript
const clickId = getStoredClickId();
if (clickId) {
  // Use Click ID
}
```

**Send Click ID to backend**:
```javascript
await sendClickIdToBackend(clickId, offerId);
```

## Trackier Integration

### Click URL Format

If using Trackier, the Click ID is appended to the tracking URL:

```
https://trackier.com/click?pid=123&sub1=CLID-8273GH
```

### Postback URL Format

Configure Trackier to send postbacks to:

```
https://yoursite.com/api/postback?click_id={sub1}&payout={payout}&status={status}
```

Where:
- `{sub1}` = The Click ID you sent (CLID-xxx)
- `{payout}` = Commission amount
- `{status}` = 1 (approved) or 0 (rejected)

## Testing

### Test Click ID Generation

```bash
# Generate Click ID for an offer (requires auth token)
curl -X GET "http://localhost:5000/api/offers/60abc123/generate-click" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Landing Page Capture

```bash
# Capture Click ID from URL
curl "http://localhost:5000/api/offers/landing?click_id=CLID-TEST123&offer_id=60abc123"
```

### Test Postback

```bash
# Send test postback
curl -X POST "http://localhost:5000/api/postback" \
  -H "Content-Type: application/json" \
  -d '{
    "click_id": "CLID-TEST123",
    "payout": 25,
    "status": 1
  }'
```

## Best Practices

1. **Always Generate Click ID**: Even if Trackier is not configured, generate Click ID for local tracking
2. **Store in Multiple Places**: Store Click ID in localStorage and database for redundancy
3. **Append to Multiple Parameters**: Use `click_id`, `sub1`, and `p1` for maximum compatibility
4. **Handle Errors Gracefully**: Don't fail user actions if Click ID generation fails
5. **Log Everything**: Log all Click ID operations for debugging
6. **Idempotent Postbacks**: Handle duplicate postbacks gracefully (already implemented)
7. **Always Return 200**: Postback endpoint should always return 200 to prevent retries

## Troubleshooting

### Click ID Not Generated

**Check**:
- User is logged in (auth required)
- Offer exists and is active
- Database connection is working

### Postback Not Adding Cashback

**Check**:
- Click ID matches in database
- Postback status is 1 (approved)
- Payout amount > 0
- User ID is found in click record

### Click ID Not Captured from URL

**Check**:
- URL contains `click_id`, `sub1`, or `p1` parameter
- `captureClickId()` is called on page load
- localStorage is enabled in browser

## Security Considerations

1. **Validate Click IDs**: Ensure Click IDs match expected format
2. **Rate Limiting**: Implement rate limiting on postback endpoint
3. **IP Validation**: Optionally validate postback source IP
4. **Idempotency**: Prevent duplicate cashback additions
5. **Audit Trail**: All postbacks are logged with raw data

## Support

For issues or questions:
- Check server logs for Click ID operations
- Verify database records in `clicks` and `postbacks` collections
- Test endpoints using curl or Postman
- Review this documentation for workflow understanding


