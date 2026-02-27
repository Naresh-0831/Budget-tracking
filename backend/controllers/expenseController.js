const Expense = require('../models/Expense');

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
            Expense.find(query).sort({ date: -1 }).limit(parseInt(limit)).skip(skip),
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

// @desc    Create expense
// @route   POST /api/expenses
// @access  Private
const createExpense = async (req, res) => {
    try {
        const { title, amount, category, type, date, notes } = req.body;
        const expense = await Expense.create({
            user: req.user.id,
            title,
            amount,
            category,
            type,
            date: date || Date.now(),
            notes,
        });
        res.status(201).json({ success: true, expense });
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

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private
const deleteExpense = async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id);
        if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
        if (expense.user.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        await expense.deleteOne();
        res.json({ success: true, message: 'Expense deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getExpenses, createExpense, updateExpense, deleteExpense };
