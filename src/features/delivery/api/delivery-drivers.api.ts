import apiService from '../../../services/api.service';

export const getStoreDrivers = async (params: any = {}) => {
    try {
        const response = await apiService.get('/delivery-drivers/store-drivers', { params });
        // If it's a paginated response, apiService returns { data, meta }
        return response;
    } catch (error) {
        throw error;
    }
};

export const createStoreDriver = async (data: any) => {
    try {
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            if (['avatar', 'identityImageFront', 'identityImageBack', 'identityImageSelfie'].includes(key)) {
                if (data[key] instanceof File) {
                    formData.append(key, data[key]);
                }
            } else {
                if (data[key] !== undefined && data[key] !== null) {
                    formData.append(key, data[key]);
                }
            }
        });

        const response = await apiService.post('/delivery-drivers/store-driver', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data || response;
    } catch (error) {
        throw error;
    }
};

export const searchFreelancers = async (params: any) => {
    try {
        const response = await apiService.get('/delivery-drivers/freelancers', { params });
        return response.data || response;
    } catch (error) {
        throw error;
    }
};

export const hireFreelancer = async (driverId: string) => {
    try {
        const response = await apiService.post(`/delivery-drivers/freelancers/${driverId}/hire`);
        return response.data || response;
    } catch (error) {
        throw error;
    }
};

export const getDriverProfile = async () => {
    try {
        const response = await apiService.get('/delivery-drivers/profile');
        return response.data || response;
    } catch (error) {
        throw error;
    }
};

export const toggleDriverAvailability = async () => {
    try {
        const response = await apiService.patch('/delivery-drivers/toggle-availability');
        return response.data || response;
    } catch (error) {
        throw error;
    }
};

export const getAllDrivers = async () => {
    try {
        const response = await apiService.get('/delivery-drivers');
        return response.data || response;
    } catch (error) {
        throw error;
    }
};

export const verifyDriver = async (driverId: string, status: string, notes?: string, rejectionReason?: string) => {
    try {
        const response = await apiService.patch(`/delivery-drivers/${driverId}/verify`, { status, notes, rejectionReason });
        return response.data || response;
    } catch (error) {
        throw error;
    }
};

export const toggleStoreDriverStatus = async (driverId: string) => {
    try {
        const response = await apiService.patch(`/delivery-drivers/store-drivers/${driverId}/toggle-status`);
        return response.data || response;
    } catch (error) {
        throw error;
    }
};

export const updateDriverStatus = async (driverId: string, status: 'VERIFIED' | 'UNDER_REVIEW') => {
    try {
        const response = await apiService.patch(`/delivery-drivers/${driverId}/status`, { status });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const removeDriver = async (driverId: string) => {
    try {
        const response = await apiService.delete(`/delivery-drivers/${driverId}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getDriverById = async (driverId: string) => {
    try {
        const response = await apiService.get(`/delivery-drivers/store-drivers/${driverId}`);
        return response;
    } catch (error) {
        throw error;
    }
};

export const updateStoreDriver = async (driverId: string, data: any) => {
    try {
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            if (['avatar', 'identityImageFront', 'identityImageBack', 'identityImageSelfie'].includes(key)) {
                if (data[key] instanceof File) {
                    formData.append(key, data[key]);
                }
            } else {
                if (data[key] !== undefined && data[key] !== null) {
                    formData.append(key, data[key]);
                }
            }
        });

        const response = await apiService.patch(`/delivery-drivers/${driverId}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data || response;
    } catch (error) {
        throw error;
    }
};

