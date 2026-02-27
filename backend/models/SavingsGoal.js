const mongoose = require('mongoose');

const savingsGoalSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        title: {
            type: String,
            required: [true, 'Goal title is required'],
            trim: true,
        },
        targetAmount: {
            type: Number,
            required: [true, 'Target amount is required'],
            min: [1, 'Target must be at least 1'],
        },
        savedAmount: {
            type: Number,
            default: 0,
            min: [0, 'Saved amount cannot be negative'],
        },
        deadline: {
            type: Date,
        },
        description: {
            type: String,
            maxlength: [300, 'Description cannot exceed 300 characters'],
        },
        color: {
            type: String,
            default: '#6366f1',
        },
        icon: {
            type: String,
            default: '🎯',
        },
        isCompleted: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// Virtual: progress percentage
savingsGoalSchema.virtual('progressPercentage').get(function () {
    return Math.min(Math.round((this.savedAmount / this.targetAmount) * 100), 100);
});

// Virtual: remaining amount
savingsGoalSchema.virtual('remainingAmount').get(function () {
    return Math.max(this.targetAmount - this.savedAmount, 0);
});

// Virtual: days to deadline
savingsGoalSchema.virtual('daysLeft').get(function () {
    if (!this.deadline) return null;
    const diff = new Date(this.deadline) - new Date();
    return Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 0);
});

savingsGoalSchema.set('toJSON', { virtuals: true });
savingsGoalSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('SavingsGoal', savingsGoalSchema);
