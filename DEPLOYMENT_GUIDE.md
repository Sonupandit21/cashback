# 🚀 Production Deployment Guide
## MERN Stack: Render (Backend + Database) + Vercel (Frontend)

This guide will walk you through deploying your Cashback Offers Platform to production using:
- **Render** for backend API and MongoDB database
- **Vercel** for frontend applications (User & Admin panels)

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step 1: Set Up MongoDB Database (Render)](#step-1-set-up-mongodb-database-render)
3. [Step 2: Deploy Backend to Render](#step-2-deploy-backend-to-render)
4. [Step 3: Deploy User Frontend to Vercel](#step-3-deploy-user-frontend-to-vercel)
5. [Step 4: Deploy Admin Frontend to Vercel](#step-4-deploy-admin-frontend-to-vercel)
6. [Step 5: Post-Deployment Configuration](#step-5-post-deployment-configuration)
7. [Step 6: Create Admin User](#step-6-create-admin-user)
8. [Troubleshooting](#troubleshooting)
9. [Important Notes](#important-notes)

---

## Prerequisites

- ✅ GitHub account with your code pushed to a repository
- ✅ Render account (sign up at [render.com](https://render.com))
- ✅ Vercel account (sign up at [vercel.com](https://vercel.com))
- ✅ MongoDB Atlas account (or use Render's MongoDB service)

---

## Step 1: Set Up MongoDB Database (Render)

### Option A: MongoDB Atlas (Recommended for Production)

1. **Create MongoDB Atlas Account**
   - Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
   - Sign up for a free account

2. **Create a Cluster**
   - Click "Create" → "Cluster"
   - Choose "M0 Free" tier
   - Select a cloud provider and region (choose closest to your Render region)
   - Click "Create Cluster"

3. **Configure Database Access**
   - Go to "Database Access" → "Add New Database User"
   - Create a username and password (save these!)
   - Set privileges to "Read and write to any database"
   - Click "Add User"

4. **Configure Network Access**
   - Go to "Network Access" → "Add IP Address"
   - Click "Allow Access from Anywhere" (or add Render's IP ranges)
   - Click "Confirm"

5. **Get Connection String**
   - Go to "Database" → "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `cashback` (or your preferred database name)
   - Example: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/cashback?retryWrites=true&w=majority`

### Option B: Render MongoDB (Alternative)

1. **Create MongoDB Service on Render**
   - Go to [dashboard.render.com](https://dashboard.render.com)
   - Click "New" → "MongoDB"
   - Name: `cashback-db`
   - Plan: Free (or paid for production)
   - Click "Create Database"
   - Wait for provisioning (2-3 minutes)

2. **Get Connection String**
   - Once created, click on your database
   - Copy the "Internal Database URL" (for Render services) or "External Connection String" (for external access)
   - Format: `mongodb://username:password@host:port/database`

---

## Step 2: Deploy Backend to Render

### 2.1 Create Web Service

1. **Connect GitHub Repository**
   - Go to [dashboard.render.com](https://dashboard.render.com)
   - Click "New" → "Web Service"
   - Connect your GitHub account if not already connected
   - Select your repository: `cashback`

2. **Configure Service Settings**

   **Basic Settings:**
   - **Name**: `cashback-api` (or your preferred name)
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or your production branch)
   - **Root Directory**: Leave empty (root of repo)
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

   **Environment Variables:**
   Click "Add Environment Variable" and add:

   ```
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/cashback?retryWrites=true&w=majority
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   NODE_ENV=production
   PORT=10000
   ```

   **Optional Trackier Variables** (if using Trackier):
   ```
   TRACKIER_API_URL=https://brandshapers.gotrackier.com
   TRACKIER_API_KEY=your-trackier-api-key
   TRACKIER_PUBLISHER_ID=your-publisher-id
   TRACKIER_ADVERTISER_ID=your-advertiser-id
   TRACKIER_POSTBACK_URL=https://brandshapers.gotrackier.com/postback
   ```

3. **Advanced Settings**
   - **Plan**: Free (or paid for production)
   - **Auto-Deploy**: Yes (deploys on every push to main branch)

4. **Create Service**
   - Click "Create Web Service"
   - Wait for deployment (5-10 minutes)
   - Your backend URL will be: `https://cashback-api.onrender.com` (or your service name)

### 2.2 Important: File Uploads Limitation

⚠️ **Render's free tier has ephemeral storage** - uploaded files in the `uploads/` directory will be lost on restart.

**Solutions:**
1. **Use Cloud Storage** (Recommended):
   - AWS S3, Cloudinary, or similar
   - Update your upload routes to use cloud storage

2. **Use Render Disk** (Paid):
   - Upgrade to paid plan and use persistent disk

3. **Temporary Solution**:
   - Files will work but won't persist across deployments
   - Acceptable for development/testing

### 2.3 Verify Backend Deployment

1. **Check Logs**
   - In Render dashboard, go to your service → "Logs"
   - Look for: `MongoDB Connected` and `Server running on port 10000`

2. **Test API Endpoint**
   - Visit: `https://your-api-name.onrender.com/api/offers`
   - Should return JSON (empty array if no offers)

3. **Note Your Backend URL**
   - Copy the URL: `https://your-api-name.onrender.com`
   - You'll need this for frontend configuration

---

## Step 3: Deploy User Frontend to Vercel

### 3.1 Import Project

1. **Go to Vercel Dashboard**
   - Visit [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "Add New" → "Project"

2. **Import Repository**
   - Connect GitHub if not already connected
   - Select your repository: `cashback`
   - Click "Import"

### 3.2 Configure Build Settings

**Framework Preset:** Create React App (auto-detected)

**Root Directory:** `frontend/client`

**Build Settings:**
- **Build Command**: `npm run build`
- **Output Directory**: `build`
- **Install Command**: `npm install`

**Environment Variables:**
Click "Add" and add:

```
REACT_APP_API_BASE_URL=https://your-api-name.onrender.com/api
```

Replace `your-api-name` with your actual Render backend service name.

### 3.3 Deploy

1. Click "Deploy"
2. Wait for build to complete (2-5 minutes)
3. Your frontend will be live at: `https://your-project-name.vercel.app`

### 3.4 Custom Domain (Optional)

1. Go to your project → "Settings" → "Domains"
2. Add your custom domain
3. Follow DNS configuration instructions

---

## Step 4: Deploy Admin Frontend to Vercel

### 4.1 Create Second Project

1. **Go to Vercel Dashboard**
   - Click "Add New" → "Project"
   - Select the same repository: `cashback`

2. **Configure Build Settings**

   **Root Directory:** `frontend/admin`

   **Build Settings:**
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
   - **Install Command**: `npm install`

   **Environment Variables:**
   ```
   REACT_APP_API_BASE_URL=https://your-api-name.onrender.com/api
   ```

3. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your admin panel will be live at: `https://your-admin-project-name.vercel.app`

### 4.2 Alternative: Use Vercel Monorepo

If you want both frontends in one project:

1. **Create `vercel.json` in root** (or update existing):
```json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/client/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    },
    {
      "src": "frontend/admin/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ],
  "routes": [
    {
      "src": "/admin/(.*)",
      "dest": "/admin/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/client/$1"
    }
  ]
}
```

This approach is more complex - separate projects are recommended.

---

## Step 5: Post-Deployment Configuration

### 5.1 Update CORS Settings (If Needed)

If you encounter CORS errors, update `server/server.js`:

```javascript
// Update CORS to allow your Vercel domains
app.use(cors({
  origin: [
    'https://your-user-frontend.vercel.app',
    'https://your-admin-frontend.vercel.app',
    'http://localhost:3000', // For local development
    'http://localhost:3002'  // For local development
  ],
  credentials: true
}));
```

Then redeploy to Render.

### 5.2 Verify Environment Variables

**Backend (Render):**
- ✅ `MONGODB_URI` - MongoDB connection string
- ✅ `JWT_SECRET` - Strong secret key
- ✅ `NODE_ENV=production`
- ✅ `PORT=10000` (Render sets this automatically, but good to specify)

**Frontend - User (Vercel):**
- ✅ `REACT_APP_API_BASE_URL` - Your Render backend URL + `/api`

**Frontend - Admin (Vercel):**
- ✅ `REACT_APP_API_BASE_URL` - Your Render backend URL + `/api`

### 5.3 Test the Deployment

1. **User Frontend:**
   - Visit: `https://your-user-frontend.vercel.app`
   - Try registering a new user
   - Check browser console for errors

2. **Admin Frontend:**
   - Visit: `https://your-admin-frontend.vercel.app`
   - Try logging in (after creating admin user)

3. **API Endpoints:**
   - Test: `https://your-api.onrender.com/api/offers`
   - Should return JSON response

---

## Step 6: Create Admin User

### 6.1 Using Render Shell

1. **Open Render Shell**
   - Go to your backend service on Render
   - Click "Shell" tab
   - Wait for connection

2. **Run Admin Creation Script**
   ```bash
   node server/scripts/createAdmin.js admin@example.com admin123 "Admin Name"
   ```

   Or use default:
   ```bash
   node server/scripts/createAdmin.js
   ```

### 6.2 Using Local Machine (Alternative)

1. **Set Environment Variables Locally**
   ```bash
   export MONGODB_URI="your-mongodb-connection-string"
   export JWT_SECRET="your-jwt-secret"
   ```

2. **Run Script**
   ```bash
   node server/scripts/createAdmin.js admin@example.com admin123 "Admin Name"
   ```

### 6.3 Default Admin Credentials

After running the script:
- **Email**: `admin@example.com`
- **Password**: `admin123`

⚠️ **IMPORTANT**: Change the password immediately after first login!

---

## Troubleshooting

### Backend Issues

**Problem: MongoDB Connection Error**
- ✅ Check `MONGODB_URI` in Render environment variables
- ✅ Verify MongoDB network access allows Render IPs
- ✅ Check MongoDB username/password are correct
- ✅ Ensure database name is included in connection string

**Problem: Server Crashes on Start**
- ✅ Check Render logs for error messages
- ✅ Verify all environment variables are set
- ✅ Ensure `package.json` has correct start script
- ✅ Check Node.js version compatibility

**Problem: CORS Errors**
- ✅ Update CORS settings in `server/server.js` to include Vercel domains
- ✅ Redeploy backend after changes

### Frontend Issues

**Problem: API Calls Fail (404 or Network Error)**
- ✅ Verify `REACT_APP_API_BASE_URL` is set correctly in Vercel
- ✅ Check backend URL is accessible (visit in browser)
- ✅ Ensure backend URL includes `/api` at the end
- ✅ Check browser console for exact error

**Problem: Build Fails on Vercel**
- ✅ Check build logs for specific errors
- ✅ Verify `package.json` has correct build script
- ✅ Ensure all dependencies are in `package.json` (not just devDependencies)
- ✅ Check for TypeScript errors if using TS

**Problem: Environment Variables Not Working**
- ✅ Restart Vercel deployment after adding env vars
- ✅ Verify variable names start with `REACT_APP_` for Create React App
- ✅ Check for typos in variable names

### Database Issues

**Problem: Data Not Persisting**
- ✅ Verify MongoDB connection string is correct
- ✅ Check MongoDB Atlas cluster is running
- ✅ Verify database user has read/write permissions

**Problem: Slow Queries**
- ✅ Check MongoDB Atlas cluster tier (free tier has limitations)
- ✅ Add indexes for frequently queried fields
- ✅ Monitor MongoDB Atlas metrics

---

## Important Notes

### ⚠️ Render Free Tier Limitations

1. **Spinning Down**: Free services spin down after 15 minutes of inactivity
   - First request after spin-down takes 30-60 seconds
   - Consider upgrading to paid plan for production

2. **Ephemeral Storage**: Files in `uploads/` directory are lost on restart
   - Use cloud storage (S3, Cloudinary) for production
   - Or upgrade to paid plan with persistent disk

3. **Build Time**: Free tier has limited build minutes per month
   - Monitor usage in Render dashboard

### ⚠️ Vercel Free Tier Limitations

1. **Build Time**: 6000 build minutes/month
2. **Bandwidth**: 100GB/month
3. **Function Execution**: 100GB-hours/month

### 🔒 Security Best Practices

1. **JWT Secret**: Use a strong, random secret (at least 32 characters)
   ```bash
   # Generate a secure secret
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **MongoDB Password**: Use a strong password
3. **Environment Variables**: Never commit `.env` files to Git
4. **HTTPS**: Both Render and Vercel provide HTTPS by default ✅

### 📊 Monitoring

1. **Render Logs**: Monitor backend logs in Render dashboard
2. **Vercel Analytics**: Enable Vercel Analytics for frontend monitoring
3. **MongoDB Atlas**: Monitor database performance in Atlas dashboard

### 🔄 Continuous Deployment

Both Render and Vercel automatically deploy on every push to your main branch:
- ✅ Push to GitHub → Auto-deploy to Render
- ✅ Push to GitHub → Auto-deploy to Vercel

### 📝 Updating Environment Variables

**Render:**
1. Go to service → "Environment"
2. Add/Update variables
3. Click "Save Changes"
4. Service will automatically redeploy

**Vercel:**
1. Go to project → "Settings" → "Environment Variables"
2. Add/Update variables
3. Redeploy project (or wait for next push)

---

## 🎉 Deployment Checklist

- [ ] MongoDB database created and accessible
- [ ] Backend deployed to Render with all environment variables
- [ ] Backend URL accessible and API endpoints working
- [ ] User frontend deployed to Vercel with `REACT_APP_API_BASE_URL`
- [ ] Admin frontend deployed to Vercel with `REACT_APP_API_BASE_URL`
- [ ] CORS configured to allow Vercel domains
- [ ] Admin user created
- [ ] Tested user registration/login
- [ ] Tested admin login
- [ ] File uploads configured (if using cloud storage)
- [ ] Custom domains configured (optional)
- [ ] Monitoring set up

---

## 📞 Support Resources

- **Render Docs**: [render.com/docs](https://render.com/docs)
- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **MongoDB Atlas Docs**: [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)

---

## 🚀 Quick Reference: URLs

After deployment, you'll have:

- **Backend API**: `https://your-api-name.onrender.com`
- **User Frontend**: `https://your-user-app.vercel.app`
- **Admin Frontend**: `https://your-admin-app.vercel.app`

Save these URLs for easy access!

---

**Happy Deploying! 🎊**



