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
