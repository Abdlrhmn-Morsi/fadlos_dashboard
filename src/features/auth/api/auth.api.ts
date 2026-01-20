import apiService from '../../../services/api.service';

/**
 * Authentication & Registration API
 */
export const authApi = {
    /**
     * Login user
     */
    login: async (credentials: any) => {
        return apiService.post('/auth/login', credentials);
    },

    /**
     * Register a new store owner
     */
    registerStoreOwner: async (data: any) => {
        return apiService.post('/auth/register/store-owner', data);
    },

    /**
     * Fetch active business types
     */
    getActiveBusinessTypes: async () => {
        return apiService.get('/business-types/active');
    },

    /**
     * Fetch active towns
     */
    getTowns: async () => {
        return apiService.get('/towns');
    },

    /**
     * Fetch active places for a specific town
     */
    getPlacesByTown: async (townId: string) => {
        return apiService.get(`/places/by-town/${townId}`);
    },

    /**
     * Verify email with 6-digit code
     */
    verifyEmail: async (token: string, code: string) => {
        return apiService.post('/auth/verify-email', { code }, {
            headers: { Authorization: `Bearer ${token}` }
        });
    },

    /**
     * Resend verification code
     */
    resendVerificationCode: async (token: string) => {
        return apiService.post('/auth/resend-verification', {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
    },

    /**
     * Request a password reset code
     */
    forgotPassword: async (email: string) => {
        return apiService.post('/auth/forgot-password', { email });
    },

    /**
     * Verify the password reset code
     */
    verifyResetCode: async (code: string, sessionToken: string) => {
        return apiService.post('/auth/verify-reset-code', { code }, {
            headers: { Authorization: `Bearer ${sessionToken}` }
        });
    },

    /**
     * Reset password using the reset token
     */
    resetPassword: async (newPassword: string, authorizedToken: string) => {
        return apiService.post('/auth/reset-password', { newPassword }, {
            headers: { Authorization: `Bearer ${authorizedToken}` }
        });
    }
};

export default authApi;
