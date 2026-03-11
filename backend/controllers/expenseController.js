const Expense = require('../models/Expense');
const User = require('../models/User');
const BankAccount = require('../models/BankAccount');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Get total expenses for today (UTC-aware, using local date boundaries) */
const getTodaySpent = async (userId) => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const result = await Expense.aggregate([
        { $match: { user: userId, date: { $gte: startOfDay, $lt: endOfDay } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    return result[0]?.total || 0;
};

/** Get total expenses for the current calendar month */
const getMonthSpent = async (userId) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNext = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const result = await Expense.aggregate([
        { $match: { user: userId, date: { $gte: startOfMonth, $lt: startOfNext } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    return result[0]?.total || 0;
};

// @desc    Get all expenses for user
// @route   GET /api/expenses
// @access  Private
const getExpenses = async (req, res) => {
    try {
        const { category, type, startDate, endDate, limit = 50, page = 1 } = req.query;
        const query = { user: req.user.id };

        if (category) query.category = category;
        if (type) query.type = type;
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [expenses, total] = await Promise.all([
            Expense.find(query).populate('bankAccount', 'bankName maskedAccountNumber').sort({ date: -1 }).limit(parseInt(limit)).skip(skip),
            Expense.countDocuments(query),
        ]);

        res.json({
            success: true,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            expenses,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create expense (with spending-limit checks + bank deduction)
// @route   POST /api/expenses
// @access  Private
const createExpense = async (req, res) => {
    try {
        const { title, amount, category, type, date, notes, bankAccount: bankAccountId } = req.body;
        const expenseAmount = parseFloat(amount);

        // ── Feature 1: Spending limit checks ──────────────────────────────────
        const user = await User.findById(req.user.id);
        const { monthlyLimit, dailyLimit, lockEnabled } = user;

        let warning = null;

        if (dailyLimit > 0) {
            const todaySpent = await getTodaySpent(user._id);
            if (todaySpent + expenseAmount > dailyLimit) {
                const msg = `Daily limit of ₹${dailyLimit} exceeded. Today spent: ₹${todaySpent.toFixed(2)}.`;
                if (lockEnabled) {
                    return res.status(400).json({ success: false, message: msg, limitType: 'daily' });
                }
                warning = warning ? warning + ' | ' + msg : msg;
            }
        }

        if (monthlyLimit > 0) {
            const monthSpent = await getMonthSpent(user._id);
            if (monthSpent + expenseAmount > monthlyLimit) {
                const msg = `Monthly limit of ₹${monthlyLimit} exceeded. Month spent: ₹${monthSpent.toFixed(2)}.`;
                if (lockEnabled) {
                    return res.status(400).json({ success: false, message: msg, limitType: 'monthly' });
                }
                warning = warning ? warning + ' | ' + msg : msg;
            }
        }

        // ── Create the expense ────────────────────────────────────────────────
        const expense = await Expense.create({
            user: req.user.id,
            title,
            amount: expenseAmount,
            category,
            type,
            date: date || Date.now(),
            notes,
            bankAccount: bankAccountId || null,
        });

        // ── Feature 4: Deduct from linked bank account ────────────────────────
        if (bankAccountId) {
            const bankAccount = await BankAccount.findById(bankAccountId);
            if (bankAccount && bankAccount.user.toString() === req.user.id) {
                bankAccount.currentBalance -= expenseAmount;
                await bankAccount.save();
            }
        }

        res.status(201).json({ success: true, expense, ...(warning && { warning }) });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Private
const updateExpense = async (req, res) => {
    try {
        let expense = await Expense.findById(req.params.id);
        if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
        if (expense.user.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        expense = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        res.json({ success: true, expense });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete expense (refunds bank balance if linked)
// @route   DELETE /api/expenses/:id
// @access  Private
const deleteExpense = async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id);
        if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
        if (expense.user.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        // ── Feature 4: Refund bank balance on delete ──────────────────────────
        if (expense.bankAccount) {
            const bankAccount = await BankAccount.findById(expense.bankAccount);
            if (bankAccount && bankAccount.user.toString() === req.user.id) {
                bankAccount.currentBalance += expense.amount;
                await bankAccount.save();
            }
        }

        await expense.deleteOne();
        res.json({ success: true, message: 'Expense deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getExpenses, createExpense, updateExpense, deleteExpense };
