import apiService from '../../../services/api.service';

/**
 * Clients Management API
 */
export const clientsApi = {
    /**
     * Fetch clients for the current store
     */
    getStoreClients: async () => {
        return apiService.get('/store/clients');
    }
};

export default clientsApi;
