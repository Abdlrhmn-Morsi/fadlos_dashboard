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
     * Fetch all reviews (for platform admin)
     */
    async getAllReviews(params: any = {}) {
        return apiService.get('/reviews', { params });
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
     * Ban customer from store reviews (store-wide)
     */
    async banFromStore(reviewId: string) {
        return apiService.post(`/reviews/${reviewId}/ban`);
    },

    /**
     * Unban customer from store reviews
     */
    async unbanFromStore(reviewId: string) {
        return apiService.post(`/reviews/${reviewId}/unban`);
    },

    /**
     * Get ban status for a review's customer
     */
    async getBanStatus(reviewId: string) {
        return apiService.get(`/reviews/${reviewId}/ban-status`);
    },

    /**
     * Delete review
     */
    async deleteReview(reviewId: string) {
        return apiService.delete(`/reviews/${reviewId}`);
    },

    async unreportReview(reviewId: string, moderatorNotes: string = '') {
        return apiService.patch(`/reviews/${reviewId}/unreport`, { moderatorNotes });
    },

    /**
     * Get all store-wide review bans
     */
    async getAllBans(params: any = {}) {
        return apiService.get('/reviews/bans', { params });
    },

    /**
     * Unban customer by Ban ID
     */
    async unbanCustomerById(banId: string) {
        return apiService.delete(`/reviews/bans/${banId}`);
    }
};

export default reviewsApi;
