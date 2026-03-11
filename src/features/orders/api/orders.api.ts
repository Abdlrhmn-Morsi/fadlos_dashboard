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
     * Return an order (Driver)
     */
    returnOrder: async (id: string, reason: string) => {
        return apiService.patch(`/delivery/orders/${id}/return`, { reason });
    },

    /**
     * Return an order (Store Owner/Employee)
     */
    storeReturnOrder: async (id: string, reason: string) => {
        return apiService.patch(`/orders/${id}/return`, { reason });
    },

    /**
     * Reset a returned order back to pending (Store Owner/Employee)
     */
    resetReturnedOrder: async (id: string) => {
        return apiService.patch(`/orders/${id}/reset-return`);
    },

    /**
     * Get order status counts
     */
    getStatusCounts: async () => {
        return apiService.get('/orders/stats/status-counts');
    },

    /**
     * Assign a driver to an order
     */
    assignDriver: async (id: string, driverId: string) => {
        return apiService.patch(`/orders/${id}/assign-driver`, { deliveryId: driverId });
    },

    /**
     * Reassign a driver to an order
     */
    reassignDriver: async (id: string, driverId: string) => {
        return apiService.patch(`/orders/${id}/reassign-driver`, { deliveryId: driverId });
    },

    /**
     * Unassign a driver from an order
     */
    unassignDriver: async (id: string) => {
        return apiService.patch(`/orders/${id}/unassign-driver`);
    },

    /**
     * Confirm delivery (Driver)
     */
    confirmDelivery: async (id: string, pin: string, proofImage?: File) => {
        const formData = new FormData();
        formData.append('pin', pin);
        if (proofImage) {
            formData.append('proofImage', proofImage);
        }
        return apiService.patch(`/orders/${id}/confirm-delivery`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    }
};

export default ordersApi;
