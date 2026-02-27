import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { TrendingUp, Mail, Lock, User, Eye, EyeOff, Loader } from 'lucide-react';

export default function Register() {
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
        setLoading(true);
        try {
            const { data } = await api.post('/auth/register', form);
            login(data.user, data.token);
            toast.success(`Welcome, ${data.user.name}! 🎉`);
            navigate('/budget-settings');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)' }}>
            <div className="absolute top-1/3 right-1/3 w-72 h-72 rounded-full opacity-20 blur-3xl" style={{ background: 'radial-gradient(circle,#a855f7,transparent)' }} />
            <div className="absolute bottom-1/3 left-1/3 w-80 h-80 rounded-full opacity-15 blur-3xl" style={{ background: 'radial-gradient(circle,#6366f1,transparent)' }} />

            <div className="w-full max-w-md px-6 animate-slide-up relative z-10">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 gradient-bg shadow-lg shadow-indigo-500/30">
                        <TrendingUp className="text-white" size={28} />
                    </div>
                    <h1 className="text-3xl font-bold gradient-text">SmartBudget</h1>
                    <p className="text-slate-400 mt-1 text-sm">Start your financial journey today</p>
                </div>

                <div className="glass rounded-2xl p-8 shadow-2xl">
                    <h2 className="text-xl font-semibold text-white mb-6">Create Account</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    required
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                                    placeholder="John Doe"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="email"
                                    required
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                                    placeholder="Min 6 characters"
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition">
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {/* Strength indicator */}
                            <div className="flex gap-1 mt-2">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${form.password.length >= i * 3 ? i === 1 ? 'bg-red-400' : i === 2 ? 'bg-yellow-400' : 'bg-green-400' : 'bg-white/10'
                                        }`} />
                                ))}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 rounded-xl font-semibold text-white gradient-bg hover:opacity-90 active:scale-95 transition-all duration-200 shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
                        >
                            {loading ? <><Loader className="animate-spin" size={18} /> Creating account...</> : 'Create Account'}
                        </button>
                    </form>

                    <p className="mt-5 text-center text-sm text-slate-400">
                        Already have an account?{' '}
                        <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
