const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
// CORS configuration - allows localhost for dev and Vercel domains for production
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:3002'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow if origin is in allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // In development, allow all origins
      if (process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API root endpoint
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Cashback API is running',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      offers: '/api/offers',
      users: '/api/users',
      admin: '/api/admin',
      withdraw: '/api/withdraw',
      support: '/api/support',
      postback: '/api/postback'
    }
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/offers', require('./routes/offers'));
app.use('/api/users', require('./routes/users'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/withdraw', require('./routes/withdraw'));
app.use('/api/support', require('./routes/support'));
app.use('/api/postback', require('./routes/postback'));

// Root route
app.get('/', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    // In production, serve the React app
    const clientBuildPath = path.join(__dirname, '../frontend/client/build');
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  } else {
    // In development, return API info
    res.json({ 
      message: 'Cashback API Server',
      environment: process.env.NODE_ENV || 'development',
      api: '/api',
      health: '/health'
    });
  }
});

// Serve static files from React app (user frontend)
// In this repo, the user React app lives in frontend/client
// and the production build is in frontend/client/build.
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../frontend/client/build');
  app.use(express.static(clientBuildPath));

  // Catch all other routes and serve React app (SPA routing)
  app.get('*', (req, res) => {
    // Don't serve React app for API routes
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// MongoDB Connection
const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cashback';
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.log('MongoDB Connection Error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


