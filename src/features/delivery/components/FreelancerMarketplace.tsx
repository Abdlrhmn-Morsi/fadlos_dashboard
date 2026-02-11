import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { searchFreelancers, hireFreelancer } from '../api/delivery-drivers.api';
import { toast } from '../../../utils/toast';
import {
    MapPin,
    Search,
    Truck,
    User,
    CheckCircle,
    Star,
    Shield
} from 'lucide-react';
import clsx from 'clsx';
import { getTowns } from '../../towns/api/towns.api';

import { useCache } from '../../../contexts/CacheContext';

const FreelancerMarketplace = () => {
    const { t } = useTranslation(['common']);
    const { invalidateCache } = useCache();
    const [freelancers, setFreelancers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [hiringId, setHiringId] = useState<string | null>(null);
    const [towns, setTowns] = useState<any[]>([]);
    const [filters, setFilters] = useState({
        townId: '',
        available: true,
    });

    useEffect(() => {
        fetchTowns();
        fetchFreelancers();
    }, []);

    useEffect(() => {
        fetchFreelancers();
    }, [filters]);

    const fetchTowns = async () => {
        try {
            const response = await getTowns({ limit: 100 });
            setTowns(response.data || []);
        } catch (error) {
            console.error('Failed to fetch towns', error);
        }
    };

    const fetchFreelancers = async () => {
        setLoading(true);
        try {
            const data = await searchFreelancers(filters);
            setFreelancers(data || []);
        } catch (error) {
            console.error('Failed to fetch freelancers', error);
        } finally {
            setLoading(false);
        }
    };

    const handleHire = async (userId: string) => {
        setHiringId(userId);
        try {
            await hireFreelancer(userId);
            toast.success(t('delivery.drivers.hire_success', 'Freelancer hired successfully'));

            // Invalidate My Drivers cache
            invalidateCache('delivery_drivers');

            // Remove from list locally
            setFreelancers(prev => prev.filter(f => f.user.id !== userId));
        } catch (error: any) {
            console.error('Failed to hire freelancer', error);
            toast.error(error.response?.data?.message || t('common.error', 'Failed to hire freelancer'));
        } finally {
            setHiringId(null);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 p-6 rounded shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <User size={24} className="text-indigo-600" />
                        {t('delivery.drivers.find_freelancers')}
                    </h2>
                    <p className="text-sm text-slate-500">{t('delivery.drivers.marketplace_desc')}</p>
                </div>

                <div className="flex gap-4">
                    <select
                        value={filters.townId}
                        onChange={(e) => setFilters(prev => ({ ...prev, townId: e.target.value }))}
                        className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                        <option value="">{t('common.all_towns', 'All Towns')}</option>
                        {towns.map((town: any) => (
                            <option key={town.id} value={town.id}>{town.name}</option>
                        ))}
                    </select>

                    <label className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer">
                        <input
                            type="checkbox"
                            checked={filters.available}
                            onChange={(e) => setFilters(prev => ({ ...prev, available: e.target.checked }))}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('delivery.drivers.available_only')}</span>
                    </label>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
                </div>
            ) : (freelancers || []).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(freelancers || []).map((profile: any) => (
                        <div key={profile.id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:shadow-md transition-shadow bg-white dark:bg-slate-900">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="relative flex-shrink-0">
                                        <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg overflow-hidden">
                                            {profile.avatarUrl ? (
                                                <img src={profile.avatarUrl} alt={profile.user.name} className="w-full h-full object-cover" />
                                            ) : (
                                                profile.user.name.charAt(0)
                                            )}
                                        </div>
                                        {/* Status Dot */}
                                        <div className={clsx(
                                            "absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 shadow-sm",
                                            (profile.isBusy || profile.activeDeliveriesCount > 0) ? "bg-amber-500 animate-pulse" :
                                                profile.isAvailableForWork ? "bg-emerald-500" : "bg-slate-400"
                                        )} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white">{profile.user.name}</h3>
                                        <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                                            <Shield size={12} />
                                            {t('common.verified', 'Verified')}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className={clsx(
                                        "px-2 py-0.5 rounded text-xs font-bold mb-1",
                                        (profile.isBusy || profile.activeDeliveriesCount > 0) ? "bg-amber-100 text-amber-700" :
                                            profile.isAvailableForWork ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                                    )}>
                                        {(profile.isBusy || profile.activeDeliveriesCount > 0) ? t('delivery.status.busy') :
                                            profile.isAvailableForWork ? t('delivery.status.online') : t('delivery.status.offline')}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                    <MapPin size={16} />
                                    <span>
                                        {profile.towns?.map((t: any) => t.name).join(', ') || t('common.no_location', 'No location')}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                    <Truck size={16} />
                                    <span>{profile.vehicleType || t('common.vehicle', 'Vehicle')} - {profile.vehiclePlateNumber || '---'}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => handleHire(profile.user.id)}
                                disabled={hiringId === profile.user.id}
                                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {hiringId === profile.user.id ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <CheckCircle size={18} />
                                )}
                                {t('delivery.drivers.hire')}
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 text-slate-400">
                    <Search size={48} className="mx-auto mb-4 opacity-20" />
                    <p>{t('common.no_results')}</p>
                </div>
            )}
        </div>
    );
};

export default FreelancerMarketplace;
