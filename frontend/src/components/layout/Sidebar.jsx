import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    LayoutDashboard, Receipt, BarChart2, PiggyBank, Settings, LogOut, TrendingUp, X, Brain
} from 'lucide-react';

const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/expenses', icon: Receipt, label: 'Expenses' },
    { to: '/analytics', icon: BarChart2, label: 'Analytics' },
    { to: '/savings', icon: PiggyBank, label: 'Savings Goals' },
    { to: '/budget-settings', icon: Settings, label: 'Budget Settings' },
    { to: '/ai-insights', icon: Brain, label: 'AI Insights' },
];

export default function Sidebar({ isOpen, onClose }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <>
            {/* Overlay on mobile */}
            {isOpen && <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={onClose} />}

            <aside className={`
        fixed top-0 left-0 h-full w-64 z-30 flex flex-col transition-transform duration-300
        lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `} style={{ background: 'linear-gradient(180deg,#1e1b4b,#0f0c29)' }}>
                {/* Logo */}
                <div className="flex items-center justify-between p-5 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center shadow-lg shadow-indigo-500/30">
                            <TrendingUp size={18} className="text-white" />
                        </div>
                        <span className="font-bold text-white text-lg">SmartBudget</span>
                    </div>
                    <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white transition">
                        <X size={20} />
                    </button>
                </div>

                {/* User info */}
                <div className="p-4 mx-3 mt-3 rounded-xl glass">
                    <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-white font-bold text-sm mb-2">
                        {user?.name?.[0]?.toUpperCase()}
                    </div>
                    <p className="text-white font-medium text-sm truncate">{user?.name}</p>
                    <p className="text-slate-400 text-xs truncate">{user?.email}</p>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-4 space-y-1">
                    {navItems.map(({ to, icon: Icon, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={to === '/'}
                            onClick={onClose}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium
                ${isActive
                                    ? 'gradient-bg text-white shadow-lg shadow-indigo-500/20'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`
                            }
                        >
                            <Icon size={18} />
                            {label}
                        </NavLink>
                    ))}
                </nav>

                {/* Logout */}
                <div className="p-3 border-t border-white/10">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 text-sm font-medium"
                    >
                        <LogOut size={18} />
                        Logout
                    </button>
                </div>
            </aside>
        </>
    );
}
