import apiService from '../../../services/api.service';

/**
 * Clients Management API
 */
export const clientsApi = {
    /**
     * Fetch clients for the current store with filtering and sorting
     */
    getStoreClients: async (params?: any) => {
        return apiService.get('/store/clients', { params });
    },

    /**
     * Fetch orders for a specific client
     */
    getClientOrders: async (clientId: string, params?: any) => {
        return apiService.get(`/store/clients/${clientId}/orders`, { params });
    }
};

export default clientsApi;
