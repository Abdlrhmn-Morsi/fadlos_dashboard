import React, { useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';
import StoreStatusModal from './StoreStatusModal';
import {
    Store,
    Search,
    MapPin,
    MoreVertical,
    CheckCircle,
    XCircle,
    Clock,
    ShieldAlert
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getStores, getStoreStatsSummary } from '../api/stores.api';
import {
    storesState,
    storesLoadingState,
    storesFiltersState,
    storesPaginationState
} from '../store/stores.store';

const StoresList = () => {
    const { t } = useTranslation(['stores', 'common']);
    const [stores, setStores] = useRecoilState(storesState);
    const [loading, setLoading] = useRecoilState(storesLoadingState);
    const [filters, setFilters] = useRecoilState(storesFiltersState);
    const [pagination, setPagination] = useRecoilState(storesPaginationState);
    const [selectedStore, setSelectedStore] = useState<any>(null);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [statsSummary, setStatsSummary] = useState<any>(null);

    const fetchStatsSummary = async () => {
        try {
            const stats = await getStoreStatsSummary();
            setStatsSummary(stats);
        } catch (error) {
            console.error('Failed to fetch store stats summary:', error);
        }
    };

    const fetchStores = async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                search: filters.search,
                status: filters.status
            };

            const { stores, meta } = await getStores(params);
            setStores(stores);
            setPagination(prev => ({
                ...prev,
                total: meta.total,
                totalPages: meta.totalPages
            }));
        } catch (error) {
            console.error('Failed to fetch stores:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStores();
    }, [pagination.page, filters.status]);

    useEffect(() => {
        fetchStatsSummary();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchStores();
    };

    const getStatusBadge = (status: string) => {
        const baseClass = "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-none text-xs font-semibold";
        const s = status?.toUpperCase();
        switch (s) {
            case 'ACTIVE':
                return <span className={`${baseClass} bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300`}><CheckCircle size={12} /> {t('common:active')}</span>;
            case 'INACTIVE':
                return <span className={`${baseClass} bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400`}><XCircle size={12} /> {t('common:inactive')}</span>;
            case 'PENDING':
                return <span className={`${baseClass} bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300`}><Clock size={12} /> {t('common:pending')}</span>;
            case 'SUSPENDED':
                return <span className={`${baseClass} bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300`}><ShieldAlert size={12} /> {t('common:suspended')}</span>;
            default:
                return <span className={`${baseClass} bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300`}>{status}</span>;
        }
    };

    const handleOpenStatusModal = (store: any) => {
        setSelectedStore(store);
        setIsStatusModalOpen(true);
    };

    return (
        <div className="list-page-container p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary-light rounded-none-[1.25rem] animate-float">
                        <Store size={24} className="text-primary" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{t('title')}</h2>
                </div>

                <div className="flex flex-wrap gap-3">
                    <select
                        className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-none text-sm font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-sm"
                        value={filters.status}
                        onChange={(e) => {
                            setFilters(prev => ({ ...prev, status: e.target.value }));
                            setPagination(prev => ({ ...prev, page: 1 }));
                        }}
                    >
                        <option value="">{t('common:allStatuses', { defaultValue: 'All Statuses' })}</option>
                        <option value="active">{t('common:active')}</option>
                        <option value="pending">{t('common:pending')}</option>
                        <option value="suspended">{t('common:suspended')}</option>
                        <option value="inactive">{t('common:inactive')}</option>
                    </select>

                    <form onSubmit={handleSubmit} className="relative group">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder={t('searchPlaceholder')}
                            className="pl-11 pr-4 py-3 w-full md:w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-none-none focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-sm group-hover:shadow-md text-slate-900 dark:text-slate-100"
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        />
                    </form>
                </div>
            </div>

            {/* Stats Summary Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-none border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-none">
                            <CheckCircle size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{t('activeMerchants', { defaultValue: 'Active Merchants' })}</p>
                            <h4 className="text-xl font-black text-slate-900 dark:text-white leading-none">{statsSummary?.active || 0}</h4>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-none border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-none">
                            <Clock size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{t('common:pending')}</p>
                            <h4 className="text-xl font-black text-slate-900 dark:text-white leading-none">{statsSummary?.pending || 0}</h4>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-none border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-none">
                            <ShieldAlert size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{t('common:suspended')}</p>
                            <h4 className="text-xl font-black text-slate-900 dark:text-white leading-none">{statsSummary?.suspended || 0}</h4>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-none border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-none">
                            <XCircle size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{t('common:inactive')}</p>
                            <h4 className="text-xl font-black text-slate-900 dark:text-white leading-none">{statsSummary?.inactive || 0}</h4>
                        </div>
                    </div>
                </div>
            </div>

            <div className="table-container">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-6">
                        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-none-none animate-spin" />
                        <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">{t('syncing', { defaultValue: 'Syncing store records...' })}</div>
                    </div>
                ) : (
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/80 dark:bg-slate-800/80">
                                    <th className="table-header-cell">{t('merchantEntity')}</th>
                                    <th className="table-header-cell">{t('legalOwner')}</th>
                                    <th className="table-header-cell">{t('deployment')}</th>
                                    <th className="table-header-cell">{t('operationalStatus')}</th>
                                    <th className="table-header-cell">{t('commercialStats')}</th>
                                    <th className="table-header-cell text-right">{t('common:actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                {stores.length > 0 ? (
                                    stores.map(store => (
                                        <tr key={store.id} className="table-row group">
                                            <td className="table-cell">
                                                <div className="flex items-center gap-4">
                                                    {store.logo ? (
                                                        <img src={store.logo} alt="" className="w-11 h-11 rounded-none-none object-cover shadow-lg shadow-slate-200 dark:shadow-slate-900/50 border border-white dark:border-slate-700" />
                                                    ) : (
                                                        <div className="w-11 h-11 rounded-none-none bg-slate-900 dark:bg-slate-800 flex items-center justify-center text-white font-black shadow-lg shadow-slate-200 dark:shadow-slate-900/50 rotate-2 group-hover:rotate-0 transition-transform">
                                                            {store.name.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="text-[15px] font-black text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">{store.name}</div>
                                                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">{store.businessType?.en_name}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="table-cell">
                                                <div className="text-sm font-bold text-slate-700 dark:text-slate-300">{store.owner?.name}</div>
                                            </td>
                                            <td className="table-cell">
                                                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                                    <MapPin size={14} className="text-primary" />
                                                    <span className="text-sm font-bold">
                                                        {store.towns && store.towns.length > 0 ? store.towns[0].enName : t('notSet')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="table-cell">{getStatusBadge(store.status)}</td>
                                            <td className="table-cell">
                                                <div className="text-sm font-black text-slate-900 dark:text-slate-100">{store.totalOrders || 0} {t('orders')}</div>
                                                <div className="text-[11px] font-bold text-slate-400 mt-0.5">${(store.totalRevenue || 0).toLocaleString()} {t('revenue')}</div>
                                            </td>
                                            <td className="table-cell text-right">
                                                <button
                                                    onClick={() => handleOpenStatusModal(store)}
                                                    className="p-3 text-slate-300 hover:text-primary hover:bg-primary-light rounded-none transition-all active:scale-90"
                                                >
                                                    <MoreVertical size={20} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="text-center py-32">
                                            <div className="flex flex-col items-center gap-3">
                                                <Store size={48} className="text-slate-200" />
                                                <div className="text-slate-400 font-bold text-sm tracking-tight italic">{t('noStoresFound')}</div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {pagination.totalPages > 1 && (
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
                        <div className="w-10 h-10 rounded-none-none bg-slate-900 dark:bg-slate-800 flex items-center justify-center text-white text-sm font-black shadow-lg shadow-slate-200 dark:shadow-slate-900/50">
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
            )}

            <StoreStatusModal
                isOpen={isStatusModalOpen}
                store={selectedStore}
                onClose={() => setIsStatusModalOpen(false)}
                onSuccess={fetchStores}
            />
        </div>

    );
};

export default StoresList;

