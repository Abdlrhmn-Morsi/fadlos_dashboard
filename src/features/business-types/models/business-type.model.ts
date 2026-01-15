export interface BusinessType {
    id: string;
    en_name: string;
    ar_name: string;
    code: string;
    is_active: boolean;
}

export interface BusinessTypeModalState {
    isOpen: boolean;
    isEditing: boolean;
    currentType: BusinessType;
}
