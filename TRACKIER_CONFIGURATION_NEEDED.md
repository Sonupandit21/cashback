# Trackier Configuration - What You Need to Share

## 📋 Current System Configuration

Based on your code, here's what I found:

### 1️⃣ **Your Tracking Link Format**

Your system currently generates tracking links like this:

**Current Format:**
```
[YOUR_OFFER_URL]?click_id={click_id}&sub1={click_id}&p1={click_id}
```

**Example:**
```
https://www.amazon.com/?click_id=CLID-ABC123&sub1=CLID-ABC123&p1=CLID-ABC123
```

**What Trackier Needs:**
```
https://click.trackier.io/c/{trackier_offer_id}?pid={publisher_id}&sub1={click_id}
```

### 2️⃣ **Your Postback URL**

**Current Postback Endpoint:**
```
POST/GET https://YOUR_DOMAIN.com/api/postback
```

**Accepts Parameters:**
- `click_id` or `clickid` (required)
- `payout` (optional)
- `status` (1 = approved, 0 = rejected)
- `conversion_id` (optional)
- `offer_id` (optional)
- `publisher_id` (optional)

**Example Postback URL:**
```
https://YOUR_DOMAIN.com/api/postback?click_id={sub1}&payout={payout}&status={status}&event=install
```

## 🔍 What I Need From You

### **STEP 1: Share These 2 Things**

#### 1️⃣ **Your Tracking Link** (from Trackier Admin Panel)

**Where to find:**
- Go to Trackier Admin → Offers
- Select your offer (Amazon/Flipkart/etc.)
- Copy the tracking link

**Format should be:**
```
https://click.trackier.io/c/xxxxx?pid=123&sub1={click_id}
```

**OR if you're using a different format, paste it here:**

```
[PASTE YOUR TRACKING LINK HERE]
```

#### 2️⃣ **Your Postback URL** (for Trackier to send conversions)

**Your current postback endpoint:**
```
https://YOUR_DOMAIN.com/api/postback
```

**What Trackier needs:**
```
https://YOUR_DOMAIN.com/api/postback?click_id={sub1}&payout={payout}&status={status}&event=install
```

**Please provide:**
- Your actual domain (replace YOUR_DOMAIN)
- Example: `https://cashback.example.com/api/postback`

**Paste here:**
```
[PASTE YOUR POSTBACK URL HERE]
```

### **STEP 2: Which Offer to Fix?**

Please tell me which offer you want to fix first:
- [ ] Amazon
- [ ] Flipkart  
- [ ] Sudoku
- [ ] Other: _______________

## 📝 Current System Flow

### How Your System Works:

1. **User Clicks Offer:**
   - System generates Click ID: `CLID-ABC123`
   - Appends to offer URL: `?click_id=CLID-ABC123&sub1=CLID-ABC123&p1=CLID-ABC123`
   - Redirects user to offer

2. **User Installs App:**
   - Trackier detects install
   - Trackier sends postback to your server

3. **Postback Received:**
   - Your server receives: `/api/postback?click_id=CLID-ABC123&payout=25&status=1`
   - System updates click status to "Converted"
   - User wallet updated

## 🔧 What Needs to Be Fixed

### Issue 1: Tracking Link Format

**Problem:** Your tracking link might not be in the correct Trackier format

**Solution:** Need to see your actual tracking link to fix it

### Issue 2: Postback URL Configuration

**Problem:** Trackier needs to know where to send postbacks

**Solution:** Need your domain to configure postback URL

### Issue 3: Click ID Parameter Mapping

**Problem:** Trackier uses `sub1` parameter, your system uses `click_id`

**Solution:** Need to ensure both are mapped correctly

## ✅ After You Share

Once you provide:
1. ✅ Your Tracking Link
2. ✅ Your Postback URL  
3. ✅ Which offer to fix

I will:
- ✅ Correct the tracking link format
- ✅ Configure postback URL properly
- ✅ Generate test cURL command to manually convert install
- ✅ Fix the status update from Pending → Converted

## 🧪 Testing Requirements

**Important:** Don't test from localhost (IP ::1)

**Why:** Advertisers ignore localhost traffic

**Test from:**
- ✅ Mobile device
- ✅ 4G/5G network (not WiFi)
- ✅ Real device
- ✅ Tracking link → Install → Open app

**Only then postback will fire!**

## 📞 Next Steps

1. **Copy your tracking link from Trackier Admin Panel**
2. **Provide your domain for postback URL**
3. **Tell me which offer to fix**
4. **I'll provide corrected configuration + test cURL**

---

## 🔍 Quick Check: Your Current Setup

**To find your tracking link:**
1. Login to Trackier Admin Panel
2. Go to: Offers → [Select Offer]
3. Look for: "Tracking Link" or "Click URL"
4. Copy and paste here

**To find your domain:**
- What domain is your cashback website hosted on?
- Example: `cashback.example.com` or `www.example.com`
- Your postback URL will be: `https://YOUR_DOMAIN/api/postback`

**Paste both here and I'll fix everything!** 🚀










