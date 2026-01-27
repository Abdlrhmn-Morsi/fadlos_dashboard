import apiService from './api.service';

export const toolsApi = {
    translate: async (text: string, from: string = 'ar', to: string = 'en') => {
        return apiService.post('/tools/translate', { text, from, to });
    },
    transliterate: async (text: string, from: string = 'ar') => {
        return apiService.post('/tools/transliterate', { text, from });
    }
};

export default toolsApi;
