import apiService from '../../../services/api.service';
import { CreateAddonDto, UpdateAddonDto } from '../models/addon.model';

export const addonsApi = {
    /**
     * Fetch all addons for the current store
     */
    getAddons: async (params: any = {}) => {
        return apiService.get('/addons', { params });
    },

    /**
     * Fetch a single addon by ID
     */
    getAddon: async (id: string) => {
        return apiService.get(`/addons/${id}`);
    },

    /**
     * Create a new addon
     */
    createAddon: async (data: CreateAddonDto) => {
        return apiService.post('/addons', data);
    },

    /**
     * Update an existing addon
     */
    updateAddon: async (id: string, data: UpdateAddonDto) => {
        return apiService.patch(`/addons/${id}`, data);
    },

    /**
     * Delete an addon
     */
    deleteAddon: async (id: string) => {
        return apiService.delete(`/addons/${id}`);
    },

    /**
     * Update addon inventory
     */
    updateInventory: async (id: string, quantity: number) => {
        return apiService.patch(`/addons/${id}/inventory`, { quantity });
    },
};

export default addonsApi;
