export interface BusinessCategory {
    id: string;
    name: string;
    nameAr: string;
    code: string;
    isActive: boolean;
    sort: number;
    businessTypeId: string;
    businessType?: {
        id: string;
        en_name: string;
        ar_name: string;
        code: string;
    };
    createdAt: string;
    updatedAt: string;
}

export interface BusinessCategoryModalState {
    isOpen: boolean;
    isEditing: boolean;
    currentCategory: Partial<BusinessCategory>;
}
