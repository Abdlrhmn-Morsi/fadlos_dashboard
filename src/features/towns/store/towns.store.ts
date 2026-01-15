import { atom } from 'recoil';
import { Town, TownModalState } from '../models/town.model';

export const townsState = atom<Town[]>({
    key: 'townsState',
    default: []
});

export const townsLoadingState = atom<boolean>({
    key: 'townsLoadingState',
    default: true
});

export const townsSearchState = atom<string>({
    key: 'townsSearchState',
    default: ''
});

export const townsCityFilterState = atom<string>({
    key: 'townsCityFilterState',
    default: 'all'
});

export const townModalState = atom<TownModalState>({
    key: 'townModalState',
    default: {
        isOpen: false,
        isEditing: false,
        currentTown: { id: '', enName: '', arName: '', isActive: true, townId: '' }
    }
});

export const townStatusModalState = atom({
    key: 'townStatusModalState',
    default: {
        isOpen: false,
        type: 'success',
        title: '',
        message: '',
        onConfirm: null
    }
});
