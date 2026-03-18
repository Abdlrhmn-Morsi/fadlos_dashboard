import React, { useState, useEffect } from 'react';
import { toast } from '../../../utils/toast';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, User, Key, Mail, Phone, Shield, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useCache } from '../../../contexts/CacheContext';
import clsx from 'clsx';
import { AdminEmployeesApiService } from '../api/admin-employees.api';
import { AdminRolesApiService } from '../../admin-roles/api/admin-roles.api';
import { AdminRole } from '../../admin-roles/models/admin-role.model';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

const AdminEmployeeForm = () => {
    const { t } = useTranslation(['common']);
    const { isRTL } = useLanguage();
    const { invalidateCache } = useCache();
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;

    const [loading, setLoading] = useState(isEditMode);
    const [submitting, setSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [roles, setRoles] = useState<AdminRole[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        username: '', // Wait, does CreateAdminEmployeeDto need username? Actually earlier I added username to the DTO in backend!
        email: '',
        phone: '',
        password: '',
        adminRoleId: '',
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
            const response = await AdminRolesApiService.getAdminRoles();
            let rolesData: AdminRole[] = [];

            if (Array.isArray(response)) {
                rolesData = response;
            } else if (response && Array.isArray((response as any).data)) {
                rolesData = (response as any).data;
            }

            setRoles(rolesData);
        } catch (error) {
            console.error('Failed to fetch admin roles', error);
            toast.error(t('errorFetchingData'));
        }
    };

    const fetchEmployee = async () => {
        try {
            if (!id) return;
            const response = await AdminEmployeesApiService.getAdminEmployee(id);
            const employee = (response as any).data || response;

            setFormData({
                name: employee.profile?.user?.name || '',
                username: employee.profile?.user?.username || '', 
                email: employee.profile?.user?.email || '',
                phone: employee.profile?.user?.phone || '',
                password: '',
                adminRoleId: employee.adminRoleId || '',
                isActive: employee.isActive ?? true,
            });
        } catch (error) {
            console.error('Failed to fetch admin employee', error);
            toast.error(t('errorFetchingData'));
            navigate('/admin-employees');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            if (isEditMode && id) {
                const { password, ...updateData } = formData;
                const dataToSend = password ? formData : updateData;
                await AdminEmployeesApiService.updateAdminEmployee(id, dataToSend);
                toast.success(t('success'));
            } else {
                await AdminEmployeesApiService.createAdminEmployee(formData);
                toast.success(t('success'));
            }

            invalidateCache('admin-employees');
            navigate('/admin-employees');
        } catch (error: any) {
            console.error('Failed to save admin employee', error);
            const errorData = error.response?.data?.message;
            const message = typeof errorData === 'string' ? errorData : Array.isArray(errorData) ? errorData[0] : t('error');
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Link
                        to="/admin-employees"
                        className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                    >
                        <ArrowLeft size={20} className={clsx(isRTL && "rotate-180")} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            {isEditMode ? t('editAdminEmployee') : t('createAdminEmployee')}
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
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6 md:col-span-2">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <User size={20} className="text-indigo-500" />
                        {t('personalInfo')}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                {t('fullName')} <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                placeholder={t('fullNamePlaceholder')}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                {t('username')} <span className="text-rose-500">*</span>
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
                                {t('emailAddress')} <span className="text-rose-500">*</span>
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
                                    placeholder={t('emailPlaceholder')}
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                {t('phoneNumber')}
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
                                    placeholder={t('phonePlaceholder')}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6 md:col-span-2">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Shield size={20} className="text-indigo-500" />
                        {t('accountAccess')}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                {t('adminRole')} <span className="text-rose-500">*</span>
                            </label>
                            <select
                                required
                                value={formData.adminRoleId}
                                onChange={e => setFormData({ ...formData, adminRoleId: e.target.value })}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all appearance-none"
                            >
                                <option value="">{t('selectRolePlaceholder')}</option>
                                {Array.isArray(roles) && roles.map(role => (
                                    <option key={role.id} value={role.id} disabled={!role.isActive}>
                                        {role.name} {!role.isActive && `(${t('inactive')})`}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                {t('password')} {isEditMode ? '' : <span className="text-rose-500">*</span>}
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
                                        isRTL ? "pr-10 pl-10" : "pl-10 pr-10"
                                    )}
                                    placeholder={isEditMode ? t('leaveBlankToKeepCurrent') : t('passwordPlaceholder')}
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

                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div>
                            <span className="block text-sm font-semibold text-slate-900 dark:text-white">{t('allowLogin')}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">{t('allowLoginDesc')}</span>
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

export default AdminEmployeeForm;
