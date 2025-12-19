# Tracker Data Preservation

## Important: Tracker Data is NOT Deleted When UPI Records are Deleted

When a UPI record is deleted from the admin panel, **all tracker/postback data is preserved**. This ensures:

1. **Analytics Integrity** - Historical tracking data remains intact
2. **Audit Trail** - Complete record of clicks, conversions, and postbacks
3. **Reporting Accuracy** - Statistics remain accurate even after UPI cleanup

---

## How It Works

### Data Relationships

```
User
  ├── UPI Records (can be deleted)
  ├── Click Records (preserved)
  └── Postback Records (preserved)

Offer
  ├── UPI Records (can be deleted)
  ├── Click Records (preserved)
  └── Postback Records (preserved)
```

### When UPI is Deleted

1. **UPI Record** → Deleted ✅
2. **User's offersClaimed** → Updated (removes claim entry)
3. **Click Records** → **PRESERVED** ✅
4. **Postback Records** → **PRESERVED** ✅

---

## Why Tracker Data is Preserved

### 1. Independent Data Models

- **UPI Model**: Stores UPI ID and claim status
- **Click Model**: Stores click tracking data (linked by userId + offerId)
- **Postback Model**: Stores conversion/postback data (linked by userId + offerId)

These are **separate collections** with no cascade delete relationships.

### 2. Analytics Requirements

Tracker data is needed for:
- Performance metrics
- Conversion tracking
- Revenue reporting
- Historical analysis
- Compliance/audit purposes

### 3. No Cascade Delete

Mongoose models don't have cascade delete configured:
```javascript
// Postback Model
userId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  index: true
  // No cascade delete configured
}

// Click Model
userId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  required: true
  // No cascade delete configured
}
```

---

## What Happens When UPI is Deleted

### API Response

```json
{
  "message": "UPI record deleted successfully",
  "trackerDataPreserved": {
    "clicks": 5,
    "postbacks": 3,
    "note": "Tracker/Postback records are preserved for analytics and will remain visible in Trackier Stats"
  }
}
```

### Server Logs

```
Deleting UPI record: {
  upiId: 'user@paytm',
  userId: '507f1f77bcf86cd799439011',
  offerId: '507f1f77bcf86cd799439012',
  clickRecords: 5,
  postbackRecords: 3,
  note: 'Tracker data will be preserved'
}

✅ UPI record deleted. Tracker data preserved: {
  clicks: 5,
  postbacks: 3,
  userId: '507f1f77bcf86cd799439011',
  offerId: '507f1f77bcf86cd799439012',
  message: 'Click and Postback records remain intact for analytics'
}
```

---

## Viewing Tracker Data After UPI Deletion

### Trackier Stats Dashboard

Even after UPI deletion, you can still view:
- **Clicks** - All click records for the user/offer
- **Installs** - All postback/conversion records
- **Payouts** - All payout records

### Filtering

Tracker stats can be filtered by:
- User ID
- Offer ID
- Date range
- Status

**Note**: UPI records are not required to view tracker data.

---

## Manual Tracker Data Deletion

If you need to delete tracker data (not recommended), you must do it separately:

### Delete Clicks
```javascript
await Click.deleteMany({ userId: userId, offerId: offerId });
```

### Delete Postbacks
```javascript
await Postback.deleteMany({ userId: userId, offerId: offerId });
```

**Warning**: This will permanently remove analytics data. Use with caution.

---

## Best Practices

### ✅ DO
- Delete UPI records when cleaning up invalid claims
- Keep tracker data for analytics
- Use tracker data for reporting and metrics
- Filter tracker stats by user/offer even after UPI deletion

### ❌ DON'T
- Delete tracker data when cleaning up UPI records
- Rely on UPI records for analytics (use Click/Postback instead)
- Delete users/offers if you want to preserve historical data

---

## Troubleshooting

### Issue: Tracker stats not showing after UPI deletion

**Solution**: 
- Tracker stats are independent of UPI records
- Check if user/offer IDs are correct
- Verify Click/Postback records exist in database
- Check date filters in admin panel

### Issue: Want to delete tracker data

**Solution**:
- Use separate deletion endpoints (if implemented)
- Or delete directly from database:
  ```javascript
  // Delete clicks
  db.clicks.deleteMany({ userId: ObjectId("...") })
  
  // Delete postbacks
  db.postbacks.deleteMany({ userId: ObjectId("...") })
  ```

---

## Summary

✅ **UPI deletion** → Only removes UPI record and user claim entry
✅ **Tracker data** → Always preserved (clicks, postbacks, conversions)
✅ **Analytics** → Remains accurate and complete
✅ **Reporting** → Historical data always available

**Key Point**: UPI records and tracker data are **independent**. Deleting UPI does NOT affect tracker/postback records.

---

**Last Updated**: 2024
**Version**: 1.0















