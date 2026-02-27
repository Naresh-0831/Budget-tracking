const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const { getSavingsGoals, createSavingsGoal, updateSavingsGoal, deleteSavingsGoal } = require('../controllers/savingsController');

router.route('/').get(protect, getSavingsGoals).post(protect, createSavingsGoal);
router.route('/:id').put(protect, updateSavingsGoal).delete(protect, deleteSavingsGoal);

module.exports = router;
