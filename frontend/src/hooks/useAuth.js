'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext(null);

/**
 * AuthProvider - Manages authentication state
 */
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check for existing session on mount
    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const data = await api.getMe();
                    setUser(data.user);
                } catch (error) {
                    // Token invalid, clear it
                    localStorage.removeItem('token');
                }
            }
            setLoading(false);
        };

        checkAuth();
    }, []);

    /**
     * Login user
     */
    const login = async (email, password) => {
        const data = await api.login({ email, password });
        localStorage.setItem('token', data.token);
        setUser(data.user);
        return data;
    };

    /**
     * Register user
     */
    const register = async (email, password, name) => {
        const data = await api.register({ email, password, name });
        localStorage.setItem('token', data.token);
        setUser(data.user);
        return data;
    };

    /**
     * Logout user
     */
    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    /**
     * Refresh user data
     */
    const refreshUser = async () => {
        try {
            const data = await api.getMe();
            setUser(data.user);
        } catch (error) {
            logout();
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            login,
            register,
            logout,
            refreshUser,
            isAuthenticated: !!user
        }}>
            {children}
        </AuthContext.Provider>
    );
}

/**
 * useAuth hook
 */
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
