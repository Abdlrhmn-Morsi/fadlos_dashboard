import { atom } from 'recoil';
import { City, CityModalState } from '../models/city.model';

export const citiesState = atom<City[]>({
    key: 'citiesState',
    default: []
});

export const citiesLoadingState = atom<boolean>({
    key: 'citiesLoadingState',
    default: true
});

export const citiesSearchState = atom<string>({
    key: 'citiesSearchState',
    default: ''
});

export const cityModalState = atom<CityModalState>({
    key: 'cityModalState',
    default: {
        isOpen: false,
        isEditing: false,
        currentCity: { id: '', enName: '', arName: '', isActive: true }
    }
});

export const cityStatusModalState = atom<{
    isOpen: boolean;
    type: 'success' | 'error' | 'confirm';
    title: string;
    message: string;
    onConfirm?: () => void;
}>({
    key: 'cityStatusModalState',
    default: {
        isOpen: false,
        type: 'success',
        title: '',
        message: '',
        onConfirm: undefined
    }
});
