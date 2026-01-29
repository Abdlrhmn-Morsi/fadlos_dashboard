import apiService from '../../../services/api.service';

/**
 * Category Management API
 */
const categoriesApi = {
    /**
     * Fetch categories for a store
     */
    getCategories: async (params: any = {}) => {
        // storeId should be passed in params from the component using useAuth()
        return apiService.get('/categories', { params });
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
