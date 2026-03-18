import api from '../../../services/api';
import { CreateAdminEmployeeDto, AdminEmployee, AdminEmployeeQueryDto, UpdateAdminEmployeeDto } from '../models/admin-employee.model';

export const AdminEmployeesApiService = {
    getAdminEmployees: async (params?: AdminEmployeeQueryDto) => {
        const response = await api.get<AdminEmployee[]>('/admin-employees', { params });
        return response.data;
    },

    getAdminEmployee: async (id: string) => {
        const response = await api.get<AdminEmployee>(`/admin-employees/${id}`);
        return response.data;
    },

    createAdminEmployee: async (data: CreateAdminEmployeeDto) => {
        const response = await api.post<AdminEmployee>('/admin-employees', data);
        return response.data;
    },

    updateAdminEmployee: async (id: string, data: UpdateAdminEmployeeDto) => {
        const response = await api.patch<AdminEmployee>(`/admin-employees/${id}`, data);
        return response.data;
    },

    deleteAdminEmployee: async (id: string) => {
        await api.delete(`/admin-employees/${id}`);
    },

    toggleStatus: async (id: string, isActive: boolean) => {
        const response = await api.patch<AdminEmployee>(`/admin-employees/${id}`, { isActive });
        return response.data;
    },
};
