import apiService from '../../../services/api.service';

export const getBusinessTypes = async () => {
    try {
        const responseBody = await apiService.get('/business-types');
        const data = responseBody.data || responseBody;

        if (data && typeof data === 'object' && !Array.isArray(data)) {
            return Object.values(data);
        } else {
            return Array.isArray(data) ? data : [];
        }
    } catch (error) {
        throw error;
    }
};

export const createBusinessType = async (payload) => {
    try {
        return await apiService.post('/business-types', payload);
    } catch (error) {
        throw error;
    }
};

export const updateBusinessType = async (id, payload) => {
    try {
        return await apiService.patch(`/business-types/${id}`, payload);
    } catch (error) {
        throw error;
    }
};

export const toggleBusinessTypeStatus = async (id, is_active) => {
    try {
        return await apiService.patch(`/business-types/${id}`, { is_active: !is_active });
    } catch (error) {
        throw error;
    }
};
