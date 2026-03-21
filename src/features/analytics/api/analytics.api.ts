import apiService from '../../../services/api.service';

export const fetchOrderStats = async (period: string = '7d', startDate?: string, endDate?: string, branchId?: string) => {
    let url = `/orders/stats/summary?period=${period}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;
    if (branchId) url += `&branchId=${branchId}`;
    const response = await apiService.get(url);
    return response;
};

export const fetchProductMerchantStats = async (startDate?: string, endDate?: string, branchId?: string) => {
    let url = '/products/merchant/stats';
    if (startDate || endDate || branchId) {
        url += '?';
        const params: string[] = [];
        if (startDate) params.push(`startDate=${startDate}`);
        if (endDate) params.push(`endDate=${endDate}`);
        if (branchId) params.push(`branchId=${branchId}`);
        url += params.join('&');
    }
    const response = await apiService.get(url);
    return response;
};

export const fetchCustomerAnalytics = async (period: string = '30d', startDate?: string, endDate?: string, branchId?: string) => {
    let url = `/store/clients/analytics?period=${period}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;
    if (branchId) url += `&branchId=${branchId}`;
    const response = await apiService.get(url);
    return response;
};

// ── Admin Analytics APIs ──────────────────────────────────────────
export const fetchSubscriptionAnalytics = async (startDate?: string, endDate?: string) => {
    let url = '/stats/subscription-analytics';
    if (startDate || endDate) {
        url += `?startDate=${startDate || ''}&endDate=${endDate || ''}`;
    }
    const response = await apiService.get(url);
    return response;
};

export const fetchSystemAnalytics = async (startDate?: string, endDate?: string) => {
    let url = '/stats/system-analytics';
    if (startDate || endDate) {
        url += `?startDate=${startDate || ''}&endDate=${endDate || ''}`;
    }
    const response = await apiService.get(url);
    return response;
};

export const fetchAllSubscriptions = async (options: {
    page?: number;
    limit?: number;
    search?: string;
    plan?: string;
    billingCycle?: string;
    startDate?: string;
    endDate?: string;
}) => {
    const { page = 1, limit = 10, search, plan, billingCycle, startDate, endDate } = options;
    let url = `/subscriptions/admin/all?page=${page}&limit=${limit}`;
    if (search) url += `&search=${search}`;
    if (plan && plan !== 'all') url += `&plan=${plan}`;
    if (billingCycle && billingCycle !== 'all') url += `&billingCycle=${billingCycle}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;
    const response = await apiService.get(url);
    return response;
};

