import { AxiosRequestConfig } from 'axios';
import api from './api';

/**
 * Centralized API Service wrapper for Axios.
 * Automatically extracts data from response and handles basic payload unwrapping.
 */
const apiService = {
    get: async <T = any>(url: string, config: AxiosRequestConfig = {}): Promise<T> => {
        const response = await api.get<any>(url, config);
        const body = response.data;
        // Unwrap if response follows the { success, statusCode, data } pattern
        if (body && body.success !== undefined && body.data !== undefined) {
            if (body.meta) {
                return { data: body.data, meta: body.meta } as any;
            }
            return body.data;
        }
        return body;
    },

    post: async <T = any>(url: string, data: any = {}, config: AxiosRequestConfig = {}): Promise<T> => {
        if (data instanceof FormData) {
            config.headers = { ...config.headers, 'Content-Type': 'multipart/form-data' };
        }
        const response = await api.post<any>(url, data, config);
        const body = response.data;
        if (body && body.success !== undefined && body.data !== undefined) {
            if (body.meta) {
                return { data: body.data, meta: body.meta } as any;
            }
            return body.data;
        }
        return body;
    },

    patch: async <T = any>(url: string, data: any = {}, config: AxiosRequestConfig = {}): Promise<T> => {
        if (data instanceof FormData) {
            config.headers = { ...config.headers, 'Content-Type': 'multipart/form-data' };
        }
        const response = await api.patch<any>(url, data, config);
        const body = response.data;
        if (body && body.success !== undefined && body.data !== undefined) {
            if (body.meta) {
                return { data: body.data, meta: body.meta } as any;
            }
            return body.data;
        }
        return body;
    },

    delete: async <T = any>(url: string, config: AxiosRequestConfig = {}): Promise<T> => {
        const response = await api.delete<any>(url, config);
        const body = response.data;
        if (body && body.success !== undefined && body.data !== undefined) {
            if (body.meta) {
                return { data: body.data, meta: body.meta } as any;
            }
            return body.data;
        }
        return body;
    }
};

export default apiService;
