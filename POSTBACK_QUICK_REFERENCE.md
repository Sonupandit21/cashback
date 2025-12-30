# 📋 Postback URL Quick Reference Card

## Your Postback Endpoint

```
POST https://yourdomain.com/api/postback
GET  https://yourdomain.com/api/postback
```

---

## Required Parameters

| Parameter | Alternative Names | Description | Example |
|-----------|------------------|-------------|---------|
| `click_id` | `clickid`, `clid` | Unique click identifier | `CLID-123456` |

---

## Optional Parameters

| Parameter | Alternative Names | Description | Example |
|-----------|------------------|-------------|---------|
| `payout` | `amount`, `reward`, `cashback` | Payout amount | `10.50` |
| `status` | `approved`, `converted` | 1 = approved, 0 = rejected | `1` |
| `conversion_id` | `conversionid`, `conv_id` | Conversion identifier | `conv_789` |
| `offer_id` | `offerid`, `offerId` | Offer identifier | `offer_456` |
| `publisher_id` | `publisherid`, `user_id` | Publisher/User identifier | `user_123` |
| `advertiser_id` | `advertiserid` | Advertiser identifier | `adv_789` |
| `ip` | `ip_address` | User IP address | `192.168.1.1` |
| `user_agent` | `useragent` | User agent string | `Mozilla/5.0...` |

---

## CPALead Postback URL

```
https://yourdomain.com/api/postback?click_id={click_id}&payout={payout}&status={status}&offer_id={offer_id}
```

**CPALead Dashboard Setup:**
1. Settings → Postback URLs
2. Add URL: `https://yourdomain.com/api/postback`
3. Parameters: `click_id={click_id}&payout={payout}&status={status}`

---

## CPABuild Postback URL

```
https://yourdomain.com/api/postback
```

**CPABuild Dashboard Setup:**
1. Account Settings → Postback URLs
2. Add URL: `https://yourdomain.com/api/postback`
3. Method: POST
4. Parameters: JSON body with `click_id`, `payout`, `status`

---

## Offerwall Postback URL

```
https://yourdomain.com/api/postback
```

**Offerwall Setup:**
- Method: POST
- Content-Type: application/json
- Body: `{ "click_id": "...", "payout": "...", "status": "1", "user_id": "..." }`

---

## Payment Gateway Postback URL

```
https://yourdomain.com/api/postback/payment
```

**Payment Gateway Setup:**
- Method: POST
- Content-Type: application/json
- Body: `{ "transaction_id": "...", "user_id": "...", "amount": "...", "status": "success" }`

---

## Test Postback URLs

### Test 1: GET Request
```bash
curl "https://yourdomain.com/api/postback?click_id=TEST123&payout=10&status=1"
```

### Test 2: POST Request (JSON)
```bash
curl -X POST https://yourdomain.com/api/postback \
  -H "Content-Type: application/json" \
  -d '{"click_id":"TEST123","payout":"10","status":"1"}'
```

### Test 3: POST Request (Form Data)
```bash
curl -X POST https://yourdomain.com/api/postback \
  -d "click_id=TEST123&payout=10&status=1"
```

---

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Postback processed successfully",
  "postbackId": "507f1f77bcf86cd799439011"
}
```

### Duplicate Response
```json
{
  "success": true,
  "message": "Duplicate postback (already processed)",
  "duplicate": true
}
```

### Error Response
```json
{
  "success": false,
  "message": "Click ID is required"
}
```

---

## Status Codes

| Code | Meaning |
|------|---------|
| `1` | Approved / Success |
| `0` | Rejected / Failed |

---

## Common Postback Formats

### Format 1: Query Parameters (GET)
```
https://yourdomain.com/api/postback?click_id=123&payout=10&status=1
```

### Format 2: JSON Body (POST)
```json
POST https://yourdomain.com/api/postback
Content-Type: application/json

{
  "click_id": "123",
  "payout": "10",
  "status": "1"
}
```

### Format 3: Form Data (POST)
```
POST https://yourdomain.com/api/postback
Content-Type: application/x-www-form-urlencoded

click_id=123&payout=10&status=1
```

---

## Network-Specific Postback URLs

### Trackier
```
https://yourdomain.com/api/postback?click_id={click_id}&payout={payout}&status={status}
```

### CPALead
```
https://yourdomain.com/api/postback?click_id={click_id}&payout={payout}&status={status}&offer_id={offer_id}
```

### CPABuild
```
POST https://yourdomain.com/api/postback
Body: { "click_id": "{click_id}", "payout": "{payout}", "status": "{status}" }
```

### Impact Radius
```
https://yourdomain.com/api/postback?click_id={click_id}&payout={payout}&status={status}
```

### HasOffers
```
https://yourdomain.com/api/postback?click_id={click_id}&payout={payout}&status={status}
```

---

## Security Best Practices

1. **Always Return 200 OK** - Prevents retries
2. **Validate Signatures** - Verify postback authenticity
3. **Check Duplicates** - Prevent double processing
4. **Log Everything** - Full audit trail
5. **Store Raw Data** - For debugging

---

## Quick Test Commands

### Local Testing
```bash
# Start server
npm start

# Test postback
curl -X POST http://localhost:5000/api/postback \
  -H "Content-Type: application/json" \
  -d '{"click_id":"LOCAL_TEST","payout":"5","status":"1"}'
```

### Production Testing
```bash
curl -X POST https://yourdomain.com/api/postback \
  -H "Content-Type: application/json" \
  -d '{"click_id":"PROD_TEST","payout":"10","status":"1"}'
```

---

## Health Check

```
GET https://yourdomain.com/api/postback/health
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

## Support

- **Main Handler**: `server/routes/postback.js`
- **Examples**: `server/routes/postback-examples.js`
- **Complete Guide**: `POSTBACK_TRACKING_COMPLETE_GUIDE.md`

---

**Your postback endpoint is ready!** 🚀


