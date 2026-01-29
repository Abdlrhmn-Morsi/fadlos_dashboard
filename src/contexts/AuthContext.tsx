import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { UserRole } from '../types/user-role';

interface User {
    id: string;
    username: string;
    email: string;
    role: UserRole;
    name?: string;
    profileImage?: string;
    phone?: string;
    store?: any;
    isActive?: boolean;
    isEmailVerified?: boolean;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (user: User) => void;
    logout: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshProfile = useCallback(async () => {
        try {
            const response = await api.get('/auth/me');
            // Assuming profile response is { success, message, user } or similar
            const profileUser = response.data?.user || response.data?.data?.user || response.data?.data;
            if (profileUser) {
                setUser(profileUser);
            } else {
                setUser(null);
            }
        } catch (error) {
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshProfile();
    }, [refreshProfile]);

    const login = (userData: User) => {
        setUser(userData);
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            // Even if API fails, we clear state
        } finally {
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!user,
            isLoading,
            login,
            logout,
            refreshProfile
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
