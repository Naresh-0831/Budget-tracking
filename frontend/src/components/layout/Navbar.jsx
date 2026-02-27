import { useState, useEffect } from 'react';
import { Menu, Sun, Moon, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function Navbar({ onMenuClick }) {
    const { user, updateUser } = useAuth();
    const [isDark, setIsDark] = useState(user?.theme !== 'light');

    const toggleTheme = async () => {
        const newTheme = isDark ? 'light' : 'dark';
        setIsDark(!isDark);
        document.documentElement.setAttribute('data-theme', newTheme);
        try {
            const { data } = await api.put('/auth/profile', { theme: newTheme });
            updateUser(data.user);
        } catch { }
    };

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', user?.theme || 'dark');
        setIsDark(user?.theme !== 'light');
    }, [user?.theme]);

    return (
        <header className="h-16 flex items-center justify-between px-6 border-b border-white/10" style={{ background: 'rgba(15,12,41,0.8)', backdropFilter: 'blur(12px)' }}>
            <div className="flex items-center gap-4">
                <button onClick={onMenuClick} className="lg:hidden text-slate-400 hover:text-white transition">
                    <Menu size={22} />
                </button>
                <div>
                    <h1 className="text-white font-semibold text-base leading-tight">
                        Hello, <span className="gradient-text">{user?.name?.split(' ')[0]}</span> 👋
                    </h1>
                    <p className="text-slate-500 text-xs">Track your finances intelligently</p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {/* Theme toggle */}
                <button
                    onClick={toggleTheme}
                    className="w-9 h-9 rounded-xl glass flex items-center justify-center text-slate-400 hover:text-white transition"
                >
                    {isDark ? <Sun size={17} /> : <Moon size={17} />}
                </button>

                {/* Avatar */}
                <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-500/30">
                    {user?.name?.[0]?.toUpperCase()}
                </div>
            </div>
        </header>
    );
}
