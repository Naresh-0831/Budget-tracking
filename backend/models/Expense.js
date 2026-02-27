const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        title: {
            type: String,
            required: [true, 'Expense title is required'],
            trim: true,
        },
        amount: {
            type: Number,
            required: [true, 'Amount is required'],
            min: [0, 'Amount cannot be negative'],
        },
        category: {
            type: String,
            required: [true, 'Category is required'],
            enum: ['Food', 'Rent', 'Travel', 'Shopping', 'Bills', 'Others'],
        },
        type: {
            type: String,
            enum: ['needs', 'wants', 'savings'],
            required: true,
        },
        date: {
            type: Date,
            default: Date.now,
        },
        notes: {
            type: String,
            maxlength: [200, 'Notes cannot exceed 200 characters'],
        },
    },
    { timestamps: true }
);

// Index for faster queries
expenseSchema.index({ user: 1, date: -1 });
expenseSchema.index({ user: 1, category: 1 });

module.exports = mongoose.model('Expense', expenseSchema);
