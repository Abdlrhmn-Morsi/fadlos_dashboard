import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Users, Power, PowerOff } from 'lucide-react';
import clsx from 'clsx';
import { Link, useNavigate } from 'react-router-dom';
import { EmployeesService } from '../api/employees.api';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { toast } from '../../../utils/toast';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useCache } from '../../../contexts/CacheContext';
import { Employee } from '../models/employee.model';

const EmployeesList = () => {
    const navigate = useNavigate();
    const { t } = useTranslation(['common']);
    const { isRTL } = useLanguage();
    const { getCache, setCache, invalidateCache } = useCache();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [actionType, setActionType] = useState<'delete' | 'toggle'>('delete');
    const [actionId, setActionId] = useState<string | null>(null);
    const [isActiveStatus, setIsActiveStatus] = useState(false);

    useEffect(() => {
        fetchEmployees();
    }, []);

    // Refetch data when component becomes visible (e.g., navigating back from form)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                fetchEmployees();
            }
        };

        const handleFocus = () => {
            fetchEmployees();
        };

        // Listen for visibility changes and window focus
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
        };
    }, []);

    const fetchEmployees = async () => {
        try {
            setLoading(true);

            // Check cache first
            const cacheKey = 'employees';
            const cachedData = getCache<any>(cacheKey);
            if (cachedData) {
                let employeesData: Employee[] = [];
                const rawData = cachedData.data || cachedData;

                if (Array.isArray(rawData)) {
                    employeesData = rawData;
                } else if (rawData && Array.isArray(rawData.data)) {
                    employeesData = rawData.data;
                }

                setEmployees(employeesData);
                setLoading(false);
                return;
            }

            const response = await EmployeesService.getEmployees();
            let employeesData: Employee[] = [];

            // Extract the actual array from the potentially nested response
            // Backend returns: { success: true, data: { data: [], pagination: {} } }
            const rawData = (response as any).data || response;

            if (Array.isArray(rawData)) {
                employeesData = rawData;
            } else if (rawData && Array.isArray((rawData as any).data)) {
                employeesData = (rawData as any).data;
            } else if (response && Array.isArray((response as any).data)) {
                // Fallback for different nesting
                employeesData = (response as any).data;
            }

            setEmployees(employeesData);
            // Cache the response
            setCache(cacheKey, response);
        } catch (error) {
            console.error('Failed to fetch employees', error);
            toast.error(t('errorFetchingData'));
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id: string) => {
        setDeleteId(id);
        setActionType('delete');
        setConfirmOpen(true);
    };

    const handleToggleStatus = (id: string, currentStatus: boolean) => {
        setActionId(id);
        setIsActiveStatus(currentStatus);
        setActionType('toggle');
        setConfirmOpen(true);
    };

    const confirmAction = async () => {
        try {
            if (actionType === 'delete' && deleteId) {
                await EmployeesService.deleteEmployee(deleteId);
                toast.success(t('success'));

                // Immediately remove from local state for better UX
                setEmployees(prevEmployees => prevEmployees.filter(emp => emp.id !== deleteId));

                // Invalidate cache after delete
                invalidateCache('employees');
            } else if (actionType === 'toggle' && actionId) {
                await EmployeesService.toggleStatus(actionId, !isActiveStatus);
                toast.success(t('success'));

                // Optimistic update
                setEmployees(prev => prev.map(emp =>
                    emp.id === actionId ? { ...emp, isActive: !isActiveStatus } : emp
                ));

                // Invalidate cache
                invalidateCache('employees');
            }
        } catch (error) {
            console.error('Failed to perform action', error);
            toast.error(t('error'));
            // Refetch on error to restore correct state
            fetchEmployees();
        } finally {
            setConfirmOpen(false);
            setDeleteId(null);
            setActionId(null);
        }
    };

    const filteredEmployees = employees.filter(emp =>
        (emp.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className={isRTL ? 'text-right' : 'text-left'}>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        {t('employees')}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        {t('manageEmployeesDesc', { defaultValue: 'Manage store staff and their access' })}
                    </p>
                </div>
                <Link
                    to="/employees/new"
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 font-medium"
                >
                    <Plus size={20} />
                    <span>{t('addEmployee', { defaultValue: 'Add Employee' })}</span>
                </Link>
            </div>

            {/* Search Bar */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4">
                <div className="relative">
                    <Search className={clsx("absolute top-1/2 -translate-y-1/2 text-slate-400", isRTL ? "right-3" : "left-3")} size={20} />
                    <input
                        type="text"
                        placeholder={t('searchEmployeePlaceholder', { defaultValue: 'Search by name or email...' })}
                        className={clsx(
                            "w-full py-2.5 bg-slate-50 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-900 border focus:border-indigo-500 rounded-xl transition-all duration-200 outline-none",
                            isRTL ? "pr-10 pl-4 text-right" : "pl-10 pr-4"
                        )}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Employees Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className={clsx("w-full border-collapse", isRTL ? "text-right" : "text-left")}>
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                <th className="px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('employee', { defaultValue: 'Employee' })}</th>
                                <th className="px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('role', { defaultValue: 'Role' })}</th>
                                <th className="px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('contact', { defaultValue: 'Contact' })}</th>
                                <th className="px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('status')}</th>
                                <th className={clsx("px-6 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider", isRTL ? "text-left" : "text-right")}>{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-48"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-40"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16"></div></td>
                                        <td className="px-6 py-4"></td>
                                    </tr>
                                ))
                            ) : filteredEmployees.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-400">
                                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-full mb-4">
                                                <Users size={48} strokeWidth={1} className="text-slate-300 dark:text-slate-600" />
                                            </div>
                                            <p className="text-lg font-medium text-slate-600 dark:text-slate-300">{t('noDataFound')}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredEmployees.map((emp) => (
                                    <tr key={emp.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-200">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                                                    {(emp.name || '').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-slate-800 dark:text-white">
                                                        {emp.name}
                                                    </div>
                                                    <div className="text-xs text-slate-500">
                                                        {emp.username}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400">
                                                {emp.employeeRole?.name || t(emp.role)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-sm">
                                            <div className="flex flex-col gap-1">
                                                <span>{emp.email}</span>
                                                {emp.phone && <span className="text-xs text-slate-400">{emp.phone}</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${emp.isActive
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'
                                                : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800'
                                                }`}>
                                                <span className={clsx("w-1.5 h-1.5 rounded-full", isRTL ? "ml-1.5" : "mr-1.5", emp.isActive ? 'bg-emerald-500' : 'bg-rose-500')} />
                                                {emp.isActive ? t('active') : t('inactive', { defaultValue: 'Inactive' })}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={clsx("flex items-center gap-2 transition-opacity duration-200", isRTL ? "justify-start" : "justify-end")}>
                                                <button
                                                    onClick={() => navigate(`/employees/edit/${emp.id}`)}
                                                    className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all"
                                                    title={t('edit')}
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleToggleStatus(emp.id, emp.isActive)}
                                                    className={clsx(
                                                        "p-2 rounded-lg transition-all",
                                                        emp.isActive
                                                            ? "text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30"
                                                            : "text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                                                    )}
                                                    title={emp.isActive ? t('deactivate') : t('activate')}
                                                >
                                                    {emp.isActive ? <PowerOff size={18} /> : <Power size={18} />}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(emp.id)}
                                                    className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-all"
                                                    title={t('delete')}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
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
                title={actionType === 'delete' ? t('deleteEmployee', { defaultValue: 'Delete Employee' }) : (isActiveStatus ? t('deactivateEmployee', { defaultValue: 'Deactivate Employee' }) : t('activateEmployee', { defaultValue: 'Activate Employee' }))}
                message={actionType === 'delete' ? t('deleteEmployeeConfirmation', { defaultValue: 'Are you sure you want to delete this employee?' }) : t('toggleEmployeeStatusConfirmation', { defaultValue: 'Are you sure you want to change this employee status?' })}
                onConfirm={confirmAction}
                onCancel={() => setConfirmOpen(false)}
            />
        </div>
    );
};

export default EmployeesList;
