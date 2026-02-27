const Expense = require('../models/Expense');

// ─────────────────────────────────────────────
// 1. EXPENSE PREDICTION  –  Linear Regression
// ─────────────────────────────────────────────
const predictExpense = async (req, res) => {
    try {
        const userId = req.user._id;

        // Aggregate monthly totals (last 12 months)
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

        const monthlyData = await Expense.aggregate([
            { $match: { user: userId, date: { $gte: twelveMonthsAgo } } },
            {
                $group: {
                    _id: { year: { $year: '$date' }, month: { $month: '$date' } },
                    total: { $sum: '$amount' },
                },
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
        ]);

        if (monthlyData.length < 2) {
            return res.json({
                success: true,
                prediction: {
                    predictedAmount: 0,
                    confidence: 0,
                    message: 'Not enough data (need at least 2 months of expenses to predict).',
                    dataPoints: monthlyData.length,
                },
            });
        }

        // Simple least-squares linear regression  y = a + bx
        const n = monthlyData.length;
        const x = monthlyData.map((_, i) => i + 1);       // month index 1..n
        const y = monthlyData.map(d => d.total);

        const sumX = x.reduce((s, v) => s + v, 0);
        const sumY = y.reduce((s, v) => s + v, 0);
        const sumXY = x.reduce((s, v, i) => s + v * y[i], 0);
        const sumX2 = x.reduce((s, v) => s + v * v, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        const nextX = n + 1;
        const predictedAmount = Math.max(0, intercept + slope * nextX);

        // R² confidence score
        const meanY = sumY / n;
        const SStot = y.reduce((s, v) => s + (v - meanY) ** 2, 0);
        const SSres = y.reduce((s, v, i) => s + (v - (intercept + slope * x[i])) ** 2, 0);
        const rSquared = SStot === 0 ? 1 : Math.max(0, 1 - SSres / SStot);
        const confidence = Math.round(rSquared * 100);

        res.json({
            success: true,
            prediction: {
                predictedAmount: parseFloat(predictedAmount.toFixed(2)),
                confidence,
                trend: slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable',
                dataPoints: n,
                message: `Based on ${n} months of data. Confidence: ${confidence}%.`,
            },
        });
    } catch (error) {
        console.error('predictExpense error:', error);
        res.status(500).json({ success: false, message: 'Server error while predicting expense.' });
    }
};

// ─────────────────────────────────────────────
// 2. SMART CATEGORY SUGGESTION  –  Keyword NLP
// ─────────────────────────────────────────────
const CATEGORY_KEYWORDS = {
    Food: [
        'pizza', 'burger', 'dominos', 'mcdonalds', 'kfc', 'subway', 'restaurant',
        'cafe', 'coffee', 'starbucks', 'food', 'groceries', 'grocery', 'supermarket',
        'bakery', 'diner', 'lunch', 'dinner', 'breakfast', 'snack', 'meal', 'zomato',
        'swiggy', 'ubereats', 'eat', 'sushi', 'taco', 'noodle', 'rice', 'bread', 'milk',
    ],
    Rent: [
        'rent', 'lease', 'flat', 'apartment', 'housing', 'landlord', 'mortgage',
        'hostel', 'pg', 'room', 'accommodation', 'maintenance',
    ],
    Travel: [
        'uber', 'ola', 'taxi', 'cab', 'flight', 'bus', 'train', 'metro', 'fuel',
        'petrol', 'diesel', 'toll', 'parking', 'hotel', 'airbnb', 'travel', 'trip',
        'vacation', 'ticket', 'railway', 'airline', 'rapido', 'blinkit',
    ],
    Shopping: [
        'amazon', 'flipkart', 'myntra', 'clothes', 'clothing', 'shirt', 'shoes',
        'dress', 'fashion', 'mall', 'store', 'shop', 'buy', 'purchase', 'order',
        'delivery', 'gadget', 'electronics', 'iphone', 'samsung', 'laptop',
    ],
    Bills: [
        'bill', 'electricity', 'water', 'internet', 'wifi', 'broadband', 'phone',
        'mobile', 'recharge', 'subscription', 'netflix', 'spotify', 'amazon prime',
        'insurance', 'emi', 'loan', 'tax', 'fee', 'utility', 'gas', 'jio', 'airtel',
    ],
};

const suggestCategory = async (req, res) => {
    try {
        const { title } = req.body;

        if (!title || typeof title !== 'string') {
            return res.status(400).json({ success: false, message: 'title is required.' });
        }

        const lower = title.toLowerCase();

        let bestMatch = 'Others';
        let bestScore = 0;

        for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
            const score = keywords.reduce((s, kw) => (lower.includes(kw) ? s + kw.length : s), 0);
            if (score > bestScore) {
                bestScore = score;
                bestMatch = category;
            }
        }

        res.json({ success: true, suggestedCategory: bestMatch });
    } catch (error) {
        console.error('suggestCategory error:', error);
        res.status(500).json({ success: false, message: 'Server error while suggesting category.' });
    }
};

// ─────────────────────────────────────────────
// 3. ANOMALY DETECTION  –  >2× category average
// ─────────────────────────────────────────────
const detectAnomalies = async (req, res) => {
    try {
        const userId = req.user._id;

        // Per-category average
        const categoryStats = await Expense.aggregate([
            { $match: { user: userId } },
            {
                $group: {
                    _id: '$category',
                    avgAmount: { $avg: '$amount' },
                    count: { $sum: 1 },
                },
            },
        ]);

        if (categoryStats.length === 0) {
            return res.json({ success: true, anomalies: [], message: 'No expenses found.' });
        }

        const avgMap = {};
        categoryStats.forEach(c => { avgMap[c._id] = c.avgAmount; });

        // Fetch all expenses and flag anomalies
        const expenses = await Expense.find({ user: userId }).sort({ date: -1 }).limit(200);

        const anomalies = expenses
            .filter(e => avgMap[e.category] && e.amount > 2 * avgMap[e.category])
            .map(e => ({
                _id: e._id,
                title: e.title,
                amount: e.amount,
                category: e.category,
                date: e.date,
                isAnomaly: true,
                categoryAvg: parseFloat(avgMap[e.category].toFixed(2)),
                ratio: parseFloat((e.amount / avgMap[e.category]).toFixed(2)),
            }));

        res.json({
            success: true,
            anomalies,
            total: anomalies.length,
            message: anomalies.length === 0 ? 'No anomalies detected. Your spending looks normal!' : `${anomalies.length} anomalous expense(s) detected.`,
        });
    } catch (error) {
        console.error('detectAnomalies error:', error);
        res.status(500).json({ success: false, message: 'Server error during anomaly detection.' });
    }
};

// ─────────────────────────────────────────────
// 4. BUDGET RECOMMENDATIONS  –  Last 3 months avg
// ─────────────────────────────────────────────
const getBudgetRecommendations = async (req, res) => {
    try {
        const userId = req.user._id;

        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        const data = await Expense.aggregate([
            { $match: { user: userId, date: { $gte: threeMonthsAgo } } },
            {
                $group: {
                    _id: {
                        category: '$category',
                        year: { $year: '$date' },
                        month: { $month: '$date' },
                    },
                    monthTotal: { $sum: '$amount' },
                },
            },
            {
                $group: {
                    _id: '$_id.category',
                    avgMonthlySpend: { $avg: '$monthTotal' },
                    totalSpend: { $sum: '$monthTotal' },
                    monthsActive: { $sum: 1 },
                },
            },
            { $sort: { avgMonthlySpend: -1 } },
        ]);

        if (data.length === 0) {
            return res.json({
                success: true,
                recommendations: [],
                message: 'No data available for the last 3 months.',
            });
        }

        // Also get the previous 3-month window to compute trend
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const prevData = await Expense.aggregate([
            { $match: { user: userId, date: { $gte: sixMonthsAgo, $lt: threeMonthsAgo } } },
            {
                $group: {
                    _id: {
                        category: '$category',
                        year: { $year: '$date' },
                        month: { $month: '$date' },
                    },
                    monthTotal: { $sum: '$amount' },
                },
            },
            { $group: { _id: '$_id.category', avgMonthlySpend: { $avg: '$monthTotal' } } },
        ]);

        const prevMap = {};
        prevData.forEach(p => { prevMap[p._id] = p.avgMonthlySpend; });

        const recommendations = data.map(cat => {
            const avg = cat.avgMonthlySpend;
            // Recommend 10% buffer above average; minimum $10
            const budget = Math.max(10, Math.ceil(avg * 1.10));
            const prevAvg = prevMap[cat._id];
            let trend = 'stable';
            if (prevAvg) {
                const change = ((avg - prevAvg) / prevAvg) * 100;
                if (change > 5) trend = 'increasing';
                else if (change < -5) trend = 'decreasing';
            }

            return {
                category: cat._id,
                avgMonthlySpend: parseFloat(avg.toFixed(2)),
                recommendedBudget: parseFloat(budget.toFixed(2)),
                trend,
                monthsActive: cat.monthsActive,
            };
        });

        res.json({ success: true, recommendations });
    } catch (error) {
        console.error('getBudgetRecommendations error:', error);
        res.status(500).json({ success: false, message: 'Server error while generating recommendations.' });
    }
};

module.exports = { predictExpense, suggestCategory, detectAnomalies, getBudgetRecommendations };
