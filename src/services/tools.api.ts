import apiService from './api.service';

export const toolsApi = {
    translate: async (text: string, from: string = 'ar', to: string = 'en') => {
        return apiService.post('/tools/translate', { text, from, to });
    }
};

export default toolsApi;
