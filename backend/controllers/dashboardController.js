const Expense = require('../models/Expense');
const User = require('../models/User');

// @desc    Get dashboard summary
// @route   GET /api/dashboard
// @access  Private
const getDashboard = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // Monthly expense aggregation
        const monthlyAgg = await Expense.aggregate([
            { $match: { user: user._id, date: { $gte: startOfMonth, $lte: endOfMonth } } },
            {
                $group: {
                    _id: '$type',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 },
                },
            },
        ]);

        const spending = { needs: 0, wants: 0, savings: 0 };
        monthlyAgg.forEach((item) => {
            spending[item._id] = item.total;
        });

        const totalExpenses = spending.needs + spending.wants + spending.savings;
        const salary = user.monthlySalary;
        const budgetRules = user.budgetRules;

        // Budget allocations
        const allocations = {
            needs: (salary * budgetRules.needs) / 100,
            wants: (salary * budgetRules.wants) / 100,
            savings: (salary * budgetRules.savings) / 100,
        };

        const remainingBalance = salary - totalExpenses;

        // Financial health score (0-100)
        let healthScore = 100;
        if (spending.needs > allocations.needs) healthScore -= 20;
        if (spending.wants > allocations.wants) healthScore -= 25;
        if (totalExpenses > salary * 0.9) healthScore -= 30;
        if (spending.savings < allocations.savings * 0.5) healthScore -= 25;
        healthScore = Math.max(0, healthScore);

        // Smart alerts
        const alerts = [];
        if (spending.needs > allocations.needs) {
            alerts.push({
                type: 'danger',
                category: 'Needs',
                message: `You've exceeded your Needs budget by ₹${(spending.needs - allocations.needs).toFixed(2)}`,
            });
        }
        if (spending.wants > allocations.wants) {
            alerts.push({
                type: 'warning',
                category: 'Wants',
                message: `You've exceeded your Wants budget by ₹${(spending.wants - allocations.wants).toFixed(2)}`,
            });
        }
        if (spending.needs > allocations.needs * 0.8 && spending.needs <= allocations.needs) {
            alerts.push({
                type: 'info',
                category: 'Needs',
                message: `You've used ${Math.round((spending.needs / allocations.needs) * 100)}% of your Needs budget`,
            });
        }
        if (totalExpenses > salary * 0.9) {
            alerts.push({
                type: 'danger',
                category: 'Budget',
                message: 'You have spent over 90% of your monthly income!',
            });
        }
        if (spending.savings < allocations.savings) {
            alerts.push({
                type: 'tip',
                category: 'Savings',
                message: `Save ₹${(allocations.savings - spending.savings).toFixed(2)} more to meet your savings goal`,
            });
        }

        res.json({
            success: true,
            dashboard: {
                totalIncome: salary,
                totalExpenses,
                remainingBalance,
                spending,
                allocations,
                budgetRules,
                healthScore,
                alerts,
                savingsPercentage: salary > 0 ? Math.round((spending.savings / salary) * 100) : 0,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get analytics data
// @route   GET /api/dashboard/analytics
// @access  Private
const getAnalytics = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const now = new Date();

        // Category-wise spending (this month)
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const categoryAgg = await Expense.aggregate([
            { $match: { user: user._id, date: { $gte: startOfMonth } } },
            { $group: { _id: '$category', total: { $sum: '$amount' } } },
            { $sort: { total: -1 } },
        ]);

        // Monthly totals (last 6 months)
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        const monthlyTotals = await Expense.aggregate([
            { $match: { user: user._id, date: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: { year: { $year: '$date' }, month: { $month: '$date' } },
                    total: { $sum: '$amount' },
                    needs: { $sum: { $cond: [{ $eq: ['$type', 'needs'] }, '$amount', 0] } },
                    wants: { $sum: { $cond: [{ $eq: ['$type', 'wants'] }, '$amount', 0] } },
                    savings: { $sum: { $cond: [{ $eq: ['$type', 'savings'] }, '$amount', 0] } },
                },
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
        ]);

        // Daily trend (last 30 days)
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const dailyTrend = await Expense.aggregate([
            { $match: { user: user._id, date: { $gte: thirtyDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
                    total: { $sum: '$amount' },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        res.json({
            success: true,
            analytics: { categoryAgg, monthlyTotals, dailyTrend },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getDashboard, getAnalytics };
