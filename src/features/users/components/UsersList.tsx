import React, { useEffect } from 'react';
import { useRecoilState } from 'recoil';
import {
    Users,
    Search,
    Filter,
    MoreVertical,
    Shield,
    Store,
    User as UserIcon,
    ShoppingBag
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getUsers } from '../api/users.api';
import {
    usersState,
    usersLoadingState,
    usersFiltersState,
    usersPaginationState
} from '../store/users.store';

const UsersList: React.FC = () => {
    const { t } = useTranslation(['users', 'common']);
    const [users, setUsers] = useRecoilState(usersState);
    const [loading, setLoading] = useRecoilState(usersLoadingState);
    const [filters, setFilters] = useRecoilState(usersFiltersState);
    const [pagination, setPagination] = useRecoilState(usersPaginationState);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params: any = {
                page: pagination.page,
                limit: pagination.limit,
                search: filters.search,
            };

            if (filters.role && filters.role !== 'all') {
                params.role = filters.role;
            }

            const { users, meta } = await getUsers(params);
            setUsers(users);
            setPagination(prev => ({
                ...prev,
                total: meta.total,
                totalPages: meta.totalPages
            }));
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [pagination.page, filters.role]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchUsers();
    };

    const getRoleBadge = (role: string) => {
        const baseClass = "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-none-none text-xs font-semibold";
        switch (role) {
            case 'store_owner':
                return <span className={`${baseClass} bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300`}><Store size={12} /> {t('storeOwner')}</span>;
            case 'employee':
                return <span className={`${baseClass} bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300`}><Shield size={12} /> {t('employee', { defaultValue: 'Employee' })}</span>;
            case 'customer':
                return <span className={`${baseClass} bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300`}><ShoppingBag size={12} /> {t('customer')}</span>;
            default:
                return <span className={`${baseClass} bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400`}><UserIcon size={12} /> {role}</span>;
        }
    };

    return (
        <div className="list-page-container p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary-light rounded-none-[1.25rem] animate-float">
                        <Users size={24} className="text-primary" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{t('title')}</h2>
                </div>

                <div className="flex flex-wrap gap-3">
                    <form onSubmit={handleSearch} className="relative group">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder={t('searchPlaceholder')}
                            className="pl-11 pr-4 py-3 w-full md:w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-none-none focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-sm group-hover:shadow-md"
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        />
                    </form>

                    <div className="relative group">
                        <Filter size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors pointer-events-none" />
                        <select
                            className="appearance-none pl-11 pr-12 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-none-none focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none cursor-pointer transition-all shadow-sm group-hover:shadow-md"
                            value={filters.role}
                            onChange={(e) => {
                                setFilters(prev => ({ ...prev, role: e.target.value }));
                                setPagination(prev => ({ ...prev, page: 1 }));
                            }}
                        >
                            <option value="">{t('allRoles')}</option>
                            <option value="customer">{t('customer')}</option>
                            <option value="store_owner">{t('storeOwner')}</option>
                            <option value="employee">{t('employee', { defaultValue: 'Employee' })}</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="table-container">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-6">
                        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-none-none animate-spin" />
                        <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">{t('common:loading')}...</div>
                    </div>
                ) : (
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/80 dark:bg-slate-800/80">
                                    <th className="table-header-cell">{t('userProfile', { defaultValue: 'User Profile' })}</th>
                                    <th className="table-header-cell">{t('permissions', { defaultValue: 'Permissions' })}</th>
                                    <th className="table-header-cell">{t('communication', { defaultValue: 'Communication' })}</th>
                                    <th className="table-header-cell">{t('common:status')}</th>
                                    <th className="table-header-cell">{t('registration', { defaultValue: 'Registration' })}</th>
                                    <th className="table-header-cell text-right">{t('common:actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                {users.length > 0 ? (
                                    users.map(user => (
                                        <tr key={user.id} className="table-row group">
                                            <td className="table-cell">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-11 h-11 rounded-none-none bg-slate-900 dark:bg-slate-800 flex items-center justify-center text-white font-black shadow-lg shadow-slate-200 dark:shadow-slate-900/50 rotate-2 group-hover:rotate-0 transition-transform">
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="text-[15px] font-black text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">{user.name}</div>
                                                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">@{user.username}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="table-cell">{getRoleBadge(user.role)}</td>
                                            <td className="table-cell">
                                                <div className="text-sm text-slate-700 dark:text-slate-300 font-bold">{user.email}</div>
                                                <div className="text-xs text-slate-400 font-medium mt-0.5">{user.phone || 'No phone set'}</div>
                                            </td>
                                            <td className="table-cell">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-3 h-3 rounded-none-none ${user.isActive ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]' : 'bg-slate-300'}`} />
                                                    <span className={`text-xs font-black uppercase tracking-wider ${user.isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                        {user.isActive ? t('common:active') : t('common:inactive')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="table-cell text-sm text-slate-500 font-bold">
                                                {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </td>
                                            <td className="table-cell text-right">
                                                <button className="p-3 text-slate-300 hover:text-primary hover:bg-primary-light rounded-none-none transition-all active:scale-90">
                                                    <MoreVertical size={20} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="text-center py-32">
                                            <div className="flex flex-col items-center gap-3">
                                                <Users size={48} className="text-slate-200" />
                                                <div className="text-slate-400 font-bold text-sm tracking-tight italic">{t('noUsersFound')}</div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {
                pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between py-6">
                        <button
                            disabled={pagination.page === 1}
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                            className="btn btn-secondary border-none shadow-sm h-11"
                        >
                            {t('common:previous')}
                        </button>
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{t('common:page')}</span>
                            <div className="w-10 h-10 rounded-none-none bg-slate-900 dark:bg-slate-700 flex items-center justify-center text-white text-sm font-black shadow-lg shadow-slate-200 dark:shadow-slate-900/50">
                                {pagination.page}
                            </div>
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{t('common:of')} {pagination.totalPages}</span>
                        </div>
                        <button
                            disabled={pagination.page >= pagination.totalPages}
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                            className="btn btn-secondary border-none shadow-sm h-11"
                        >
                            {t('common:next')}
                        </button>
                    </div>
                )
            }
        </div >

    );
};

export default UsersList;

