// @refresh reset
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const stored = localStorage.getItem('user');
        return stored ? JSON.parse(stored) : null;
    });
    const [token, setToken] = useState(() => localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    // Verify token on mount
    useEffect(() => {
        const verify = async () => {
            if (token) {
                try {
                    const { data } = await api.get('/auth/me');
                    setUser(data.user);
                    localStorage.setItem('user', JSON.stringify(data.user));
                } catch (err) {
                    // Only clear credentials when the server explicitly rejects the token (401).
                    // Network errors (backend down, no internet) should NOT wipe localStorage —
                    // that's what caused the "refresh loop" on the login page.
                    if (err.response?.status === 401) {
                        console.warn('[Auth] Token rejected by server, logging out.');
                        logout();
                    } else {
                        console.warn('[Auth] Could not verify token (network/server error). Keeping existing session.');
                    }
                }
            }
            setLoading(false);
        };
        verify();
    }, []);

    const login = useCallback((userData, jwtToken) => {
        setUser(userData);
        setToken(jwtToken);
        localStorage.setItem('token', jwtToken);
        localStorage.setItem('user', JSON.stringify(userData));
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }, []);

    const updateUser = useCallback((updatedUser) => {
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    }, []);

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
};
