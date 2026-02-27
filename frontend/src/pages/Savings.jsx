import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Plus, X, Loader, Trash2, Edit2 } from 'lucide-react';

const ICONS = ['🎯', '🏠', '✈️', '🚗', '📱', '💰', '🎓', '🏋️', '❤️', '🌴'];
const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f97316', '#22c55e', '#06b6d4', '#eab308'];

const emptyForm = { title: '', targetAmount: '', savedAmount: '', deadline: '', description: '', color: '#6366f1', icon: '🎯' };

function GoalCard({ goal, onEdit, onDelete, onDeposit }) {
    const pct = Math.min(Math.round((goal.savedAmount / goal.targetAmount) * 100), 100);
    const remaining = Math.max(goal.targetAmount - goal.savedAmount, 0);
    const daysLeft = goal.deadline ? Math.max(Math.ceil((new Date(goal.deadline) - new Date()) / 86400000), 0) : null;
    const monthlyNeeded = daysLeft ? (remaining / (daysLeft / 30)).toFixed(2) : null;

    return (
        <div className="glass rounded-2xl p-5 card-hover flex flex-col gap-4">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: goal.color + '22' }}>
                        {goal.icon}
                    </div>
                    <div>
                        <h3 className="text-white font-semibold">{goal.title}</h3>
                        {goal.description && <p className="text-slate-400 text-xs mt-0.5">{goal.description}</p>}
                    </div>
                </div>
                <div className="flex gap-1">
                    <button onClick={() => onEdit(goal)} className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/40 flex items-center justify-center transition">
                        <Edit2 size={13} />
                    </button>
                    <button onClick={() => onDelete(goal._id)} className="w-7 h-7 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/40 flex items-center justify-center transition">
                        <Trash2 size={13} />
                    </button>
                </div>
            </div>

            {/* Progress */}
            <div>
                <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-slate-400">₹{goal.savedAmount.toFixed(0)} saved</span>
                    <span className="text-white font-semibold">₹{goal.targetAmount.toFixed(0)} goal</span>
                </div>
                <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: goal.color }} />
                </div>
                <div className="flex justify-between mt-1.5">
                    <span className="text-xs text-slate-500">{pct}% complete</span>
                    <span className="text-xs text-slate-500">₹{remaining.toFixed(0)} left</span>
                </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-2">
                {daysLeft !== null && (
                    <div className="rounded-xl bg-white/5 p-2.5 text-center">
                        <p className="text-white font-bold text-lg">{daysLeft}</p>
                        <p className="text-slate-400 text-xs">days left</p>
                    </div>
                )}
                {monthlyNeeded && (
                    <div className="rounded-xl bg-white/5 p-2.5 text-center">
                        <p className="text-white font-bold text-base">₹{monthlyNeeded}</p>
                        <p className="text-slate-400 text-xs">needed/month</p>
                    </div>
                )}
            </div>

            {/* Deposit button */}
            {!goal.isCompleted && (
                <button onClick={() => onDeposit(goal)} className="w-full py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95" style={{ background: goal.color + '33', color: goal.color, border: `1px solid ${goal.color}44` }}>
                    + Add Savings
                </button>
            )}

            {goal.isCompleted && (
                <div className="text-center text-green-400 font-semibold text-sm py-1">🎉 Goal Completed!</div>
            )}
        </div>
    );
}

