import apiService from '../../../services/api.service';

export const getStores = async (params) => {
    try {
        const responseBody = await apiService.get('/stores', { params });

        let stores = [];
        let meta = { total: 0, totalPages: 0 };

        if (responseBody.data && Array.isArray(responseBody.data)) {
            stores = responseBody.data;
            if (responseBody.meta) {
                meta = responseBody.meta;
            }
        } else if (responseBody.data && responseBody.data.data && Array.isArray(responseBody.data.data)) {
            stores = responseBody.data.data;
            if (responseBody.data.meta) {
                meta = responseBody.data.meta;
            }
        }

        return { stores, meta };
    } catch (error) {
        throw error;
    }
};
