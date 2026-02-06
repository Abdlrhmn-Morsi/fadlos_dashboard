import apiService from '../../../services/api.service';

/**
 * Orders Management API
 */
export const ordersApi = {
    /**
     * Fetch orders with optional filters
     */
    getOrders: async (params: any = {}) => {
        return apiService.get('/orders', { params });
    },

    /**
     * Fetch a single order by ID
     */
    getOrder: async (id: string) => {
        return apiService.get(`/orders/${id}`);
    },

    /**
     * Update the status of an order
     */
    updateOrderStatus: async (id: string, status: string) => {
        return apiService.patch(`/orders/${id}/status`, { status });
    },

    /**
     * Cancel an order
     */
    cancelOrder: async (id: string, reason: string) => {
        return apiService.delete(`/orders/${id}`, { data: { reason } });
    },

    /**
     * Get order status counts
     */
    getStatusCounts: async () => {
        return apiService.get('/orders/stats/status-counts');
    }
};

export default ordersApi;
