import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, X, Loader, Search, Landmark } from 'lucide-react';

const CATEGORIES = ['Food', 'Rent', 'Travel', 'Shopping', 'Bills', 'Others'];
const TYPES = ['needs', 'wants', 'savings'];
const CATEGORY_EMOJIS = { Food: '🍔', Rent: '🏠', Travel: '✈️', Shopping: '🛍️', Bills: '⚡', Others: '📦' };
const TYPE_COLORS = { needs: '#6366f1', wants: '#a855f7', savings: '#22c55e' };

function Modal({ title, onClose, children }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={onClose}>
            <div className="glass rounded-2xl p-6 w-full max-w-md shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-5">
                    <h3 className="text-white font-semibold text-lg">{title}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition"><X size={20} /></button>
                </div>
                {children}
            </div>
        </div>
    );
}

const emptyForm = { title: '', amount: '', category: 'Food', type: 'needs', date: '', notes: '', bankAccount: '' };

export default function Expenses() {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [filter, setFilter] = useState({ category: '', type: '' });
    const [search, setSearch] = useState('');
    const [bankAccounts, setBankAccounts] = useState([]);

    const fetchExpenses = async () => {
        try {
            const params = {};
            if (filter.category) params.category = filter.category;
            if (filter.type) params.type = filter.type;
            const { data } = await api.get('/expenses', { params });
            setExpenses(data.expenses);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchExpenses(); }, [filter]);

    // Fetch bank accounts for the selector
    useEffect(() => {
        api.get('/bank').then(({ data }) => setBankAccounts(data.accounts || [])).catch(() => { });
    }, []);

    const openAdd = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
    const openEdit = (exp) => {
        setEditing(exp);
        setForm({ title: exp.title, amount: exp.amount, category: exp.category, type: exp.type, date: exp.date?.split('T')[0] || '', notes: exp.notes || '' });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editing) {
                const { data } = await api.put(`/expenses/${editing._id}`, form);
                setExpenses(prev => prev.map(e => e._id === editing._id ? data.expense : e));
                toast.success('Expense updated!');
            } else {
                const { data } = await api.post('/expenses', form);
                setExpenses(prev => [data.expense, ...prev]);
                if (data.warning) {
                    toast('⚠️ ' + data.warning, { icon: null, style: { background: '#78350f', color: '#fef3c7', border: '1px solid #d97706' } });
                } else {
                    toast.success('Expense added!');
                }
            }
            setShowModal(false);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Error saving expense');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this expense?')) return;
        try {
            await api.delete(`/expenses/${id}`);
            setExpenses(prev => prev.filter(e => e._id !== id));
            toast.success('Expense deleted');
        } catch {
            toast.error('Error deleting expense');
        }
    };

    const filtered = expenses.filter(e => e.title.toLowerCase().includes(search.toLowerCase()));
    const total = filtered.reduce((sum, e) => sum + e.amount, 0);

    return (
        <div className="space-y-5 animate-fade-in">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold text-white">Expenses</h2>
                    <p className="text-slate-400 text-sm">{filtered.length} transactions · Total: <span className="text-red-400 font-semibold">${total.toFixed(2)}</span></p>
                </div>
                <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-bg text-white text-sm font-semibold hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-indigo-500/30">
                    <Plus size={16} /> Add Expense
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-48">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search expenses..."
                        className="w-full pl-9 pr-4 py-2 rounded-xl glass text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                </div>
                <select value={filter.category} onChange={e => setFilter(f => ({ ...f, category: e.target.value }))}
                    className="px-3 py-2 rounded-xl glass text-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500">
                    <option value="">All Categories</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={filter.type} onChange={e => setFilter(f => ({ ...f, type: e.target.value }))}
                    className="px-3 py-2 rounded-xl glass text-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500">
                    <option value="">All Types</option>
                    {TYPES.map(t => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
            </div>

            {/* List */}
            <div className="glass rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-16"><Loader className="animate-spin text-indigo-400" size={24} /></div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16 text-slate-400">
                        <p className="text-4xl mb-3">💸</p>
                        <p>No expenses found. Add your first one!</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {filtered.map((exp) => (
                            <div key={exp._id} className="flex items-center justify-between px-5 py-3.5 hover:bg-white/5 transition group">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{CATEGORY_EMOJIS[exp.category]}</span>
                                    <div>
                                        <p className="text-white font-medium text-sm">{exp.title}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-slate-400 text-xs">{exp.category}</span>
                                            <span className="text-slate-600">·</span>
                                            <span className="text-xs px-1.5 py-0.5 rounded-md font-medium" style={{ background: TYPE_COLORS[exp.type] + '22', color: TYPE_COLORS[exp.type] }}>
                                                {exp.type}
                                            </span>
                                            <span className="text-slate-500 text-xs">{new Date(exp.date).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-red-400 font-bold text-sm">-${exp.amount.toFixed(2)}</span>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                        <button onClick={() => openEdit(exp)} className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/40 flex items-center justify-center transition">
                                            <Edit2 size={13} />
                                        </button>
                                        <button onClick={() => handleDelete(exp._id)} className="w-7 h-7 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/40 flex items-center justify-center transition">
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <Modal title={editing ? 'Edit Expense' : 'Add Expense'} onClose={() => setShowModal(false)}>
                    <form onSubmit={handleSubmit} className="space-y-3">
                        {[['Title', 'title', 'text', 'e.g. Grocery shopping'], ['Amount ($)', 'amount', 'number', '0.00']].map(([lbl, key, type, ph]) => (
                            <div key={key}>
                                <label className="text-slate-300 text-sm mb-1 block">{lbl}</label>
                                <input
                                    type={type}
                                    required
                                    min={type === 'number' ? 0 : undefined}
                                    step={type === 'number' ? '0.01' : undefined}
                                    value={form[key]}
                                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                                    placeholder={ph}
                                    className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition"
                                />
                            </div>
                        ))}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-slate-300 text-sm mb-1 block">Category</label>
                                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 transition">
                                    {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_EMOJIS[c]} {c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-slate-300 text-sm mb-1 block">Type</label>
                                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 transition">
                                    {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-slate-300 text-sm mb-1 block">Date</label>
                            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                                className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 transition" />
                        </div>
                        <div>
                            <label className="text-slate-300 text-sm mb-1 block">Notes (optional)</label>
                            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                                className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 transition resize-none" />
                        </div>
                        {/* Bank account selector (Feature 4 - only for new expenses) */}
                        {!editing && bankAccounts.length > 0 && (
                            <div>
                                <label className="text-slate-300 text-sm mb-1 flex items-center gap-1.5 block">
                                    <Landmark size={14} className="text-indigo-400" /> Deduct from Bank Account (optional)
                                </label>
                                <select value={form.bankAccount} onChange={e => setForm(f => ({ ...f, bankAccount: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 transition">
                                    <option value="">No bank deduction</option>
                                    {bankAccounts.map(acc => (
                                        <option key={acc._id} value={acc._id}>
                                            {acc.bankName} — {acc.maskedAccountNumber} (₹{Number(acc.currentBalance).toLocaleString('en-IN')})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <button type="submit" disabled={saving}
                            className="w-full py-2.5 rounded-xl gradient-bg text-white font-semibold text-sm hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                            {saving ? <><Loader size={16} className="animate-spin" /> Saving...</> : editing ? 'Update Expense' : 'Add Expense'}
                        </button>
                    </form>
                </Modal>
            )}
        </div>
    );
}
