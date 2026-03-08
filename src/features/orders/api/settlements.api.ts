import apiService from '../../../services/api.service';

/**
 * Settlements Management API
 */
export const settlementsApi = {
    /**
     * Get list of drivers with pending cash collections
     */
    getPendingCollections: async () => {
        return apiService.get('/settlements/pending');
    },

    /**
     * Get pending orders for a specific driver
     */
    getPendingOrdersByDriver: async (driverId: string) => {
        return apiService.get(`/settlements/pending/${driverId}`);
    },

    /**
     * Create a new settlement batch
     */
    createSettlement: async (deliveryId: string, orderIds: string[]) => {
        return apiService.post('/settlements', { deliveryId, orderIds });
    },

    /**
     * Get all settlement batches
     */
    getSettlements: async () => {
        return apiService.get('/settlements');
    },

    /**
     * Get settlement batch details
     */
    getSettlement: async (id: string) => {
        return apiService.get(`/settlements/${id}`);
    }
};

export default settlementsApi;
