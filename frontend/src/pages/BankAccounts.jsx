import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
    Landmark, Plus, Trash2, Pencil, CheckCircle, X, Loader,
    RefreshCw, CreditCard, IndianRupee
} from 'lucide-react';

export default function BankAccounts() {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editBalanceId, setEditBalanceId] = useState(null);
    const [newBalance, setNewBalance] = useState('');

    const [form, setForm] = useState({
        bankName: '', accountHolderName: '', accountNumber: '', ifscCode: '', currentBalance: ''
    });

    const fetchAccounts = async () => {
        try {
            const { data } = await api.get('/bank');
            setAccounts(data.accounts);
        } catch {
            toast.error('Failed to load bank accounts');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAccounts(); }, []);

    const handleAdd = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const { data } = await api.post('/bank', form);
            setAccounts(prev => [data.account, ...prev]);
            setForm({ bankName: '', accountHolderName: '', accountNumber: '', ifscCode: '', currentBalance: '' });
            setShowForm(false);
            toast.success('Bank account added!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to add account');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Remove this bank account?')) return;
        try {
            await api.delete(`/bank/${id}`);
            setAccounts(prev => prev.filter(a => a._id !== id));
            toast.success('Account removed');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to remove account');
        }
    };

    const handleUpdateBalance = async (id) => {
        const val = parseFloat(newBalance);
        if (isNaN(val)) return toast.error('Enter a valid balance');
        try {
            const { data } = await api.patch(`/bank/${id}/balance`, { currentBalance: val });
            setAccounts(prev => prev.map(a => a._id === id ? data.account : a));
            setEditBalanceId(null);
            setNewBalance('');
            toast.success('Balance updated');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update balance');
        }
    };

    const fmt = (n) => `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return (
        <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-white">Bank Accounts</h2>
                    <p className="text-slate-400 text-sm">Manual balance tracking — no real bank integration</p>
                </div>
                <button onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-bg text-white text-sm font-semibold hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-indigo-500/30">
                    {showForm ? <X size={16} /> : <Plus size={16} />}
                    {showForm ? 'Cancel' : 'Add Account'}
                </button>
            </div>

            {/* Add Account Form */}
            {showForm && (
                <form onSubmit={handleAdd} className="glass rounded-2xl p-6 space-y-4 animate-fade-in">
                    <h3 className="text-white font-semibold flex items-center gap-2"><Landmark size={18} /> New Bank Account</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                        {[
                            { key: 'bankName', label: 'Bank Name', placeholder: 'e.g. State Bank of India' },
                            { key: 'accountHolderName', label: 'Account Holder Name', placeholder: 'Full name' },
                            { key: 'accountNumber', label: 'Account Number', placeholder: 'e.g. 1234567890' },
                            { key: 'ifscCode', label: 'IFSC Code', placeholder: 'e.g. SBIN0001234' },
                        ].map(({ key, label, placeholder }) => (
                            <div key={key}>
                                <label className="text-slate-300 text-sm mb-1 block">{label}</label>
                                <input type="text" required value={form[key]}
                                    onChange={e => setForm({ ...form, [key]: e.target.value })}
                                    placeholder={placeholder}
                                    className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition" />
                            </div>
                        ))}
                        <div>
                            <label className="text-slate-300 text-sm mb-1 block">Current Balance (₹)</label>
                            <div className="relative">
                                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                                <input type="number" min="0" step="0.01" value={form.currentBalance}
                                    onChange={e => setForm({ ...form, currentBalance: e.target.value })}
                                    placeholder="0.00"
                                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition" />
                            </div>
                        </div>
                    </div>
                    <button type="submit" disabled={saving}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl gradient-bg text-white text-sm font-semibold hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-60">
                        {saving ? <><Loader size={16} className="animate-spin" /> Saving...</> : <><CheckCircle size={16} /> Save Account</>}
                    </button>
                </form>
            )}

            {/* Account Cards */}
            {loading ? (
                <div className="flex justify-center py-16">
                    <Loader className="animate-spin text-indigo-400" size={36} />
                </div>
            ) : accounts.length === 0 ? (
                <div className="glass rounded-2xl p-12 text-center">
                    <CreditCard className="mx-auto mb-4 text-slate-600" size={48} />
                    <p className="text-slate-400">No bank accounts added yet.</p>
                    <p className="text-slate-500 text-sm mt-1">Click "Add Account" to get started.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {accounts.map((account) => (
                        <div key={account._id} className="glass rounded-2xl p-5">
                            <div className="flex items-start justify-between gap-4">
                                {/* Bank Info */}
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/30">
                                        <Landmark className="text-white" size={22} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-white font-semibold truncate">{account.bankName}</p>
                                        <p className="text-slate-400 text-sm">{account.accountHolderName}</p>
                                        <p className="text-slate-500 text-xs font-mono mt-0.5">{account.maskedAccountNumber} · {account.ifscCode}</p>
                                    </div>
                                </div>

                                {/* Balance + Actions */}
                                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                    <p className={`text-lg font-bold ${account.currentBalance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {fmt(account.currentBalance)}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => { setEditBalanceId(account._id); setNewBalance(account.currentBalance); }}
                                            title="Update balance"
                                            className="p-1.5 rounded-lg bg-white/10 text-slate-300 hover:bg-indigo-500/20 hover:text-indigo-300 transition">
                                            <RefreshCw size={14} />
                                        </button>
                                        <button onClick={() => handleDelete(account._id)} title="Remove account"
                                            className="p-1.5 rounded-lg bg-white/10 text-slate-300 hover:bg-red-500/20 hover:text-red-400 transition">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Inline balance editor */}
                            {editBalanceId === account._id && (
                                <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-3 animate-fade-in">
                                    <div className="relative flex-1">
                                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                        <input type="number" value={newBalance} onChange={e => setNewBalance(e.target.value)}
                                            className="w-full pl-8 pr-4 py-2 rounded-xl bg-white/10 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 transition"
                                            placeholder="New balance" />
                                    </div>
                                    <button onClick={() => handleUpdateBalance(account._id)}
                                        className="px-4 py-2 rounded-xl gradient-bg text-white text-sm font-semibold hover:opacity-90 transition flex items-center gap-1.5">
                                        <Pencil size={13} /> Update
                                    </button>
                                    <button onClick={() => setEditBalanceId(null)}
                                        className="px-3 py-2 rounded-xl bg-white/10 text-slate-300 text-sm hover:bg-white/20 transition">
                                        <X size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
