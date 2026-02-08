import apiService from '../../../services/api.service';

export const fetchOrderStats = async (period: string = '7d', startDate?: string, endDate?: string) => {
    let url = `/orders/stats/summary?period=${period}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;
    const response = await apiService.get(url);
    return response.data || response;
};

export const fetchProductMerchantStats = async (startDate?: string, endDate?: string) => {
    let url = '/products/merchant/stats';
    if (startDate || endDate) {
        url += '?';
        if (startDate) url += `startDate=${startDate}`;
        if (endDate) url += `${startDate ? '&' : ''}endDate=${endDate}`;
    }
    const response = await apiService.get(url);
    return response.data || response;
};

export const fetchCustomerAnalytics = async (period: string = '30d', startDate?: string, endDate?: string) => {
    let url = `/store/clients/analytics?period=${period}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;
    const response = await apiService.get(url);
    return response.data || response;
};
