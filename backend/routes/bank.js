const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const { addBankAccount, getBankAccounts, updateBankBalance, deleteBankAccount } = require('../controllers/bankController');

router.post('/', protect, addBankAccount);
router.get('/', protect, getBankAccounts);
router.patch('/:id/balance', protect, updateBankBalance);
router.delete('/:id', protect, deleteBankAccount);

module.exports = router;
