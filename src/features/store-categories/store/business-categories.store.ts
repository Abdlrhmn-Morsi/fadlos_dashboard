import { atom } from 'recoil';
import { BusinessCategory, BusinessCategoryModalState } from '../models/business-category.model';

export const businessCategoriesState = atom<BusinessCategory[]>({
    key: 'businessCategoriesState',
    default: [],
});

export const businessCategoriesLoadingState = atom<boolean>({
    key: 'businessCategoriesLoadingState',
    default: false,
});

export const businessCategoriesSearchState = atom<string>({
    key: 'businessCategoriesSearchState',
    default: '',
});

export const businessCategoriesFilterState = atom<string>({
    key: 'businessCategoriesFilterState',
    default: '',
});

export const businessCategoryModalState = atom<BusinessCategoryModalState>({
    key: 'businessCategoryModalState',
    default: {
        isOpen: false,
        isEditing: false,
        currentCategory: {
            id: '',
            name: '',
            nameAr: '',
            code: '',
            businessTypeId: '',
            isActive: true,
            sort: 0,
        },
    },
});

export const businessCategoryStatusModalState = atom<{
    isOpen: boolean;
    type: 'success' | 'error' | 'confirm';
    title: string;
    message: string;
    onConfirm?: () => void;
}>({
    key: 'businessCategoryStatusModalState',
    default: {
        isOpen: false,
        type: 'success',
        title: '',
        message: '',
        onConfirm: undefined,
    },
});

