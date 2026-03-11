const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            maxlength: [50, 'Name cannot exceed 50 characters'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter valid email'],
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters'],
            select: false,
        },
        monthlySalary: {
            type: Number,
            default: 0,
        },
        monthlyIncome: {
            type: Number,
            default: null,
        },
        incomeType: {
            type: String,
            enum: ['monthly', 'annual'],
            default: 'monthly',
        },
        currency: {
            type: String,
            default: 'INR',
        },
        budgetRules: {
            needs: { type: Number, default: 50 },
            wants: { type: Number, default: 30 },
            savings: { type: Number, default: 20 },
        },
        // Spending limits (Feature 1)
        monthlyLimit: { type: Number, default: 0 },
        dailyLimit: { type: Number, default: 0 },
        lockEnabled: { type: Boolean, default: false },
        // Forgot-password OTP (Feature 3)
        resetOtp: { type: String, select: false },
        otpExpiry: { type: Date, select: false },
        theme: {
            type: String,
            enum: ['light', 'dark'],
            default: 'dark',
        },
    },
    { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 12);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
