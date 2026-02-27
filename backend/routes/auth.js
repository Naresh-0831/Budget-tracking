const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const { register, login, getMe, updateBudgetSettings, updateProfile, setIncome } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/budget-settings', protect, updateBudgetSettings);
router.put('/profile', protect, updateProfile);
router.put('/set-income', protect, setIncome);

module.exports = router;
