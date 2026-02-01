export interface Role {
    id: string;
    name: string;
    description: string;
    permissions: string[];
    isActive: boolean;
    storeId: string;
    createdAt: string;
    updatedAt: string;
    isSystem?: boolean; // If we want to distinguish system roles later
}

export interface CreateRoleDto {
    name: string;
    description?: string;
    permissions: string[];
    isActive?: boolean;
}

export type UpdateRoleDto = Partial<CreateRoleDto>;
