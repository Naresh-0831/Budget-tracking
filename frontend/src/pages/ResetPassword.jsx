import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { TrendingUp, Mail, KeyRound, Lock, Eye, EyeOff, Loader } from 'lucide-react';

export default function ResetPassword() {
    const location = useLocation();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        email: location.state?.email || '',
        resetToken: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (form.newPassword !== form.confirmPassword) {
            return toast.error('Passwords do not match');
        }
        if (form.newPassword.length < 6) {
            return toast.error('Password must be at least 6 characters');
        }

        setLoading(true);
        try {
            await api.post('/auth/reset-password', {
                email: form.email,
                resetToken: form.resetToken,
                newPassword: form.newPassword
            });
            toast.success('Password reset successfully! You can now log in.');
            navigate('/login');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Reset failed. Please check your details and try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)' }}>
            {/* Glowing orbs */}
            <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full opacity-20 blur-3xl"
                style={{ background: 'radial-gradient(circle,#6366f1,transparent)' }} />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-15 blur-3xl"
                style={{ background: 'radial-gradient(circle,#a855f7,transparent)' }} />

            <div className="w-full max-w-md px-6 animate-slide-up relative z-10">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 gradient-bg shadow-lg shadow-indigo-500/30">
                        <TrendingUp className="text-white" size={28} />
                    </div>
                    <h1 className="text-3xl font-bold gradient-text">SmartBudget</h1>
                    <p className="text-slate-400 mt-1 text-sm">Reset Your Password</p>
                </div>

                <div className="glass rounded-2xl p-8 shadow-2xl">
                    <h2 className="text-xl font-semibold text-white mb-1">Set New Password</h2>
                    <p className="text-slate-400 text-sm mb-6">Enter the OTP sent to your email and your new password.</p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email Field */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input type="email" required
                                    value={form.email}
                                    onChange={e => setForm({ ...form, email: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                                    placeholder="you@example.com" />
                            </div>
                        </div>

                        {/* OTP Field */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">6-Digit OTP</label>
                            <div className="relative">
                                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input type="text" required maxLength={6}
                                    value={form.resetToken}
                                    onChange={e => setForm({ ...form, resetToken: e.target.value.replace(/\D/g, '') })}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition tracking-widest"
                                    placeholder="000000" />
                            </div>
                        </div>

                        {/* New Password */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">New Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input type={showPw ? 'text' : 'password'} required
                                    value={form.newPassword}
                                    onChange={e => setForm({ ...form, newPassword: e.target.value })}
                                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                                    placeholder="Min. 6 characters" />
                                <button type="button" onClick={() => setShowPw(!showPw)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition">
                                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirm Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input type={showPw ? 'text' : 'password'} required
                                    value={form.confirmPassword}
                                    onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                                    placeholder="Repeat password" />
                            </div>
                        </div>

                        <button type="submit" disabled={loading || form.resetToken.length !== 6}
                            className="w-full py-3 rounded-xl font-semibold text-white gradient-bg hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 disabled:opacity-60 mt-4">
                            {loading ? <><Loader className="animate-spin" size={18} /> Resetting...</> : 'Reset Password'}
                        </button>
                    </form>

                    <p className="mt-5 text-center text-sm text-slate-400">
                        Remember your password?{' '}
                        <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition">Back to Login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
