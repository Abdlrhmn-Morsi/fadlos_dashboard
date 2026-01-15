import { atom } from 'recoil';
import { User, UsersFilters, UsersPagination } from '../models/user.model';

export const usersState = atom<User[]>({
    key: 'usersState',
    default: []
});

export const usersLoadingState = atom<boolean>({
    key: 'usersLoadingState',
    default: true
});

export const usersFiltersState = atom<UsersFilters>({
    key: 'usersFiltersState',
    default: {
        role: '',
        search: ''
    }
});

export const usersPaginationState = atom<UsersPagination>({
    key: 'usersPaginationState',
    default: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
    }
});
