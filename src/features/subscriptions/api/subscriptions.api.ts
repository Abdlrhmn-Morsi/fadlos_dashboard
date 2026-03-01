import api from '../../../services/api';

export interface Plan {
    id: string;
    name: string;
    description: string;
    pricing: {
        monthly: number;
        yearly: number;
    };
    features: string[];
    limits: {
        branches: number;
        products: number;
        categories: number;
        orders_per_month: number;
        drivers: number;
        staff_accounts: number;
    };
}

export interface SubscriptionUsage {
    plan: string;
    status: string;
    daysUntilExpiry: number;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    features: string[];
    limits: Record<string, number>;
}

export const getPlans = async (): Promise<Plan[]> => {
    const response = await api.get('/subscriptions/plans');
    return response.data.data.plans;
};

export const getMySubscriptionUsage = async (): Promise<SubscriptionUsage> => {
    const response = await api.get('/subscriptions/usage');
    return response.data.data || response.data;
};

export const createCheckoutSession = async (plan: string, billingCycle: 'monthly' | 'yearly'): Promise<{ checkoutUrl: string; checkoutId: string }> => {
    const response = await api.post('/subscriptions/create', { plan, billingCycle });
    return response.data.data; // Unwrap: axios.data -> backend wrapper .data -> { checkoutUrl, checkoutId }
};

export const cancelSubscription = async (): Promise<void> => {
    await api.post('/subscriptions/cancel');
};

export const syncSubscription = async (): Promise<SubscriptionUsage> => {
    const response = await api.post('/subscriptions/sync');
    return response.data.data;
};
