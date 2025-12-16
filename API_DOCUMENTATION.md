# API Documentation

Base URL: `http://localhost:5000/api`

All API endpoints return JSON responses.

---

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:
```
Authorization: Bearer <your-token>
```

---

## Authentication Endpoints

### 1. Register User
**POST** `/api/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+1234567890"  // optional
}
```

**Response (201):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

**Error Responses:**
- `400` - User already exists
- `500` - Server error

---

### 2. Login User
**POST** `/api/auth/login`

Login with email and password.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

**Error Responses:**
- `400` - Invalid credentials
- `500` - Server error

---

### 3. Get Current User
**GET** `/api/auth/me`

Get the currently authenticated user's information.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "role": "user",
  "offersClaimed": [],
  "totalCashback": 0,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses:**
- `401` - Unauthorized (no token or invalid token)
- `500` - Server error

---

## Offers Endpoints

### 4. Get All Active Offers
**GET** `/api/offers`

Get all active offers. Supports filtering by category and featured status.

**Query Parameters:**
- `category` (optional) - Filter by category (e.g., "Shopping", "Food")
- `featured` (optional) - Filter featured offers (set to "true")
- `limit` (optional) - Limit number of results (default: 100)

**Example:**
```
GET /api/offers?category=Shopping&featured=true&limit=10
```

**Response (200):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Amazon Cashback",
    "description": "Get 10% cashback on all purchases",
    "category": "Shopping",
    "cashbackAmount": 10,
    "currency": "USD",
    "instructions": "Complete purchase and get cashback",
    "offerLink": "https://amazon.com",
    "imageUrl": "/uploads/offers/offer-123.jpg",
    "trackierOfferId": "track123",
    "isActive": true,
    "isFeatured": true,
    "minAmount": 50,
    "maxUsers": 100,
    "currentUsers": 25,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### 5. Get Single Offer
**GET** `/api/offers/:id`

Get details of a specific offer.

**Response (200):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "Amazon Cashback",
  "description": "Get 10% cashback on all purchases",
  "category": "Shopping",
  "cashbackAmount": 10,
  "currency": "USD",
  "instructions": "Complete purchase and get cashback",
  "offerLink": "https://amazon.com",
  "imageUrl": "/uploads/offers/offer-123.jpg",
  "trackierOfferId": "track123",
  "isActive": true,
  "isFeatured": true,
  "minAmount": 50,
  "maxUsers": 100,
  "currentUsers": 25,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses:**
- `404` - Offer not found
- `500` - Server error

---

### 6. Track Offer Click
**POST** `/api/offers/:id/track`

Track when a user clicks on an offer (for analytics).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Click tracked successfully"
}
```

**Error Responses:**
- `401` - Unauthorized
- `404` - Offer not found or inactive
- `500` - Server error

---

### 7. Claim Offer
**POST** `/api/offers/:id/claim`

Claim an offer (user action). Requires UPI ID.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "upiId": "username@paytm"
}
```

**Response (200):**
```json
{
  "message": "Offer claimed successfully",
  "offer": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Amazon Cashback",
    "currentUsers": 26,
    ...
  }
}
```

**Error Responses:**
- `400` - UPI ID is required / Invalid UPI ID format / Maximum users reached / Already claimed
- `401` - Unauthorized
- `404` - Offer not found or inactive
- `500` - Server error

**Note:** UPI ID format must be: `username@bankname` (e.g., `user@paytm`, `user@ybl`, `user@okaxis`)

---

## User Endpoints

### 8. Get All Users (Admin Only)
**GET** `/api/users`

Get list of all users. Admin access only.

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Response (200):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "role": "user",
    "offersClaimed": [],
    "totalCashback": 0,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

**Error Responses:**
- `401` - Unauthorized
- `403` - Access denied (not admin)
- `500` - Server error

---

### 9. Get User Details
**GET** `/api/users/:id`

