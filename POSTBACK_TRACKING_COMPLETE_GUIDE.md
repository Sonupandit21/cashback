# 📡 Complete Postback URL Tracking Guide - Node.js Implementation

## Table of Contents
1. [What is Postback Tracking?](#what-is-postback-tracking)
2. [Node.js Postback Implementation](#nodejs-postback-implementation)
3. [CPALead Postback Integration](#cpalead-postback-integration)
4. [CPABuild Postback Integration](#cpabuild-postback-integration)
5. [Offer & Campaign Postback Tracking](#offer--campaign-postback-tracking)
6. [Postback API Endpoints](#postback-api-endpoints)
7. [Offerwall Postback Implementation](#offerwall-postback-implementation)
8. [Payment Results Postback](#payment-results-postback)
9. [Testing Postbacks](#testing-postbacks)
10. [ASP.NET Postback (Reference)](#aspnet-postback-reference)

---

## What is Postback Tracking?

**Postback** is a server-to-server (S2S) callback mechanism where one server automatically sends data to another server when a specific event occurs.

### How It Works:
```
1. User completes action (install, purchase, signup)
   ↓
2. Advertiser/Network detects event
   ↓
3. Advertiser sends HTTP request to your postback URL
   ↓
4. Your server receives and processes the data
   ↓
5. Your server updates database, credits user, etc.
```

### Common Use Cases:
- **Offer Completion**: User completes an offer → Postback confirms → Credit user wallet
- **App Install**: User installs app → Postback confirms → Credit user
- **Purchase**: User makes purchase → Postback confirms → Credit commission
- **Payment Results**: Payment gateway confirms payment → Postback updates status

---

## Node.js Postback Implementation

### Current Implementation Location
- **File**: `server/routes/postback.js`
- **Endpoint**: `POST /api/postback` and `GET /api/postback`

### Features Implemented:

#### ✅ 1. Dual Method Support (GET & POST)
```javascript
// Supports both GET and POST requests
router.post('/', async (req, res) => { /* ... */ });
router.get('/', async (req, res) => { /* ... */ });
```

#### ✅ 2. Multiple Parameter Name Formats
Handles various parameter naming conventions:
- `click_id` or `clickid`
- `conversion_id` or `conversionid`
- `offer_id` or `offerid`
- `publisher_id` or `publisherid`

#### ✅ 3. Idempotency (Duplicate Prevention)
Prevents duplicate processing:
```javascript
// Check for existing approved payout
const existingPostback = await Postback.findOne({ 
  clickId: normalizedClickId,
  status: 1 
});
```

#### ✅ 4. Click Record Matching
Multiple methods to find click records:
- Exact match
- Case-insensitive match
- Partial match
- Search by userId/offerId

#### ✅ 5. Wallet Credit
Automatically credits user wallet on approved postback:
```javascript
if (postbackStatus === 1 && payoutAmount > 0 && userId) {
  user.wallet = (user.wallet || 0) + payoutAmount;
  user.totalCashback = (user.totalCashback || 0) + payoutAmount;
}
```

#### ✅ 6. Error Handling
Always returns 200 OK to prevent retries:
```javascript
res.status(200).json({ 
  success: true,
  message: 'Postback received'
});
```

---

## CPALead Postback Integration

### CPALead Postback Format

CPALead typically sends postbacks in this format:

```
GET https://yourdomain.com/api/postback?
  click_id={click_id}&
  offer_id={offer_id}&
  payout={payout}&
  status={status}&
  conversion_id={conversion_id}&
  ip={ip}&
  user_agent={user_agent}
```

### CPALead Postback Parameters

| Parameter | Description | Required |
|-----------|-------------|----------|
| `click_id` | Unique click identifier | ✅ Yes |
| `offer_id` | CPALead offer ID | Optional |
| `payout` | Payout amount | Optional |
| `status` | 1 = approved, 0 = rejected | Optional (default: 1) |
| `conversion_id` | Conversion identifier | Optional |
| `ip` | User IP address | Optional |
| `user_agent` | User agent string | Optional |

### CPALead Integration Example

```javascript
// CPALead postback handler (already implemented in postback.js)
router.post('/', async (req, res) => {
  const params = { ...req.query, ...req.body };
  const clickId = params.click_id || params.clickid;
  const payout = parseFloat(params.payout || 0);
  const status = parseInt(params.status || 1);
  
  // Process CPALead postback
  // ... existing implementation handles this
});
```

### CPALead Postback URL Setup

In CPALead dashboard:
1. Go to **Settings** → **Postback URLs**
2. Add postback URL: `https://yourdomain.com/api/postback`
3. Configure parameters:
   ```
   https://yourdomain.com/api/postback?
     click_id={click_id}&
     payout={payout}&
     status={status}&
     offer_id={offer_id}
   ```

---

## CPABuild Postback Integration

### CPABuild Postback Format

CPABuild sends postbacks similar to CPALead:

```
POST https://yourdomain.com/api/postback
Content-Type: application/json

{
  "click_id": "123456",
  "offer_id": "789",
  "payout": "10.50",
  "status": "1",
  "conversion_id": "conv_123",
  "publisher_id": "pub_456"
}
```

### CPABuild Postback Parameters

| Parameter | Description | Required |
|-----------|-------------|----------|
| `click_id` | Click identifier | ✅ Yes |
| `offer_id` | CPABuild offer ID | Optional |
| `payout` | Payout amount | Optional |
| `status` | Status code | Optional |
| `conversion_id` | Conversion ID | Optional |
| `publisher_id` | Publisher ID | Optional |

### CPABuild Integration Example

```javascript
// CPABuild postback handler (already implemented)
router.post('/', async (req, res) => {
  // Handles both JSON body and query params
  const params = { ...req.query, ...req.body };
  
  // Process CPABuild postback
  // ... existing implementation handles this
});
```

### CPABuild Postback URL Setup

In CPABuild dashboard:
1. Go to **Account Settings** → **Postback URLs**
2. Add postback URL: `https://yourdomain.com/api/postback`
3. Configure parameters:
   ```
   https://yourdomain.com/api/postback?
     click_id={click_id}&
     payout={payout}&
     status={status}
   ```

---

## Offer & Campaign Postback Tracking

### Complete Postback Flow

```
1. User clicks offer link
   ↓
2. Click record created with clickId
   ↓
3. User completes offer (install, purchase, etc.)
   ↓
4. Advertiser sends postback to your server
   ↓
5. Postback handler processes:
   - Validates clickId
   - Checks for duplicates
   - Finds click record
   - Updates click status to converted
   - Credits user wallet
   - Updates offer status
   ↓
6. Response sent back (200 OK)
```

### Offer Postback Tracking Code

```javascript
// server/routes/postback.js
router.post('/', async (req, res) => {
  try {
    // 1. Extract parameters
    const params = { ...req.query, ...req.body };
    const clickId = params.click_id || params.clickid;
    const payout = parseFloat(params.payout || 0);
    const status = parseInt(params.status || 1);
    
    // 2. Validate clickId
    if (!clickId) {
      return res.status(200).json({ 
        success: false,
        message: 'Click ID is required' 
      });
    }
    
    // 3. Check for duplicate (idempotency)
    const existingPostback = await Postback.findOne({ 
      clickId: clickId.trim(),
      status: 1 
    });
    
    if (existingPostback) {
      return res.status(200).json({ 
        success: true,
        message: 'Duplicate postback (already processed)',
        duplicate: true
      });
    }
    
    // 4. Find click record
    const clickRecord = await Click.findOne({ 
      clickId: clickId.trim() 
    });
    
    if (!clickRecord) {
      console.warn('Click record not found:', clickId);
    }
    
    // 5. Create postback record
    const postback = new Postback({
      clickId: clickId.trim(),
      conversionId: params.conversion_id || params.conversionid,
      offerId: clickRecord?.offerId,
      userId: clickRecord?.userId,
      payout: payout,
      status: status,
      source: 'incoming',
      rawData: params
    });
    
    await postback.save();
    
    // 6. Update click record if approved
    if (status === 1 && clickRecord) {
      clickRecord.converted = true;
      clickRecord.conversionValue = payout;
      clickRecord.convertedAt = new Date();
      await clickRecord.save();
    }
    
    // 7. Credit user wallet if approved
    if (status === 1 && payout > 0 && clickRecord?.userId) {
      const user = await User.findById(clickRecord.userId);
      if (user) {
        user.wallet = (user.wallet || 0) + payout;
        user.totalCashback = (user.totalCashback || 0) + payout;
        await user.save();
      }
    }
    
    // 8. Return success
    res.status(200).json({ 
      success: true,
      message: 'Postback processed successfully',
      postbackId: postback._id
    });
    
  } catch (error) {
    console.error('Postback error:', error);
    // Always return 200 to prevent retries
    res.status(200).json({ 
      success: false,
      message: error.message
    });
  }
});
```

### Campaign Postback Tracking

For campaigns with multiple offers:

```javascript
// Track campaign-level postbacks
router.post('/campaign', async (req, res) => {
  const { campaign_id, click_id, payout, status } = req.body;
  
  // Find all offers in campaign
  const campaignOffers = await Offer.find({ 
    campaignId: campaign_id 
  });
  
  // Process postback for each offer in campaign
  for (const offer of campaignOffers) {
    // Process postback...
  }
});
```

---

## Postback API Endpoints

### 1. Receive Postback
```
POST /api/postback
GET /api/postback
```

**Request Body (POST):**
```json
{
  "click_id": "CLID-123456",
  "payout": "10.50",
  "status": "1",
  "conversion_id": "conv_789",
  "offer_id": "offer_456"
}
```

**Query Parameters (GET):**
```
?click_id=CLID-123456&payout=10.50&status=1
```

**Response:**
```json
{
  "success": true,
  "message": "Postback processed successfully",
  "postbackId": "507f1f77bcf86cd799439011"
}
```

### 2. Get Postback Statistics
```
GET /api/admin/trackier/installs
```

**Query Parameters:**
- `offerId` - Filter by offer
- `userId` - Filter by user
- `status` - Filter by status (0 or 1)
- `startDate` - Start date filter
- `endDate` - End date filter

**Response:**
```json
{
  "installs": [...],
  "stats": {
    "total": 100,
    "approved": 85,
    "rejected": 15,
    "totalPayout": 850.50
  }
}
```

### 3. Get Postback Details
```
GET /api/admin/trackier/installs/:id
```

### 4. Health Check
```
GET /api/postback/health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "postback",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## Offerwall Postback Implementation

### What is an Offerwall?

An **offerwall** is a collection of offers displayed to users. Users can browse and complete offers to earn rewards.

### Offerwall Postback Flow

```
1. User views offerwall
   ↓
2. User clicks on offer
   ↓
3. Click tracked with clickId
   ↓
4. User completes offer
   ↓
5. Offerwall sends postback
   ↓
6. Your server processes postback
   ↓
7. User wallet credited
```

### Offerwall Postback Handler

```javascript
// server/routes/offerwall.js
const express = require('express');
const router = express.Router();
const Postback = require('../models/Postback');
const Click = require('../models/Click');
const User = require('../models/User');

/**
 * Offerwall Postback Handler
 * Handles postbacks from offerwall networks
 */
router.post('/postback', async (req, res) => {
  try {
    const {
      click_id,
      offer_id,
      payout,
      status,
      user_id, // Offerwall user ID
      conversion_id
    } = req.body;
    
    // Find your user by offerwall user ID
    const user = await User.findOne({ 
      offerwallUserId: user_id 
    });
    
    if (!user) {
      return res.status(200).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    // Find click record
    const clickRecord = await Click.findOne({ 
      clickId: click_id 
    });
    
    // Create postback record
    const postback = new Postback({
      clickId: click_id,
      conversionId: conversion_id,
      userId: user._id,
      payout: parseFloat(payout || 0),
      status: parseInt(status || 1),
      source: 'incoming',
      rawData: req.body
    });
    
    await postback.save();
    
    // Credit user if approved
    if (parseInt(status) === 1 && parseFloat(payout) > 0) {
      user.wallet = (user.wallet || 0) + parseFloat(payout);
      await user.save();
    }
    
    res.status(200).json({ 
      success: true,
      postbackId: postback._id
    });
    
  } catch (error) {
    console.error('Offerwall postback error:', error);
    res.status(200).json({ 
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
```

### How to Make an Offerwall Website

1. **Create Offer Display Page**
   - List all available offers
   - Show cashback amounts
   - Display offer images and descriptions

2. **Implement Click Tracking**
   - Generate unique clickId for each click
   - Store clickId in database
   - Redirect user to offer URL with clickId

3. **Set Up Postback URL**
   - Configure postback URL in offerwall network
   - Handle incoming postbacks
   - Credit user wallets

4. **User Dashboard**
   - Show user's completed offers
   - Display earnings
   - Show pending/approved status

---

## Payment Results Postback

### Payment Gateway Postback

When a user makes a payment, the payment gateway sends a postback to confirm the transaction:

```javascript
// server/routes/payment.js
router.post('/postback', async (req, res) => {
  try {
    const {
      transaction_id,
      user_id,
      amount,
      status, // success, failed, pending
      payment_method,
      timestamp
    } = req.body;
    
    // Verify payment signature (security)
    const isValid = verifyPaymentSignature(req.body);
    if (!isValid) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid signature' 
      });
    }
    
    // Find user
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    // Update payment status
    if (status === 'success') {
      // Payment successful
      user.wallet = (user.wallet || 0) + parseFloat(amount);
      await user.save();
    }
    
    // Log payment postback
    const paymentPostback = new PaymentPostback({
      transactionId: transaction_id,
      userId: user_id,
      amount: parseFloat(amount),
      status: status,
      rawData: req.body
    });
    
    await paymentPostback.save();
    
    res.status(200).json({ 
      success: true,
      message: 'Payment postback processed' 
    });
    
  } catch (error) {
    console.error('Payment postback error:', error);
    res.status(200).json({ 
      success: false,
      message: error.message
    });
  }
});
```

---

## Testing Postbacks

### Test 1: Using cURL (GET Request)

```bash
curl "https://yourdomain.com/api/postback?click_id=TEST123&payout=10&status=1"
```

### Test 2: Using cURL (POST Request)

```bash
curl -X POST https://yourdomain.com/api/postback \
  -H "Content-Type: application/json" \
  -d '{
    "click_id": "TEST123",
    "payout": "10.50",
    "status": "1",
    "conversion_id": "conv_789"
  }'
```

### Test 3: Using Postman

1. **Method**: POST
2. **URL**: `https://yourdomain.com/api/postback`
3. **Headers**: `Content-Type: application/json`
4. **Body**:
```json
{
  "click_id": "TEST123",
  "payout": "10",
  "status": "1"
}
```

### Test 4: Using Node.js

```javascript
const axios = require('axios');

async function testPostback() {
  try {
    const response = await axios.post('https://yourdomain.com/api/postback', {
      click_id: 'TEST123',
      payout: '10',
      status: '1'
    });
    
    console.log('Postback test result:', response.data);
  } catch (error) {
    console.error('Postback test error:', error.message);
  }
}

testPostback();
```

### Test 5: Local Testing

```bash
# Start your server
npm start

# In another terminal, test postback
curl -X POST http://localhost:5000/api/postback \
  -H "Content-Type: application/json" \
  -d '{"click_id":"LOCAL_TEST","payout":"5","status":"1"}'
```

---

## ASP.NET Postback (Reference)

### ASP.NET Postback Handler

```csharp
// ASP.NET Core Controller
[ApiController]
[Route("api/[controller]")]
public class PostbackController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    
    public PostbackController(ApplicationDbContext context)
    {
        _context = context;
    }
    
    [HttpPost]
    [HttpGet]
    public async Task<IActionResult> ReceivePostback()
    {
        try
        {
            // Get parameters from query or body
            var clickId = Request.Query["click_id"].FirstOrDefault() 
                       ?? Request.Form["click_id"].FirstOrDefault();
            
            var payout = decimal.Parse(
                Request.Query["payout"].FirstOrDefault() 
                ?? Request.Form["payout"].FirstOrDefault() 
                ?? "0"
            );
            
            var status = int.Parse(
                Request.Query["status"].FirstOrDefault() 
                ?? Request.Form["status"].FirstOrDefault() 
                ?? "1"
            );
            
            // Validate clickId
            if (string.IsNullOrEmpty(clickId))
            {
                return Ok(new { 
                    success = false, 
                    message = "Click ID is required" 
                });
            }
            
            // Check for duplicate
            var existingPostback = await _context.Postbacks
                .FirstOrDefaultAsync(p => 
                    p.ClickId == clickId && 
                    p.Status == 1
                );
            
            if (existingPostback != null)
            {
                return Ok(new { 
                    success = true, 
                    message = "Duplicate postback",
                    duplicate = true
                });
            }
            
            // Find click record
            var clickRecord = await _context.Clicks
                .FirstOrDefaultAsync(c => c.ClickId == clickId);
            
            // Create postback record
            var postback = new Postback
            {
                ClickId = clickId,
                Payout = payout,
                Status = status,
                CreatedAt = DateTime.UtcNow
            };
            
            if (clickRecord != null)
            {
                postback.UserId = clickRecord.UserId;
                postback.OfferId = clickRecord.OfferId;
            }
            
            _context.Postbacks.Add(postback);
            
            // Update click record if approved
            if (status == 1 && clickRecord != null)
            {
                clickRecord.Converted = true;
                clickRecord.ConversionValue = payout;
                clickRecord.ConvertedAt = DateTime.UtcNow;
            }
            
            // Credit user wallet if approved
            if (status == 1 && payout > 0 && clickRecord != null)
            {
                var user = await _context.Users
                    .FindAsync(clickRecord.UserId);
                
                if (user != null)
                {
                    user.Wallet += payout;
                    user.TotalCashback += payout;
                }
            }
            
            await _context.SaveChangesAsync();
            
            return Ok(new { 
                success = true, 
                message = "Postback processed successfully",
                postbackId = postback.Id
            });
        }
        catch (Exception ex)
        {
            // Always return 200 to prevent retries
            return Ok(new { 
                success = false, 
                message = ex.Message
            });
        }
    }
}
```

### ASP.NET Postback Model

```csharp
public class Postback
{
    public int Id { get; set; }
    public string ClickId { get; set; }
    public string ConversionId { get; set; }
    public int? UserId { get; set; }
    public int? OfferId { get; set; }
    public decimal Payout { get; set; }
    public int Status { get; set; } // 1 = approved, 0 = rejected
    public DateTime CreatedAt { get; set; }
    
    public User User { get; set; }
    public Offer Offer { get; set; }
}
```

---

## Best Practices

### 1. Always Return 200 OK
Prevent retries by always returning 200, even on errors:
```javascript
res.status(200).json({ success: false, message: error.message });
```

### 2. Implement Idempotency
Check for duplicates before processing:
```javascript
const existing = await Postback.findOne({ clickId, status: 1 });
if (existing) return res.status(200).json({ duplicate: true });
```

### 3. Validate All Inputs
Always validate and sanitize input:
```javascript
const clickId = (params.click_id || params.clickid || '').trim();
if (!clickId) return res.status(200).json({ error: 'Click ID required' });
```

### 4. Log Everything
Comprehensive logging helps debug issues:
```javascript
console.log('📥 Postback received:', {
  clickId, payout, status, timestamp: new Date()
});
```

### 5. Handle Errors Gracefully
Don't let errors break the flow:
```javascript
try {
  // Process postback
} catch (error) {
  console.error('Error:', error);
  // Still return 200 OK
  res.status(200).json({ success: false, message: error.message });
}
```

### 6. Use Indexes
Add database indexes for performance:
```javascript
postbackSchema.index({ clickId: 1, status: 1 });
postbackSchema.index({ userId: 1, createdAt: -1 });
```

### 7. Store Raw Data
Always store raw postback data for debugging:
```javascript
rawData: {
  ...params,
  received_at: new Date().toISOString()
}
```

---

## Summary

Your Node.js postback implementation includes:

✅ **Dual Method Support** (GET & POST)  
✅ **Multiple Parameter Formats** (click_id, clickid, etc.)  
✅ **Idempotency** (Duplicate prevention)  
✅ **Click Record Matching** (Multiple search methods)  
✅ **Wallet Credit** (Automatic user credit)  
✅ **Error Handling** (Always returns 200 OK)  
✅ **Comprehensive Logging** (Full audit trail)  
✅ **CPALead Compatible** (Works with CPALead format)  
✅ **CPABuild Compatible** (Works with CPABuild format)  
✅ **Offerwall Ready** (Can handle offerwall postbacks)  
✅ **Payment Gateway Ready** (Can handle payment postbacks)  

**Your postback endpoint is production-ready!** 🚀

---

## Quick Reference

### Postback URL
```
https://yourdomain.com/api/postback
```

### Required Parameter
- `click_id` or `clickid` (required)

### Optional Parameters
- `payout` - Payout amount
- `status` - 1 = approved, 0 = rejected
- `conversion_id` - Conversion identifier
- `offer_id` - Offer identifier
- `publisher_id` - Publisher identifier

### Response Format
```json
{
  "success": true,
  "message": "Postback processed successfully",
  "postbackId": "507f1f77bcf86cd799439011"
}
```

---

**Need Help?** Check the existing implementation in `server/routes/postback.js` for complete code examples.


