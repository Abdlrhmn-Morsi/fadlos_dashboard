import { User } from '../../users/models/user.model';
import { Role } from '../../roles/models/role.model';

export interface Employee extends User {
    employeeRole: Role; // Custom role details
    roleId?: string;
    lastLoginAt?: string;
}

export interface CreateEmployeeDto {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    password: string;
    roleId: string;
    storeId?: string;
}

export interface UpdateEmployeeDto {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    roleId?: string;
    isActive?: boolean;
}

export interface EmployeeQueryDto {
    page?: number;
    limit?: number;
    search?: string;
    roleId?: string;
    isActive?: boolean;
    storeId?: string;
}
