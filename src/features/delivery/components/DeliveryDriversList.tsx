import { Plus, Search, Truck, Clock, CheckCircle, XCircle, User, Trash2, Edit } from 'lucide-react';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getStoreDrivers, updateDriverStatus, removeDriver } from '../api/delivery-drivers.api';
import { Pagination } from '../../../components/common/Pagination';
import clsx from 'clsx';

const DeliveryDriversList = () => {
    const { t } = useTranslation('common');
    const navigate = useNavigate();
    const [drivers, setDrivers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState({
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0
    });

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(1); // Reset to first page on search
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const fetchDrivers = async () => {
        setLoading(true);
        try {
            const response = await getStoreDrivers({
                search: debouncedSearch,
                page,
                limit: meta.limit
            });
            if (response) {
                // More robust check: handle {data, meta} or just flat array
                const driversList = response.data && Array.isArray(response.data)
                    ? response.data
                    : (Array.isArray(response) ? response : []);

                setDrivers(driversList);
                setMeta(response.meta || { total: driversList.length, page: 1, limit: 10, totalPages: 1 });
            } else {
                setDrivers([]);
            }
        } catch (error) {
            console.error('Error fetching drivers:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDrivers();
    }, [debouncedSearch, page]);

    const handleStatusToggle = async (driverId: string, currentStatus: string) => {
        if (currentStatus !== 'ACCEPTED' && currentStatus !== 'PENDING') return;

        const newStatus = currentStatus === 'ACCEPTED' ? 'PENDING' : 'ACCEPTED';
        try {
            await updateDriverStatus(driverId, newStatus);
            // Refresh list
            fetchDrivers();
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    const handleRemoveDriver = async (driverId: string) => {
        if (!window.confirm(t('delivery.drivers.delete_confirm', 'Are you sure you want to remove this driver?'))) {
            return;
        }

        try {
            await removeDriver(driverId);
            fetchDrivers();
        } catch (error) {
            console.error('Failed to remove driver:', error);
        }
    };


    const [deleteModal, setDeleteModal] = useState({
        isOpen: false,
        driverId: null as string | null
    });

    // ... (keep fetchDrivers and handleStatusToggle)

    const handleDeleteClick = (driverId: string) => {
        setDeleteModal({ isOpen: true, driverId });
    };

    const confirmDelete = async () => {
        if (!deleteModal.driverId) return;

        try {
            await removeDriver(deleteModal.driverId);
            fetchDrivers();
        } catch (error) {
            console.error('Failed to remove driver:', error);
        } finally {
            setDeleteModal({ isOpen: false, driverId: null });
        }
    };

    const getStatusBadge = (status: string, driverId?: string) => {
        // ... (keep existing implementation)
        const baseClass = "inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold cursor-pointer select-none";

        // Only allow toggling for ACCEPTED/PENDING
        const canToggle = status === 'ACCEPTED' || status === 'PENDING';
        const toggleProps = canToggle && driverId ? { onClick: () => handleStatusToggle(driverId, status) } : {};

        switch (status) {
            case 'VERIFIED':
                return <span className={`${baseClass} bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300`}><CheckCircle size={12} /> {t('confirmed')}</span>;
            case 'ACCEPTED':
                return <span {...toggleProps} className={`${baseClass} bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors`}><CheckCircle size={12} /> {t('accepted', 'Accepted')}</span>;
            case 'PENDING':
                return <span {...toggleProps} className={`${baseClass} bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors`}><Clock size={12} /> {t('pending')}</span>;
            case 'REJECTED':
                return <span className={`${baseClass} bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300`}><XCircle size={12} /> {t('cancelled')}</span>;
            case 'UNVERIFIED':
                return <span className={`${baseClass} bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400`}><User size={12} /> {t('unverified', 'Unverified')}</span>;
            default:
                return <span className={`${baseClass} bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400`}><User size={12} /> {status}</span>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* ... (keep header) */}
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                        <Truck size={24} className="text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('delivery.drivers.list_title')}</h2>
                        <p className="text-sm text-slate-500">{t('delivery.drivers.manage_desc')}</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    <div className="relative group flex-1 md:flex-initial">
                        <Search size={18} className="absolute top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors start-4" />
                        <input
                            type="text"
                            placeholder={t('delivery.drivers.search_placeholder')}
                            className="py-2.5 w-full md:w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm ps-11 pe-4"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => navigate('/delivery-drivers/new')}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors shadow-sm flex items-center gap-2 justify-center"
                    >
                        <Plus size={18} />
                        {t('delivery.drivers.add_new')}
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        {/* ... (keep table header) */}
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                                <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">{t('fields.name')}</th>
                                <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">{t('fields.contact')}</th>
                                <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">{t('fields.status')}</th>
                                <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">{t('fields.availability')}</th>
                                <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">{t('fields.joined_at')}</th>
                                <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 text-right">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-8 h-8 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
                                            <span className="text-slate-400 text-sm">{t('loading')}...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : drivers.length > 0 ? (
                                drivers.map((driver) => (
                                    <tr key={driver.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        {/* ... (keep existing columns) */}
                                        <td className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/50">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-slate-900 dark:text-white uppercase">{driver.name}</span>
                                                <span className="text-xs text-slate-500 lowercase">@{driver.username}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/50">
                                            <div className="flex flex-col text-sm">
                                                <span>{driver.email}</span>
                                                <span className="text-slate-500">{driver.phone}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/50">
                                            {getStatusBadge(driver.deliveryProfile?.verificationStatus || driver.storeDriverStatus, driver.id)}
                                        </td>
                                        <td className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/50 text-sm lowercase">
                                            <span className={clsx(
                                                "inline-flex items-center gap-1.5 text-xs font-bold",
                                                driver.deliveryProfile?.isAvailableForWork ? "text-emerald-600" : "text-slate-400"
                                            )}>
                                                <span className={clsx(
                                                    "w-2 h-2 rounded-full",
                                                    driver.deliveryProfile?.isAvailableForWork ? "bg-emerald-500" : "bg-slate-300"
                                                )} />
                                                {driver.deliveryProfile?.isAvailableForWork ? t('delivery.status.online') : t('delivery.status.offline')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/50 text-sm text-slate-500">
                                            {driver.joinedAt ? new Date(driver.joinedAt).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/50 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => navigate(`/delivery-drivers/edit/${driver.id}`)}
                                                    className="p-2 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                                                    title={t('actions.edit', 'Edit')}
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(driver.id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 rounded transition-colors"
                                                    title={t('actions.remove', 'Remove')}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">
                                        {t('common.no_results')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {meta.totalPages > 1 && (
                <div className="mt-6 flex justify-center">
                    <Pagination
                        currentPage={page}
                        totalPages={meta.totalPages}
                        onPageChange={setPage}
                    />
                </div>
            )}

            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onCancel={() => setDeleteModal({ isOpen: false, driverId: null })}
                onConfirm={confirmDelete}
                title={t('delivery.drivers.remove_title', 'Remove Driver')}
                message={t('delivery.drivers.remove_confirm_message', 'Are you sure you want to remove this driver from your store? This action cannot be undone.')}
            />
        </div>
    );
};

export default DeliveryDriversList;
