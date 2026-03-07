import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

interface AppConfigContextType {
    dynamicPermissions: string[];
    permissionGroups: any[];
    dynamicPlanFeatures: string[];
    loading: boolean;
    error: string | null;
}

const AppConfigContext = createContext<AppConfigContextType>({
    dynamicPermissions: [],
    permissionGroups: [],
    dynamicPlanFeatures: [],
    loading: true,
    error: null,
});

export const AppConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [dynamicPermissions, setDynamicPermissions] = useState<string[]>([]);
    const [permissionGroups, setPermissionGroups] = useState<any[]>([]);
    const [dynamicPlanFeatures, setDynamicPlanFeatures] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const response = await api.get('/config/constants');
                // Handle unwrapping the 'data' property if it exists, sometimes axios or interceptors wrap it
                const actualData = response.data?.data || response.data || response;

                setDynamicPermissions(actualData.permissions || []);
                setPermissionGroups(actualData.permissionGroups || []);
                setDynamicPlanFeatures(actualData.planFeatures || []);
                setError(null);
            } catch (err: any) {
                console.error('Failed to fetch app configuration constants', err);
                setError(err.message || 'Failed to initialize app configuration');
            } finally {
                setLoading(false);
            }
        };

        fetchConfig();
    }, []);

    return (
        <AppConfigContext.Provider value={{ dynamicPermissions, permissionGroups, dynamicPlanFeatures, loading, error }}>
            {children}
        </AppConfigContext.Provider>
    );
};

export const useAppConfig = () => useContext(AppConfigContext);