export default function Savings() {
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [deposit, setDeposit] = useState(null);
    const [depositAmount, setDepositAmount] = useState('');
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

    const fetchGoals = async () => {
        try {
            const { data } = await api.get('/savings');
            setGoals(data.goals);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchGoals(); }, []);

    const openAdd = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
    const openEdit = (goal) => {
        setEditing(goal);
        setForm({ title: goal.title, targetAmount: goal.targetAmount, savedAmount: goal.savedAmount, deadline: goal.deadline?.split('T')[0] || '', description: goal.description || '', color: goal.color, icon: goal.icon });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editing) {
                const { data } = await api.put(`/savings/${editing._id}`, form);
                setGoals(prev => prev.map(g => g._id === editing._id ? data.goal : g));
                toast.success('Goal updated!');
            } else {
                const { data } = await api.post('/savings', form);
                setGoals(prev => [data.goal, ...prev]);
                toast.success('Savings goal created!');
            }
            setShowModal(false);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this goal?')) return;
        await api.delete(`/savings/${id}`);
        setGoals(prev => prev.filter(g => g._id !== id));
        toast.success('Goal deleted');
    };

    const handleDeposit = async (e) => {
        e.preventDefault();
        if (!depositAmount || +depositAmount <= 0) return;
        const newSaved = deposit.savedAmount + parseFloat(depositAmount);
        try {
            const { data } = await api.put(`/savings/${deposit._id}`, { savedAmount: newSaved });
            setGoals(prev => prev.map(g => g._id === deposit._id ? data.goal : g));
            toast.success(`₹${depositAmount} added to "${deposit.title}"!`);
            setDeposit(null);
            setDepositAmount('');
        } catch {
            toast.error('Error updating savings');
        }
    };

    const totalSaved = goals.reduce((s, g) => s + g.savedAmount, 0);
    const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);

    return (
        <div className="space-y-5 animate-fade-in">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold text-white">Savings Goals</h2>
                    <p className="text-slate-400 text-sm">{goals.length} goals · Saved ₹{totalSaved.toFixed(0)} of ₹{totalTarget.toFixed(0)}</p>
                </div>
                <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-bg text-white text-sm font-semibold hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-indigo-500/30">
                    <Plus size={16} /> New Goal
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Loader className="animate-spin text-indigo-400" size={24} /></div>
            ) : goals.length === 0 ? (
                <div className="glass rounded-2xl p-16 text-center text-slate-400">
                    <p className="text-6xl mb-4">🐖</p>
                    <p className="font-medium">No savings goals yet</p>
                    <p className="text-sm mt-1">Create your first goal to start tracking!</p>
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {goals.map(g => (
                        <GoalCard key={g._id} goal={g} onEdit={openEdit} onDelete={handleDelete} onDeposit={setDeposit} />
                    ))}
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={() => setShowModal(false)}>
                    <div className="glass rounded-2xl p-6 w-full max-w-md shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="text-white font-semibold text-lg">{editing ? 'Edit Goal' : 'New Savings Goal'}</h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-3">
                            {/* Icon & Color row */}
                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <label className="text-slate-300 text-sm mb-1 block">Icon</label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {ICONS.map(ic => (
                                            <button key={ic} type="button" onClick={() => setForm(f => ({ ...f, icon: ic }))}
                                                className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center transition ${form.icon === ic ? 'gradient-bg' : 'bg-white/10 hover:bg-white/20'}`}>
                                                {ic}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-slate-300 text-sm mb-1 block">Color</label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {COLORS.map(c => (
                                            <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                                                className={`w-7 h-7 rounded-full transition ${form.color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-transparent' : ''}`}
                                                style={{ background: c }} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="text-slate-300 text-sm mb-1 block">Goal Title</label>
                                <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Emergency Fund"
                                    className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-slate-300 text-sm mb-1 block">Target (₹)</label>
                                    <input type="number" required min="1" step="0.01" value={form.targetAmount} onChange={e => setForm(f => ({ ...f, targetAmount: e.target.value }))} placeholder="5000"
                                        className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition" />
                                </div>
                                <div>
                                    <label className="text-slate-300 text-sm mb-1 block">Saved (₹)</label>
                                    <input type="number" min="0" step="0.01" value={form.savedAmount} onChange={e => setForm(f => ({ ...f, savedAmount: e.target.value }))} placeholder="0"
                                        className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition" />
                                </div>
                            </div>
                            <div>
                                <label className="text-slate-300 text-sm mb-1 block">Deadline (optional)</label>
                                <input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 transition" />
                            </div>
                            <div>
                                <label className="text-slate-300 text-sm mb-1 block">Description (optional)</label>
                                <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 transition resize-none" />
                            </div>
                            <button type="submit" disabled={saving}
                                className="w-full py-2.5 rounded-xl gradient-bg text-white font-semibold text-sm hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                                {saving ? <><Loader size={16} className="animate-spin" /> Saving...</> : editing ? 'Update Goal' : 'Create Goal'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Deposit modal */}
            {deposit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={() => setDeposit(null)}>
                    <div className="glass rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-white font-semibold">Add to "{deposit.title}"</h3>
                            <button onClick={() => setDeposit(null)} className="text-slate-400 hover:text-white"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleDeposit}>
                            <input type="number" required min="0.01" step="0.01" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} placeholder="Amount (₹)"
                                className="w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition mb-3" />
                            <button type="submit" className="w-full py-2.5 rounded-xl gradient-bg text-white font-semibold text-sm hover:opacity-90 transition">
                                Deposit
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
