import apiService from '../../../services/api.service';

/**
 * Reviews Management API
 */
export const reviewsApi = {
    /**
     * Fetch reviews for store management
     */
    async getStoreManagementReviews(params: any = {}) {
        return apiService.get('/reviews/store-management', { params });
    },

    /**
     * Report a review
     */
    async reportReview(reviewId: string, reason: string) {
        return apiService.post(`/reviews/${reviewId}/report`, { reason });
    },

    /**
     * Update review (e.g. deactivate)
     */
    async updateReview(reviewId: string, data: any) {
        return apiService.patch(`/reviews/${reviewId}`, data);
    },

    /**
     * Delete review
     */
    async deleteReview(reviewId: string) {
        return apiService.delete(`/reviews/${reviewId}`);
    }
};

export default reviewsApi;
