const express = require('express');
const router = express.Router();
const {
  sendOTP,
  verifyOTP,
  register,
  login,
  checkUsername,
  getMe,
  updateProfile,
} = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/register', register);
router.post('/login', login);
router.get('/check-username/:username', checkUsername);

router.get('/me', verifyToken, getMe);
router.put('/me', verifyToken, updateProfile);

module.exports = router;