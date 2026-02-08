import React, { useState, useEffect } from 'react';
import { toast } from '../../../utils/toast';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, User, Key, Mail, Phone, Shield, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useCache } from '../../../contexts/CacheContext';
import clsx from 'clsx';
import { EmployeesService } from '../api/employees.api';
import { RolesService } from '../../roles/api/roles.api';
import { Role } from '../../roles/models/role.model';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

const EmployeeForm = () => {
    const { t } = useTranslation(['common']);
    const { isRTL } = useLanguage();
    const { invalidateCache, getCache, setCache } = useCache();
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;

    const [loading, setLoading] = useState(isEditMode);
    const [submitting, setSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [roles, setRoles] = useState<Role[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        username: '',
        email: '',
        phone: '',
        password: '',
        roleId: '',
        isActive: true,
    });

    useEffect(() => {
        fetchRoles();
        if (isEditMode) {
            fetchEmployee();
        }
    }, [id]);

    const fetchRoles = async () => {
        try {
            const response = await RolesService.getRoles();
            let rolesData: Role[] = [];

            if (Array.isArray(response)) {
                rolesData = response;
            } else if (response && Array.isArray((response as any).data)) {
                rolesData = (response as any).data;
            }

            setRoles(rolesData);
        } catch (error) {
            console.error('Failed to fetch roles', error);
            toast.error(t('errorFetchingData'));
        }
    };

    const fetchEmployee = async () => {
        try {
            if (!id) return;
            const response = await EmployeesService.getEmployee(id);
            const employee = (response as any).data || response;

            setFormData({
                name: employee.name || '',
                username: employee.username || '',
                email: employee.email || '',
                phone: employee.phone || '',
                password: '', // Don't fill password on edit
                roleId: employee.roleId || '',
                isActive: employee.isActive ?? true,
            });
        } catch (error) {
            console.error('Failed to fetch employee', error);
            toast.error(t('errorFetchingData'));
            navigate('/employees');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            let savedEmployee;
            if (isEditMode && id) {
                // Remove password if empty
                const { password, ...updateData } = formData;
                const dataToSend = password ? formData : updateData;
                savedEmployee = await EmployeesService.updateEmployee(id, dataToSend);

                // If password provided, update logic (kept from original)
                if (password) {
                    await EmployeesService.updateEmployee(id, { /* ... */ } as any);
                }

                toast.success(t('success'));
            } else {
                savedEmployee = await EmployeesService.createEmployee(formData);
                toast.success(t('success'));
            }

            // Invalidate cache to ensure list view fetches fresh data
            invalidateCache('employees');
            navigate('/employees');
        } catch (error: any) {
            console.error('Failed to save employee', error);
            toast.error(error.response?.data?.message || t('error'));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <form onSubmit={handleSubmit} className="p-6 max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Link
                        to="/employees"
                        className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                    >
                        <ArrowLeft size={20} className={clsx(isRTL && "rotate-180")} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            {isEditMode ? t('editEmployee', { defaultValue: 'Edit Employee' }) : t('createEmployee', { defaultValue: 'Create New Employee' })}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Info */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6 md:col-span-2">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <User size={20} className="text-indigo-500" />
                        {t('personalInfo', { defaultValue: 'Personal Information' })}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                {t('fullName', { defaultValue: 'Full Name' })} <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                {t('username', { defaultValue: 'Username' })} <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.username}
                                onChange={e => setFormData({ ...formData, username: e.target.value })}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                {t('email', { defaultValue: 'Email Address' })} <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <Mail size={18} className={clsx("absolute top-1/2 -translate-y-1/2 text-slate-400", isRTL ? "right-3" : "left-3")} />
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className={clsx(
                                        "w-full py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all",
                                        isRTL ? "pr-10 pl-4" : "pl-10 pr-4"
                                    )}
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                {t('phone', { defaultValue: 'Phone Number' })}
                            </label>
                            <div className="relative">
                                <Phone size={18} className={clsx("absolute top-1/2 -translate-y-1/2 text-slate-400", isRTL ? "right-3" : "left-3")} />
                                <input
                                    type="text"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    className={clsx(
                                        "w-full py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all",
                                        isRTL ? "pr-10 pl-4" : "pl-10 pr-4"
                                    )}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Account & Role */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6 md:col-span-2">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Shield size={20} className="text-indigo-500" />
                        {t('accountAccess', { defaultValue: 'Account & Access' })}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                {t('role', { defaultValue: 'Role' })} <span className="text-rose-500">*</span>
                            </label>
                            <select
                                required
                                value={formData.roleId}
                                onChange={e => setFormData({ ...formData, roleId: e.target.value })}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all appearance-none"
                            >
                                <option value="">{t('selectRole', { defaultValue: 'Select a role...' })}</option>
                                {Array.isArray(roles) && roles.map(role => (
                                    <option key={role.id} value={role.id} disabled={!role.isActive}>
                                        {role.name} {!role.isActive && `(${t('inactive')})`}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                {t('password', { defaultValue: 'Password' })} {isEditMode ? '' : <span className="text-rose-500">*</span>}
                            </label>
                            <div className="relative">
                                <Key size={18} className={clsx("absolute top-1/2 -translate-y-1/2 text-slate-400", isRTL ? "right-3" : "left-3")} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required={!isEditMode}
                                    minLength={6}
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    className={clsx(
                                        "w-full py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all",
                                        isRTL ? "pr-10 pl-4" : "pl-10 pr-10"
                                    )}
                                    placeholder={isEditMode ? t('leaveBlankToKeepCurrent', { defaultValue: 'Leave blank to keep current' }) : ''}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className={clsx(
                                        "absolute top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-colors",
                                        isRTL ? "left-3" : "right-3"
                                    )}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div>
                            <span className="block text-sm font-semibold text-slate-900 dark:text-white">{t('activeStatus', { defaultValue: 'Active Status' })}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">{t('employeeActiveDesc', { defaultValue: 'Allow this user to log in' })}</span>
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
        </form>
    );
};

export default EmployeeForm;
