import api from '../../../services/api';
import { CreateEmployeeDto, Employee, EmployeeQueryDto, UpdateEmployeeDto } from '../models/employee.model';

export const EmployeesService = {
    getEmployees: async (params?: EmployeeQueryDto) => {
        const response = await api.get<{ data: Employee[]; pagination: any }>('/employees', { params });
        return response.data;
    },

    getEmployee: async (id: string) => {
        const response = await api.get<Employee>(`/employees/${id}`);
        return response.data;
    },

    createEmployee: async (data: CreateEmployeeDto) => {
        const response = await api.post<Employee>('/employees', data);
        return response.data;
    },

    updateEmployee: async (id: string, data: UpdateEmployeeDto) => {
        const response = await api.patch<Employee>(`/employees/${id}`, data);
        return response.data;
    },

    deleteEmployee: async (id: string) => {
        await api.delete(`/employees/${id}`);
    },

    toggleStatus: async (id: string, isActive: boolean) => {
        const response = await api.patch<Employee>(`/employees/${id}/${isActive ? 'activate' : 'deactivate'}`);
        return response.data;
    },
};
