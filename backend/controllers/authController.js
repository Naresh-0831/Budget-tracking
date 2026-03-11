const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User already exists with this email' });
        }

        // Create user
        const user = await User.create({ name, email, password });
        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            message: 'Account created successfully',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                monthlySalary: user.monthlySalary,
                budgetRules: user.budgetRules,
                monthlyLimit: user.monthlyLimit,
                dailyLimit: user.dailyLimit,
                lockEnabled: user.lockEnabled,
                currency: user.currency,
                theme: user.theme,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check required fields
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password' });
        }

        // Find user with password
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Verify password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = generateToken(user._id);

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                monthlySalary: user.monthlySalary,
                budgetRules: user.budgetRules,
                monthlyLimit: user.monthlyLimit,
                dailyLimit: user.dailyLimit,
                lockEnabled: user.lockEnabled,
                currency: user.currency,
                theme: user.theme,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update budget settings
// @route   PUT /api/auth/budget-settings
// @access  Private
const updateBudgetSettings = async (req, res) => {
    try {
        const { monthlySalary, budgetRules, currency } = req.body;

        // Validate budget rules add up to 100
        if (budgetRules) {
            const total = (budgetRules.needs || 0) + (budgetRules.wants || 0) + (budgetRules.savings || 0);
            if (Math.round(total) !== 100) {
                return res.status(400).json({
                    success: false,
                    message: 'Budget percentages must add up to 100%',
                });
            }
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { monthlySalary, budgetRules, currency },
            { new: true, runValidators: true }
        );

        res.json({ success: true, message: 'Budget settings updated', user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
    try {
        const { name, theme } = req.body;
        const user = await User.findByIdAndUpdate(req.user.id, { name, theme }, { new: true, runValidators: true });
        res.json({ success: true, message: 'Profile updated', user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Set / update monthly income (with annual conversion)
// @route   PUT /api/auth/set-income
// @access  Private
const setIncome = async (req, res) => {
    try {
        const { incomeType, amount } = req.body;

        if (!amount || isNaN(amount) || Number(amount) <= 0) {
            return res.status(400).json({ success: false, message: 'Please provide a valid income amount.' });
        }

        // Convert annual package → monthly
        const monthlyIncome = incomeType === 'annual'
            ? parseFloat((Number(amount) / 12).toFixed(2))
            : parseFloat(Number(amount).toFixed(2));

        // Auto 50-30-20 budget rules
        const budgetRules = { needs: 50, wants: 30, savings: 20 };

        const user = await User.findByIdAndUpdate(
            req.user.id,
            {
                monthlyIncome,
                monthlySalary: monthlyIncome,   // keeps existing dashboard working
                incomeType: incomeType || 'monthly',
                budgetRules,
            },
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            message: 'Income saved successfully.',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                monthlyIncome: user.monthlyIncome,
                monthlySalary: user.monthlySalary,
                incomeType: user.incomeType,
                budgetRules: user.budgetRules,
                monthlyLimit: user.monthlyLimit,
                dailyLimit: user.dailyLimit,
                lockEnabled: user.lockEnabled,
                currency: user.currency,
                theme: user.theme,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update spending limits & lock
// @route   PUT /api/auth/spending-limits
// @access  Private
const updateSpendingLimits = async (req, res) => {
    try {
        const { monthlyLimit, dailyLimit, lockEnabled } = req.body;

        const updates = {};
        if (monthlyLimit !== undefined) updates.monthlyLimit = parseFloat(monthlyLimit) || 0;
        if (dailyLimit !== undefined) updates.dailyLimit = parseFloat(dailyLimit) || 0;
        if (lockEnabled !== undefined) updates.lockEnabled = Boolean(lockEnabled);

        const user = await User.findByIdAndUpdate(
            req.user.id,
            updates,
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            message: 'Spending limits updated',
            user: {
                id: user._id,
                monthlyLimit: user.monthlyLimit,
                dailyLimit: user.dailyLimit,
                lockEnabled: user.lockEnabled,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { register, login, getMe, updateBudgetSettings, updateProfile, setIncome, updateSpendingLimits };
