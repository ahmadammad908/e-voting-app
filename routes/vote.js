const express = require('express');
const Vote = require('../models/Vote');
const User = require('../models/User');
const router = express.Router();

// Middleware to check if user is authenticated
const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
};

// Cast a vote
router.post('/cast', requireAuth, async (req, res) => {
  try {
    const { candidate } = req.body;
    const userId = req.session.user.id;

    // Validate candidate
    const validCandidates = ['Ahmad Ammad', 'Saad Jawad'];
    if (!validCandidates.includes(candidate)) {
      return res.status(400).json({ error: 'Invalid candidate' });
    }

    // Check if user has already voted
    const user = await User.findById(userId);
    if (user.hasVoted) {
      return res.status(400).json({ error: 'You have already voted' });
    }

    // Create vote
    const vote = new Vote({
      userId: userId,
      candidate: candidate
    });

    await vote.save();

    // Update user's voted status
    user.hasVoted = true;
    await user.save();

    // Update session
    req.session.user.hasVoted = true;

    res.json({ 
      success: true, 
      message: 'Vote cast successfully',
      candidate: candidate
    });
  } catch (error) {
    console.error('Vote error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'You have already voted' });
    }
    res.status(500).json({ error: 'Failed to cast vote' });
  }
});

module.exports = router;