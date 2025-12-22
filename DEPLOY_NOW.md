# 🚀 Deploy Now - Quick Steps

Follow these steps to deploy your app right now.

## ⚡ Quick Deployment Steps

### 1️⃣ Push Code to GitHub (If Not Already Done)

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2️⃣ Set Up MongoDB Atlas

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create free cluster → Get connection string
3. **Save connection string** - you'll need it for Render

### 3️⃣ Deploy Backend to Render

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. **New** → **Web Service**
3. Connect GitHub → Select `cashback` repo
4. **Settings:**
   - Name: `cashback-api`
   - Build: `npm install`
   - Start: `npm start`
5. **Environment Variables:**
   ```
   MONGODB_URI=your-mongodb-connection-string
   JWT_SECRET=generate-random-32-chars-minimum
   NODE_ENV=production
   PORT=10000
   ALLOWED_ORIGINS=https://your-user-app.vercel.app,https://your-admin-app.vercel.app
   ```
6. Click **Create Web Service**
7. **Wait for deployment** → Copy backend URL: `https://cashback-api.onrender.com`

### 4️⃣ Deploy User Frontend to Vercel

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. **Add New** → **Project**
3. Import `cashback` repository
4. **Settings:**
   - Root Directory: `frontend/client`
   - Build Command: `npm run build`
   - Output Directory: `build`
5. **Environment Variable:**
   ```
   REACT_APP_API_BASE_URL=https://cashback-api.onrender.com/api
   ```
6. Click **Deploy**
7. **Copy frontend URL** → Update `ALLOWED_ORIGINS` in Render with this URL

### 5️⃣ Deploy Admin Frontend to Vercel

1. **Add New** → **Project** (same repo)
2. **Settings:**
   - Root Directory: `frontend/admin`
   - Build Command: `npm run build`
   - Output Directory: `build`
3. **Environment Variable:**
   ```
   REACT_APP_API_BASE_URL=https://cashback-api.onrender.com/api
   ```
4. Click **Deploy**
5. **Copy admin URL** → Update `ALLOWED_ORIGINS` in Render

### 6️⃣ Update CORS in Render

1. Go to Render dashboard → Your backend service
2. **Environment** → Edit `ALLOWED_ORIGINS`
3. Add both Vercel URLs (comma-separated):
   ```
   ALLOWED_ORIGINS=https://your-user-app.vercel.app,https://your-admin-app.vercel.app
   ```
4. Save → Auto-redeploys

### 7️⃣ Create Admin User

**Option A: Render Shell**
1. Render dashboard → Backend service → **Shell**
2. Run:
   ```bash
   node server/scripts/createAdmin.js admin@example.com admin123 "Admin Name"
   ```

**Option B: Local**
```bash
export MONGODB_URI="your-mongodb-connection-string"
export JWT_SECRET="your-jwt-secret"
node server/scripts/createAdmin.js admin@example.com admin123 "Admin Name"
```

### 8️⃣ Test Everything

- ✅ User frontend: `https://your-user-app.vercel.app`
- ✅ Admin frontend: `https://your-admin-app.vercel.app`
- ✅ Backend API: `https://cashback-api.onrender.com/api/offers`

---

## 📝 Generate Secure JWT Secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and use it for `JWT_SECRET` in Render.

---

## ✅ Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] MongoDB Atlas cluster created
- [ ] Backend deployed to Render
- [ ] User frontend deployed to Vercel
- [ ] Admin frontend deployed to Vercel
- [ ] CORS updated with Vercel URLs
- [ ] Admin user created
- [ ] All URLs tested and working

---

## 🆘 Need Help?

See `VERCEL_RENDER_DEPLOYMENT.md` for detailed instructions.

---

**Ready? Start with Step 1! 🚀**

