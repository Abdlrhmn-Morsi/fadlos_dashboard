import { useState, useEffect } from 'react';
import { getMySubscriptionUsage, SubscriptionUsage } from '../features/subscriptions/api/subscriptions.api';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/user-role';
import { PlanFeature } from '../types/plan-feature';

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

    const hasFeature = (feature: PlanFeature | string): boolean => {
        if (user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ADMIN) return true;
        if (!usage) return false;

        // Fallback: If feature check is for analytics, also check plan name
        if (feature === PlanFeature.ADVANCED_ANALYTICS && (usage.plan?.toLowerCase() === 'premium' || usage.plan?.toLowerCase() === 'pro')) {
            return true;
        }

        if (!Array.isArray(usage.features)) return false;
        return usage.features.includes(feature as string);
    };

    return { usage, loading, hasFeature, refreshUsage: fetchUsage };
};
