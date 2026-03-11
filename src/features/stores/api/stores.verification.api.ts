import apiService from '../../../services/api.service';
import { StoreVerificationStatus } from '../models/store.verification.model';

export const submitVerification = async (formData: FormData) => {
    try {
        const response = await apiService.post('/stores/verification/submit', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data || response;
    } catch (error) {
        throw error;
    }
};

export const getVerificationStatus = async () => {
    try {
        const response = await apiService.get('/stores/verification/status');
        return response.data || response;
    } catch (error) {
        throw error;
    }
};

export const getVerificationRequests = async (params: {
    page?: number;
    limit?: number;
    status?: StoreVerificationStatus;
    search?: string;
}) => {
    try {
        return await apiService.get('/stores/verification/requests', { params });
    } catch (error) {
        throw error;
    }
};

export const getVerificationRequestById = async (id: string) => {
    try {
        const response = await apiService.get(`/stores/verification/requests/${id}`);
        return response.data || response;
    } catch (error) {
        throw error;
    }
};

export const reviewVerification = async (id: string, data: {
    status: StoreVerificationStatus.APPROVED | StoreVerificationStatus.REJECTED;
    rejectionReason?: string;
}) => {
    try {
        const response = await apiService.patch(`/stores/verification/requests/${id}/review`, data);
        return response.data || response;
    } catch (error) {
        throw error;
    }
};
