import apiService from '../../../services/api.service';

/**
 * Promo Codes Management API
 */
export const promoCodesApi = {
    /**
     * Fetch all promo codes
     */
    getPromoCodes: async () => {
        return apiService.get('/promo-codes');
    },

    /**
     * Fetch a single promo code by ID
     */
    getPromoCode: async (id: string) => {
        return apiService.get(`/promo-codes/${id}`);
    },

    /**
     * Create a new promo code
     */
    createPromoCode: async (data: any) => {
        return apiService.post('/promo-codes', data);
    },

    /**
     * Update an existing promo code
     */
    updatePromoCode: async (id: string, data: any) => {
        return apiService.patch(`/promo-codes/${id}`, data);
    },

    /**
     * Toggle the status of a promo code
     */
    togglePromoCodeStatus: async (id: string) => {
        return apiService.post(`/promo-codes/${id}/toggle-status`, {});
    },

    /**
     * Delete a promo code
     */
    deletePromoCode: async (id: string) => {
        return apiService.delete(`/promo-codes/${id}`);
    }
};

export default promoCodesApi;
