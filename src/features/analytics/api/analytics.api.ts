import apiService from '../../../services/api.service';

export const fetchOrderStats = async (period: string = '7d', startDate?: string, endDate?: string, branchId?: string) => {
    let url = `/orders/stats/summary?period=${period}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;
    if (branchId) url += `&branchId=${branchId}`;
    const response = await apiService.get(url);
    return response.data || response;
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
    return response.data || response;
};

export const fetchCustomerAnalytics = async (period: string = '30d', startDate?: string, endDate?: string, branchId?: string) => {
    let url = `/store/clients/analytics?period=${period}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;
    if (branchId) url += `&branchId=${branchId}`;
    const response = await apiService.get(url);
    return response.data || response;
};
