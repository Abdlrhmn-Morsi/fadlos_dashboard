import { atom } from 'recoil';
import { BusinessType, BusinessTypeModalState } from '../models/business-type.model';

export const businessTypesState = atom<BusinessType[]>({
    key: 'businessTypesState',
    default: []
});

export const businessTypesLoadingState = atom<boolean>({
    key: 'businessTypesLoadingState',
    default: true
});

export const businessTypesSearchState = atom<string>({
    key: 'businessTypesSearchState',
    default: ''
});

export const businessTypeModalState = atom<BusinessTypeModalState>({
    key: 'businessTypeModalState',
    default: {
        isOpen: false,
        isEditing: false,
        currentType: { id: '', en_name: '', ar_name: '', code: '', is_active: true }
    }
});

export const businessTypeStatusModalState = atom<{
    isOpen: boolean;
    type: 'success' | 'error' | 'confirm';
    title: string;
    message: string;
    onConfirm?: () => void;
}>({
    key: 'businessTypeStatusModalState',
    default: {
        isOpen: false,
        type: 'success',
        title: '',
        message: '',
        onConfirm: undefined
    }
});
