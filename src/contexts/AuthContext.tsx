import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { UserRole } from '../types/user-role';
import { useCache } from './CacheContext';
import { Permissions } from '../types/permissions';

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
    employeeRole?: {
        id: string;
        name: string;
        permissions: string[];
    };
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (user: User) => Promise<void>;
    logout: () => Promise<void>;
    refreshProfile: () => Promise<void>;
    hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { clearAllCache } = useCache();

    const hasPermission = useCallback((permission: string): boolean => {
        if (!user) return false;

        // Super admins and Store Owners have all permissions in their scope
        if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN || user.role === UserRole.STORE_OWNER) {
            return true;
        }

        // Employees check their role permissions
        if (user.role === UserRole.EMPLOYEE) {
            // Default permissions for ALL employees
            const defaultPermissions = [Permissions.STORE_VIEW];
            if (defaultPermissions.includes(permission as any)) return true;

            const permissions = user.employeeRole?.permissions || [];
            if (permissions.includes(permission)) return true;

            // Variants access fallback (flows from product management permissions)
            if (permission.startsWith('variants.')) {
                if (permission === 'variants.view' && (
                    permissions.includes('products.create') ||
                    permissions.includes('products.update') ||
                    permissions.includes('products.delete')
                )) return true;
            }

            return false;
        }

        return false;
    }, [user]);

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

    const login = async (userData: User) => {
        clearAllCache();
        setUser(userData);
        await refreshProfile();
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            // Even if API fails, we clear state
        } finally {
            clearAllCache();
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
            refreshProfile,
            hasPermission
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
