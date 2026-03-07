import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

interface AppConfigContextType {
    permissions: string[];
    planFeatures: string[];
    loading: boolean;
    error: string | null;
}

const AppConfigContext = createContext<AppConfigContextType>({
    permissions: [],
    planFeatures: [],
    loading: true,
    error: null,
});

export const AppConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [config, setConfig] = useState<{ permissions: string[], planFeatures: string[] }>({
        permissions: [],
        planFeatures: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const response = await api.get('/config/constants');
                // Handle unwrapping the 'data' property if it exists, sometimes axios or interceptors wrap it
                const actualData = response.data?.data || response.data || response;

                setConfig({
                    permissions: actualData.permissions || [],
                    planFeatures: actualData.planFeatures || []
                });
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
        <AppConfigContext.Provider value={{ ...config, loading, error }}>
            {children}
        </AppConfigContext.Provider>
    );
};

export const useAppConfig = () => useContext(AppConfigContext);
