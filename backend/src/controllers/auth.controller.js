const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const OTP = require('../models/otp.model');
const { sendSMS } = require('../services/smsService');

/**
 * Generate JWT Token
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

/**
 * Send real SMS OTP to user's phone
 * POST /api/auth/send-otp
 */
const sendOTP = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length < 10) {
      return res.status(400).json({ success: false, message: 'Invalid 10-digit phone number' });
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP to DB
    await OTP.saveOTP(cleanPhone, otpCode);

    // Send SMS via provider
    await sendSMS(phone, otpCode);

    const isProductionSmsConfigured = Boolean(
      process.env.FAST2SMS_API_KEY || process.env.TWO_FACTOR_API_KEY || process.env.TWILIO_ACCOUNT_SID
    );

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      dev_otp: isProductionSmsConfigured ? undefined : otpCode, // Provided in dev mode if no SMS API key set
    });
  } catch (error) {
    console.error('sendOTP error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Verify SMS OTP
 * POST /api/auth/verify-otp
 */
const verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: 'Phone and OTP are required' });
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);

    // Verify OTP against DB
    const isValid = await OTP.verifyOTP(cleanPhone, otp);

    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP code' });
    }

    // Check if user already exists with this phone number
    const existingUser = await User.findByPhone(cleanPhone);

    if (existingUser) {
      const token = generateToken(existingUser);
      return res.status(200).json({
        success: true,
        isNewUser: false,
        token,
        user: existingUser,
      });
    }

    // New user -> proceed to username & password setup screen
    return res.status(200).json({
      success: true,
      isNewUser: true,
      phone: cleanPhone,
    });
  } catch (error) {
    console.error('verifyOTP error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Register User (Username + Password + Phone/Email)
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { username, password, phone, email } = req.body;

    if (!username || username.trim().length < 3) {
      return res.status(400).json({ success: false, message: 'Username must be at least 3 characters' });
    }

    // Check if username is taken
    const existingUsername = await User.findByUsername(username.trim());
    if (existingUsername) {
      return res.status(409).json({ success: false, message: 'Username is already taken' });
    }

    // Hash password if provided
    let password_hash = null;
    if (password && password.trim().length >= 4) {
      password_hash = await bcrypt.hash(password.trim(), 10);
    }

    // Check phone if provided
    let cleanPhone = null;
    if (phone) {
      cleanPhone = phone.replace(/\D/g, '').slice(-10);
      const existingPhone = await User.findByPhone(cleanPhone);
      if (existingPhone) {
        return res.status(409).json({ success: false, message: 'Phone number is already registered' });
      }
    }

    // Create user in DB
    const user = await User.createUser({
      username: username.trim(),
      phone: cleanPhone,
      email: email ? email.trim() : null,
      password_hash,
    });

    const token = generateToken(user);
    res.status(201).json({ success: true, token, user });
  } catch (error) {
    console.error('register error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Instagram-Style Login (Username / Phone / Email + Password OR Phone OTP)
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { login: loginInput, phone, password, otp } = req.body;

    // Option A: OTP-based login
    if ((phone || loginInput) && otp) {
      const targetPhone = phone || loginInput;
      const cleanPhone = targetPhone.replace(/\D/g, '').slice(-10);
      const isValid = await OTP.verifyOTP(cleanPhone, otp);
      if (!isValid) {
        return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
      }
      const user = await User.findByPhone(cleanPhone);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found. Please register.' });
      }
      const token = generateToken(user);
      return res.status(200).json({ success: true, token, user });
    }

    // Option B: Username / Phone / Email + Password login
    const targetLogin = loginInput || phone;
    if (!targetLogin) {
      return res.status(400).json({ success: false, message: 'Username, Phone, or Email is required' });
    }

    const user = await User.findByLogin(targetLogin);
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with these credentials' });
    }

    if (password) {
      if (!user.password_hash) {
        return res.status(400).json({
          success: false,
          message: 'This account was created via Phone OTP without a password. Please log in with OTP.',
        });
      }
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        return res.status(400).json({ success: false, message: 'Incorrect password' });
      }
    }

    const token = generateToken(user);
    res.status(200).json({ success: true, token, user });
  } catch (error) {
    console.error('login error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Check if a username is available in real time
 * GET /api/auth/check-username/:username
 */
const checkUsername = async (req, res) => {
  try {
    const { username } = req.params;
    if (!username || username.trim().length < 3) {
      return res.json({ available: false, message: 'Must be at least 3 characters' });
    }

    const existing = await User.findByUsername(username.trim());
    return res.json({ available: !existing });
  } catch (error) {
    res.status(500).json({ available: false, message: error.message });
  }
};

/**
 * Get current user info
 * GET /api/auth/me
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update Profile
 * PUT /api/auth/profile
 */
const updateProfile = async (req, res) => {
  try {
    const { username, avatar_url } = req.body;
    const user = await User.updateProfile(req.user.id, { username, avatar_url });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  sendOTP,
  verifyOTP,
  register,
  login,
  checkUsername,
  getMe,
  updateProfile,
};