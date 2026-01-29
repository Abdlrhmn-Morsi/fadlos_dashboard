import apiService from '../../../services/api.service';

/**
 * Products Management API
 */
export const productsApi = {
    /**
     * Fetch products for the current store
     */
    getStoreProducts: async () => {
        return apiService.get('/products/store-products');
    },
    /**
     * Fetch products for the authenticated seller
     */
    getSellerProducts: async () => {
        return apiService.get('/products/seller-products');
    },
    /**
     * Fetch a single product by ID
     */
    getProduct: async (id: string) => {
        return apiService.get(`/products/${id}`);
    },
    /**
     * Create a new product
     */
    createProduct: async (data: FormData | any) => {
        return apiService.post('/products', data, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
    /**
     * Update an existing product
     */
    updateProduct: async (id: string, data: FormData | any) => {
        return apiService.patch(`/products/${id}`, data, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
    /**
     * Delete a product
     */
    deleteProduct: async (id: string) => {
        return apiService.delete(`/products/${id}`);
    },
    /**
     * Fetch store-specific categories
     */
    getCategories: async (params: any = {}) => {
        // storeId should be passed in params from the component using useAuth()
        return apiService.get('/categories', { params });
    },
};

export default productsApi;
