export interface Addon {
    id: string;
    name: string;
    nameAr: string;
    price: number;
    image?: string;
    inventory: number;
    trackInventory: boolean;
    isActive: boolean;
    storeId: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateAddonDto {
    name: string;
    nameAr?: string;
    price: number;
    image?: string;
    inventory?: number;
    trackInventory?: boolean;
    isActive?: boolean;
}

export interface UpdateAddonDto extends Partial<CreateAddonDto> { }
