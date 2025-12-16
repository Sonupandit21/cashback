# Trackier Tracking Link Setup Guide

## Overview

You've added a tracking link in Trackier dashboard. This guide shows you how to integrate it with your cashback website.

## Your Trackier Tracking Link

Your Trackier tracking link should look like:
```
https://brandshapers.gotrackier.com/click?campaign_id=4815&pub_id=2&p1={clickid}
```

**Note**: Trackier will automatically replace `{clickid}` with a unique click ID when users click the link.

## Two Integration Methods

### Method 1: Direct Trackier Link (Recommended)

**Use this if**: You want users to go through Trackier tracking link when they click on offers.

**Setup**:
1. In your Trackier dashboard, configure the tracking link to redirect to your cashback website
2. Set the final destination URL in Trackier to: `https://yourcashbackwebsite.com/offers/{offerId}?p1={clickid}`
3. When users click the Trackier link, they'll land on your site with `?p1=CLICKID` in the URL
4. Your site automatically captures the clickid and stores it in localStorage
5. When user claims offer, postback is sent to Trackier

**Flow**:
```
User clicks Trackier link
→ Trackier tracks click and generates clickid
→ Redirects to: yoursite.com/offers/123?p1=ABCD1234
→ Your site captures clickid
→ User claims offer
→ Postback sent to Trackier
```

### Method 2: Offer Link Through Trackier

**Use this if**: You want the offer link (merchant website) to go through Trackier.

**Setup**:
1. In your admin panel, when creating/editing an offer:
   - Set `offerLink` to your Trackier tracking link
   - Configure Trackier to redirect to the actual merchant website
   
2. Example:
   ```
   offerLink: https://brandshapers.gotrackier.com/click?campaign_id=4815&pub_id=2&p1={clickid}
   ```
   
   In Trackier dashboard, set final destination to the merchant website (e.g., `https://merchant.com/offer`)

**Flow**:
```
User clicks "Claim Now" on your site
→ Your site captures clickid from URL (if available)
→ User submits UPI ID
→ Redirects to Trackier link (with clickid)
→ Trackier tracks and redirects to merchant site
→ Postback sent when conversion happens
```

## Recommended Setup (Method 1)

### Step 1: Configure Trackier Link

In your Trackier dashboard:
1. Go to your Campaign
2. Click on "Tracking" or "Click Tracking"
3. Set the tracking link destination to:
   ```
   https://yourcashbackwebsite.com/offers/{offerId}?p1={clickid}
   ```
   
   Or use a general landing page:
   ```
   https://yourcashbackwebsite.com/?p1={clickid}
   ```

### Step 2: Share Trackier Link

Share your Trackier tracking link:
```
https://brandshapers.gotrackier.com/click?campaign_id=4815&pub_id=2&p1={clickid}
```

When users click this link:
- Trackier generates a unique clickid
- User is redirected to your site with `?p1=CLICKID`
- Your site automatically captures and stores it

### Step 3: Verify Integration

1. **Test ClickID Capture**:
   ```
   Visit: https://yourcashbackwebsite.com/?p1=TEST123
   Check browser console: Should see "Trackier clickid captured: TEST123"
   Check localStorage: localStorage.getItem('trackier_clickid') === 'TEST123'
   ```

2. **Test Complete Flow**:
   - Click Trackier link
   - Land on your site
   - Browse and claim an offer
   - Check Trackier dashboard for conversion

## Current Implementation Status

✅ **Already Implemented**:
- ClickID capture from URL (`p1` parameter)
- localStorage storage
- Postback sending when offer is claimed
- Database click tracking

✅ **What You Need to Do**:
1. Configure Trackier link destination to point to your cashback website
2. Share the Trackier tracking link with users
3. Test the complete flow

## Example Configuration

### Trackier Dashboard Settings:

**Campaign**: Cashback Offer
**Tracking Link**: `https://brandshapers.gotrackier.com/click?campaign_id=4815&pub_id=2&p1={clickid}`
**Final Destination**: `https://yourcashbackwebsite.com/?p1={clickid}`

**OR** (for specific offers):

**Final Destination**: `https://yourcashbackwebsite.com/offers/{offerId}?p1={clickid}`

### Your Website Flow:

1. User clicks Trackier link
2. Trackier redirects to: `yoursite.com/?p1=ABCD1234CLICKID`
3. Your `App.js` captures `p1` parameter
4. Stores in localStorage: `trackier_clickid = "ABCD1234CLICKID"`
5. User browses offers
6. User claims offer (enters UPI ID)
7. Frontend sends clickid to backend
8. Backend sends postback: `GET /postback?click_id=ABCD1234&payout=10&status=1`
9. Trackier records conversion ✅

## Testing

### Test 1: ClickID Capture
```bash
# Visit your site with p1 parameter
https://localhost:3000/?p1=TEST123

# Check browser console
# Should see: "Trackier clickid captured: TEST123"

# Check localStorage
localStorage.getItem('trackier_clickid')
# Should return: "TEST123"
```

### Test 2: Complete Flow
1. Use your Trackier tracking link
2. Land on your cashback website
3. Claim an offer
4. Check Trackier dashboard → Conversions tab
5. Should see conversion recorded ✅

## Troubleshooting

### ClickID Not Captured
- Check URL has `?p1=clickid` parameter
- Check browser console for errors
- Verify `captureClickId()` is called in `App.js`

### Postback Not Sent
- Verify `clickid` is in localStorage
- Check server logs for postback errors
- Verify `TRACKIER_POSTBACK_URL` in `.env`

### Conversion Not in Trackier Dashboard
- Check postback URL format
- Verify click_id matches Trackier clickid
- Check Trackier campaign settings
- Verify payout and status parameters

## Next Steps

1. ✅ Configure Trackier link destination in dashboard
2. ✅ Test clickid capture
3. ✅ Test complete flow
4. ✅ Verify conversions in Trackier dashboard
5. ✅ Start sharing Trackier links with users

## Support

- Trackier Dashboard: https://brandshapers.gotrackier.com
- Check server logs for postback status
- Review `TRACKIER_S2S_INTEGRATION.md` for detailed documentation

