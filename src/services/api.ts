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
