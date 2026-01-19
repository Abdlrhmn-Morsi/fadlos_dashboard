import { atom } from 'recoil';
import { Store, StoresFilters, StoresPagination } from '../models/store.model';

export const storesState = atom<Store[]>({
    key: 'storesState',
    default: []
});

export const storesLoadingState = atom<boolean>({
    key: 'storesLoadingState',
    default: true
});

export const storesFiltersState = atom<StoresFilters>({
    key: 'storesFiltersState',
    default: {
        search: '',
        status: ''
    }
});

export const storesPaginationState = atom<StoresPagination>({
    key: 'storesPaginationState',
    default: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
    }
});
