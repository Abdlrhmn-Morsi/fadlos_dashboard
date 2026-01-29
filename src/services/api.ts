import axios from 'axios';

// Create axios instance
const api = axios.create({
    baseURL: 'http://localhost:3001/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // If using cookies
});

// Request interceptor for adding the bearer token
api.interceptors.request.use(
    (config) => {
        // Token is now handled by HttpOnly cookies automatically by the browser
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for handling errors
api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        // Handle 401 Unauthorized
        if (error.response && error.response.status === 401) {
            // Redirect to login on unauthorized
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
