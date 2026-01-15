import apiService from '../../../services/api.service';

export const getUsers = async (params) => {
    try {
        const responseBody = await apiService.get('/users', { params });

        let users = [];
        let meta = { total: 0, totalPages: 0 };

        if (responseBody.data && Array.isArray(responseBody.data)) {
            users = responseBody.data;
            if (responseBody.meta) {
                meta = responseBody.meta;
            }
        }
        else if (responseBody.data && responseBody.data.data && Array.isArray(responseBody.data.data)) {
            users = responseBody.data.data;
            if (responseBody.data.meta) {
                meta = responseBody.data.meta;
            }
        }

        return { users, meta };
    } catch (error) {
        throw error;
    }
};
