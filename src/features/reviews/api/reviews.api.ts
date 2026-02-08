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
     * Deactivate review
     */
    async deactivateReview(reviewId: string) {
        return apiService.patch(`/reviews/${reviewId}/deactivate`);
    },

    /**
     * Activate review
     */
    async activateReview(reviewId: string) {
        return apiService.patch(`/reviews/${reviewId}/activate`);
    },

    /**
     * Delete review
     */
    async deleteReview(reviewId: string) {
        return apiService.delete(`/reviews/${reviewId}`);
    },

    /**
     * Unreport a review
     */
    async unreportReview(reviewId: string) {
        return apiService.patch(`/reviews/${reviewId}/unreport`);
    }
};

export default reviewsApi;
