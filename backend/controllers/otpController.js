const crypto = require('crypto');
const User = require('../models/User');
const { sendOtpEmail } = require('../utils/mailer');

// ─── Helper ───────────────────────────────────────────────────────────────────
const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

// @desc    Send OTP to registered email
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
    console.log("=== FORGOT PASSWORD ROUTE HIT ===");
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

        const user = await User.findOne({ email: email.toLowerCase() }).select('+resetOtp +otpExpiry');
        // Always return 200 to avoid email enumeration
        if (!user) {
            console.log("=== RETURNING SUCCESS RESPONSE (User not found) ===");
            return res.json({ success: true, message: 'If that email is registered, an OTP has been sent.' });
        }

        const otp = generateOtp();
        user.resetOtp = otp;
        user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
        await user.save({ validateBeforeSave: false });

        console.log("Forgot password called for:", user.email);
        console.log("=== ABOUT TO CALL sendOtpEmail ===");

        try {
            await sendOtpEmail(user.email, otp);
            console.log("OTP email sent successfully to:", user.email);
        } catch (error) {
            console.error("OTP email sending failed:");
            console.error(error);
        }

        console.log("=== RETURNING SUCCESS RESPONSE ===");
        res.json({ success: true, message: 'OTP sent to your email. It expires in 5 minutes.' });
    } catch (error) {
        console.error('forgotPassword error:', error);
        res.status(500).json({ success: false, message: 'Failed to send OTP. Please try again.' });
    }
};

// @desc    Verify OTP and return a short-lived reset token
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP are required' });

        const user = await User.findOne({ email: email.toLowerCase() }).select('+resetOtp +otpExpiry');
        if (!user || !user.resetOtp) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }

        if (user.resetOtp !== String(otp).trim()) {
            return res.status(400).json({ success: false, message: 'Incorrect OTP' });
        }

        if (user.otpExpiry < new Date()) {
            return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
        }

        // Generate a one-time reset token (stored temporarily in OTP field overwrite)
        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetOtp = `VERIFIED:${resetToken}`;   // Mark as verified
        user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min to complete reset
        await user.save({ validateBeforeSave: false });

        res.json({ success: true, message: 'OTP verified', resetToken, email: user.email });
    } catch (error) {
        console.error('verifyOtp error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Reset password using OTP
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
    try {
        const { email, resetToken, newPassword } = req.body;
        if (!email || !resetToken || !newPassword) {
            return res.status(400).json({ success: false, message: 'Email, OTP (resetToken), and newPassword are required' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
        }

        const user = await User.findOne({ email: email.toLowerCase() }).select('+resetOtp +otpExpiry +password');
        if (!user || !user.resetOtp) {
            return res.status(400).json({ success: false, message: 'Invalid reset session. Please start over.' });
        }

        if (user.resetOtp !== String(resetToken).trim()) {
            return res.status(400).json({ success: false, message: 'Incorrect OTP' });
        }

        if (user.otpExpiry < new Date()) {
            return res.status(400).json({ success: false, message: 'OTP has expired. Please start over.' });
        }

        // Update password (pre-save hook will hash it)
        user.password = newPassword;
        user.resetOtp = undefined;
        user.otpExpiry = undefined;
        await user.save();

        res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
    } catch (error) {
        console.error('resetPassword error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { forgotPassword, verifyOtp, resetPassword };
