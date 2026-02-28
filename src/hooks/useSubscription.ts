import { useState, useEffect } from 'react';
import { getMySubscriptionUsage, SubscriptionUsage } from '../features/subscriptions/api/subscriptions.api';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/user-role';

export const useSubscription = () => {
    const { user } = useAuth();
    const [usage, setUsage] = useState<SubscriptionUsage | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchUsage = async () => {
        if (!user || user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN) {
            setLoading(false);
            return;
        }

        try {
            const data = await getMySubscriptionUsage();
            setUsage(data);
        } catch (error) {
            console.error('Error fetching subscription usage:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsage();
    }, [user?.id]);

    const hasFeature = (feature: string): boolean => {
        if (user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ADMIN) return true;
        if (!usage || !Array.isArray(usage.features)) return false;
        return usage.features.includes(feature);
    };

    return { usage, loading, hasFeature, refreshUsage: fetchUsage };
};
