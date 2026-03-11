import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
    DollarSign, TrendingUp, TrendingDown, Wallet, Activity,
    AlertTriangle, Info, Lightbulb, CheckCircle, CalendarDays
} from 'lucide-react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const fmt = (n) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n ?? 0);

const alertIcons = { danger: AlertTriangle, warning: AlertTriangle, info: Info, tip: Lightbulb };
const alertColors = {
    danger: 'border-red-500/30 bg-red-500/10 text-red-400',
    warning: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400',
    info: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
    tip: 'border-green-500/30 bg-green-500/10 text-green-400',
};

const healthColor = (score) => {
    if (score >= 80) return '#22c55e';
    if (score >= 50) return '#eab308';
    return '#ef4444';
};

function useCountUp(target, duration = 900) {
    const [val, setVal] = useState(0);
    const raf = useRef(null);
    useEffect(() => {
        const start = performance.now();
        const from = 0;
        const step = (now) => {
            const p = Math.min((now - start) / duration, 1);
            // ease-out cubic
            const eased = 1 - Math.pow(1 - p, 3);
            setVal(Math.round(from + (target - from) * eased));
            if (p < 1) raf.current = requestAnimationFrame(step);
        };
        raf.current = requestAnimationFrame(step);
        return () => cancelAnimationFrame(raf.current);
    }, [target, duration]);
    return val;
}

