# Trackier Admin Panel - Complete Guide

## What Is the Trackier Admin Panel?

The Trackier Admin Panel is the dashboard where you manage everything related to affiliate marketing and tracking:

- ✔ Offers
- ✔ Affiliates (Publishers)
- ✔ Clicks
- ✔ Installs
- ✔ Conversions
- ✔ Postbacks
- ✔ Reports
- ✔ Settings (API, Tracking Domain, Payouts)

This is where all click data + install data is stored and managed.

---

## 🧭 Main Sections of Trackier Admin Panel

### 1️⃣ Dashboard

**Shows:**
- Total clicks
- Installs
- Conversions
- Revenue
- Top Offers
- Top Publishers

**Use Case:** Get a quick overview of your cashback platform performance.

---

### 2️⃣ Offers

**You can:**
- Create offers
- Add landing pages
- Set payout & caps
- Upload creatives
- Configure postback URLs

**Important for Cashback System:**
- Set postback URL to: `https://yourdomain.com/api/postback`
- Configure payout amounts
- Set offer status (active/inactive)
- Copy `trackierOfferId` to use in your system

---

### 3️⃣ Publishers / Affiliates

**Here you:**
- Approve affiliates
- View each affiliate's statistics
- Assign offers
- Manage payments

**Note:** In your cashback system, you are the publisher/affiliate tracking conversions.

---

### 4️⃣ Clicks Log

**Shows all clicks with:**
- Click ID
- Affiliate ID
- Offer ID
- IP, device, country
- Timestamp

**👉 Important:** If click ID is not showing here, your tracking link is incorrect.

**How to Check:**
1. Go to Trackier Admin → Clicks Log
2. Look for your Click IDs (format: `CLID-xxx`)
3. If not showing, verify:
   - Tracking link format is correct
   - Click ID is being appended to URL
   - Network is receiving the click

---

### 5️⃣ Install Log

**Shows install data:**
- Install event
- Click ID match
- Device ID
- Time
- Status (pending, approved)

**👉 Important:** If install not showing, postback or SDK setup is wrong.

**How to Check:**
1. Go to Trackier Admin → Install Log
2. Look for installs matching your Click IDs
3. If not showing, verify:
   - Postback URL is configured correctly
   - Postback is being sent from your server
   - Click ID matches between click and install

---

### 6️⃣ Postback Log

**Here you can see:**
- Successful postbacks
- Failed postbacks
- Error details

**Very important for fixing install issues.**

**How to Use:**
1. Go to Trackier Admin → Postback Log
2. Check if postbacks are being received
3. Look for errors or failed postbacks
4. Verify Click ID is being sent correctly

**Common Issues:**
- Postback URL incorrect
- Click ID not matching
- Network timeout
- Invalid parameters

---

### 7️⃣ Reports

**Available Reports:**
- Offer Report
- Publisher Report
- Geo Report
- Daily Report
- Event Report

**Use Case:** Analyze performance, track conversions, and optimize offers.

---

### 8️⃣ Settings

**Configuration Options:**
- API Keys
- Advertiser postback setup
- Global Tracking Domain
- Withholding rules
- Finance settings

**Important Settings for Your System:**
1. **API Keys:** Get your `TRACKIER_API_KEY` from here
2. **Postback URL:** Configure where Trackier sends postbacks
3. **Tracking Domain:** Set your tracking domain
4. **Payout Settings:** Configure payout rules

---

## 📌 Troubleshooting: If Your Install or Click is NOT Coming in Admin Panel

### Checklist:

1. **Check Tracking Link:**
   - Format: `https://trackier.com/click?pid=XXX&sub1=CLID-xxx`
   - Verify Click ID is being appended
   - Test the link manually

2. **Check Clicks Log:**
   - Go to Trackier Admin → Clicks Log
   - Search for your Click ID
   - If not found, tracking link is incorrect

3. **Check Install Log:**
   - Go to Trackier Admin → Install Log
   - Look for matching Click ID
   - If not found, postback is not being sent

4. **Check Postback Log:**
   - Go to Trackier Admin → Postback Log
   - Look for failed postbacks
   - Check error messages

### What to Send for Support:

When asking for help, provide:

✔ **Your tracking link** - The full URL with Click ID
✔ **Prelander JS file** - If using prelander
✔ **Postback URL** - Your postback endpoint
✔ **Screenshot of admin → clicks log / install log** - Show what's missing

---

## Integration with Your Cashback System

### How Your System Works with Trackier Admin Panel:

1. **Click Tracking:**
   ```
   User clicks offer → Your system generates Click ID (CLID-xxx)
   → Appends to offer URL → Trackier receives click
   → Shows in Trackier Admin → Clicks Log
   ```

2. **Install Tracking:**
   ```
   User completes offer → Your system sends postback
   → Trackier receives postback → Shows in Install Log
   → Cashback added to user wallet
   ```

3. **Verification:**
   - Check Trackier Admin → Clicks Log for click records
   - Check Trackier Admin → Install Log for conversion records
   - Match Click IDs between your system and Trackier

### Key Fields to Match:

- **Click ID:** Must match between your system and Trackier
- **Offer ID:** Your `trackierOfferId` must match Trackier's offer ID
- **Payout:** Should match between your system and Trackier

---

## Best Practices

1. **Regular Monitoring:**
   - Check Clicks Log daily
   - Monitor Install Log for conversions
   - Review Postback Log for errors

2. **Data Verification:**
   - Compare Click IDs between systems
   - Verify payout amounts match
   - Check conversion rates

3. **Error Handling:**
   - Monitor failed postbacks
   - Fix postback URL issues immediately
   - Update tracking links if needed

4. **Reporting:**
   - Use Reports section for analytics
   - Track top performing offers
   - Monitor publisher performance

---

## Quick Reference

### Trackier Admin Panel URLs (Example):
- Dashboard: `https://brandshapers.trackier.io/dashboard`
- Offers: `https://brandshapers.trackier.io/offers`
- Clicks Log: `https://brandshapers.trackier.io/clicks`
- Install Log: `https://brandshapers.trackier.io/installs`
- Postback Log: `https://brandshapers.trackier.io/postbacks`
- Settings: `https://brandshapers.trackier.io/settings`

### Your System Endpoints:
- Postback Receiver: `https://yourdomain.com/api/postback`
- Click Tracking: `https://yourdomain.com/api/offers/:id/track`
- Generate Click ID: `https://yourdomain.com/api/offers/:id/generate-click`

---

## Support

If you need help fixing tracking issues:

1. Check this guide first
2. Verify all settings in Trackier Admin Panel
3. Check your server logs for errors
4. Compare Click IDs between systems
5. Contact support with:
   - Tracking link
   - Postback URL
   - Screenshots from Trackier Admin Panel
   - Error messages from server logs












