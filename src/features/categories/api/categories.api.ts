import apiService from '../../../services/api.service';

/**
 * Category Management API
 */
const categoriesApi = {
    /**
     * Fetch categories for a store
     */
    getCategories: async (params: any = {}) => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const storeId = user.store?.id;

        // Default to current user's store if storeId not provided
        const queryParams = {
            storeId,
            ...params
        };

        return apiService.get('/categories', { params: queryParams });
    },

    /**
     * Fetch categories for the authenticated seller
     */
    getSellerCategories: async (params: any = {}) => {
        return apiService.get('/categories/seller-categories', { params });
    },

    /**
     * Create a new category
     */
    createCategory: async (data: any) => {
        return apiService.post('/categories', data);
    },

    /**
     * Update an existing category
     */
    updateCategory: async (id: string, data: any) => {
        return apiService.patch(`/categories/${id}`, data);
    },

    /**
     * Delete a category
     */
    deleteCategory: async (id: string) => {
        return apiService.delete(`/categories/${id}`);
    }
};

export default categoriesApi;
