import apiService from '../../../services/api.service';

export const getTowns = async () => {
    try {
        const responseBody = await apiService.get('/places');
        const data = responseBody.data || responseBody;
        return Array.isArray(data) ? data : (data.data || []);
    } catch (error) {
        throw error;
    }
};

export const createTown = async (townData) => {
    try {
        return await apiService.post('/places', townData);
    } catch (error) {
        throw error;
    }
};

export const updateTown = async (id, townData) => {
    try {
        return await apiService.patch(`/places/${id}`, townData);
    } catch (error) {
        throw error;
    }
};

export const deleteTown = async (id) => {
    try {
        return await apiService.delete(`/places/${id}`);
    } catch (error) {
        throw error;
    }
};

export const toggleTownStatus = async (id, isActive) => {
    try {
        const action = isActive ? 'deactivate' : 'activate';
        return await apiService.patch(`/places/${id}/${action}`);
    } catch (error) {
        throw error;
    }
};
