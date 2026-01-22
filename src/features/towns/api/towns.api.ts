import apiService from '../../../services/api.service';

export const getTowns = async (params: any = {}) => {
    try {
        // Use admin endpoint if asking for all records (which implies admin access)
        const url = params.includeAll ? '/places/admin' : '/places';
        const responseBody = await apiService.get(url, { params });
        const data = responseBody.data || responseBody;
        return Array.isArray(data) ? data : (data.data || []);
    } catch (error) {
        throw error;
    }
};

export const createTown = async (townData: any) => {
    try {
        return await apiService.post('/places', townData);
    } catch (error) {
        throw error;
    }
};

export const updateTown = async (id: string, townData: any) => {
    try {
        return await apiService.patch(`/places/${id}`, townData);
    } catch (error) {
        throw error;
    }
};

export const deleteTown = async (id: string) => {
    try {
        return await apiService.delete(`/places/${id}`);
    } catch (error) {
        throw error;
    }
};

export const toggleTownStatus = async (id: string, isActive: boolean) => {
    try {
        const action = isActive ? 'deactivate' : 'activate';
        return await apiService.patch(`/places/${id}/${action}`);
    } catch (error) {
        throw error;
    }
};

// Delivery Area Management
export const assignTownToStore = async (dto: { townId: string; defaultPrice: number; storeId?: string }) => {
    try {
        return await apiService.post('/towns/delivery-areas/bulk', dto);
    } catch (error) {
        throw error;
    }
};

export const getMyStoreDeliveryAreas = async () => {
    try {
        const responseBody = await apiService.get('/towns/delivery-areas/my-store');
        return responseBody.data || responseBody;
    } catch (error) {
        throw error;
    }
};

export const updateDeliveryArea = async (id: string, dto: { price?: number; isActive?: boolean }) => {
    try {
        return await apiService.patch(`/towns/delivery-areas/${id}`, dto);
    } catch (error) {
        throw error;
    }
};

export const removeDeliveryArea = async (id: string) => {
    try {
        return await apiService.delete(`/towns/delivery-areas/${id}`);
    } catch (error) {
        throw error;
    }
};

export const resetMyStoreDeliveryAreas = async () => {
    try {
        return await apiService.delete('/towns/delivery-areas/reset/all');
    } catch (error) {
        throw error;
    }
};
