const express = require('express');
const router = express.Router();
const SupportTicket = require('../models/SupportTicket');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// Submit support ticket
// API: POST /api/support
router.post('/', async (req, res) => {
  try {
    const { name, upiId, email, issueType, description } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Basic email validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.trim())) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    if (!issueType) {
      return res.status(400).json({ message: 'Issue type is required' });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({ message: 'Description is required' });
    }

    // Get userId if user is logged in (from token)
    let userId = null;
    if (req.headers.authorization) {
      try {
        const jwt = require('jsonwebtoken');
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        userId = decoded.userId;
      } catch (error) {
        // If token is invalid, continue without userId (anonymous ticket)
      }
    }

    // Create support ticket
    const ticket = new SupportTicket({
      userId: userId,
      name: name.trim(),
      upiId: upiId ? upiId.trim() : '',
      email: email.trim().toLowerCase(),
      issueType: issueType,
      description: description.trim(),
      status: 'open'
    });

    await ticket.save();

    res.status(201).json({
      message: 'Support ticket submitted successfully',
      ticketId: ticket._id
    });
  } catch (error) {
    console.error('Error creating support ticket:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get user's support tickets (if logged in)
// API: GET /api/support
router.get('/', auth, async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ userId: req.user._id })
      .sort({ createdAt: -1 });
    
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single ticket
// API: GET /api/support/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id)
      .populate('userId', 'name email');
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Users can only view their own tickets unless admin
    if (req.user.role !== 'admin' && ticket.userId && ticket.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;














