# Cashback Offers Platform

A full-stack MERN application for managing cashback offers with admin dashboard, user management, and Trackier integration.

## Features

- User authentication and authorization
- Admin dashboard for managing offers
- User management system
- Offer management (CRUD operations)
- **Trackier Integration** - Full performance marketing tracking:
  - Click tracking with unique click IDs
  - Conversion tracking (sales, signups)
  - Publisher/Affiliate tracking
  - Payout tracking
- Wallet balance management with withdrawal system
- UPI ID management and approval workflow
- Image upload for offers
- Responsive design with Tailwind CSS

## Tech Stack

- **Backend**: Node.js, Express, MongoDB, Mongoose
- **Frontend (User)**: React, Tailwind CSS - Port 3000
- **Frontend (Admin)**: React, Tailwind CSS - Port 3002
- **Authentication**: JWT
- **File Upload**: Multer

## Project Structure

```
cashback/
├── server/            ← Backend (Node.js + Express + MongoDB)
├── frontend/
│   ├── client/        ← User frontend (React) - Port 3000
│   └── admin/         ← Admin panel frontend (React) - Port 3002
└── package.json       ← Root package.json with scripts
```

## Installation

1. Install backend dependencies:
```bash
npm install
```

2. Install frontend dependencies:
```bash
npm run client-install
npm run admin-install
```

3. Create a `.env` file in the root directory (copy from `.env.example`):
```bash
cp .env.example .env
```

Then edit `.env` with your configuration:
```
MONGODB_URI=mongodb://127.0.0.1:27017/cashback
JWT_SECRET=your-secret-key-here
PORT=5000

# Trackier Integration (Performance Marketing Tracking)
TRACKIER_API_URL=https://brandshapers.trackier.io
TRACKIER_API_KEY=your-trackier-api-key
TRACKIER_PUBLISHER_ID=your-publisher-id
TRACKIER_ADVERTISER_ID=your-advertiser-id
```

4. Create `.env` file in `frontend/admin/` for admin panel port:
```
PORT=3002
```

5. Make sure MongoDB is running on your system

6. Create an admin user:
```bash
npm run create-admin
# Or with custom credentials:
npm run create-admin admin@example.com admin123 "Admin Name"
```

7. Run the development servers:
```bash
npm run dev-full
```

The application will be available at:
- **User Frontend**: http://localhost:3000
- **Super Admin Panel**: http://localhost:3002
- **Sub-Admin / Partner Panel**: http://localhost:3003
- **Backend API**: http://localhost:5000

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Offers
- `GET /api/offers` - Get all active offers
- `GET /api/offers/:id` - Get single offer
- `POST /api/offers/:id/claim` - Claim an offer

### Admin
- `GET /api/admin/stats` - Get dashboard statistics
- `GET /api/admin/offers` - Get all offers (admin)
- `POST /api/admin/offers` - Create new offer
- `PUT /api/admin/offers/:id` - Update offer
- `DELETE /api/admin/offers/:id` - Delete offer

### Users
- `GET /api/users` - Get all users (admin)
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (admin)

## Default Admin Account

Create an admin user through the registration endpoint or MongoDB directly:
```javascript
{
  "name": "Admin",
  "email": "admin@example.com",
  "password": "",
  "role": "admin"
}
```admin123

## 🚀 Production Deployment

Ready to deploy to production? Check out our comprehensive deployment guide:

- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Complete step-by-step guide for deploying to Render (backend) and Vercel (frontend)
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Quick checklist to ensure nothing is missed during deployment

### Quick Overview

1. **Backend**: Deploy to [Render](https://render.com) (free tier available)
2. **Database**: Use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (free tier available)
3. **Frontend**: Deploy both user and admin apps to [Vercel](https://vercel.com) (free tier available)

See the deployment guide for detailed instructions, environment variable configuration, and troubleshooting tips.

