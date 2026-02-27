const SavingsGoal = require('../models/SavingsGoal');

// @desc    Get all savings goals
// @route   GET /api/savings
// @access  Private
const getSavingsGoals = async (req, res) => {
    try {
        const goals = await SavingsGoal.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json({ success: true, goals });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create savings goal
// @route   POST /api/savings
// @access  Private
const createSavingsGoal = async (req, res) => {
    try {
        const { title, targetAmount, savedAmount, deadline, description, color, icon } = req.body;
        const goal = await SavingsGoal.create({
            user: req.user.id,
            title,
            targetAmount,
            savedAmount: savedAmount || 0,
            deadline,
            description,
            color,
            icon,
        });
        res.status(201).json({ success: true, goal });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update savings goal
// @route   PUT /api/savings/:id
// @access  Private
const updateSavingsGoal = async (req, res) => {
    try {
        let goal = await SavingsGoal.findById(req.params.id);
        if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });
        if (goal.user.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        // Auto-complete if saved >= target
        if (req.body.savedAmount >= goal.targetAmount) {
            req.body.isCompleted = true;
        }

        goal = await SavingsGoal.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        res.json({ success: true, goal });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete savings goal
// @route   DELETE /api/savings/:id
// @access  Private
const deleteSavingsGoal = async (req, res) => {
    try {
        const goal = await SavingsGoal.findById(req.params.id);
        if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });
        if (goal.user.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        await goal.deleteOne();
        res.json({ success: true, message: 'Savings goal deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getSavingsGoals, createSavingsGoal, updateSavingsGoal, deleteSavingsGoal };