Get details of a specific user. Users can only view their own profile unless admin.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "role": "user",
  "offersClaimed": [
    {
      "offerId": {
        "_id": "507f1f77bcf86cd799439012",
        "title": "Amazon Cashback",
        ...
      },
      "status": "pending",
      "claimedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "totalCashback": 50,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses:**
- `401` - Unauthorized
- `403` - Access denied
- `404` - User not found
- `500` - Server error

---

### 10. Update User
**PUT** `/api/users/:id`

Update user profile. Users can only update their own profile unless admin.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "John Updated",
  "email": "john.updated@example.com",
  "phone": "+1234567890"
}
```

**Response (200):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John Updated",
  "email": "john.updated@example.com",
  "phone": "+1234567890",
  "role": "user",
  "updatedAt": "2024-01-02T00:00:00.000Z"
}
```

**Error Responses:**
- `401` - Unauthorized
- `403` - Access denied
- `404` - User not found
- `500` - Server error

---

### 11. Delete User (Admin Only)
**DELETE** `/api/users/:id`

Delete a user. Admin access only.

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Response (200):**
```json
{
  "message": "User deleted successfully"
}
```

**Error Responses:**
- `401` - Unauthorized
- `403` - Access denied (not admin)
- `404` - User not found
- `500` - Server error

---

## Admin Endpoints

All admin endpoints require authentication and admin role.

### 12. Get Dashboard Statistics
**GET** `/api/admin/stats`

Get dashboard statistics for admin panel.

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Response (200):**
```json
{
  "totalUsers": 150,
  "totalOffers": 25,
  "activeOffers": 20,
  "featuredOffers": 5,
  "totalClaims": 500
}
```

**Error Responses:**
- `401` - Unauthorized
- `403` - Access denied (not admin)
- `500` - Server error

---

### 13. Get All Offers (Admin)
**GET** `/api/admin/offers`

Get all offers including inactive ones. Admin access only.

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Response (200):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Amazon Cashback",
    "description": "Get 10% cashback",
    "category": "Shopping",
    "cashbackAmount": 10,
    "currency": "USD",
    "instructions": "Complete purchase",
    "offerLink": "https://amazon.com",
    "imageUrl": "/uploads/offers/offer-123.jpg",
    "trackierOfferId": "track123",
    "isActive": true,
    "isFeatured": true,
    "minAmount": 50,
    "maxUsers": 100,
    "currentUsers": 25,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### 14. Create Offer (Admin)
**POST** `/api/admin/offers`

Create a new offer. Supports image upload.

**Headers:**
```
Authorization: Bearer <admin-token>
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
- `title` (required) - Offer title
- `description` (required) - Offer description
- `category` (required) - Offer category
- `cashbackAmount` (required) - Cashback percentage/amount
- `currency` (required) - Currency code (USD, EUR, GBP, INR)
- `instructions` (required) - Instructions for users
- `offerLink` (required) - Link to the offer
- `trackierOfferId` (optional) - Trackier offer ID
- `isActive` (optional) - Boolean, default: true
- `isFeatured` (optional) - Boolean, default: false
- `minAmount` (optional) - Minimum purchase amount
- `maxUsers` (optional) - Maximum number of users
- `image` (optional) - Image file (max 5MB, formats: jpeg, jpg, png, gif, webp)

**Response (201):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "Amazon Cashback",
  "description": "Get 10% cashback",
  "category": "Shopping",
  "cashbackAmount": 10,
  "currency": "USD",
  "instructions": "Complete purchase",
  "offerLink": "https://amazon.com",
  "imageUrl": "/uploads/offers/offer-123.jpg",
  "trackierOfferId": "track123",
  "isActive": true,
  "isFeatured": false,
  "minAmount": 50,
  "maxUsers": 100,
  "currentUsers": 0,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses:**
- `401` - Unauthorized
- `403` - Access denied (not admin)
- `400` - Validation error
- `500` - Server error

---

### 15. Update Offer (Admin)
**PUT** `/api/admin/offers/:id`

Update an existing offer. Supports image upload.

**Headers:**
```
Authorization: Bearer <admin-token>
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
Same as Create Offer, all fields optional except those being updated.

**Response (200):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "Updated Amazon Cashback",
  ...
}
```

**Error Responses:**
- `401` - Unauthorized
- `403` - Access denied (not admin)
- `404` - Offer not found
- `500` - Server error

---

### 16. Delete Offer (Admin)
**DELETE** `/api/admin/offers/:id`

Delete an offer. Also deletes associated image file.

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Response (200):**
```json
{
  "message": "Offer deleted successfully"
}
```

**Error Responses:**
- `401` - Unauthorized
- `403` - Access denied (not admin)
- `404` - Offer not found
- `500` - Server error

---

### 17. Regenerate Offer ID (Admin)
**POST** `/api/admin/offers/:id/regenerate-id`

Delete an offer and recreate it with a new auto-generated ID. Useful when you need to change an offer's MongoDB `_id` while keeping all other data the same.

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Response (200):**
```json
{
  "message": "Offer ID regenerated successfully",
  "oldId": "507f1f77bcf86cd799439011",
  "newId": "6926d9968df6b8b51925c1a6",
  "offer": {
    "_id": "6926d9968df6b8b51925c1a6",
    "title": "flipkart Cashback",
    ...
  }
}
```

**Error Responses:**
- `401` - Unauthorized
- `403` - Access denied (not admin)
- `404` - Offer not found
- `500` - Server error

**Note:** The image file is preserved (not deleted) since it's reused for the new offer.

---

## Error Response Format

All error responses follow this format:

```json
{
  "message": "Error description"
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Example Usage

### Using cURL

**Register User:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Get Offers:**
```bash
curl http://localhost:5000/api/offers?featured=true
```

**Claim Offer:**
```bash
curl -X POST http://localhost:5000/api/offers/507f1f77bcf86cd799439011/claim \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"upiId": "username@paytm"}'
```

**Create Offer (Admin):**
```bash
curl -X POST http://localhost:5000/api/admin/offers \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE" \
  -F "title=Amazon Cashback" \
  -F "description=Get 10% cashback" \
  -F "category=Shopping" \
  -F "cashbackAmount=10" \
  -F "currency=USD" \
  -F "instructions=Complete purchase" \
  -F "offerLink=https://amazon.com" \
  -F "isActive=true" \
  -F "isFeatured=true" \
  -F "image=@/path/to/image.jpg"
```

**Regenerate Offer ID (Admin):**
```bash
curl -X POST http://localhost:5000/api/admin/offers/507f1f77bcf86cd799439011/regenerate-id \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE"
```

---

## Notes

1. JWT tokens expire after 7 days
2. Image uploads are limited to 5MB
3. Supported image formats: JPEG, JPG, PNG, GIF, WEBP
4. All timestamps are in ISO 8601 format (UTC)
5. Currency codes should follow ISO 4217 standard (USD, EUR, GBP, INR, etc.)

