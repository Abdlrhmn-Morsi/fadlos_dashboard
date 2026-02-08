import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { toast } from '../../../utils/toast';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Shield, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useCache } from '../../../contexts/CacheContext';
import { RolesService } from '../api/roles.api';
import { PermissionGroup } from '../../../types/permission';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

const RoleForm = () => {
    const { t } = useTranslation(['common']);
    const { isRTL } = useLanguage();
    const { invalidateCache } = useCache();
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;

    const [loading, setLoading] = useState(isEditMode);
    const [submitting, setSubmitting] = useState(false);
    const [permissionsData, setPermissionsData] = useState<{ categories: string[]; permissions: PermissionGroup[] } | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        permissions: [] as string[],
        isActive: true,
    });

    useEffect(() => {
        fetchPermissions();
        if (isEditMode) {
            fetchRole();
        }
    }, [id]);

    const fetchPermissions = async () => {
        try {
            const response = await RolesService.getPermissions();
            // Handle both { permissions, permissionGroups, ... } and nested { data: { ... } }
            const raw = (response as any).data || response;

            let structured: PermissionGroup[] = [];

            if (raw.permissionGroups && Array.isArray(raw.permissionGroups)) {
                structured = raw.permissionGroups;
            } else if (raw.permissions && Array.isArray(raw.permissions)) {
                // If backend only gives flat list, group it
                const groups: Record<string, any[]> = {};
                raw.permissions.forEach((p: any) => {
                    const cat = p.category || 'Other';
                    if (!groups[cat]) groups[cat] = [];
                    groups[cat].push({
                        key: p.key,
                        name: p.name || p.key,
                        description: p.description
                    });
                });
                const defaultIncluded = ['products.view', 'categories.view'];
                structured = Object.entries(groups).map(([category, permissions]) => ({
                    category,
                    permissions: permissions.filter((p: any) => !defaultIncluded.includes(p.key)) as any
                })).filter(group => group.permissions.length > 0);
            }

            if (structured.length > 0) {
                setPermissionsData({
                    categories: structured.map(s => s.category),
                    permissions: structured
                });
            }
        } catch (error) {
            console.error('Failed to fetch permissions', error);
            toast.error(t('errorFetchingData'));
        }
    };

    const fetchRole = async () => {
        try {
            if (!id) return;
            const response = await RolesService.getRole(id);
            // Handle { ...role } and { data: { ...role } }
            const role = (response as any).data && (response as any).name === undefined
                ? (response as any).data
                : response;

            setFormData({
                name: role.name || '',
                description: role.description || '',
                permissions: role.permissions || [],
                isActive: role.isActive ?? true,
            });
        } catch (error) {
            console.error('Failed to fetch role', error);
            toast.error(t('errorFetchingData'));
            navigate('/roles');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            if (isEditMode && id) {
                await RolesService.updateRole(id, formData);
                toast.success(t('success'));
            } else {
                await RolesService.createRole(formData);
                toast.success(t('success'));
            }

            // Invalidate roles cache to refresh the list
            invalidateCache('roles');

            navigate('/roles');
        } catch (error: any) {
            console.error('Failed to save role', error);
            toast.error(error.response?.data?.message || t('error'));
        } finally {
            setSubmitting(false);
        }
    };

    const togglePermission = (key: string) => {
        setFormData(prev => {
            const exists = prev.permissions.includes(key);
            if (exists) {
                return { ...prev, permissions: prev.permissions.filter(p => p !== key) };
            } else {
                return { ...prev, permissions: [...prev.permissions, key] };
            }
        });
    };

    const toggleGroup = (keys: string[]) => {
        setFormData(prev => {
            const allSelected = keys.every(key => prev.permissions.includes(key));
            if (allSelected) {
                // Deselect all
                return { ...prev, permissions: prev.permissions.filter(p => !keys.includes(p)) };
            } else {
                // Select all
                const newPermissions = new Set([...prev.permissions, ...keys]);
                return { ...prev, permissions: Array.from(newPermissions) };
            }
        });
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <form onSubmit={handleSubmit} className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Link
                        to="/roles"
                        className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                    >
                        <ArrowLeft size={20} className={clsx(isRTL && "rotate-180")} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            {isEditMode ? t('editRole', { defaultValue: 'Edit Role' }) : t('createRole', { defaultValue: 'Create New Role' })}
                        </h1>
                    </div>
                </div>
                <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 font-medium disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {submitting ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <Save size={20} />
                    )}
                    <span>{t('save')}</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Role Details */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Shield size={20} className="text-indigo-500" />
                            {t('roleDetails', { defaultValue: 'Role Details' })}
                        </h3>

                        {/* Name */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                {t('roleName', { defaultValue: 'Role Name' })} <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                placeholder={t('roleNamePlaceholder', { defaultValue: 'e.g. Sales Manager' })}
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                {t('description', { defaultValue: 'Description' })}
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                rows={4}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none"
                                placeholder={t('roleDescriptionPlaceholder', { defaultValue: 'Describe what this role is for...' })}
                            />
                        </div>

                        {/* Status */}
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                            <div>
                                <span className="block text-sm font-semibold text-slate-900 dark:text-white">{t('activeStatus', { defaultValue: 'Active Status' })}</span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">{t('roleActiveDesc', { defaultValue: 'Enable or disable this role' })}</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={formData.isActive}
                                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-500 dark:peer-checked:bg-emerald-500"></div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Right Column: Permissions */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                {t('permissionsTitle', { defaultValue: 'Permissions' })}
                            </h3>
                            <span className="text-sm text-slate-500 font-medium bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                                {formData.permissions.length} {t('selected', { defaultValue: 'Selected' })}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            {!permissionsData || permissionsData.permissions.length === 0 ? (
                                <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                                    <Shield size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                                    <p className="text-slate-500 dark:text-slate-400 font-medium">
                                        {t('noPermissionsFound', { defaultValue: 'No permissions available to select. Please check system configuration.' })}
                                    </p>
                                </div>
                            ) : (
                                permissionsData.permissions.map((group) => {
                                    const groupKeys = group.permissions?.map(p => p.key) || [];
                                    const isAllSelected = groupKeys.every(k => formData.permissions.includes(k));
                                    const isSomeSelected = groupKeys.some(k => formData.permissions.includes(k));

                                    return (
                                        <div key={group.category} className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                            <div
                                                className="bg-slate-50 dark:bg-slate-800/80 px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                                                onClick={() => toggleGroup(groupKeys)}
                                            >
                                                <div className="flex flex-col">
                                                    <h4 className="font-bold text-slate-900 dark:text-white text-base tracking-tight">
                                                        {t(group.category, { defaultValue: group.category })}
                                                    </h4>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                        {group.permissions?.length || 0} {t('permissionsCount')}
                                                    </p>
                                                </div>
                                                <div className={clsx(
                                                    "w-6 h-6 rounded-lg border flex items-center justify-center transition-all",
                                                    isAllSelected
                                                        ? "bg-indigo-600 border-indigo-600 text-white"
                                                        : isSomeSelected
                                                            ? "bg-indigo-50 border-indigo-600 text-indigo-600 dark:bg-indigo-900/30 dark:border-indigo-400 dark:text-indigo-400"
                                                            : "border-slate-300 dark:border-slate-600"
                                                )}>
                                                    {isAllSelected && <Check size={16} strokeWidth={3} />}
                                                    {isSomeSelected && !isAllSelected && <div className="w-3 h-3 bg-current rounded-sm" />}
                                                </div>
                                            </div>
                                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                                {group.permissions?.map((perm) => {
                                                    const isSelected = formData.permissions.includes(perm.key);
                                                    return (
                                                        <div
                                                            key={perm.key}
                                                            className="flex items-start gap-3 cursor-pointer group"
                                                            onClick={() => togglePermission(perm.key)}
                                                        >
                                                            <div className={clsx(
                                                                "mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0",
                                                                isSelected
                                                                    ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                                                                    : "border-slate-300 dark:border-slate-600 group-hover:border-indigo-400"
                                                            )}>
                                                                {isSelected && <Check size={14} strokeWidth={3} />}
                                                            </div>
                                                            <div className="space-y-0.5">
                                                                <p className={clsx(
                                                                    "text-sm font-semibold transition-colors",
                                                                    isSelected ? "text-indigo-700 dark:text-indigo-400" : "text-slate-800 dark:text-slate-300 group-hover:text-indigo-600"
                                                                )}>
                                                                    {t(`permissions.${perm.key}.name`, { defaultValue: perm.name })}
                                                                </p>
                                                                <p className="text-xs text-slate-500 dark:text-slate-500 leading-tight whitespace-pre-line">
                                                                    {t(`permissions.${perm.key}.description`, { defaultValue: perm.description })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
};

export default RoleForm;
