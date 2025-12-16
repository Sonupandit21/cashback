 # Trackier Advertiser + Publisher Setup Guide

Complete guide for setting up Trackier integration with your Cashback Platform.

## Table of Contents

1. [Overview](#overview)
2. [Trackier Account Setup](#trackier-account-setup)
3. [Advertiser Setup](#advertiser-setup)
4. [Publisher Setup](#publisher-setup)
5. [Postback Configuration](#postback-configuration)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

---

## Overview

This guide explains how to configure Trackier as both:
- **Advertiser**: You are the advertiser offering cashback to users
- **Publisher**: You are the publisher/affiliate promoting offers

### Flow Diagram

```
User clicks Trackier link
    ↓
Trackier tracks click → Generates click_id
    ↓
User lands on your website (with ?p1=click_id)
    ↓
User claims offer → Submits UPI ID
    ↓
Your server sends postback to Trackier
    ↓
Trackier receives postback → Shows conversion in dashboard
```

---

## Trackier Account Setup

### Step 1: Create Trackier Account

1. Go to [Trackier](https://trackier.com) or your Trackier instance URL
2. Sign up for an account
3. Complete email verification

### Step 2: Get API Credentials

1. Log in to Trackier dashboard
2. Go to **Settings** → **API Keys**
3. Generate or copy your API key
4. Note down:
   - **API Key**: Your authentication token
   - **API URL**: Your Trackier instance URL (e.g., `https://brandshapers.gotrackier.com`)
   - **Publisher ID**: Your publisher/affiliate ID
   - **Advertiser ID**: Your advertiser ID (if applicable)

---

## Advertiser Setup

### Step 1: Create Advertiser Account

1. In Trackier dashboard, go to **Advertisers** → **Add Advertiser**
2. Fill in advertiser details:
   - Name: Your company name
   - Email: Your email
   - Currency: INR (or your preferred currency)
3. Save the advertiser

### Step 2: Create Campaign/Offer

1. Go to **Campaigns** → **Create Campaign**
2. Fill in campaign details:
   - **Campaign Name**: e.g., "Cashback Offer - Flipkart"
   - **Advertiser**: Select your advertiser
   - **Payout Type**: CPA (Cost Per Action)
   - **Payout Amount**: e.g., ₹10
   - **Status**: Active
3. Save the campaign
4. **Copy the Campaign/Offer ID** - This is your `trackierOfferId`

### Step 3: Configure Postback URL

1. Go to your campaign settings
2. Find **Postback URL** or **S2S Postback** section
3. Set postback URL to:
   ```
   https://yourdomain.com/api/postback
   ```
   Or for local testing:
   ```
   http://localhost:5000/api/postback
   ```
4. Save the configuration

### Step 4: Generate Tracking Link

1. In campaign settings, go to **Tracking Links**
2. Click **Generate Tracking Link**
3. Configure link parameters:
   - **Destination URL**: Your cashback website URL
   - **Click ID Parameter**: `p1` (or your preferred parameter name)
   - **Postback Parameters**: Include `click_id`, `payout`, `status`
4. Copy the generated tracking link

**Example Tracking Link:**
```
https://brandshapers.gotrackier.com/click?offer_id=12345&p1={click_id}&destination=https://yourdomain.com
```

---

## Publisher Setup

### Step 1: Create Publisher Account

1. In Trackier dashboard, go to **Publishers** → **Add Publisher**
2. Fill in publisher details:
   - Name: Your publisher name
   - Email: Your email
   - Payment Method: Bank Transfer / UPI
3. Save the publisher
4. **Copy the Publisher ID** - This is your `TRACKIER_PUBLISHER_ID`

### Step 2: Link Publisher to Campaign

1. Go to your campaign
2. In **Publishers** section, add your publisher
3. Set publisher payout (if different from default)
4. Approve the publisher

### Step 3: Get Tracking Link for Publisher

1. Go to **Tracking Links** in campaign
2. Select your publisher
3. Copy the tracking link with your publisher ID

---

## Postback Configuration

### Step 1: Configure Environment Variables

Add these to your `.env` file:

```env
# Trackier Configuration
TRACKIER_API_URL=https://brandshapers.gotrackier.com
TRACKIER_API_KEY=your-api-key-here
TRACKIER_PUBLISHER_ID=your-publisher-id
TRACKIER_ADVERTISER_ID=your-advertiser-id
TRACKIER_POSTBACK_URL=https://brandshapers.gotrackier.com/postback
```

### Step 2: Postback Endpoint

Your server already has a postback endpoint at:
```
POST /api/postback
GET /api/postback
```

This endpoint accepts postbacks from Trackier with these parameters:
- `click_id` or `clickid`: The click ID
- `payout`: Payout amount
- `status`: 1 = approved, 0 = rejected
- `offer_id` or `offerid`: Trackier offer ID
- `publisher_id` or `publisherid`: Publisher ID
- `advertiser_id` or `advertiserid`: Advertiser ID

### Step 3: Configure Trackier to Send Postbacks

In your Trackier campaign settings:

1. Go to **Postback Settings**
2. Set **Postback URL** to: `https://yourdomain.com/api/postback`
3. Configure postback parameters:
   ```
   click_id={click_id}
   payout={payout}
   status={status}
   offer_id={offer_id}
   publisher_id={publisher_id}
   ```
4. Set **Postback Method**: GET or POST (both are supported)
5. Save configuration

---

## Testing

### Test 1: Click Tracking

1. Generate a test tracking link from Trackier
2. Visit the link: `https://yourdomain.com/?p1=TEST123`
3. Check browser console - should see click ID captured
4. Check database - should see click record in `clicks` collection

### Test 2: Postback Reception

1. Manually send a test postback:
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
2. Check database - should see postback record in `postbacks` collection
3. Check admin dashboard - should see install/conversion

### Test 3: End-to-End Flow

1. User clicks Trackier link: `https://yourdomain.com/?p1=CLICK456`
2. User claims offer and submits UPI ID
3. Your server sends postback to Trackier
4. Check Trackier dashboard - should see conversion
5. Check your admin dashboard - should see click, install, and payout

---

## Complete Integration Flow

### 1. First Click (User Lands from Trackier)

```
Trackier → Your Website
URL: https://yourdomain.com/?p1=ABCD1234CLICKID

Frontend captures click_id from URL parameter p1
Stores in localStorage: 'trackier_clickid'
```

### 2. User Claims Offer

```
User → Your Website
POST /api/offers/:id/claim
Body: {
  upiId: "user@paytm",
  clickid: "ABCD1234CLICKID"  // From localStorage
}

Your Server:
1. Validates offer and user
2. Saves click record (if not exists)
3. Sends postback to Trackier:
   GET https://brandshapers.gotrackier.com/postback?click_id=ABCD1234&payout=10&status=1
4. Saves postback record
5. Updates user wallet
```

### 3. Trackier Receives Postback

```
Trackier receives postback
Shows conversion in dashboard:
- Click ID: ABCD1234
- Payout: ₹10
- Status: Approved
- Publisher: Your Publisher ID
```

### 4. Trackier Sends Postback Back (Optional)

```
Trackier → Your Server
POST /api/postback
Body: {
  click_id: "ABCD1234",
  payout: "10",
  status: "1",
  conversion_id: "CONV789"
}

Your Server:
1. Saves postback record (source: 'incoming')
2. Updates click record with conversion info
```

---

## Admin Dashboard

### Viewing Statistics

1. Log in to admin panel: `http://localhost:3002`
2. Navigate to **Trackier Stats**
3. View:
   - **Overview**: Total clicks, installs, payouts
   - **Clicks**: All click records with details
   - **Installs**: All conversions/installs
   - **Payouts**: All approved payouts

### Filtering

- Filter by date range
- Filter by offer
- Filter by user
- Filter by status

---

## Troubleshooting

### Issue: Clicks Not Being Tracked

**Solution:**
1. Check if `p1` parameter is in URL
2. Check browser console for errors
3. Check if click record is saved in database
4. Verify Trackier offer ID is correct

### Issue: Postbacks Not Received

**Solution:**
1. Check postback URL in Trackier settings
2. Verify server is accessible (not behind firewall)
3. Check server logs for postback requests
4. Test postback endpoint manually with curl

### Issue: Conversions Not Showing in Trackier

**Solution:**
1. Verify postback URL is correct
2. Check postback parameters match Trackier requirements
3. Verify click_id matches the one from Trackier
4. Check Trackier dashboard for postback logs

### Issue: Postback Data Not Saved

**Solution:**
1. Check MongoDB connection
2. Verify Postback model is correct
3. Check server logs for errors
4. Verify postback endpoint is accessible

---

## Environment Variables Reference

```env
# Required
TRACKIER_POSTBACK_URL=https://brandshapers.gotrackier.com/postback

# Optional (for API-based tracking)
TRACKIER_API_URL=https://brandshapers.gotrackier.com
TRACKIER_API_KEY=your-api-key
TRACKIER_PUBLISHER_ID=your-publisher-id
TRACKIER_ADVERTISER_ID=your-advertiser-id
```

---

## API Endpoints Reference

### Your Server Endpoints

- `POST /api/postback` - Receive postbacks from Trackier
- `GET /api/postback` - Same as POST (for GET requests)
- `GET /api/admin/trackier/stats` - Get comprehensive statistics
- `GET /api/admin/trackier/clicks` - Get click records
- `GET /api/admin/trackier/installs` - Get install/conversion records
- `GET /api/admin/trackier/payouts` - Get payout records

### Trackier Postback Format

**GET Request:**
```
https://yourdomain.com/api/postback?click_id=XXX&payout=10&status=1
```

**POST Request:**
```json
{
  "click_id": "XXX",
  "payout": "10",
  "status": "1",
  "offer_id": "12345"
}
```

---

## Best Practices

1. **Always validate click IDs** before processing
2. **Log all postbacks** for debugging
3. **Use HTTPS** in production
4. **Set up monitoring** for postback failures
5. **Test thoroughly** before going live
6. **Keep postback URLs secure** (don't expose in frontend)
7. **Handle duplicate postbacks** gracefully
8. **Use idempotent operations** for postback processing

---

## Support

For Trackier-specific issues:
- Check Trackier documentation
- Contact Trackier support
- Check Trackier dashboard logs

For integration issues:
- Check server logs
- Check database records
- Test endpoints manually
- Review this guide

---

## Quick Start Checklist

- [ ] Create Trackier account
- [ ] Get API credentials
- [ ] Create advertiser account
- [ ] Create campaign/offer
- [ ] Get Trackier offer ID
- [ ] Create publisher account
- [ ] Get publisher ID
- [ ] Configure postback URL in Trackier
- [ ] Set environment variables
- [ ] Test click tracking
- [ ] Test postback reception
- [ ] Verify in admin dashboard
- [ ] Verify in Trackier dashboard

---

**Last Updated:** 2024
**Version:** 1.0











