const express = require('express');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const router = express.Router();

// Email transporter - FIXED: createTransporter -> createTransport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Generate random OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP email
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    let user = await User.findOne({ email });
    
    if (!user) {
      user = new User({ email });
    }

    user.otp = {
      code: otp,
      expiresAt: expiresAt
    };
    user.isVerified = false;

    await user.save();

    // Send email
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Your Voting App OTP Code',
      html: `
        <h2>Your OTP Code</h2>
        <p>Use this code to verify your email: <strong>${otp}</strong></p>
        <p>This code will expire in 10 minutes.</p>
        <p><em>This is a demo application for testing purposes only.</em></p>
      `
    });

    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('OTP send error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Verify OTP and login
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    if (!user.otp || user.otp.code !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    if (user.otp.expiresAt < new Date()) {
      return res.status(400).json({ error: 'OTP has expired' });
    }

    user.isVerified = true;
    user.otp = undefined;
    await user.save();

    req.session.user = {
      id: user._id,
      email: user.email,
      hasVoted: user.hasVoted
    };

    res.json({ 
      success: true, 
      message: 'Login successful',
      hasVoted: user.hasVoted
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ error: 'OTP verification failed' });
  }
});

module.exports = router;