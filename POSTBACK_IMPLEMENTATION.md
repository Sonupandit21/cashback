# Postback Implementation Guide

## What is a Postback?

A **postback** is a server-to-server (S2S) request sent automatically when an event occurs. It's essentially:

> **"When X happens, send data to URL Y."**

The receiving URL is called the **postback URL**.

---

## How Postbacks Work

### 1. Event Happens
A user completes an action (e.g., claims an offer, completes a purchase, installs an app).

### 2. Server Detects the Event
The system handling the event prepares data like:
- `click_id` - Unique identifier for the click
- `payout` - Amount to be paid
- `status` - Approval status (1 = approved, 0 = rejected)
- `conversion_id` - Unique conversion identifier
- `timestamp` - When the event occurred

### 3. Server Sends Request to Postback URL
Usually an HTTP GET or POST request.

**Example GET Request:**
```
GET https://yourdomain.com/api/postback?click_id=123&payout=10&status=1
```

**Example POST Request:**
```json
POST https://yourdomain.com/api/postback
Content-Type: application/json

{
  "click_id": "123",
  "payout": "10",
  "status": "1",
  "offer_id": "456"
}
```

### 4. Receiving Server Processes Data
Our server:
- Validates the postback data
- Stores it in the database
- Updates related records (clicks, conversions)
- Triggers any automation workflows

### 5. (Optional) Sending Server Retries if No Response
Most postback systems retry if the endpoint fails or doesn't return 200 OK.

---

## Our Implementation

### Endpoint: `/api/postback`

**Supported Methods:**
- `GET /api/postback` - Query parameters in URL
- `POST /api/postback` - JSON body or form data

**Location:** `server/routes/postback.js`

### Features Implemented

#### ✅ 1. Idempotency
Handles duplicate postbacks gracefully. If the same postback is received twice, it:
- Detects the duplicate
- Returns success without reprocessing
- Prevents duplicate records in database

```javascript
// Check for duplicate postback
const existingPostback = await Postback.findOne({ 
  clickId: clickId,
  conversionId: conversionId,
  source: 'incoming'
});

if (existingPostback) {
  return res.status(200).json({ 
    success: true,
    message: 'Postback already processed (duplicate)',
    duplicate: true
  });
}
```

#### ✅ 2. Error Handling
Always returns `200 OK` to prevent retries, even on errors:
- Prevents infinite retry loops
- Logs errors for manual review
- Accepts postback even if processing fails

```javascript
catch (error) {
  // Still return 200 to prevent retries
  res.status(200).json({ 
    success: false,
    message: error.message,
    error: 'Postback received but processing failed'
  });
}
```

#### ✅ 3. Comprehensive Logging
Logs all postback activity for debugging:
- Incoming requests
- Processing steps
- Success/failure status
- Processing time

```javascript
console.log('📥 Postback received:', {
  method: req.method,
  query: req.query,
  body: req.body,
  timestamp: new Date().toISOString()
});
```

#### ✅ 4. Data Validation
Validates required parameters:
- `click_id` is required
- `payout` is validated as a number
- `status` is validated (0 or 1)
- Invalid values are logged and handled gracefully

#### ✅ 5. Raw Data Storage
Stores complete raw postback data for audit trail:
- All parameters received
- Request headers
- Timestamp
- Request method

```javascript
rawData: {
  ...params,
  received_at: new Date().toISOString(),
  request_method: req.method,
  request_headers: { ... }
}
```

#### ✅ 6. Automatic Record Linking
Automatically links postbacks to:
- Click records (if clickId matches)
- Offer records (if offerId matches)
- User records (if userId matches)

---

## Postback Flow in Our System

### Complete Flow Diagram

```
1. User clicks Trackier link
   ↓
   Trackier generates click_id
   ↓
   User lands: https://yourdomain.com/?p1=CLICK123
   ↓
   Frontend captures click_id → localStorage

2. User claims offer
   ↓
   POST /api/offers/:id/claim
   Body: { upiId, clickid: "CLICK123" }
   ↓
   Backend:
   - Saves click record
   - Sends postback to Trackier (outgoing)
   - Saves outgoing postback record
   - Updates user wallet

3. Trackier receives postback
   ↓
   Trackier processes conversion
   ↓
   Shows in Trackier dashboard

4. Trackier sends postback back (optional)
   ↓
   POST /api/postback
   Body: { click_id, payout, status, conversion_id }
   ↓
   Our Server:
   - Validates postback
   - Checks for duplicates (idempotency)
   - Saves incoming postback record
   - Updates click record
   - Returns 200 OK

5. Admin views statistics
   ↓
   GET /api/admin/trackier/stats
   ↓
   Admin Dashboard displays:
   - Clicks, Installs, Payouts
   - Conversion rates
   - Detailed records
```

---

## Postback Parameters

### Required Parameters
- `click_id` or `clickid` - The click identifier (required)

### Optional Parameters
- `conversion_id` or `conversionid` - Conversion identifier
- `payout` - Payout amount (default: 0)
- `status` - Status: 1 = approved, 0 = rejected (default: 1)
- `offer_id` or `offerid` - Trackier offer ID
- `publisher_id` or `publisherid` - Publisher/Affiliate ID
- `advertiser_id` or `advertiserid` - Advertiser ID
- `conversion_type` or `conversiontype` - Type: install, sale, signup (default: install)
- `ip` or `ip_address` - IP address
- `user_agent` or `useragent` - User agent string
- `referrer` - Referrer URL

### Parameter Name Variations
Our implementation supports multiple parameter name formats:
- `click_id` or `clickid`
- `conversion_id` or `conversionid`
- `offer_id` or `offerid`
- etc.

This makes it compatible with different postback formats.

---

## Testing Postbacks