function StatCard({ icon: Icon, label, value, rawValue, sub, color, negative }) {
    const animated = useCountUp(rawValue ?? 0);
    const displayValue = typeof rawValue === 'number' ? fmt(animated) : value;
    const borderColor = negative ? '#ef4444' : color;
    return (
        <div
            className="glass rounded-2xl p-5 card-hover transition-all duration-300"
            style={{ borderLeft: `3px solid ${borderColor}40` }}
        >
            <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${borderColor}20` }}>
                    <Icon size={20} style={{ color: borderColor }} />
                </div>
                {negative && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ background: '#ef444420', color: '#f87171' }}>Over budget</span>
                )}
            </div>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-1">{label}</p>
            <p className="font-bold text-2xl transition-all duration-300" style={{ color: negative ? '#f87171' : 'white' }}>
                {displayValue}
            </p>
            {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
        </div>
    );
}

function BudgetBar({ label, spent, allocated, color }) {
    const pct = allocated > 0 ? Math.min((spent / allocated) * 100, 100) : 0;
    const over = spent > allocated;
    return (
        <div className="mb-4">
            <div className="flex justify-between text-sm mb-1.5">
                <span className="text-slate-300 font-medium">{label}</span>
                <span className={over ? 'text-red-400 font-semibold' : 'text-slate-400'}>
                    ${spent.toFixed(0)} / ${allocated.toFixed(0)}
                </span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: over ? '#ef4444' : color }}
                />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{pct.toFixed(0)}% used</p>
        </div>
    );
}

export default function Dashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await api.get('/dashboard');
                setData(res.data.dashboard);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (!data) return <div className="text-slate-400 text-center py-20">Failed to load dashboard.</div>;

    const pieData = {
        labels: ['Needs', 'Wants', 'Savings', 'Remaining'],
        datasets: [{
            data: [
                data.spending.needs,
                data.spending.wants,
                data.spending.savings,
                Math.max(data.remainingBalance, 0),
            ],
            backgroundColor: ['#6366f1', '#a855f7', '#22c55e', '#1e1b4b'],
            borderColor: ['#818cf8', '#c084fc', '#4ade80', '#312e81'],
            borderWidth: 2,
        }],
    };

    const pieOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: { color: '#94a3b8', font: { size: 12 }, padding: 15 },
                position: 'bottom',
            },
        },
        cutout: '65%',
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={DollarSign}
                    label="Monthly Income"
                    rawValue={data.totalIncome}
                    sub={user?.incomeType === 'annual' ? 'Annual ÷ 12' : 'This month'}
                    color="#6366f1"
                />
                <StatCard
                    icon={TrendingDown}
                    label="Total Expenses"
                    rawValue={data.totalExpenses}
                    sub="This month"
                    color="#ef4444"
                />
                <StatCard
                    icon={Wallet}
                    label="Remaining"
                    rawValue={Math.abs(data.remainingBalance)}
                    sub={data.remainingBalance < 0 ? 'Overspent this month' : 'Available balance'}
                    color="#22c55e"
                    negative={data.remainingBalance < 0}
                />
                <StatCard
                    icon={TrendingUp}
                    label="Savings Goal"
                    rawValue={data.allocations.savings}
                    sub={`${data.savingsPercentage}% of income saved`}
                    color="#a855f7"
                />
            </div>

            {/* Feature 2 — Smart Remaining Days row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="glass rounded-2xl p-5 card-hover" style={{ borderLeft: '3px solid #f59e0b40' }}>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#f59e0b20' }}>
                            <CalendarDays size={20} style={{ color: '#f59e0b' }} />
                        </div>
                        <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">Days Left This Month</p>
                    </div>
                    <p className="font-bold text-2xl text-white">{data.remainingDays ?? '—'} <span className="text-sm font-normal text-slate-400">days</span></p>
                    <p className="text-slate-500 text-xs mt-1">Until end of month</p>
                </div>
                <div className="glass rounded-2xl p-5 card-hover" style={{ borderLeft: '3px solid #22d3ee40' }}>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#22d3ee20' }}>
                            <TrendingDown size={20} style={{ color: '#22d3ee' }} />
                        </div>
                        <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">Recommended Daily Spend</p>
                    </div>
                    <p className={`font-bold text-2xl ${(data.recommendedDailyLimit ?? 0) < 0 ? 'text-red-400' : 'text-white'}`}>
                        {fmt(data.recommendedDailyLimit ?? 0)}
                    </p>
                    <p className="text-slate-500 text-xs mt-1">
                        {data.monthlyLimit > 0 ? `Based on ₹${data.monthlyLimit.toLocaleString('en-IN')} monthly limit` : 'Based on your salary'}
                    </p>
                </div>
                {data.dailyLimit > 0 && (
                    <div className="glass rounded-2xl p-5 card-hover" style={{ borderLeft: '3px solid #f43f5e40' }}>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#f43f5e20' }}>
                                <Activity size={20} style={{ color: '#f43f5e' }} />
                            </div>
                            <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">Daily Limit</p>
                        </div>
                        <p className="font-bold text-2xl text-white">{fmt(data.dailyLimit)}</p>
                        <p className="text-slate-500 text-xs mt-1">{data.lockEnabled ? '🔒 Lock enabled' : '⚠️ Warning mode'}</p>
                    </div>
                )}
            </div>

            {/* Health + Pie + Alerts row */}
            <div className="grid lg:grid-cols-3 gap-4">
                {/* Financial Health Score */}
                <div className="glass rounded-2xl p-5 card-hover">
                    <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                        <Activity size={18} className="text-indigo-400" /> Financial Health
                    </h3>
                    <div className="flex flex-col items-center">
                        <div className="relative w-36 h-36">
                            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
                                <circle
                                    cx="50" cy="50" r="40" fill="none"
                                    stroke={healthColor(data.healthScore)}
                                    strokeWidth="10"
                                    strokeDasharray={`${(data.healthScore / 100) * 251.2} 251.2`}
                                    strokeLinecap="round"
                                    className="transition-all duration-1000"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-bold text-white">{data.healthScore}</span>
                                <span className="text-xs text-slate-400">/100</span>
                            </div>
                        </div>
                        <p className="mt-3 text-sm font-semibold" style={{ color: healthColor(data.healthScore) }}>
                            {data.healthScore >= 80 ? '🟢 Excellent' : data.healthScore >= 50 ? '🟡 Fair' : '🔴 Needs Attention'}
                        </p>
                    </div>
                </div>

                {/* Pie Chart */}
                <div className="glass rounded-2xl p-5 card-hover">
                    <h3 className="text-white font-semibold mb-3">Spending Breakdown</h3>
                    <div className="h-48">
                        <Doughnut data={pieData} options={pieOptions} />
                    </div>
                </div>

                {/* Alerts */}
                <div className="glass rounded-2xl p-5 overflow-y-auto max-h-72">
                    <h3 className="text-white font-semibold mb-3">Smart Alerts</h3>
                    <div className="space-y-2">
                        {data.alerts.length === 0 ? (
                            <div className="flex items-center gap-2 text-green-400 text-sm">
                                <CheckCircle size={16} /> All budgets on track!
                            </div>
                        ) : data.alerts.map((alert, i) => {
                            const Icon = alertIcons[alert.type] || Info;
                            return (
                                <div key={i} className={`flex items-start gap-2 p-2.5 rounded-xl border text-sm ${alertColors[alert.type]}`}>
                                    <Icon size={14} className="shrink-0 mt-0.5" />
                                    <div>
                                        <span className="font-medium">{alert.category}: </span>
                                        {alert.message}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Budget Bars */}
            <div className="glass rounded-2xl p-5 card-hover">
                <h3 className="text-white font-semibold mb-5">Budget Allocation ({user?.budgetRules?.needs}/{user?.budgetRules?.wants}/{user?.budgetRules?.savings} Rule)</h3>
                <BudgetBar label={`Needs (${user?.budgetRules?.needs}%)`} spent={data.spending.needs} allocated={data.allocations.needs} color="#6366f1" />
                <BudgetBar label={`Wants (${user?.budgetRules?.wants}%)`} spent={data.spending.wants} allocated={data.allocations.wants} color="#a855f7" />
                <BudgetBar label={`Savings (${user?.budgetRules?.savings}%)`} spent={data.spending.savings} allocated={data.allocations.savings} color="#22c55e" />
            </div>
        </div>
    );
}
