const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const { register, login, getMe, updateBudgetSettings, updateProfile, setIncome, updateSpendingLimits } = require('../controllers/authController');
const { forgotPassword, verifyOtp, resetPassword } = require('../controllers/otpController');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/budget-settings', protect, updateBudgetSettings);
router.put('/profile', protect, updateProfile);
router.put('/set-income', protect, setIncome);
router.put('/spending-limits', protect, updateSpendingLimits);

// Forgot password OTP flow (public)
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);

module.exports = router;
