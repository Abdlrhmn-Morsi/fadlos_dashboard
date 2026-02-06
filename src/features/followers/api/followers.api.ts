import apiService from '../../../services/api.service';

/**
 * Followers Management API
 */
export const followersApi = {
    /**
     * Fetch followers for a specific store
     */
    getStoreFollowers: async (storeId: string, search?: string, page: number = 1, limit: number = 20) => {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        params.append('page', page.toString());
        params.append('limit', limit.toString());
        return apiService.get(`/follows/store/${storeId}/followers?${params.toString()}`);
    }
};

export default followersApi;
