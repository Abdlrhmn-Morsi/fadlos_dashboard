import axios from 'axios';

// Create axios instance
const api = axios.create({
    baseURL: 'http://localhost:3001/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // If using cookies
});

// Request interceptor for adding the bearer token and language header
api.interceptors.request.use(
    (config) => {
        // Token is now handled by HttpOnly cookies automatically by the browser
        
        // Add language header for backend translations
        const language = localStorage.getItem('language') || 'ar';
        config.headers['lang'] = language;
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let refreshPromise: Promise<any> | null = null;

// Response interceptor for handling errors
api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Handle 401 Unauthorized
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            // We ignore 401s from the refresh endpoint itself to prevent infinite loops
            if (originalRequest.url === '/auth/refresh-token' || originalRequest.url?.includes('login')) {
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
                return Promise.reject(error);
            }

            if (!isRefreshing) {
                isRefreshing = true;
                originalRequest._retry = true;

                refreshPromise = api.post('/auth/refresh-token')
                    .then((res) => {
                        return res;
                    })
                    .catch((err) => {
                        // Refresh token failed/expired
                        if (window.location.pathname !== '/login') {
                            window.location.href = '/login';
                        }
                        return Promise.reject(err);
                    })
                    .finally(() => {
                        isRefreshing = false;
                        refreshPromise = null;
                    });
            }

            try {
                await refreshPromise;
                // Retry the original request after successful refresh
                return api(originalRequest);
            } catch (err) {
                return Promise.reject(err);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
