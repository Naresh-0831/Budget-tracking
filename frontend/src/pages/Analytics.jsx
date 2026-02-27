import { useState, useEffect } from 'react';
import api from '../services/api';
import {
    Chart as ChartJS, ArcElement, Tooltip, Legend,
    CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler,
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler);

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const CATEGORY_COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f97316', '#eab308', '#22c55e'];

const chartDefaults = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { labels: { color: '#94a3b8', font: { size: 12 }, padding: 15 }, position: 'bottom' },
        tooltip: { backgroundColor: '#1e1b4b', borderColor: '#6366f1', borderWidth: 1, titleColor: '#fff', bodyColor: '#94a3b8' },
    },
};

export default function Analytics() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/dashboard/analytics').then(res => {
            setData(res.data.analytics);
        }).finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (!data) return <div className="text-slate-400 text-center py-20">No analytics data available yet.</div>;

    // Pie: category spending
    const pieData = {
        labels: data.categoryAgg.map(c => c._id),
        datasets: [{
            data: data.categoryAgg.map(c => c.total),
            backgroundColor: CATEGORY_COLORS,
            borderColor: CATEGORY_COLORS.map(c => c + 'aa'),
            borderWidth: 2,
        }],
    };

    // Bar: monthly totals
    const barData = {
        labels: data.monthlyTotals.map(m => `${MONTH_NAMES[m._id.month - 1]} ${m._id.year}`),
        datasets: [
            { label: 'Needs', data: data.monthlyTotals.map(m => m.needs), backgroundColor: '#6366f155', borderColor: '#6366f1', borderWidth: 2, borderRadius: 6 },
            { label: 'Wants', data: data.monthlyTotals.map(m => m.wants), backgroundColor: '#a855f755', borderColor: '#a855f7', borderWidth: 2, borderRadius: 6 },
            { label: 'Savings', data: data.monthlyTotals.map(m => m.savings), backgroundColor: '#22c55e55', borderColor: '#22c55e', borderWidth: 2, borderRadius: 6 },
        ],
    };

    // Line: daily trend
    const lineData = {
        labels: data.dailyTrend.map(d => d._id),
        datasets: [{
            label: 'Daily Spending',
            data: data.dailyTrend.map(d => d.total),
            fill: true,
            backgroundColor: 'rgba(99,102,241,0.1)',
            borderColor: '#6366f1',
            borderWidth: 2.5,
            pointBackgroundColor: '#6366f1',
            pointRadius: 4,
            tension: 0.4,
        }],
    };

    const axisColor = { scales: { x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } }, y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } } } };

    return (
        <div className="space-y-5 animate-fade-in">
            <div>
                <h2 className="text-xl font-bold text-white">Analytics</h2>
                <p className="text-slate-400 text-sm">Visualize your spending patterns</p>
            </div>

            {/* Pie + Bar row */}
            <div className="grid lg:grid-cols-2 gap-5">
                <div className="glass rounded-2xl p-5 card-hover">
                    <h3 className="text-white font-semibold mb-4">Category Spending (This Month)</h3>
                    {data.categoryAgg.length === 0 ? (
                        <p className="text-slate-400 text-sm text-center py-8">No data yet</p>
                    ) : (
                        <div className="h-64">
                            <Doughnut data={pieData} options={{ ...chartDefaults, cutout: '60%' }} />
                        </div>
                    )}
                </div>

                <div className="glass rounded-2xl p-5 card-hover">
                    <h3 className="text-white font-semibold mb-4">Monthly Breakdown (Last 6 Months)</h3>
                    {data.monthlyTotals.length === 0 ? (
                        <p className="text-slate-400 text-sm text-center py-8">No data yet</p>
                    ) : (
                        <div className="h-64">
                            <Bar data={barData} options={{ ...chartDefaults, ...axisColor }} />
                        </div>
                    )}
                </div>
            </div>

            {/* Line chart */}
            <div className="glass rounded-2xl p-5 card-hover">
                <h3 className="text-white font-semibold mb-4">Daily Spending Trend (Last 30 Days)</h3>
                {data.dailyTrend.length === 0 ? (
                    <p className="text-slate-400 text-sm text-center py-8">No data yet. Start adding expenses!</p>
                ) : (
                    <div className="h-64">
                        <Line data={lineData} options={{ ...chartDefaults, ...axisColor }} />
                    </div>
                )}
            </div>

            {/* Category breakdown table */}
            {data.categoryAgg.length > 0 && (
                <div className="glass rounded-2xl p-5 card-hover">
                    <h3 className="text-white font-semibold mb-4">Category Breakdown</h3>
                    <div className="space-y-3">
                        {data.categoryAgg.map((cat, i) => {
                            const total = data.categoryAgg.reduce((s, c) => s + c.total, 0);
                            const pct = Math.round((cat.total / total) * 100);
                            return (
                                <div key={cat._id}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-slate-300">{cat._id}</span>
                                        <span className="text-white font-semibold">${cat.total.toFixed(2)} <span className="text-slate-500 font-normal">({pct}%)</span></span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
