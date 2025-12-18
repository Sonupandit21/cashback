# Setup Guide

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (running locally or MongoDB Atlas)
- npm or yarn

## Step-by-Step Setup

### 1. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
npm run client-install
```

### 2. Configure Environment Variables

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` with your settings:
- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: A random secret key for JWT tokens
- `PORT`: Backend server port (default: 5000)
- `TRACKIER_API_KEY`: Your Trackier API key (optional)
- `TRACKIER_API_URL`: Trackier API URL (default: https://brandshapers.trackier.io)

### 3. Start MongoDB

Make sure MongoDB is running:
```bash
# If using local MongoDB
mongod

# Or use MongoDB Atlas cloud service
```

### 4. Create Admin User

```bash
npm run create-admin
```

Or with custom credentials:
```bash
npm run create-admin admin@example.com admin123 "Admin Name"
```

### 5. Start Development Servers

```bash
npm run dev-full
```

This will start both:
- Backend server on http://localhost:5000
- Frontend React app on http://localhost:3000

## Default Admin Credentials

After running `npm run create-admin`:
- Email: admin@example.com
- Password: admin123

**Important**: Change the password after first login!

## Project Structure

```
cashback/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React context
│   │   └── App.js
│   └── package.json
├── models/                # MongoDB models
├── routes/                # Express routes
├── middleware/            # Express middleware
├── utils/                 # Utility functions
├── uploads/               # Uploaded images
├── scripts/               # Setup scripts
├── server.js              # Express server
└── package.json
```

## Features

✅ User authentication (register/login)
✅ Admin dashboard with statistics
✅ Offer management (CRUD operations)
✅ User management
✅ Image upload for offers
✅ Trackier integration
✅ Responsive design with Tailwind CSS
✅ Protected routes
✅ Role-based access control

## API Endpoints

### Public Endpoints
- `GET /api/offers` - Get all active offers
- `GET /api/offers/:id` - Get single offer
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user

### Protected Endpoints (User)
- `GET /api/auth/me` - Get current user
- `POST /api/offers/:id/claim` - Claim an offer
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update user profile

### Admin Endpoints
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/offers` - Get all offers
- `POST /api/admin/offers` - Create offer
- `PUT /api/admin/offers/:id` - Update offer
- `DELETE /api/admin/offers/:id` - Delete offer
- `GET /api/users` - Get all users
- `DELETE /api/users/:id` - Delete user

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check MONGODB_URI in .env file
- Verify MongoDB connection string format

### Port Already in Use
- Change PORT in .env file
- Or stop the process using the port

### Image Upload Issues
- Ensure `uploads/` directory exists
- Check file permissions
- Verify multer configuration

### Trackier Integration
- Trackier integration is optional
- Offers work without Trackier API key
- Set TRACKIER_API_KEY in .env for tracking

## Production Deployment

1. Build the React app:
```bash
npm run build
```

2. Set NODE_ENV=production in .env

3. Use a process manager like PM2:
```bash
npm install -g pm2
pm2 start server.js
```

4. Configure reverse proxy (nginx) for production





























