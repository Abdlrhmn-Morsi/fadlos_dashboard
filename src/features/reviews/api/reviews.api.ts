import apiService from '../../../services/api.service';

/**
 * Reviews Management API
 */
export const reviewsApi = {
    /**
     * Fetch reviews for store management
     */
    getStoreManagementReviews: async (params: any = {}) => {
        return apiService.get('/reviews/store-management', { params });
    }
};

export default reviewsApi;
