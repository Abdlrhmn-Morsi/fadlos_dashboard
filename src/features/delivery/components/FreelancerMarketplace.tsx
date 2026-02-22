import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { searchFreelancers, hireFreelancer, cancelHiringRequest } from '../api/delivery-drivers.api';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { toast } from '../../../utils/toast';
import {
    MapPin,
    Search,
    Truck,
    User,
    CheckCircle,
    Shield,
    Filter,
    XCircle
} from 'lucide-react';
import clsx from 'clsx';
import { getCities } from '../../cities/api/cities.api';
import { getPlacesByTown } from '../../towns/api/towns.api';
import { useCache } from '../../../contexts/CacheContext';
import { useDebounce } from '../../../hooks';
import { useLanguage } from '../../../contexts/LanguageContext';

const FreelancerMarketplace = () => {
    const { t } = useTranslation(['common']);
    const { isRTL } = useLanguage();
    const { invalidateCache } = useCache();
    const [freelancers, setFreelancers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [hiringId, setHiringId] = useState<string | null>(null);
    const [towns, setTowns] = useState<any[]>([]);
    const [places, setPlaces] = useState<any[]>([]);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [cancelData, setCancelData] = useState<{ requestId: string, userId: string } | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearch = useDebounce(searchQuery, 500);

    const [filters, setFilters] = useState({
        townId: '',
        placeId: '',
    });

    useEffect(() => {
        fetchTowns();
    }, []);

    const fetchTowns = async () => {
        try {
            const response = await getCities({ limit: 100 });
            setTowns(Array.isArray(response) ? response : response?.data?.data || response?.data || []);
        } catch (error) {
            console.error('Failed to fetch towns', error);
        }
    };

    const fetchPlaces = async (townId: string) => {
        if (!townId) {
            setPlaces([]);
            return;
        }
        try {
            const data = await getPlacesByTown(townId);
            setPlaces(data || []);
        } catch (error) {
            console.error('Failed to fetch places', error);
        }
    };

    const fetchFreelancers = useCallback(async () => {
        setLoading(true);
        try {
            const data = await searchFreelancers({
                ...filters,
                search: debouncedSearch
            });
            setFreelancers(data || []);
        } catch (error) {
            console.error('Failed to fetch freelancers', error);
        } finally {
            setLoading(false);
        }
    }, [filters, debouncedSearch]);

    useEffect(() => {
        fetchFreelancers();
    }, [fetchFreelancers]);

    const handleTownChange = (townId: string) => {
        setFilters(prev => ({ ...prev, townId, placeId: '' }));
        fetchPlaces(townId);
    };

    const handleCancelRequest = (requestId: string, userId: string) => {
        setCancelData({ requestId, userId });
        setIsCancelModalOpen(true);
    };

    const confirmCancelRequest = async () => {
        if (!cancelData) return;
        const { requestId, userId } = cancelData;
        setIsCancelModalOpen(false);
        setHiringId(userId);
        try {
            await cancelHiringRequest(requestId);
            toast.success(t('delivery.drivers.drivers.cancel_hiring_success', 'Hiring request cancelled successfully'));

            // Invalidate My Drivers cache
            invalidateCache('delivery_drivers');

            // Update status locally
            setFreelancers(prev => prev.map(f => f.user.id === userId ? { ...f, hiringStatus: null, hiringRequestId: null } : f));
        } catch (error: any) {
            console.error('Failed to cancel hiring request', error);
            toast.error(error.response?.data?.message || t('delivery.drivers.drivers.cancel_hiring_failed', 'Failed to cancel hiring request'));
        } finally {
            setHiringId(null);
            setCancelData(null);
        }
    };

    const handleHire = async (userId: string) => {
        setHiringId(userId);
        try {
            await hireFreelancer(userId);
            toast.success(t('delivery.drivers.hire_success', 'Freelancer hired successfully'));

            // Invalidate My Drivers cache
            invalidateCache('delivery_drivers');

            // Update status locally
            setFreelancers(prev => prev.map(f => f.user.id === userId ? { ...f, hiringStatus: 'PENDING' } : f));
        } catch (error: any) {
            console.error('Failed to hire freelancer', error);
            toast.error(error.response?.data?.message || t('common.error', 'Failed to hire freelancer'));
        } finally {
            setHiringId(null);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 p-6 rounded shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <User size={24} className="text-indigo-600" />
                        {t('delivery.drivers.find_freelancers')}
                    </h2>
                    <p className="text-sm text-slate-500">{t('delivery.drivers.marketplace_desc')}</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Search Input */}
                    <div className="relative min-w-[240px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={t('common.search_placeholder')}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
                        />
                    </div>

                    <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden md:block mx-1" />

                    {/* Town Filter */}
                    <select
                        value={filters.townId}
                        onChange={(e) => handleTownChange(e.target.value)}
                        className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
                    >
                        <option value="">{t('common.all_towns', 'All Towns')}</option>
                        {towns.map((town: any) => (
                            <option key={town.id} value={town.id}>
                                {isRTL ? town.arName : town.enName}
                            </option>
                        ))}
                    </select>

                    {/* Place Filter */}
                    <select
                        value={filters.placeId}
                        onChange={(e) => setFilters(prev => ({ ...prev, placeId: e.target.value }))}
                        disabled={!filters.townId}
                        className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm disabled:opacity-50"
                    >
                        <option value="">{t('common.all_places', 'All Areas')}</option>
                        {places.map((place: any) => (
                            <option key={place.id} value={place.id}>
                                {isRTL ? place.arName : place.enName}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-24">
                    <div className="w-10 h-10 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
                </div>
            ) : (freelancers || []).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {(freelancers || []).map((profile: any) => (
                        <div key={profile.id} className="group border border-slate-200 dark:border-slate-700 rounded-2xl p-6 hover:shadow-xl hover:border-indigo-500/30 transition-all bg-white dark:bg-slate-900">
                            <div className="flex items-start justify-between mb-5">
                                <div className="flex items-center gap-4">
                                    <div className="relative flex-shrink-0">
                                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 font-bold text-xl overflow-hidden group-hover:scale-105 transition-transform">
                                            {profile.avatarUrl ? (
                                                <img src={profile.avatarUrl} alt={profile.user.name} className="w-full h-full object-cover" />
                                            ) : (
                                                profile.user.name.charAt(0)
                                            )}
                                        </div>
                                        <div className={clsx(
                                            "absolute -bottom-1 -inset-inline-end-1 w-5 h-5 rounded-full border-4 border-white dark:border-slate-900 shadow-sm",
                                            (profile.isBusy || profile.activeDeliveriesCount > 0) ? "bg-amber-500" :
                                                profile.isAvailableForWork ? "bg-emerald-500" : "bg-slate-400"
                                        )} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-tight">{profile.user.name}</h3>
                                        <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold uppercase tracking-wider mt-1">
                                            <Shield size={12} />
                                            {t('common.verified')}
                                        </div>
                                    </div>
                                </div>
                                <span className={clsx(
                                    "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                                    (profile.isBusy || profile.activeDeliveriesCount > 0) ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                                        profile.isAvailableForWork ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                                )}>
                                    {(profile.isBusy || profile.activeDeliveriesCount > 0) ? t('delivery.status.busy') :
                                        profile.isAvailableForWork ? t('delivery.status.online') : t('delivery.status.offline')}
                                </span>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div className="flex items-start gap-3">
                                    <MapPin size={18} className="text-slate-400 mt-0.5" />
                                    <div className="flex flex-wrap gap-1.5">
                                        {profile.towns?.length > 0 ? (
                                            profile.towns.map((tn: any) => (
                                                <span key={tn.id} className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded">
                                                    {isRTL ? tn.arName : tn.enName}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-sm text-slate-400 italic">{t('common.no_location')}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                                    <Truck size={18} className="text-slate-400" />
                                    <span>
                                        <span className="font-medium text-slate-900 dark:text-slate-200">
                                            {profile.vehicleType ? t(`vehicle_types.${profile.vehicleType.toLowerCase()}`) : '---'}
                                        </span>
                                        {profile.vehiclePlateNumber && <span className="text-slate-300 dark:text-slate-600 mx-2">|</span>}
                                        {profile.vehiclePlateNumber}
                                    </span>
                                </div>
                            </div>

                            {profile.hiringStatus === 'ACTIVE' ? (
                                <button
                                    disabled
                                    className="w-full py-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-not-allowed"
                                >
                                    <CheckCircle size={20} />
                                    {t('common.alreadyHired', 'Already Hired')}
                                </button>
                            ) : profile.hiringStatus === 'PENDING' ? (
                                <div className="flex gap-2">
                                    <button
                                        disabled
                                        className="flex-1 py-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-not-allowed"
                                    >
                                        <CheckCircle size={20} />
                                        {t('common.requestSent', 'Request Sent')}
                                    </button>
                                    <button
                                        onClick={() => handleCancelRequest(profile.hiringRequestId, profile.user.id)}
                                        disabled={hiringId === profile.user.id}
                                        className="px-4 py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-900/20 dark:hover:bg-rose-900/40 dark:text-rose-400 font-bold rounded-xl transition-all flex items-center justify-center disabled:opacity-50 active:scale-[0.98]"
                                        title={t('delivery.drivers.cancel_hiring', 'Cancel Application')}
                                    >
                                        {hiringId === profile.user.id ? (
                                            <div className="w-5 h-5 border-2 border-rose-600/30 border-t-rose-600 rounded-full animate-spin" />
                                        ) : (
                                            <XCircle size={20} />
                                        )}
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => handleHire(profile.user.id)}
                                    disabled={hiringId === profile.user.id}
                                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
                                >
                                    {hiringId === profile.user.id ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <CheckCircle size={20} />
                                    )}
                                    {t('common.sendRequest', 'Send Request')}
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border-2 border-dashed border-slate-100 dark:border-slate-800">
                    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                        <Search size={40} className="text-slate-300" />
                    </div>
                    <p className="text-lg font-medium text-slate-500 dark:text-slate-400 mb-2">{t('common.no_results')}</p>
                    <p className="text-sm max-w-xs text-center">{t('adjustSearch', 'Try adjusting your search criteria to find available freelancers.')}</p>
                </div>
            )}
            {isCancelModalOpen && (
                <ConfirmModal
                    isOpen={isCancelModalOpen}
                    title={t('delivery.drivers.drivers.cancel_hiring_title', 'Cancel Hiring Request')}
                    message={t('delivery.drivers.drivers.confirm_cancel_hiring', 'Are you sure you want to cancel this hiring request?')}
                    onConfirm={confirmCancelRequest}
                    onCancel={() => {
                        setIsCancelModalOpen(false);
                        setCancelData(null);
                    }}
                />
            )}
        </div>
    );
};

export default FreelancerMarketplace;
