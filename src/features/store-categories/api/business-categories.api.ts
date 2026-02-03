import apiService from '../../../services/api.service';

export const getBusinessCategories = async (businessTypeId?: string) => {
    try {
        const url = businessTypeId
            ? `/business-categories?businessTypeId=${businessTypeId}`
            : '/business-categories';
        const responseBody = await apiService.get(url);
        const data = responseBody.data || responseBody;

        if (data && typeof data === 'object' && !Array.isArray(data)) {
            return Object.values(data);
        } else {
            return Array.isArray(data) ? data : [];
        }
    } catch (error) {
        console.error('Error fetching business categories:', error);
        throw error;
    }
};

export const createBusinessCategory = async (payload: any) => {
    try {
        return await apiService.post('/business-categories', payload);
    } catch (error) {
        console.error('Error creating business category:', error);
        throw error;
    }
};

export const updateBusinessCategory = async (id: string, payload: any) => {
    try {
        return await apiService.patch(`/business-categories/${id}`, payload);
    } catch (error) {
        console.error('Error updating business category:', error);
        throw error;
    }
};

export const toggleBusinessCategoryStatus = async (id: string) => {
    try {
        return await apiService.patch(`/business-categories/${id}/status`, {});
    } catch (error) {
        console.error('Error toggling business category status:', error);
        throw error;
    }
};
