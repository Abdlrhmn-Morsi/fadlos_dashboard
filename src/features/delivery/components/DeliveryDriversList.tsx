import { Plus, Search, Truck, Clock, CheckCircle, XCircle, User, Trash2, Edit, Bike, Footprints, Package, ShieldCheck, Mail, Phone, X, Eye } from 'lucide-react';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getStoreDrivers, updateDriverStatus, removeDriver, toggleStoreDriverStatus } from '../api/delivery-drivers.api';
import { Pagination } from '../../../components/common/Pagination';
import { toast } from '../../../utils/toast';
import clsx from 'clsx';
import { useCache } from '../../../contexts/CacheContext';
import { useAuth } from '../../../contexts/AuthContext';
import { UserRole } from '../../../types/user-role';
import { Permissions } from '../../../types/permissions';

const DeliveryDriversList = () => {
    const { getCache, setCache, updateCacheItem, invalidateCache } = useCache();
    const { user, hasPermission } = useAuth();
    const isSystemAdmin = user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ADMIN;
    const CACHE_KEY = 'delivery_drivers';

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
        totalPages: 0,
        maxOrdersPerDriver: 5
    });


    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const fetchDrivers = async () => {
        const params = {
            search: debouncedSearch,
            page,
            limit: meta.limit
        };

        // Check cache first
        const cachedResponse = getCache(CACHE_KEY, params);
        if (cachedResponse) {
            setDrivers(cachedResponse.data);
            setMeta(cachedResponse.meta);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const response = await getStoreDrivers(params);
            if (response) {
                const driversList = response.data && Array.isArray(response.data)
                    ? response.data
                    : (Array.isArray(response) ? response : []);

                const formattedMeta = response.meta || { total: driversList.length, page: 1, limit: 10, totalPages: 1 };

                setDrivers(driversList);
                setMeta(formattedMeta);

                // Set cache
                setCache(CACHE_KEY, { data: driversList, meta: formattedMeta }, params);
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
        if (currentStatus !== 'VERIFIED' && currentStatus !== 'UNDER_REVIEW') return;

        const newStatus = currentStatus === 'VERIFIED' ? 'UNDER_REVIEW' : 'VERIFIED';
        const updater = (d: any) => ({ ...d, deliveryProfile: { ...d.deliveryProfile, verificationStatus: newStatus } });

        try {
            // Optimistic update local state
            setDrivers(prevDrivers => prevDrivers.map(d =>
                d.id === driverId ? updater(d) : d
            ));

            // Update cache
            updateCacheItem(CACHE_KEY, driverId, updater);

            const response = await updateDriverStatus(driverId, newStatus);

            // If response contains the updated status, sync it just in case
            if (response && response.status) {
                const finalUpdater = (d: any) => ({ ...d, deliveryProfile: { ...d.deliveryProfile, verificationStatus: response.status } });
                setDrivers(prevDrivers => prevDrivers.map(d =>
                    d.id === driverId ? finalUpdater(d) : d
                ));
                updateCacheItem(CACHE_KEY, driverId, finalUpdater);
            }

            toast.success(t('delivery.drivers.status_updated', 'Driver status updated successfully'));
        } catch (error) {
            console.error('Failed to update status:', error);
            const revertUpdater = (d: any) => ({ ...d, deliveryProfile: { ...d.deliveryProfile, verificationStatus: currentStatus } });

            // Revert local state
            setDrivers(prevDrivers => prevDrivers.map(d =>
                d.id === driverId ? revertUpdater(d) : d
            ));

            // Revert cache
            updateCacheItem(CACHE_KEY, driverId, revertUpdater);

            toast.error(t('common.error', 'Failed to update status'));
        }
    };

    const handleActiveToggle = async (driverId: string) => {
        const updater = (d: any) => ({ ...d, storeDriverIsActive: !d.storeDriverIsActive });

        try {
            // Optimistic update local state
            setDrivers(prevDrivers => prevDrivers.map(d =>
                d.id === driverId ? updater(d) : d
            ));

            // Update cache
            updateCacheItem(CACHE_KEY, driverId, updater);

            const response: any = await toggleStoreDriverStatus(driverId);

            // If response contains updated driver data, use it.
            // The backend returns the updated `StoreDeliveryDriver` entity.
            // But our local state is a mix of User properties and storeDriverIsActive.
            // Let's assume the API returns the saved entity which has `isActive`.

            // If the API call fails, we should revert.
            // However, the prompt says "get the data from the response and update the ui".

            // Re-read backend:
            // storeDriver.isActive = !storeDriver.isActive;
            // return this.storeDeliveryDriverRepository.save(storeDriver);

            // So response is the StoreDeliveryDriver object: { id, isActive: boolean, ... }

            if (response && typeof response.isActive !== 'undefined') {
                const finalUpdater = (d: any) => ({ ...d, storeDriverIsActive: response.isActive });
                setDrivers(prevDrivers => prevDrivers.map(d =>
                    d.id === driverId ? finalUpdater(d) : d
                ));
                updateCacheItem(CACHE_KEY, driverId, finalUpdater);
            }

            toast.success(t('delivery.drivers.status_updated', 'Driver status updated successfully'));
        } catch (error) {
            console.error('Failed to toggle driver status:', error);
            // Revert local state
            setDrivers(prevDrivers => prevDrivers.map(d =>
                d.id === driverId ? updater(d) : d // toggle back
            ));
            // Revert cache
            updateCacheItem(CACHE_KEY, driverId, updater);

            toast.error(t('common.error', 'Failed to update driver status'));
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

    const handleDeleteClick = (driverId: string) => {
        setDeleteModal({ isOpen: true, driverId });
    };

    const confirmDelete = async () => {
        if (!deleteModal.driverId) return;

        try {
            await removeDriver(deleteModal.driverId);

            // Invalidate the cache entirely for this key because removal affects multiple pages/counts
            // and CacheContext doesn't have a simple "removeItem" with pattern matching yet (only update).
            // Actually, I can use invalidateCache.
            invalidateCache(CACHE_KEY);

            setDrivers(prevDrivers => prevDrivers.filter(d => d.id !== deleteModal.driverId));
            setMeta(prev => ({
                ...prev,
                total: prev.total - 1,
                totalPages: Math.ceil((prev.total - 1) / prev.limit)
            }));
            toast.success(t('delivery.drivers.remove_success', 'Driver removed successfully'));
        } catch (error) {
            console.error('Failed to remove driver:', error);
            toast.error(t('common.error', 'Failed to remove driver'));
        } finally {
            setDeleteModal({ isOpen: false, driverId: null });
        }
    };

    const getStatusBadge = (status: string, driverId?: string) => {
        const baseClass = "inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold cursor-pointer select-none";

        const canToggle = isSystemAdmin && (status === 'VERIFIED' || status === 'UNDER_REVIEW');
        const toggleProps = canToggle && driverId ? { onClick: () => handleStatusToggle(driverId, status) } : {};

        switch (status) {
            case 'VERIFIED':
                return <span {...toggleProps} className={`${baseClass} bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors`}><CheckCircle size={12} /> {t('verificationStatuses.VERIFIED', 'Verified')}</span>;
            case 'ACTIVE':
                return <span className={`${baseClass} bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300`}><CheckCircle size={12} /> {t('verificationStatuses.ACTIVE', 'Active')}</span>;
            case 'UNDER_REVIEW':
                return <span {...toggleProps} className={`${baseClass} bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors`}><Clock size={12} /> {t('verificationStatuses.UNDER_REVIEW', 'Under Review')}</span>;
            case 'PENDING':
                return <span className={`${baseClass} bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300`}><Clock size={12} /> {t('verificationStatuses.PENDING', 'Pending')}</span>;
            case 'REJECTED':
                return <span className={`${baseClass} bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300`}><XCircle size={12} /> {t('verificationStatuses.REJECTED', 'Rejected')}</span>;
            case 'UNVERIFIED':
                return <span className={`${baseClass} bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400`}><User size={12} /> {t('verificationStatuses.UNVERIFIED', 'Unverified')}</span>;
            default:
                return <span className={`${baseClass} bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400`}><User size={12} /> {t(`verificationStatuses.${status}`, status)}</span>;
        }
    };

    const getVehicleBadge = (type: string) => {
        const baseClass = "inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold select-none bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";

        switch (type) {
            case 'walking':
                return <span className={baseClass}><Footprints size={12} /> {t('vehicle_types.walking', 'Walking')}</span>;
            case 'bicycle':
                return <span className={baseClass}><Bike size={12} /> {t('vehicle_types.bicycle', 'Bicycle')}</span>;
            case 'tricycle':
                return <span className={baseClass}><Truck size={12} /> {t('vehicle_types.tricycle', 'Tricycle')}</span>;
            case 'motorcycle':
                return <span className={baseClass}><Bike size={12} /> {t('vehicle_types.motorcycle', 'Motorcycle')}</span>;
            default:
                return <span className={baseClass}>{type}</span>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
                    {hasPermission(Permissions.DELIVERY_DRIVERS_CREATE) && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate('/delivery-drivers/new');
                            }}
                            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors shadow-sm flex items-center gap-2 justify-center"
                        >
                            <Plus size={18} />
                            {t('delivery.drivers.add_new')}
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                                <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">{t('fields.name')}</th>
                                <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">{t('fields.type')}</th>
                                <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">{t('fields.availability', 'Availability')}</th>
                                <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">{t('fields.contact')}</th>
                                <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">{t('fields.status')}</th>
                                <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 text-center">{t('fields.active_orders', 'Active')}</th>
                                <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 text-center">{t('fields.total_orders', 'Total')}</th>
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
                                    <tr
                                        key={driver.id}
                                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                                        onClick={() => navigate(`/delivery-drivers/${driver.id}`)}
                                    >
                                        {/* ... (keep existing columns) */}
                                        <td className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/50">
                                            <div className="flex items-center gap-3">
                                                <div className="relative flex-shrink-0">
                                                    <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                                                        {driver.deliveryProfile?.avatarUrl ? (
                                                            <img src={driver.deliveryProfile.avatarUrl} alt={driver.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                                <User size={20} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    {/* Status Dot */}
                                                    <div className={clsx(
                                                        "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 shadow-sm",
                                                        !driver.deliveryProfile?.isAvailableForWork ? "bg-slate-400" :
                                                            driver.deliveryProfile?.isBusy ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
                                                    )} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-slate-900 dark:text-white uppercase tracking-tight leading-tight">{driver.name}</span>
                                                    </div>
                                                    <span className="text-[10px] text-slate-500 lowercase font-medium">@{driver.username}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/50">
                                            <span className={clsx(
                                                "px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest border",
                                                driver.deliveryProfile?.driverType === 'FREELANCER'
                                                    ? "bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800"
                                                    : "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                                            )}>
                                                {t(`driverTypes.${driver.deliveryProfile?.driverType || 'STORE_DRIVER'}`, driver.deliveryProfile?.driverType || 'Store Driver') as string}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/50">
                                            <div className="flex flex-col gap-1.5">
                                                {/* Online/Offline Status */}
                                                <span className={clsx(
                                                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[8px] font-black uppercase tracking-widest border",
                                                    driver.deliveryProfile?.isAvailableForWork
                                                        ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800"
                                                        : "bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                                                )}>
                                                    <span className={clsx("w-1.5 h-1.5 rounded-full", driver.deliveryProfile?.isAvailableForWork ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-slate-400")} />
                                                    {driver.deliveryProfile?.isAvailableForWork ? t('delivery.status.online', 'Online') : t('delivery.status.offline', 'Offline')}
                                                </span>

                                                {/* Busy Status */}
                                                {driver.deliveryProfile?.isBusy && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[8px] font-black uppercase tracking-widest bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800 animate-pulse">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                                                        {t('delivery.status.busy', 'Busy')}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/50">
                                            <div className="flex flex-col text-sm">
                                                <span>{driver.email}</span>
                                                <span className="text-slate-500">{driver.phone}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/50">
                                            <div className="flex flex-col gap-1.5 items-start">
                                                {getStatusBadge(driver.deliveryProfile?.verificationStatus || driver.storeDriverStatus, driver.id)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/50 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <span className={clsx(
                                                    "inline-flex items-center justify-center w-max px-2.5 py-1 rounded-full font-bold text-[10px] border",
                                                    (driver.activeDeliveriesCount || 0) >= (meta?.maxOrdersPerDriver || 5)
                                                        ? "bg-amber-50 text-amber-600 border-amber-200 animate-pulse"
                                                        : "bg-emerald-50 text-emerald-600 border-emerald-200"
                                                )}>
                                                    {driver.activeDeliveriesCount || 0} / {meta?.maxOrdersPerDriver || 5}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/50 text-center">
                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-xs border border-slate-200 dark:border-slate-700">
                                                {driver.totalOrdersCount || 0}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/50 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/delivery-drivers/${driver.id}`);
                                                    }}
                                                    className="p-2 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                                                    title={t('actions.view', 'View')}
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                {hasPermission(Permissions.DELIVERY_DRIVERS_UPDATE) && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/delivery-drivers/edit/${driver.id}`);
                                                        }}
                                                        className="p-2 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                                                        title={t('actions.edit', 'Edit')}
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                )}
                                                {hasPermission(Permissions.DELIVERY_DRIVERS_DELETE) && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteClick(driver.id);
                                                        }}
                                                        className="p-2 text-slate-400 hover:text-red-600 rounded transition-colors"
                                                        title={t('actions.remove', 'Remove')}
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-sm">
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
