const mongoose = require('mongoose');

const bankAccountSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        bankName: {
            type: String,
            required: [true, 'Bank name is required'],
            trim: true,
        },
        accountHolderName: {
            type: String,
            required: [true, 'Account holder name is required'],
            trim: true,
        },
        accountNumber: {
            type: String,
            required: [true, 'Account number is required'],
            trim: true,
        },
        ifscCode: {
            type: String,
            required: [true, 'IFSC code is required'],
            trim: true,
            uppercase: true,
        },
        currentBalance: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

// Index for fast user-based queries
bankAccountSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('BankAccount', bankAccountSchema);
