const express = require('express');
const User = require('../models/User');
const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { username, phoneNumber } = req.body;

    // Validation
    if (!username || !phoneNumber) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Username and phone number are required'
      });
    }

    // Check if username already exists
    const existingUser = await User.findOne({
      where: {
        username: username.toLowerCase().trim()
      }
    });
    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'Username already taken. Please choose a different one.'
      });
    }

    // Check if phone number already exists
    const existingPhone = await User.findOne({
      where: {
        phoneNumber: phoneNumber.trim()
      }
    });
    if (existingPhone) {
      return res.status(409).json({
        error: 'Phone already registered',
        message: 'This phone number is already registered.'
      });
    }

    // Create new user
    const user = await User.create({
      username: username.toLowerCase().trim(),
      phoneNumber: phoneNumber.trim()
    });

    res.status(201).json({
      message: 'Account created successfully',
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Registration error:', error);

    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        error: 'Validation failed',
        message: error.errors[0].message
      });
    }

    res.status(500).json({
      error: 'Server error',
      message: 'Failed to create account. Please try again.'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { username } = req.body;

    // Validation
    if (!username) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Username is required'
      });
    }

    // Find user
    const user = await User.findByUsername(username.toLowerCase().trim());
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'Username not found. Please create an account first.'
      });
    }

    // Update last login
    await user.updateLastLogin();

    res.status(200).json({
      message: 'Login successful',
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Login failed. Please try again.'
    });
  }
});

// @route   POST /api/auth/check-username
// @desc    Check if username is available
// @access  Public
router.post('/check-username', async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Username is required'
      });
    }

    const existingUser = await User.findOne({
      where: {
        username: username.toLowerCase().trim()
      }
    });

    res.status(200).json({
      available: !existingUser,
      message: existingUser ? 'Username already taken' : 'Username available'
    });

  } catch (error) {
    console.error('Username check error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to check username availability'
    });
  }
});

// @route   GET /api/auth/user/:username
// @desc    Get user profile
// @access  Public (for basic info)
router.get('/user/:username', async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findByUsername(username.toLowerCase());
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User does not exist'
      });
    }

    res.status(200).json({
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to get user profile'
    });
  }
});

module.exports = router;