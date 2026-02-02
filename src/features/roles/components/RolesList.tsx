import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Shield } from 'lucide-react';
import clsx from 'clsx';
import { Link, useNavigate } from 'react-router-dom';
import { RolesService } from '../api/roles.api';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { toast } from '../../../utils/toast';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useCache } from '../../../contexts/CacheContext';
import { Role } from '../models/role.model';

const RolesList = () => {
    const navigate = useNavigate();
    const { t } = useTranslation(['common']);
    const { isRTL } = useLanguage();
    const { getCache, setCache, invalidateCache } = useCache();
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    useEffect(() => {
        fetchRoles();
    }, []);

    // Refetch data when component becomes visible (e.g., navigating back from form)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                fetchRoles();
            }
        };

        const handleFocus = () => {
            fetchRoles();
        };

        // Listen for visibility changes and window focus
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
        };
    }, []);

    const fetchRoles = async () => {
        try {
            setLoading(true);

            // Check cache first
            const cacheKey = 'roles';
            const cachedData = getCache<any>(cacheKey);
            if (cachedData) {
                let rolesData: Role[] = [];
                const rawData = cachedData.data || cachedData;

                if (Array.isArray(rawData)) {
                    rolesData = rawData;
                } else if (rawData && Array.isArray(rawData.data)) {
                    rolesData = rawData.data;
                }

                setRoles(rolesData);
                setLoading(false);
                return;
            }

            const response = await RolesService.getRoles();
            let rolesData: Role[] = [];

            const rawData = (response as any).data || response;

            if (Array.isArray(rawData)) {
                rolesData = rawData;
            } else if (rawData && Array.isArray((rawData as any).data)) {
                rolesData = (rawData as any).data;
            } else if (response && Array.isArray((response as any).data)) {
                rolesData = (response as any).data;
            }

            setRoles(rolesData);
            // Cache the response
            setCache(cacheKey, response);
        } catch (error) {
            console.error('Failed to fetch roles', error);
            toast.error(t('errorFetchingData'));
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        setDeleteId(id);
        setConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            await RolesService.deleteRole(deleteId);
            toast.success(t('success'));

            // Immediately remove from local state for better UX
            setRoles(prevRoles => prevRoles.filter(role => role.id !== deleteId));

            // Invalidate cache after delete
            invalidateCache('roles');

            // Small delay to ensure cache invalidation completes
            setTimeout(() => {
                fetchRoles();
            }, 100);
        } catch (error) {
            console.error('Failed to delete role', error);
            toast.error(t('error'));
            // Refetch on error to restore correct state
            fetchRoles();
        } finally {
            setConfirmOpen(false);
            setDeleteId(null);
        }
    };

    const filteredRoles = roles.filter(role =>
        role.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className={isRTL ? 'text-right' : 'text-left'}>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        {t('roles')}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        {t('manageRolesDesc', { defaultValue: 'Manage user roles and permissions' })}
                    </p>
                </div>
                <Link
                    to="/roles/new"
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 font-medium"
                >
                    <Plus size={20} />
                    <span>{t('addRole', { defaultValue: 'Add Role' })}</span>
                </Link>
            </div>

            {/* Search Bar */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4">
                <div className="relative">
                    <Search className={clsx("absolute top-1/2 -translate-y-1/2 text-slate-400", isRTL ? "right-3" : "left-3")} size={20} />
                    <input
                        type="text"
                        placeholder={t('searchPlaceholder', { defaultValue: 'Search...' })}
                        className={clsx(
                            "w-full py-2.5 bg-slate-50 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-900 border focus:border-indigo-500 rounded-xl transition-all duration-200 outline-none",
                            isRTL ? "pr-10 pl-4 text-right" : "pl-10 pr-4"
                        )}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Roles Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className={clsx("w-full border-collapse", isRTL ? "text-right" : "text-left")}>
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                <th className="px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('roleName', { defaultValue: 'Role Name' })}</th>
                                <th className="px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('description', { defaultValue: 'Description' })}</th>
                                <th className="px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('permissionsTitle', { defaultValue: 'Permissions' })}</th>
                                <th className="px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('status')}</th>
                                <th className={clsx("px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider", isRTL ? "text-left" : "text-right")}>{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-48"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16"></div></td>
                                        <td className="px-6 py-4"></td>
                                    </tr>
                                ))
                            ) : filteredRoles.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-400">
                                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-full mb-4">
                                                <Shield size={48} strokeWidth={1} className="text-slate-300 dark:text-slate-600" />
                                            </div>
                                            <p className="text-lg font-medium text-slate-600 dark:text-slate-300">{t('noDataFound')}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredRoles.map((role) => (
                                    <tr key={role.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-200">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-800 dark:text-white">
                                                {role.name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-sm">
                                            {role.description || '—'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                                                {role.permissions.length} {t('permissionsCount', { defaultValue: 'Permissions' })}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${role.isActive
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'
                                                : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                                                }`}>
                                                <span className={clsx("w-1.5 h-1.5 rounded-full", isRTL ? "ml-1.5" : "mr-1.5", role.isActive ? 'bg-emerald-500' : 'bg-slate-400')} />
                                                {role.isActive ? t('active') : t('inactive', { defaultValue: 'Inactive' })}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={clsx("flex items-center gap-2 transition-opacity duration-200", isRTL ? "justify-start" : "justify-end")}>
                                                <button
                                                    onClick={() => navigate(`/roles/edit/${role.id}`)}
                                                    className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all"
                                                    title={t('edit')}
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                {!role.isSystem && (
                                                    <button
                                                        onClick={() => handleDelete(role.id)}
                                                        className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-all"
                                                        title={t('delete')}
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ConfirmModal
                isOpen={confirmOpen}
                title={t('deleteRole', { defaultValue: 'Delete Role' })}
                message={t('deleteRoleConfirmation', { defaultValue: 'Are you sure you want to delete this role?' })}
                onConfirm={confirmDelete}
                onCancel={() => setConfirmOpen(false)}
            />
        </div>
    );
};

export default RolesList;
