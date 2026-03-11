import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { TrendingUp, Mail, Loader } from 'lucide-react';

export default function ForgotPassword() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/auth/forgot-password', { email });
            toast.success('OTP sent! Check your inbox.');
            navigate('/reset-password', { state: { email } });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send OTP');
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
                    <p className="text-slate-400 mt-1 text-sm">Password Recovery</p>
                </div>

                <div className="glass rounded-2xl p-8 shadow-2xl">
                    <h2 className="text-xl font-semibold text-white mb-1">Forgot Password</h2>
                    <p className="text-slate-400 text-sm mb-6">Enter your registered email to receive an OTP.</p>

                    <form onSubmit={handleSendOtp} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input type="email" required value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                                    placeholder="you@example.com" />
                            </div>
                        </div>

                        <button type="submit" disabled={loading}
                            className="w-full py-3 rounded-xl font-semibold text-white gradient-bg hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 disabled:opacity-60 mt-4">
                            {loading ? <><Loader className="animate-spin" size={18} /> Sending OTP...</> : 'Send OTP'}
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
