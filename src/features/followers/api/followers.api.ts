import apiService from '../../../services/api.service';

/**
 * Followers Management API
 */
export const followersApi = {
    /**
     * Fetch followers for a specific store
     */
    getStoreFollowers: async (storeId: string) => {
        return apiService.get(`/follows/store/${storeId}/followers`);
    }
};

export default followersApi;
