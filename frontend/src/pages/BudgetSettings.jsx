import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Loader, Save, DollarSign } from 'lucide-react';

export default function BudgetSettings() {
    const { user, updateUser } = useAuth();
    const [salary, setSalary] = useState(user?.monthlySalary || '');
    const [rules, setRules] = useState({
        needs: user?.budgetRules?.needs ?? 50,
        wants: user?.budgetRules?.wants ?? 30,
        savings: user?.budgetRules?.savings ?? 20,
    });
    const [currency, setCurrency] = useState(user?.currency || 'INR');
    const [saving, setSaving] = useState(false);

    const total = rules.needs + rules.wants + rules.savings;

    const handleSlider = (key, value) => {
        const num = parseInt(value);
        const remaining = 100 - num;
        const others = Object.keys(rules).filter(k => k !== key);
        const updated = { ...rules, [key]: num };
        // Distribute remaining proportionally
        const otherTotal = others.reduce((s, k) => s + rules[k], 0);
        if (otherTotal > 0) {
            others.forEach(k => {
                updated[k] = Math.round((rules[k] / otherTotal) * remaining);
            });
        } else {
            others.forEach((k, i) => {
                updated[k] = i === 0 ? Math.floor(remaining / 2) : Math.ceil(remaining / 2);
            });
        }
        setRules(updated);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (Math.round(total) !== 100) return toast.error('Percentages must add up to 100%');
        setSaving(true);
        try {
            const { data } = await api.put('/auth/budget-settings', {
                monthlySalary: parseFloat(salary),
                budgetRules: rules,
                currency,
            });
            updateUser(data.user);
            toast.success('Budget settings saved! 🎉');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Error saving settings');
        } finally {
            setSaving(false);
        }
    };

    const RULE_COLORS = { needs: '#6366f1', wants: '#a855f7', savings: '#22c55e' };
    const RULE_LABELS = { needs: 'Needs (essential expenses)', wants: 'Wants (discretionary)', savings: 'Savings & investments' };

    const allocations = {
        needs: (salary * rules.needs) / 100,
        wants: (salary * rules.wants) / 100,
        savings: (salary * rules.savings) / 100,
    };

    return (
        <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
            <div>
                <h2 className="text-xl font-bold text-white">Budget Settings</h2>
                <p className="text-slate-400 text-sm">Configure your salary and 50-30-20 budget rules</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Salary */}
                <div className="glass rounded-2xl p-5">
                    <h3 className="text-white font-semibold mb-4">Monthly Income</h3>
                    <div className="grid sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                            <label className="text-slate-300 text-sm mb-1 block">Monthly Salary</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={salary}
                                    onChange={e => setSalary(e.target.value)}
                                    placeholder="e.g. 5000"
                                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-slate-300 text-sm mb-1 block">Currency</label>
                            <select value={currency} onChange={e => setCurrency(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 transition">
                                {['INR', 'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'].map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Budget Rule Sliders */}
                <div className="glass rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-semibold">Budget Rule</h3>
                        <span className={`text-sm font-semibold px-2 py-0.5 rounded-lg ${Math.round(total) === 100 ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'}`}>
                            {total}% {Math.round(total) === 100 ? '✓' : `(${100 - total > 0 ? '+' : ''}${100 - total} to go)`}
                        </span>
                    </div>

                    {/* Visual bar */}
                    <div className="flex h-3 rounded-full overflow-hidden mb-6">
                        {Object.entries(rules).map(([key, val]) => (
                            <div key={key} className="transition-all duration-300" style={{ width: `${val}%`, background: RULE_COLORS[key] }} />
                        ))}
                    </div>

                    <div className="space-y-5">
                        {Object.entries(rules).map(([key, val]) => (
                            <div key={key}>
                                <div className="flex justify-between items-center mb-2">
                                    <div>
                                        <span className="text-white text-sm font-medium capitalize">{key}</span>
                                        <p className="text-slate-400 text-xs">{RULE_LABELS[key]}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-white font-bold" style={{ color: RULE_COLORS[key] }}>{val}%</span>
                                        {salary > 0 && <p className="text-slate-400 text-xs">${allocations[key].toFixed(0)}/mo</p>}
                                    </div>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={val}
                                    onChange={e => handleSlider(key, e.target.value)}
                                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                                    style={{ accentColor: RULE_COLORS[key] }}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Presets */}
                    <div className="mt-4 pt-4 border-t border-white/10">
                        <p className="text-slate-400 text-xs mb-2">Quick presets:</p>
                        <div className="flex flex-wrap gap-2">
                            {[
                                { label: '50-30-20 (Classic)', v: { needs: 50, wants: 30, savings: 20 } },
                                { label: '70-20-10 (Beginner)', v: { needs: 70, wants: 20, savings: 10 } },
                                { label: '40-30-30 (Aggressive)', v: { needs: 40, wants: 30, savings: 30 } },
                            ].map(p => (
                                <button key={p.label} type="button" onClick={() => setRules(p.v)}
                                    className="text-xs px-3 py-1.5 rounded-lg bg-white/10 text-slate-300 hover:bg-indigo-500/20 hover:text-indigo-300 transition">
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Summary preview */}
                {salary > 0 && (
                    <div className="glass rounded-2xl p-5">
                        <h3 className="text-white font-semibold mb-3">Monthly Budget Preview</h3>
                        <div className="grid grid-cols-3 gap-3">
                            {Object.entries(allocations).map(([key, val]) => (
                                <div key={key} className="rounded-xl p-3 text-center" style={{ background: RULE_COLORS[key] + '15' }}>
                                    <p className="text-xs text-slate-400 mb-1 capitalize">{key}</p>
                                    <p className="text-white font-bold text-lg">${val.toFixed(0)}</p>
                                    <p className="text-xs" style={{ color: RULE_COLORS[key] }}>{rules[key]}%</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <button type="submit" disabled={saving || Math.round(total) !== 100}
                    className="w-full py-3 rounded-xl gradient-bg text-white font-semibold hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 disabled:opacity-50">
                    {saving ? <><Loader size={18} className="animate-spin" /> Saving...</> : <><Save size={18} /> Save Budget Settings</>}
                </button>
            </form>
        </div>
    );
}
