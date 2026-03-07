import apiService from '../../../services/api.service';

export const getCities = async (params: any = {}) => {
    try {
        const url = params.includeAll ? '/towns/admin' : '/towns';
        const responseBody = await apiService.get(url, { params });
        // Handle both direct array and object with .data (from apiService)
        const data = responseBody.data !== undefined ? responseBody.data : responseBody;
        return Array.isArray(data) ? data : [];
    } catch (error) {
        throw error;
    }
};

export const createCity = async (cityData: any) => {
    try {
        return await apiService.post('/towns', cityData);
    } catch (error) {
        throw error;
    }
};

export const updateCity = async (id: string, cityData: any) => {
    try {
        return await apiService.patch(`/towns/${id}`, cityData);
    } catch (error) {
        throw error;
    }
};

export const deleteCity = async (id: string) => {
    try {
        return await apiService.delete(`/towns/${id}`);
    } catch (error) {
        throw error;
    }
};

export const toggleCityStatus = async (id: string, isActive: boolean) => {
    try {
        const action = isActive ? 'deactivate' : 'activate';
        return await apiService.patch(`/towns/${id}/${action}`);
    } catch (error) {
        throw error;
    }
};
