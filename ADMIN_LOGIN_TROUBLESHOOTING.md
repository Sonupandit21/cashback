# Admin Login Troubleshooting Guide

## Common Issues and Solutions

### Issue 1: "Access denied. Admin only."

**Problem**: User account doesn't have admin role.

**Solution**: Create an admin user or update existing user's role.

#### Option A: Create New Admin User
```bash
npm run create-admin
```

Or with custom credentials:
```bash
npm run create-admin admin@example.com admin123 "Admin Name"
```

#### Option B: Update Existing User to Admin (MongoDB)
```javascript
// Connect to MongoDB
use cashback

// Update user role to admin
db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { role: "admin" } }
)
```

### Issue 2: "Invalid email or password"

**Possible Causes:**
1. Wrong email or password
2. Email case sensitivity (now fixed - emails are lowercased)
3. User doesn't exist in database

**Solution:**
1. Verify email and password are correct
2. Check if user exists in database
3. Try creating a new admin user

### Issue 3: Login succeeds but redirects back to login

**Problem**: Token is not being stored or user role check fails.

**Solution:**
1. Check browser console for errors
2. Verify localStorage has `adminToken`
3. Check user role in database is `admin`

### Issue 4: "Login failed: No user data received"

**Problem**: Backend is not returning user data properly.

**Solution:**
1. Check backend server is running
2. Check API endpoint `/api/auth/login` is accessible
3. Check server logs for errors

## Step-by-Step Debugging

### 1. Check if Admin User Exists

```bash
# Connect to MongoDB
mongosh

# Switch to database
use cashback

# Find admin users
db.users.find({ role: "admin" })
```

### 2. Create Admin User (if doesn't exist)

```bash
npm run create-admin admin@example.com admin123 "Admin User"
```

### 3. Verify User Role

```javascript
// In MongoDB
db.users.findOne({ email: "admin@example.com" })

// Should show: { role: "admin" }
```

### 4. Test Login API Directly

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

Expected response:
```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": "...",
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

### 5. Check Frontend Console

Open browser DevTools (F12) and check:
- Network tab: See if login request is sent
- Console tab: Check for JavaScript errors
- Application tab: Check localStorage for `adminToken`

## Quick Fix Commands

### Create Admin User
```bash
npm run create-admin
```

### Update User to Admin (MongoDB)
```javascript
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { role: "admin" } }
)
```

### Reset Admin Password (MongoDB)
```javascript
// Note: Password will be hashed automatically on next save
// You need to update through the application or create new user
```

## Default Admin Credentials

After running `npm run create-admin`:
- **Email**: `admin@example.com`
- **Password**: `admin123`

**Important**: Change password after first login!

## Verification Checklist

- [ ] MongoDB is running
- [ ] Backend server is running on port 5000
- [ ] Admin user exists in database with `role: "admin"`
- [ ] Email and password are correct
- [ ] No JavaScript errors in browser console
- [ ] Network request to `/api/auth/login` returns 200
- [ ] Response includes `user.role === "admin"`
- [ ] `adminToken` is stored in localStorage

## Still Having Issues?

1. **Check Server Logs**: Look for errors in backend console
2. **Check Browser Console**: Look for JavaScript errors
3. **Verify Database Connection**: Ensure MongoDB is accessible
4. **Clear Browser Data**: Clear localStorage and cookies
5. **Check Environment Variables**: Verify JWT_SECRET is set

## Contact Support

If issues persist, check:
- Server logs for detailed error messages
- Database connection status
- Network connectivity
- Environment variable configuration

