# 🚀 Production Deployment Guide
## Vercel (Frontend) + Render (Backend)

Simple, step-by-step guide to deploy your Cashback Platform.

---

## Prerequisites

- ✅ Code pushed to GitHub repository
- ✅ Render account: [render.com](https://render.com)
- ✅ Vercel account: [vercel.com](https://vercel.com)
- ✅ MongoDB Atlas account: [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) (free tier works)

---

## Step 1: MongoDB Setup

### 1.1 Create MongoDB Atlas Cluster

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up → Create free cluster (M0)
3. Choose region closest to your Render region
4. Click "Create Cluster"

### 1.2 Configure Database Access

1. Go to **Database Access** → **Add New Database User**
2. Username: `cashback-user` (or your choice)
3. Password: Generate secure password (save it!)
4. Privileges: **Read and write to any database**
5. Click **Add User**

### 1.3 Configure Network Access

1. Go to **Network Access** → **Add IP Address**
2. Click **Allow Access from Anywhere** (or add specific IPs)
3. Click **Confirm**

### 1.4 Get Connection String

1. Go to **Database** → **Connect**
2. Choose **Connect your application**
3. Copy connection string
4. Replace `<password>` with your database password
5. Replace `<dbname>` with `cashback`

**Example:**
```
mongodb+srv://cashback-user:YourPassword123@cluster0.xxxxx.mongodb.net/cashback?retryWrites=true&w=majority
```

**Save this connection string** — you'll need it for Render.

---

## Step 2: Deploy Backend to Render

### 2.1 Create Web Service

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click **New** → **Web Service**
3. Connect GitHub → Select your `cashback` repository
4. Click **Connect**

### 2.2 Configure Settings

**Basic Settings:**
- **Name**: `cashback-api`
- **Region**: Choose closest to your users
- **Branch**: `main` (or your production branch)
- **Root Directory**: Leave empty
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

**Environment Variables:**
Click **Add Environment Variable** and add:

```
MONGODB_URI=mongodb+srv://cashback-user:YourPassword123@cluster0.xxxxx.mongodb.net/cashback?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-change-this
NODE_ENV=production
PORT=10000
ALLOWED_ORIGINS=https://your-user-app.vercel.app,https://your-admin-app.vercel.app
```

**Note:** Update `ALLOWED_ORIGINS` after deploying frontends (add both Vercel URLs, comma-separated)

**Optional (if using Trackier):**
```
TRACKIER_API_URL=https://brandshapers.trackier.io
TRACKIER_API_KEY=your-trackier-api-key
TRACKIER_PUBLISHER_ID=your-publisher-id
TRACKIER_ADVERTISER_ID=your-advertiser-id
```

**Plan:**
- Select **Free** (or paid for production)

### 2.3 Deploy

1. Click **Create Web Service**
2. Wait 5-10 minutes for deployment
3. Check **Logs** tab — look for `MongoDB Connected` and `Server running on port 10000`
4. Test API: Visit `https://cashback-api.onrender.com/api/offers` (should return JSON)

**Save your backend URL:** `https://cashback-api.onrender.com`

---

## Step 3: Deploy User Frontend to Vercel

### 3.1 Import Project

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **Add New** → **Project**
3. Import your GitHub repository: `cashback`
4. Click **Import**

### 3.2 Configure Build Settings

**Framework Preset:** Create React App (auto-detected)

**Root Directory:** `frontend/client`

**Build Settings:**
- **Build Command**: `npm run build`
- **Output Directory**: `build`
- **Install Command**: `npm install`

**Environment Variables:**
Click **Add** and add:

```
REACT_APP_API_BASE_URL=https://cashback-api.onrender.com/api
```

Replace `cashback-api` with your actual Render service name.

### 3.3 Deploy

1. Click **Deploy**
2. Wait 2-5 minutes
3. Your frontend is live at: `https://your-project-name.vercel.app`

**Save your frontend URL.**

---

## Step 4: Deploy Admin Frontend to Vercel

### 4.1 Create Second Project

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **Add New** → **Project**
3. Select the same repository: `cashback`
4. Click **Import**

### 4.2 Configure Build Settings

**Root Directory:** `frontend/admin`

**Build Settings:**
- **Build Command**: `npm run build`
- **Output Directory**: `build`
- **Install Command**: `npm install`

**Environment Variables:**
```
REACT_APP_API_BASE_URL=https://cashback-api.onrender.com/api
```

### 4.3 Deploy

1. Click **Deploy**
2. Wait 2-5 minutes
3. Your admin panel is live at: `https://your-admin-project-name.vercel.app`

**Save your admin URL.**

---

## Step 5: Update CORS Configuration

After deploying both frontends, update CORS in Render:

1. Go to Render dashboard → Your backend service
2. Click **Environment** tab
3. Find `ALLOWED_ORIGINS` variable
4. Update with both Vercel URLs (comma-separated):
   ```
   ALLOWED_ORIGINS=https://your-user-frontend.vercel.app,https://your-admin-frontend.vercel.app
   ```
5. Click **Save Changes** → Render will auto-redeploy

**Note:** CORS is now configured via environment variable. No code changes needed!

---

## Step 6: Create Admin User

### Option A: Using Render Shell (Recommended)

1. Go to Render dashboard → Your backend service
2. Click **Shell** tab
3. Wait for connection
4. Run:
```bash
node server/scripts/createAdmin.js admin@example.com admin123 "Admin Name"
```

### Option B: Using Local Machine

1. Set environment variables locally:
```bash
export MONGODB_URI="your-mongodb-connection-string"
export JWT_SECRET="your-jwt-secret"
```

2. Run:
```bash
node server/scripts/createAdmin.js admin@example.com admin123 "Admin Name"
```

**Default credentials:**
- Email: `admin@example.com`
- Password: `admin123`

⚠️ **Change password immediately after first login!**

---

## Step 7: Verify Deployment

### Test User Frontend
1. Visit: `https://your-user-frontend.vercel.app`
2. Try registering a new user
3. Check browser console for errors

### Test Admin Frontend
1. Visit: `https://your-admin-frontend.vercel.app`
2. Login with admin credentials
3. Verify dashboard loads

### Test API
1. Visit: `https://cashback-api.onrender.com/api/offers`
2. Should return JSON (empty array if no offers)

---

## Quick Troubleshooting

### Backend Issues

**MongoDB Connection Error**
- ✅ Check `MONGODB_URI` in Render environment variables
- ✅ Verify MongoDB network access allows all IPs
- ✅ Check username/password are correct

**Server Crashes**
- ✅ Check Render logs for errors
- ✅ Verify all environment variables are set
- ✅ Ensure `JWT_SECRET` is set

### Frontend Issues

**API Calls Fail (404/Network Error)**
- ✅ Verify `REACT_APP_API_BASE_URL` in Vercel environment variables
- ✅ Ensure URL ends with `/api`
- ✅ Check backend URL is accessible
- ✅ Restart Vercel deployment after adding env vars

**Build Fails**
- ✅ Check Vercel build logs
- ✅ Verify `package.json` has correct build script
- ✅ Ensure all dependencies are installed

---

## Important Notes

### Render Free Tier
- ⚠️ Services spin down after 15 minutes of inactivity (first request takes 30-60 seconds)
- ⚠️ Ephemeral storage — files in `uploads/` are lost on restart (use cloud storage for production)
- ⚠️ Limited build minutes per month

### Vercel Free Tier
- ✅ 6000 build minutes/month
- ✅ 100GB bandwidth/month
- ✅ Auto HTTPS and CDN

### Security
- ✅ Use strong `JWT_SECRET` (32+ characters)
- ✅ Use strong MongoDB password
- ✅ Never commit `.env` files
- ✅ HTTPS enabled by default on both platforms

---

## Deployment Checklist

- [ ] MongoDB Atlas cluster created
- [ ] Database user created with read/write permissions
- [ ] Network access configured (allow all IPs)
- [ ] Backend deployed to Render with all environment variables
- [ ] Backend URL accessible (`/api/offers` returns JSON)
- [ ] User frontend deployed to Vercel with `REACT_APP_API_BASE_URL`
- [ ] Admin frontend deployed to Vercel with `REACT_APP_API_BASE_URL`
- [ ] CORS updated (if needed)
- [ ] Admin user created
- [ ] Tested user registration/login
- [ ] Tested admin login
- [ ] All URLs saved

---

## Your Production URLs

After deployment:

- **Backend API**: `https://cashback-api.onrender.com`
- **User Frontend**: `https://your-user-app.vercel.app`
- **Admin Frontend**: `https://your-admin-app.vercel.app`

---

## Continuous Deployment

Both platforms auto-deploy on every push to `main`:
- ✅ Push to GitHub → Auto-deploy to Render
- ✅ Push to GitHub → Auto-deploy to Vercel

---

**Done! 🎉**

