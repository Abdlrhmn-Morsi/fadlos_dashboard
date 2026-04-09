import apiService from '../../../services/api.service';

export interface SubscriptionCode {
    id: string;
    code: string;
    plan: string;
    durationMonths: number;
    maxUses: number;
    usedCount: number;
    status: 'active' | 'fully_used' | 'expired' | 'revoked';
    createdById: string;
    createdBy?: { name?: string; username?: string };
    expiresAt: string | null;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface SubscriptionCodeUsage {
    id: string;
    subscriptionCodeId: string;
    storeId: string;
    store?: { id: string; name: string; nameAr?: string };
    subscriptionId: string | null;
    redeemedAt: string;
}

export interface SubscriptionCodeStats {
    total: number;
    active: number;
    fullyUsed: number;
    expired: number;
    revoked: number;
    totalRedemptions: number;
}

export interface CreateSubscriptionCodePayload {
    plan: 'pro' | 'premium';
    durationMonths: 1 | 3 | 6 | 12;
    maxUses?: number;
    quantity?: number;
    notes?: string;
    expiresAt?: string;
}

export const generateSubscriptionCodes = async (
    payload: CreateSubscriptionCodePayload
): Promise<{ message: string; data: SubscriptionCode[]; count: number }> => {
    return apiService.post('/admin/plans/subscription-codes', payload);
};

export const getSubscriptionCodes = async (params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    plan?: string;
}): Promise<{
    data: SubscriptionCode[];
    meta: { total: number; page: number; limit: number; totalPages: number; hasNextPage: boolean; hasPreviousPage: boolean };
}> => {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.search) query.set('search', params.search);
    if (params.status) query.set('status', params.status);
    if (params.plan) query.set('plan', params.plan);
    return apiService.get(`/admin/plans/subscription-codes?${query.toString()}`);
};

export const getSubscriptionCodeStats = async (): Promise<SubscriptionCodeStats> => {
    return apiService.get('/admin/plans/subscription-codes/stats');
};

export const getSubscriptionCodeUsages = async (
    codeId: string,
    params?: { page?: number; limit?: number }
): Promise<{
    code: SubscriptionCode;
    data: SubscriptionCodeUsage[];
    meta: { total: number; page: number; limit: number; totalPages: number };
}> => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    return apiService.get(`/admin/plans/subscription-codes/${codeId}/usages?${query.toString()}`);
};

export const revokeSubscriptionCode = async (
    codeId: string
): Promise<{ message: string; data: SubscriptionCode }> => {
    return apiService.patch(`/admin/plans/subscription-codes/${codeId}/revoke`, {});
};

// Store owner endpoints
export const redeemSubscriptionCode = async (
    code: string
): Promise<{ subscription?: any; requiresConfirmation?: boolean; warning?: string }> => {
    return apiService.post('/subscriptions/redeem-code', { code });
};

export const confirmRedeemSubscriptionCode = async (
    code: string
): Promise<{ subscription?: any; requiresConfirmation?: boolean; warning?: string }> => {
    return apiService.post('/subscriptions/redeem-code/confirm', { code });
};
