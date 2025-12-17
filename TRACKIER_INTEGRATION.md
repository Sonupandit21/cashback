# Trackier Integration Guide

This project integrates with [Trackier](https://brandshapers.trackier.io/), a performance marketing tracking platform for tracking clicks, conversions, publishers, and payouts.

## What is Trackier?

Trackier is a performance marketing tracking platform that helps you track:
- **Clicks** - Track when users click on offers
- **Publishers (Affiliates)** - Manage and track affiliate performance
- **Advertisers** - Track advertiser campaigns
- **Click ID** - Unique identifiers for each click to track user journey
- **Conversions** - Track sales, signups, and other conversion events
- **Payout** - Track and manage payouts to publishers/affiliates

## Setup

### 1. Environment Variables

Add the following to your `.env` file:

```env
# Trackier Configuration
TRACKIER_API_URL=https://brandshapers.trackier.io
TRACKIER_API_KEY=your-trackier-api-key-here
TRACKIER_PUBLISHER_ID=your-publisher-id
TRACKIER_ADVERTISER_ID=your-advertiser-id
```

### 2. Get Your Trackier Credentials

1. Log in to your Trackier dashboard at https://brandshapers.trackier.io/
2. Navigate to Settings > API Keys
3. Generate an API key
4. Get your Publisher ID and Advertiser ID from your dashboard

### 3. Add Trackier Offer ID to Offers

When creating or editing offers in the admin panel, add the `trackierOfferId` field. This is the offer ID from your Trackier dashboard.

## How It Works

### Click Tracking

When a user clicks on an offer:

1. A click is tracked via Trackier API
2. A unique `clickId` is generated and stored
3. Click data (IP, user agent, referrer) is stored in the database
4. The click ID is returned for conversion tracking

**API Endpoint:** `POST /api/offers/:id/track`

### Conversion Tracking

When a user claims an offer:

1. The system finds the associated click ID
2. A conversion is tracked via Trackier API using the click ID
3. Conversion data (type, value, currency) is sent to Trackier
4. The click record is marked as converted

**API Endpoint:** `POST /api/offers/:id/claim`

### Publisher/Affiliate Tracking

Each user acts as a publisher/affiliate. Their user ID is used as the publisher ID when tracking clicks and conversions.

### Payout Tracking

Payouts can be tracked when processing withdrawals:

```javascript
const { trackPayout } = require('./utils/trackier');

// Track a payout
await trackPayout(
  userId,           // Publisher ID
  amount,           // Payout amount
  'INR',           // Currency
  {                // Additional data
    payout_method: 'UPI',
    transaction_id: 'txn_123'
  }
);
```

## API Functions

### `trackClick(trackierOfferId, userId, additionalData)`

Track a click event.

**Parameters:**
- `trackierOfferId` - The offer ID from Trackier
- `userId` - User ID (used as publisher ID)
- `additionalData` - Object with `ipAddress`, `userAgent`, `referrer`, `customParams`

**Returns:**
```javascript
{
  success: true,
  clickId: "generated-click-id",
  data: { ... }
}
```

### `trackConversion(clickId, trackierOfferId, userId, conversionData)`

Track a conversion event.

**Parameters:**
- `clickId` - The click ID from the initial click
- `trackierOfferId` - The offer ID from Trackier
- `userId` - User ID
- `conversionData` - Object with `conversionType`, `conversionValue`, `currency`, `customParams`

**Returns:**
```javascript
{
  success: true,
  conversionId: "trackier-conversion-id",
  data: { ... }
}
```

### `trackPayout(publisherId, amount, currency, payoutData)`

Track a payout to a publisher/affiliate.

**Parameters:**
- `publisherId` - Publisher/Affiliate ID
- `amount` - Payout amount
- `currency` - Currency code (default: 'INR')
- `payoutData` - Additional payout information

**Returns:**
```javascript
{
  success: true,
  payoutId: "trackier-payout-id",
  data: { ... }
}
```

### `getPublisherStats(publisherId, dateRange)`

Get statistics for a publisher/affiliate.

**Parameters:**
- `publisherId` - Publisher ID
- `dateRange` - Object with `startDate` and `endDate`

**Returns:**
```javascript
{
  success: true,
  data: {
    clicks: 100,
    conversions: 10,
    revenue: 1000,
    ...
  }
}
```

### `getOfferStats(trackierOfferId, dateRange)`

Get statistics for an offer.

**Parameters:**
- `trackierOfferId` - Offer ID from Trackier
- `dateRange` - Object with `startDate` and `endDate`

## Database Models

### Click Model

Stores click tracking data:

```javascript
{
  userId: ObjectId,
  offerId: ObjectId,
  trackierOfferId: String,
  clickId: String (unique),
  ipAddress: String,
  userAgent: String,
  referrer: String,
  conversionId: String,
  converted: Boolean,
  conversionValue: Number,
  createdAt: Date,
  convertedAt: Date
}
```

## Testing

To test the Trackier integration:

1. Create an offer with a `trackierOfferId`
2. Click on the offer (triggers click tracking)
3. Claim the offer (triggers conversion tracking)
4. Check your Trackier dashboard for tracked events

## Troubleshooting

### Click ID Not Found for Conversion

If a conversion is attempted without a click ID:
- The system will attempt to track the conversion without a click ID
- This may result in incomplete tracking in Trackier
- Ensure clicks are tracked before conversions

### API Errors

If you encounter API errors:
- Check your API key and credentials
- Verify the Trackier API endpoints match your Trackier version
- Check the console logs for detailed error messages
- Ensure your Trackier account has API access enabled

### Missing Configuration

If tracking fails:
- Verify all environment variables are set
- Check that `trackierOfferId` is set on offers
- Ensure the Trackier API URL is correct

## References

- [Trackier Dashboard](https://brandshapers.trackier.io/)
- Trackier API Documentation (check your Trackier dashboard for API docs)


