### Test 1: GET Request
```bash
curl "http://localhost:5000/api/postback?click_id=TEST123&payout=10&status=1"
```

### Test 2: POST Request (JSON)
```bash
curl -X POST http://localhost:5000/api/postback \
  -H "Content-Type: application/json" \
  -d '{
    "click_id": "TEST123",
    "payout": "10",
    "status": "1",
    "offer_id": "12345"
  }'
```

### Test 3: POST Request (Form Data)
```bash
curl -X POST http://localhost:5000/api/postback \
  -d "click_id=TEST123&payout=10&status=1"
```

### Test 4: Health Check
```bash
curl http://localhost:5000/api/postback/health
```

---

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Postback received and processed successfully",
  "postbackId": "507f1f77bcf86cd799439011",
  "clickId": "CLICK123",
  "processingTime": "45ms"
}
```

### Duplicate Response
```json
{
  "success": true,
  "message": "Postback already processed (duplicate)",
  "postbackId": "507f1f77bcf86cd799439011",
  "duplicate": true
}
```

### Error Response (Still 200 OK)
```json
{
  "success": false,
  "message": "Click ID is required",
  "received_params": ["payout", "status"]
}
```

---

## Best Practices

### ✅ Always Return 200 OK
Even on errors, return 200 OK to prevent retries:
```javascript
res.status(200).json({ success: false, message: error.message });
```

### ✅ Implement Idempotency
Handle duplicate postbacks gracefully:
```javascript
const existing = await Postback.findOne({ clickId, conversionId });
if (existing) return res.status(200).json({ success: true, duplicate: true });
```

### ✅ Log Everything
Log all postback activity for debugging:
```javascript
console.log('📥 Postback received:', { method, params, timestamp });
```

### ✅ Store Raw Data
Store complete raw data for audit trail:
```javascript
rawData: { ...params, received_at: new Date().toISOString() }
```

### ✅ Validate Input
Validate all parameters before processing:
```javascript
if (!clickId) {
  return res.status(200).json({ success: false, message: 'Click ID required' });
}
```

### ✅ Handle Errors Gracefully
Catch and log errors without failing the request:
```javascript
try {
  await processPostback();
} catch (error) {
  console.error('Error:', error);
  // Still return 200 OK
}
```

---

## Monitoring

### Health Check Endpoint
```
GET /api/postback/health
```

Returns:
```json
{
  "status": "healthy",
  "service": "postback",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600
}
```

### Log Monitoring
Check server logs for:
- `📥 Postback received` - Incoming postback
- `✅ Postback processed successfully` - Success
- `⚠️ Postback rejected` - Validation failure
- `❌ Error processing postback` - Processing error
- `✅ Duplicate postback detected` - Idempotency

---

## Database Schema

### Postback Model
```javascript
{
  clickId: String (required, indexed),
  conversionId: String (indexed),
  offerId: ObjectId (ref: Offer, indexed),
  trackierOfferId: String (indexed),
  userId: ObjectId (ref: User, indexed),
  publisherId: String (indexed),
  advertiserId: String,
  payout: Number (default: 0),
  status: Number (1 = approved, 0 = rejected, indexed),
  conversionType: String (default: 'install'),
  ipAddress: String,
  userAgent: String,
  referrer: String,
  rawData: Mixed (complete raw data),
  source: String ('incoming' | 'outgoing'),
  createdAt: Date (indexed)
}
```

---

## Troubleshooting

### Issue: Postbacks Not Received
1. Check postback URL in Trackier settings
2. Verify server is accessible (not behind firewall)
3. Check server logs for incoming requests
4. Test endpoint manually with curl

### Issue: Duplicate Postbacks
- This is normal - our system handles duplicates idempotently
- Check logs for "duplicate postback detected" messages
- Verify idempotency is working correctly

### Issue: Postbacks Not Processing
1. Check server logs for errors
2. Verify database connection
3. Check parameter validation
4. Verify click records exist

### Issue: Missing Data
1. Check rawData field in database
2. Verify all parameters are being sent
3. Check parameter name variations
4. Review logs for received parameters

---

## Security Considerations

### 1. Validate All Input
Always validate postback parameters before processing.

### 2. Rate Limiting
Consider adding rate limiting to prevent abuse:
```javascript
const rateLimit = require('express-rate-limit');
const postbackLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100 // 100 requests per minute
});
router.post('/', postbackLimiter, async (req, res) => { ... });
```

### 3. IP Whitelisting (Optional)
If Trackier provides static IPs, whitelist them:
```javascript
const allowedIPs = ['1.2.3.4', '5.6.7.8'];
const clientIP = req.ip || req.headers['x-forwarded-for'];
if (!allowedIPs.includes(clientIP)) {
  return res.status(403).json({ error: 'Forbidden' });
}
```

### 4. Signature Verification (Optional)
If Trackier provides webhook signatures, verify them:
```javascript
const crypto = require('crypto');
const signature = req.headers['x-trackier-signature'];
const expectedSignature = crypto
  .createHmac('sha256', SECRET)
  .update(JSON.stringify(req.body))
  .digest('hex');
if (signature !== expectedSignature) {
  return res.status(401).json({ error: 'Invalid signature' });
}
```

---

## Summary

Our postback implementation:
- ✅ Handles GET and POST requests
- ✅ Supports multiple parameter name formats
- ✅ Implements idempotency (handles duplicates)
- ✅ Always returns 200 OK (prevents retries)
- ✅ Comprehensive logging
- ✅ Data validation
- ✅ Raw data storage for audit trail
- ✅ Automatic record linking
- ✅ Health check endpoint
- ✅ Error handling

**Key Principle:** Always return 200 OK to prevent retries, even on errors. Log everything for debugging.

---

**Last Updated:** 2024
**Version:** 2.0












