import apiService from '../../../services/api.service';
import { GetStoresParams } from '../models/store.model';

export const getStores = async (params: GetStoresParams) => {
    try {
        // Filter out empty strings or null/undefined values from params
        const cleanParams = Object.fromEntries(
            Object.entries(params).filter(([_, v]) => v !== '' && v !== null && v !== undefined)
        );
        const responseBody = await apiService.get('/stores', { params: cleanParams });

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

export const updateStoreStatus = async (id: string, data: { status: string; reason?: string }) => {
    try {
        return await apiService.patch(`/stores/${id}/status`, data);
    } catch (error) {
        throw error;
    }
};

export const getMyStore = async () => {
    try {
        const response = await apiService.get('/stores/my-store');
        return response.store || response;
    } catch (error) {
        throw error;
    }
};
export const getStoreStatsSummary = async () => {
    try {
        const response = await apiService.get('/stores/stats/summary');
        return response.data || response;
    } catch (error) {
        throw error;
    }
};

export const updateStore = async (formData: FormData) => {
    try {
        const response = await apiService.patch('/stores/update', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response;
    } catch (error) {
        throw error;
    }
};
export const getStoreById = async (id: string) => {
    try {
        const response = await apiService.get(`/stores/${id}`);
        return response.data || response;
    } catch (error) {
        throw error;
    }
};
