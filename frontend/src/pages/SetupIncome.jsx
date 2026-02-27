import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { TrendingUp, DollarSign, Loader, Calculator, PiggyBank } from 'lucide-react';

const fmt = (n) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default function SetupIncome() {
    const [incomeType, setIncomeType] = useState('monthly');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const { updateUser } = useAuth();
    const navigate = useNavigate();

    const monthly = incomeType === 'annual' && amount
        ? parseFloat(amount) / 12
        : parseFloat(amount) || 0;

    const alloc = {
        needs: monthly * 0.50,
        wants: monthly * 0.30,
        savings: monthly * 0.20,
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!amount || parseFloat(amount) <= 0) {
            toast.error('Please enter a valid income amount.');
            return;
        }
        setLoading(true);
        try {
            const { data } = await api.put('/auth/set-income', {
                incomeType,
                amount: parseFloat(amount),
            });
            updateUser(data.user);
            toast.success('Income saved! Welcome to your dashboard 🎉');
            navigate('/');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save income.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center relative overflow-hidden px-4"
            style={{ background: 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)' }}
        >
            {/* Background orbs */}
            <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
                style={{ background: 'radial-gradient(circle,#6366f1,transparent)' }} />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-15 blur-3xl pointer-events-none"
                style={{ background: 'radial-gradient(circle,#a855f7,transparent)' }} />

            <div className="w-full max-w-lg relative z-10 animate-slide-up">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg"
                        style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)', boxShadow: '0 0 30px #6366f140' }}>
                        <TrendingUp className="text-white" size={28} />
                    </div>
                    <h1 className="text-3xl font-bold text-white">Set Your Income</h1>
                    <p className="text-slate-400 mt-2 text-sm">
                        We'll use this to build your personalised budget plan
                    </p>
                </div>

                <div className="glass rounded-2xl p-8 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Income type toggle */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-3">
                                Income Type
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { value: 'monthly', label: 'Monthly Income', icon: DollarSign },
                                    { value: 'annual', label: 'Annual Package', icon: Calculator },
                                ].map(({ value, label, icon: Icon }) => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => setIncomeType(value)}
                                        className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 text-sm font-medium"
                                        style={{
                                            borderColor: incomeType === value ? '#6366f1' : 'rgba(255,255,255,0.1)',
                                            background: incomeType === value ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                                            color: incomeType === value ? '#a5b4fc' : '#94a3b8',
                                        }}
                                    >
                                        <Icon size={18} />
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Amount input */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                {incomeType === 'annual' ? 'Annual CTC / Package' : 'Monthly Take-home'}
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-lg">₹</span>
                                <input
                                    type="number"
                                    min="1"
                                    step="any"
                                    required
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder={incomeType === 'annual' ? '600000' : '50000'}
                                    className="w-full pl-9 pr-4 py-3 rounded-xl text-white text-lg font-semibold placeholder:text-slate-600 outline-none transition"
                                    style={{
                                        background: 'rgba(255,255,255,0.07)',
                                        border: '1px solid rgba(255,255,255,0.12)',
                                    }}
                                    onFocus={e => e.target.style.borderColor = '#6366f1'}
                                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
                                />
                            </div>

                            {/* Annual → monthly preview */}
                            {incomeType === 'annual' && monthly > 0 && (
                                <p className="text-indigo-400 text-sm mt-2 flex items-center gap-1.5">
                                    <Calculator size={14} />
                                    {fmt(parseFloat(amount))} ÷ 12 = <strong>{fmt(monthly)} / month</strong>
                                </p>
                            )}
                        </div>

                        {/* 50-30-20 preview */}
                        {monthly > 0 && (
                            <div className="rounded-xl p-4 space-y-2" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
                                <p className="text-slate-300 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <PiggyBank size={14} className="text-indigo-400" />
                                    Auto Budget Allocation (50-30-20 Rule)
                                </p>
                                {[
                                    { label: 'Needs', pct: 50, val: alloc.needs, color: '#6366f1' },
                                    { label: 'Wants', pct: 30, val: alloc.wants, color: '#a855f7' },
                                    { label: 'Savings', pct: 20, val: alloc.savings, color: '#22c55e' },
                                ].map(({ label, pct, val, color }) => (
                                    <div key={label} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                                            <span className="text-slate-300">{label} <span className="text-slate-500">({pct}%)</span></span>
                                        </div>
                                        <span className="text-white font-semibold">{fmt(val)}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !amount}
                            className="w-full py-3.5 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                            style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)', boxShadow: '0 4px 20px rgba(99,102,241,0.4)' }}
                        >
                            {loading
                                ? <><Loader size={18} className="animate-spin" /> Saving…</>
                                : 'Save & Go to Dashboard →'
                            }
                        </button>
                    </form>
                </div>

                <p className="text-center text-slate-500 text-xs mt-4">
                    You can update your income anytime from Budget Settings
                </p>
            </div>
        </div>
    );
}
