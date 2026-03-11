const BankAccount = require('../models/BankAccount');

// Helper: mask account number (show only last 4 digits)
const maskAccountNumber = (num) => {
    const s = String(num);
    return s.length > 4 ? '*'.repeat(s.length - 4) + s.slice(-4) : s;
};

// @desc    Add a bank account
// @route   POST /api/bank
// @access  Private
const addBankAccount = async (req, res) => {
    try {
        const { bankName, accountHolderName, accountNumber, ifscCode, currentBalance } = req.body;

        if (!bankName || !accountHolderName || !accountNumber || !ifscCode) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        const account = await BankAccount.create({
            user: req.user.id,
            bankName,
            accountHolderName,
            accountNumber,
            ifscCode,
            currentBalance: currentBalance || 0,
        });

        // Return with masked number
        const responseAccount = account.toObject();
        responseAccount.maskedAccountNumber = maskAccountNumber(account.accountNumber);

        res.status(201).json({ success: true, account: responseAccount });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all bank accounts for user (masked account numbers)
// @route   GET /api/bank
// @access  Private
const getBankAccounts = async (req, res) => {
    try {
        const accounts = await BankAccount.find({ user: req.user.id }).sort({ createdAt: -1 });

        const masked = accounts.map((a) => {
            const obj = a.toObject();
            obj.maskedAccountNumber = maskAccountNumber(a.accountNumber);
            delete obj.accountNumber; // don't expose raw number
            return obj;
        });

        res.json({ success: true, accounts: masked });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Manually update bank balance
// @route   PATCH /api/bank/:id/balance
// @access  Private
const updateBankBalance = async (req, res) => {
    try {
        const { currentBalance } = req.body;
        if (currentBalance === undefined || isNaN(currentBalance)) {
            return res.status(400).json({ success: false, message: 'Valid balance is required' });
        }

        const account = await BankAccount.findById(req.params.id);
        if (!account) return res.status(404).json({ success: false, message: 'Bank account not found' });
        if (account.user.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        account.currentBalance = parseFloat(currentBalance);
        await account.save();

        const obj = account.toObject();
        obj.maskedAccountNumber = maskAccountNumber(account.accountNumber);
        delete obj.accountNumber;

        res.json({ success: true, message: 'Balance updated', account: obj });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete a bank account
// @route   DELETE /api/bank/:id
// @access  Private
const deleteBankAccount = async (req, res) => {
    try {
        const account = await BankAccount.findById(req.params.id);
        if (!account) return res.status(404).json({ success: false, message: 'Bank account not found' });
        if (account.user.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        await account.deleteOne();
        res.json({ success: true, message: 'Bank account removed' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { addBankAccount, getBankAccounts, updateBankBalance, deleteBankAccount };
