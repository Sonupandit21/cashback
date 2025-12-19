# 🚀 Quick Deployment Checklist

Use this checklist during deployment to ensure nothing is missed.

## Pre-Deployment

- [ ] Code pushed to GitHub repository
- [ ] All local changes committed
- [ ] `.env` files are NOT committed (check `.gitignore`)
- [ ] Tested locally and everything works

## Step 1: MongoDB Setup

- [ ] MongoDB Atlas account created OR Render MongoDB service created
- [ ] Database user created with read/write permissions
- [ ] Network access configured (allow all IPs or specific IPs)
- [ ] Connection string copied and saved securely
- [ ] Connection string tested locally

## Step 2: Backend (Render)

- [ ] Render account created
- [ ] GitHub repository connected to Render
- [ ] Web service created with correct settings:
  - [ ] Name: `cashback-api`
  - [ ] Build Command: `npm install`
  - [ ] Start Command: `npm start`
- [ ] Environment variables added:
  - [ ] `MONGODB_URI` (with password replaced)
  - [ ] `JWT_SECRET` (strong random secret)
  - [ ] `NODE_ENV=production`
  - [ ] `PORT=10000`
  - [ ] Trackier variables (if using)
- [ ] Service deployed successfully
- [ ] Backend URL saved: `https://________________.onrender.com`
- [ ] Tested API endpoint: `https://________________.onrender.com/api/offers`
- [ ] Checked logs for "MongoDB Connected" message

## Step 3: User Frontend (Vercel)

- [ ] Vercel account created
- [ ] GitHub repository connected to Vercel
- [ ] Project created with settings:
  - [ ] Root Directory: `frontend/client`
  - [ ] Build Command: `npm run build`
  - [ ] Output Directory: `build`
- [ ] Environment variable added:
  - [ ] `REACT_APP_API_BASE_URL=https://________________.onrender.com/api`
- [ ] Deployed successfully
- [ ] User frontend URL saved: `https://________________.vercel.app`
- [ ] Tested in browser - no console errors
- [ ] Tested user registration

## Step 4: Admin Frontend (Vercel)

- [ ] Second Vercel project created
- [ ] Settings configured:
  - [ ] Root Directory: `frontend/admin`
  - [ ] Build Command: `npm run build`
  - [ ] Output Directory: `build`
- [ ] Environment variable added:
  - [ ] `REACT_APP_API_BASE_URL=https://________________.onrender.com/api`
- [ ] Deployed successfully
- [ ] Admin frontend URL saved: `https://________________.vercel.app`
- [ ] Tested in browser - no console errors

## Step 5: Post-Deployment

- [ ] CORS updated in backend (if needed)
- [ ] Backend redeployed after CORS changes
- [ ] Admin user created using Render Shell or local script
- [ ] Admin login tested successfully
- [ ] Changed default admin password
- [ ] Tested offer creation (if applicable)
- [ ] Tested file uploads (if applicable)

## Step 6: Security & Optimization

- [ ] Strong JWT_SECRET generated and set
- [ ] MongoDB password is strong
- [ ] Default admin password changed
- [ ] Environment variables verified (no typos)
- [ ] HTTPS working on all URLs (automatic with Render/Vercel)
- [ ] `.env` files not in Git repository

## Step 7: Testing

- [ ] User registration works
- [ ] User login works
- [ ] Admin login works
- [ ] API endpoints accessible
- [ ] No CORS errors in browser console
- [ ] Images/static files loading correctly
- [ ] All features tested end-to-end

## Optional: Customization

- [ ] Custom domain configured for backend (if needed)
- [ ] Custom domain configured for user frontend
- [ ] Custom domain configured for admin frontend
- [ ] Analytics/monitoring set up
- [ ] Error tracking configured (Sentry, etc.)

## Final Verification

- [ ] All three URLs working:
  - [ ] Backend: `https://________________.onrender.com`
  - [ ] User: `https://________________.vercel.app`
  - [ ] Admin: `https://________________.vercel.app`
- [ ] No errors in browser console
- [ ] No errors in Render logs
- [ ] Database connection stable
- [ ] Ready for production use! 🎉

---

## Quick Command Reference

### Create Admin User (Render Shell)
```bash
node server/scripts/createAdmin.js admin@example.com admin123 "Admin Name"
```

### Generate Secure JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Test Backend API
```bash
curl https://your-api-name.onrender.com/api/offers
```

---

**Save your URLs here:**

- Backend: `_________________________________`
- User Frontend: `_________________________________`
- Admin Frontend: `_________________________________`

