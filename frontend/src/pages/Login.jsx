import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { TrendingUp, Mail, Lock, Eye, EyeOff, Loader } from 'lucide-react';

export default function Login() {
    const [form, setForm] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();  // ← stops page refresh unconditionally

        if (loading) return; // ← guard against double-submit

        console.log('[Login] Submitting:', form.email);
        setLoading(true);

        try {
            console.log('[Login] POSTing to /api/auth/login…');
            const { data } = await api.post('/auth/login', form);
            console.log('[Login] Response:', data);

            if (!data.success || !data.token) {
                throw new Error(data.message || 'Login response invalid');
            }

            // Persist credentials via AuthContext (saves to localStorage internally)
            login(data.user, data.token);

            toast.success(`Welcome back, ${data.user.name}! 👋`);
            console.log('[Login] Navigating to dashboard…');
            navigate('/');
        } catch (err) {
            console.error('[Login] Error:', err);

            // Distinguish network/server-down from API-level errors
            if (!err.response) {
                toast.error('Cannot reach server. Is the backend running?');
            } else {
                toast.error(err.response?.data?.message || 'Login failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)' }}>
            {/* Glowing orbs */}
            <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full opacity-20 blur-3xl" style={{ background: 'radial-gradient(circle,#6366f1,transparent)' }} />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-15 blur-3xl" style={{ background: 'radial-gradient(circle,#a855f7,transparent)' }} />

            <div className="w-full max-w-md px-6 animate-slide-up relative z-10">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 gradient-bg shadow-lg shadow-indigo-500/30">
                        <TrendingUp className="text-white" size={28} />
                    </div>
                    <h1 className="text-3xl font-bold gradient-text">SmartBudget</h1>
                    <p className="text-slate-400 mt-1 text-sm">Your Financial Intelligence Dashboard</p>
                </div>

                <div className="glass rounded-2xl p-8 shadow-2xl">
                    <h2 className="text-xl font-semibold text-white mb-6">Sign In</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email */}
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

                        {/* Password */}
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
                                    placeholder="••••••••"
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition">
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 rounded-xl font-semibold text-white gradient-bg hover:opacity-90 active:scale-95 transition-all duration-200 shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
                        >
                            {loading ? <><Loader className="animate-spin" size={18} /> Signing in...</> : 'Sign In'}
                        </button>
                    </form>

                    <p className="mt-5 text-center text-sm text-slate-400">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium transition">
                            Create account
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
