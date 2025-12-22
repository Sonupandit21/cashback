# 🔧 Render Deployment Troubleshooting Guide

## Issue: "Not Found" or 404 Error on Render

If you're getting a "not found" error when accessing `https://cashback-api.onrender.com/api`, follow these steps:

---

## Step 1: Check Render Logs

1. **Go to Render Dashboard**
   - Visit: https://dashboard.render.com
   - Click on your service: `cashback-api`

2. **Check Logs Tab**
   - Click "Logs" in the left sidebar
   - Look for error messages

### Common Log Errors:

**MongoDB Connection Error:**
```
MongoDB Connection Error: ...
```
**Solution:** Check your `MONGODB_URI` environment variable

**Port Error:**
```
Error: listen EADDRINUSE: address already in use
```
**Solution:** Remove `PORT` from env vars (Render sets it automatically)

**Module Not Found:**
```
Error: Cannot find module '...'
```
**Solution:** Dependencies not installed - check build command

---

## Step 2: Verify Environment Variables

In Render Dashboard → Your Service → Environment:

**Required Variables:**
- ✅ `MONGODB_URI` - Must be set and valid
- ✅ `JWT_SECRET` - Must be set
- ✅ `NODE_ENV=production`

**Optional (but recommended):**
- `PORT=10000` (Render sets this automatically, but good to specify)

**Check:**
1. Go to Environment tab
2. Verify all variables are set correctly
3. Make sure there are no extra spaces or quotes
4. Click "Save Changes" if you made updates
5. Service will auto-redeploy

---

## Step 3: Verify Build Settings

In Render Dashboard → Your Service → Settings:

**Build Command:** `npm install`
**Start Command:** `npm start`

**Root Directory:** Leave empty (or set to root of repo)

**Node Version:** Should be compatible (v14+)

---

## Step 4: Test Endpoints

After deployment, test these URLs:

1. **Health Check:**
   ```
   https://cashback-api.onrender.com/health
   ```
   Should return: `{"status":"ok","message":"Server is running",...}`

2. **API Root:**
   ```
   https://cashback-api.onrender.com/api
   ```
   Should return API information

3. **Offers Endpoint:**
   ```
   https://cashback-api.onrender.com/api/offers
   ```
   Should return offers array (empty if no offers)

---

## Step 5: Render Free Tier - Spinning Down

⚠️ **Important:** Render free tier services spin down after 15 minutes of inactivity.

**Symptoms:**
- First request after spin-down takes 30-60 seconds
- You might see "not found" during spin-up

**Solution:**
1. Wait 30-60 seconds after first request
2. Try again - service should be up
3. Or upgrade to paid plan for always-on service

---

## Step 6: Common Issues & Fixes

### Issue: MongoDB Connection Fails

**Check:**
- MongoDB Atlas network access allows all IPs (0.0.0.0/0)
- Connection string has correct password
- Database name is included in connection string
- Connection string format: `mongodb+srv://user:pass@cluster.mongodb.net/dbname?retryWrites=true&w=majority`

**Fix:**
```bash
# Test connection string locally first
# Then update MONGODB_URI in Render
```

### Issue: Server Crashes on Start

**Check Logs for:**
- Missing environment variables
- Syntax errors in code
- Port conflicts

**Fix:**
- Add all required env vars
- Check code for errors
- Remove PORT env var (let Render set it)

### Issue: API Routes Return 404

**Possible Causes:**
1. Service still spinning up (wait 30-60 seconds)
2. Routes not properly configured
3. Static file serving interfering

**Fix:**
- Wait for service to fully start
- Check server.js has all routes
- Verify build completed successfully

### Issue: CORS Errors

**Symptoms:**
- Frontend can't connect to API
- Browser console shows CORS errors

**Fix:**
Update `server/server.js`:
```javascript
app.use(cors({
  origin: [
    'https://your-frontend.vercel.app',
    'http://localhost:3000'
  ],
  credentials: true
}));
```

Then redeploy.

---

## Step 7: Manual Deployment Test

1. **Test Locally First:**
   ```bash
   # Set production env vars locally
   export NODE_ENV=production
   export MONGODB_URI=your-connection-string
   export JWT_SECRET=your-secret
   export PORT=5000
   
   # Start server
   npm start
   
   # Test endpoints
   curl http://localhost:5000/health
   curl http://localhost:5000/api
   ```

2. **If local works but Render doesn't:**
   - Check environment variables match
   - Verify build command installs dependencies
   - Check Render logs for specific errors

---

## Step 8: Force Redeploy

If nothing works:

1. **Manual Redeploy:**
   - Render Dashboard → Your Service
   - Click "Manual Deploy" → "Deploy latest commit"

2. **Clear Build Cache:**
   - Settings → Clear build cache
   - Redeploy

3. **Check Git Repository:**
   - Ensure latest code is pushed to GitHub
   - Verify branch is correct (usually `main`)

---

## Quick Diagnostic Checklist

- [ ] Service shows "Live" status in Render dashboard
- [ ] Logs show "MongoDB Connected"
- [ ] Logs show "Server running on port 10000" (or your port)
- [ ] No error messages in logs
- [ ] Environment variables are set correctly
- [ ] Health endpoint works: `/health`
- [ ] API endpoint works: `/api`
- [ ] Service has finished spinning up (waited 30-60 seconds)

---

## Still Not Working?

1. **Check Render Status Page:**
   - https://status.render.com
   - See if there are any outages

2. **Review Render Documentation:**
   - https://render.com/docs

3. **Common Final Checks:**
   - Is your GitHub repo private? (Render free tier supports public repos)
   - Is your service on free tier? (Check plan in settings)
   - Are you hitting rate limits? (Check usage dashboard)

---

## Test Commands

After deployment, test with curl or browser:

```bash
# Health check
curl https://cashback-api.onrender.com/health

# API root
curl https://cashback-api.onrender.com/api

# Offers endpoint
curl https://cashback-api.onrender.com/api/offers
```

Expected responses:
- `/health` → `{"status":"ok",...}`
- `/api` → `{"message":"Cashback API is running",...}`
- `/api/offers` → `[]` (or array of offers)

---

**Need More Help?** Check the main [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed setup instructions.



