const router = require('express').Router();
const protect = require('../middleware/auth');
const {
    predictExpense,
    suggestCategory,
    detectAnomalies,
    getBudgetRecommendations,
} = require('../controllers/mlController');

// GET  /api/ml/predict-expense
router.get('/predict-expense', protect, predictExpense);

// POST /api/ml/suggest-category   body: { title: "Dominos Pizza" }
router.post('/suggest-category', protect, suggestCategory);

// GET  /api/ml/anomalies
router.get('/anomalies', protect, detectAnomalies);

// GET  /api/ml/budget-recommendations
router.get('/budget-recommendations', protect, getBudgetRecommendations);

module.exports = router;
