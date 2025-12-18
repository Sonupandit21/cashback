# Trackier Click ID Testing Guide

## How Click Tracking Works

1. **When User Clicks on Offer Card** → Click is tracked
2. **When User Views Offer Detail Page** → Click is tracked (if logged in)
3. **When User Clicks "Track" Button** → Click is tracked
4. **Click ID is Generated** → Unique ID stored in database
5. **When User Claims Offer** → Conversion tracked using Click ID

## Testing Click IDs

### Step 1: Check if Click IDs are Being Stored

Run the check script:
```bash
npm run check-clicks
```

This will show:
- All click records in database
- Click IDs for each click
- Conversion status
- Statistics

### Step 2: Test Click Tracking

1. **Make sure you have an offer with `trackierOfferId`:**
   - Go to Admin Panel
   - Create/Edit an offer
   - Add `trackierOfferId` field (e.g., "test123")

2. **Login as a user** (not admin)

3. **Click on an offer:**
   - Go to Offers page
   - Click on any offer card
   - This should trigger click tracking

4. **Check the database:**
   ```bash
   npm run check-clicks
   ```

### Step 3: Verify Click IDs

The script will show:
```
✅ Found X click record(s):

1. Click Record:
   - Click ID: abc123def456...
   - User: John Doe (john@example.com)
   - Offer: Amazon Cashback
   - Trackier Offer ID: test123
   - Converted: ❌ No
   - Created At: 2024-01-01 12:00:00
```

## Troubleshooting

### No Click Records Found

**Possible Issues:**
1. **User not logged in** - Click tracking requires authentication
2. **Offer doesn't have trackierOfferId** - Check admin panel
3. **API endpoint not being called** - Check browser console for errors
4. **Server not running** - Make sure server is started

**Check:**
- Browser console for errors
- Server logs for tracking errors
- Network tab to see if `/api/offers/:id/track` is being called

### Click ID Not Generated

**Check:**
- Trackier API key is set in `.env`
- `TRACKIER_API_KEY` is configured
- Server logs for API errors

### Click ID Generated But Not Stored

**Check:**
- MongoDB connection is working
- Click model is properly imported
- Check server logs for database errors

## Expected Flow

1. User clicks offer → `POST /api/offers/:id/track` called
2. Click ID generated → Stored in database
3. User claims offer → Conversion tracked with Click ID
4. Click record updated → `converted: true`

## Manual Testing

### Test Click Tracking API Directly

```bash
# Replace with actual token and offer ID
curl -X POST http://localhost:5000/api/offers/OFFER_ID/track \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

Expected Response:
```json
{
  "message": "Click tracked successfully",
  "clickId": "abc123def456..."
}
```

## Database Query

You can also check directly in MongoDB:

```javascript
// In MongoDB shell or Compass
db.clicks.find().pretty()

// Count clicks
db.clicks.count()

// Find clicks for a specific user
db.clicks.find({ userId: ObjectId("USER_ID") })

// Find converted clicks
db.clicks.find({ converted: true })
```

## Next Steps

After verifying click IDs are being stored:
1. Test conversion tracking
2. Check Trackier dashboard for tracked events
3. Verify click-to-conversion flow


















