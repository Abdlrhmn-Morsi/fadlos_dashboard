import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
    MapPin,
    Trash2,
    Loader2,
    Truck,
    DollarSign,
    RefreshCw,
    Search,
    RotateCcw,
    ChevronDown,
    Check,
    CheckSquare,
} from 'lucide-react';
import clsx from 'clsx';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useCache } from '../../../contexts/CacheContext';
import { getCities } from '../../cities/api/cities.api';
import {
    assignTownToStore,
    getMyStoreDeliveryAreas,
    updateDeliveryArea,
    removeDeliveryArea,
    bulkRemoveDeliveryAreas,
    resetMyStoreDeliveryAreas,
    getPlacesByTown
} from '../../towns/api/towns.api';
import { toast } from '../../../utils/toast';
import StatusModal from '../../../components/common/StatusModal';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { useAuth } from '../../../contexts/AuthContext';
import { Permissions } from '../../../types/permissions';

const DeliveryAreas = () => {
    const { t, i18n } = useTranslation(['stores', 'common']);
    const { isRTL } = useLanguage();
    const { hasPermission } = useAuth();
    const { getCache, setCache, invalidateCache } = useCache();

    const [loading, setLoading] = useState(true);
    const [cities, setCities] = useState<any[]>([]);
    const [deliveryAreas, setDeliveryAreas] = useState<any[]>([]);

    const [expandedCities, setExpandedCities] = useState<Set<string>>(new Set());
    const [cityPlacesMap, setCityPlacesMap] = useState<Record<string, any[]>>({});
    const [loadingPlacesFor, setLoadingPlacesFor] = useState<Set<string>>(new Set());
    const [cityPrices, setCityPrices] = useState<Record<string, number>>({});
    const [processingPlaces, setProcessingPlaces] = useState<Set<string>>(new Set());
    const [processingCities, setProcessingCities] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');

    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [showCityRemoveConfirm, setShowCityRemoveConfirm] = useState<string | null>(null);
    const [resetting, setResetting] = useState(false);

    const currentLng = i18n.language;
    const canUpdate = hasPermission(Permissions.DELIVERY_AREAS_UPDATE);

    const getName = useCallback((item: any) => {
        return currentLng.startsWith('ar') ? item?.arName : item?.enName;
    }, [currentLng]);

    const fetchData = async (force = false) => {
        setLoading(true);
        try {
            const cachedCities = getCache<any[]>('cities_all');
            const cachedAreas = force ? null : getCache<any[]>('delivery-areas');

            if (cachedCities && cachedAreas) {
                setCities(cachedCities);
                setDeliveryAreas(cachedAreas);
                setLoading(false);
                return;
            }

            const [allCities, areas] = await Promise.all([
                getCities({ limit: 0 }),
                getMyStoreDeliveryAreas()
            ]);

            setCities(allCities);
            setDeliveryAreas(areas);
            setCache('cities_all', allCities);
            setCache('delivery-areas', areas);
        } catch (error) {
            console.error('Failed to fetch delivery areas:', error);
            toast.error(t('common:errorFetchingData'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const getAreasForCity = (cityId: string) =>
        deliveryAreas.filter(area => area.place?.town?.id === cityId);

    const getAreaForPlace = (placeId: string) =>
        deliveryAreas.find(area => area.place?.id === placeId);

    const handleToggleCity = async (cityId: string) => {
        const next = new Set(expandedCities);
        if (next.has(cityId)) {
            next.delete(cityId);
            setExpandedCities(next);
            return;
        }

        next.add(cityId);
        setExpandedCities(next);

        if (!cityPlacesMap[cityId]) {
            setLoadingPlacesFor(prev => new Set(prev).add(cityId));
            try {
                const places = await getPlacesByTown(cityId);
                setCityPlacesMap(prev => ({ ...prev, [cityId]: places }));
            } catch (error) {
                console.error('Failed to fetch places:', error);
            } finally {
                setLoadingPlacesFor(prev => {
                    const s = new Set(prev);
                    s.delete(cityId);
                    return s;
                });
            }
        }
    };

    const handleTogglePlace = async (cityId: string, placeId: string) => {
        if (!canUpdate || processingPlaces.has(placeId)) return;

        const area = getAreaForPlace(placeId);
        setProcessingPlaces(prev => new Set(prev).add(placeId));

        try {
            if (area) {
                await removeDeliveryArea(area.id);
                setDeliveryAreas(prev => prev.filter(a => a.id !== area.id));
            } else {
                const price = cityPrices[cityId] || 0;
                await assignTownToStore({ townId: cityId, defaultPrice: price, placeIds: [placeId] });
                const areas = await getMyStoreDeliveryAreas();
                setDeliveryAreas(areas);
                setCache('delivery-areas', areas);
            }
            invalidateCache('delivery-areas');
            toast.success(t('common:success'));
        } catch (error) {
            toast.error(t('common:errorUpdatingData'));
        } finally {
            setProcessingPlaces(prev => {
                const s = new Set(prev);
                s.delete(placeId);
                return s;
            });
        }
    };

    const handleSelectAllInCity = async (cityId: string) => {
        if (!canUpdate) return;
        const places = cityPlacesMap[cityId] || [];
        const unassignedIds = places.filter(p => !getAreaForPlace(p.id)).map(p => p.id);
        if (unassignedIds.length === 0) return;

        setProcessingCities(prev => new Set(prev).add(cityId));
        try {
            const price = cityPrices[cityId] || 0;
            await assignTownToStore({ townId: cityId, defaultPrice: price, placeIds: unassignedIds });
            const areas = await getMyStoreDeliveryAreas();
            setDeliveryAreas(areas);
            setCache('delivery-areas', areas);
            invalidateCache('delivery-areas');
            toast.success(t('common:success'));
        } catch (error) {
            toast.error(t('common:errorUpdatingData'));
        } finally {
            setProcessingCities(prev => {
                const s = new Set(prev);
                s.delete(cityId);
                return s;
            });
        }
    };

    const handleRemoveAllInCity = async (cityId: string) => {
        if (!canUpdate) return;
        const areasInCity = getAreasForCity(cityId);
        if (areasInCity.length === 0) return;

        setProcessingCities(prev => new Set(prev).add(cityId));
        setShowCityRemoveConfirm(null);
        try {
            const ids = areasInCity.map(area => area.id);
            await bulkRemoveDeliveryAreas(ids);
            setDeliveryAreas(prev => prev.filter(a => a.place?.town?.id !== cityId));
            invalidateCache('delivery-areas');
            toast.success(t('common:success'));
        } catch (error) {
            toast.error(t('common:errorUpdatingData'));
        } finally {
            setProcessingCities(prev => {
                const s = new Set(prev);
                s.delete(cityId);
                return s;
            });
        }
    };

    const handleUpdatePrice = async (areaId: string, price: number) => {
        try {
            await updateDeliveryArea(areaId, { price });
            setDeliveryAreas(prev => prev.map(a => a.id === areaId ? { ...a, price } : a));
            invalidateCache('delivery-areas');
            toast.success(t('common:success'));
        } catch (error) {
            toast.error(t('common:errorUpdatingData'));
        }
    };

    const handleResetAll = async () => {
        setResetting(true);
        try {
            await resetMyStoreDeliveryAreas();
            setDeliveryAreas([]);
            setShowResetConfirm(false);
            invalidateCache('delivery-areas');
            toast.success(t('common:success'));
        } catch (error) {
            toast.error(t('common:errorUpdatingData'));
        } finally {
            setResetting(false);
        }
    };

    if (loading) return <LoadingSpinner fullHeight={false} />;

    const filteredCities = cities.filter(city => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return city.enName?.toLowerCase().includes(q) || city.arName?.toLowerCase().includes(q);
    });

    // Sort: cities with areas first
    const sortedCities = [...filteredCities].sort((a, b) => {
        const aCount = getAreasForCity(a.id).length;
        const bCount = getAreasForCity(b.id).length;
        if (aCount > 0 && bCount === 0) return -1;
        if (aCount === 0 && bCount > 0) return 1;
        return 0;
    });

    const citiesWithAreas = new Set(deliveryAreas.map(a => a.place?.town?.id)).size;

    return (
        <div className="space-y-6">
            {/* Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search size={14} className="absolute top-1/2 -translate-y-1/2 text-slate-400 start-3" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t('common:search')}
                        className="w-full py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-none font-bold text-xs outline-none focus:border-primary transition-colors ps-9 pe-4"
                    />
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-[0.625rem] font-extrabold px-3 py-1.5 bg-primary/10 text-primary uppercase tracking-widest">
                        {deliveryAreas.length} {t('totalAreas')}
                    </span>
                    <span className="text-[0.625rem] font-extrabold px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase tracking-widest">
                        {citiesWithAreas}/{cities.length} {t('citiesCovered')}
                    </span>

                    {canUpdate && (
                        <button
                            type="button"
                            onClick={() => setShowResetConfirm(true)}
                            disabled={deliveryAreas.length === 0}
                            className="flex items-center gap-2 px-3 py-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors font-extrabold text-[0.625rem] uppercase tracking-widest disabled:opacity-30"
                        >
                            <RotateCcw size={12} />
                            {t('resetAll')}
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => fetchData(true)}
                        className="p-2 text-slate-400 hover:text-primary transition-colors"
                    >
                        <RefreshCw size={14} />
                    </button>
                </div>
            </div>

            {/* Cities Accordion */}
            {sortedCities.length === 0 ? (
                <div className="py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-2 text-slate-400">
                    <Truck size={32} strokeWidth={1} />
                    <p className="font-bold text-sm uppercase tracking-widest">
                        {searchQuery ? t('noAreasFoundForTown') : t('noDeliveryAreas')}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {sortedCities.map(city => {
                        const areasInCity = getAreasForCity(city.id);
                        const places = cityPlacesMap[city.id] || [];
                        const isExpanded = expandedCities.has(city.id);
                        const isLoadingPlaces = loadingPlacesFor.has(city.id);
                        const isCityProcessing = processingCities.has(city.id);
                        const hasAreas = areasInCity.length > 0;
                        const allSelected = places.length > 0 && areasInCity.length >= places.length;

                        return (
                            <div
                                key={city.id}
                                className={clsx(
                                    "border transition-all",
                                    isExpanded
                                        ? "border-primary/30 bg-white dark:bg-slate-900 shadow-lg shadow-primary/5"
                                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700",
                                    hasAreas && !isExpanded && "border-s-4 border-s-primary"
                                )}
                            >
                                {/* City Header */}
                                <button
                                    type="button"
                                    onClick={() => handleToggleCity(city.id)}
                                    className="w-full flex items-center justify-between p-4 text-start"
                                >
                                    <div className="flex items-center gap-3">
                                        <MapPin
                                            size={18}
                                            className={clsx(hasAreas ? "text-primary" : "text-slate-300 dark:text-slate-600")}
                                        />
                                        <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                                            {getName(city)}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <span className={clsx(
                                            "text-[0.625rem] font-extrabold px-2.5 py-1 uppercase tracking-widest",
                                            hasAreas
                                                ? "bg-primary text-white"
                                                : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                                        )}>
                                            {areasInCity.length}/{city.placesCount || places.length || 0}
                                        </span>

                                        <ChevronDown
                                            size={16}
                                            className={clsx(
                                                "text-slate-400 transition-transform duration-200",
                                                isExpanded && "rotate-180"
                                            )}
                                        />
                                    </div>
                                </button>

                                {/* Expanded Content */}
                                {isExpanded && (
                                    <div className="border-t border-slate-200 dark:border-slate-700">
                                        {/* Actions Bar */}
                                        {canUpdate && (
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800/50">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSelectAllInCity(city.id)}
                                                        disabled={isCityProcessing || isLoadingPlaces || allSelected}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-[0.625rem] font-extrabold text-primary uppercase tracking-widest hover:bg-primary/5 transition-colors disabled:opacity-30"
                                                    >
                                                        <CheckSquare size={12} />
                                                        {t('common:selectAll')}
                                                    </button>
                                                    <span className="text-slate-300 dark:text-slate-600">|</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowCityRemoveConfirm(city.id)}
                                                        disabled={isCityProcessing || areasInCity.length === 0}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-[0.625rem] font-extrabold text-rose-500 uppercase tracking-widest hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors disabled:opacity-30"
                                                    >
                                                        <Trash2 size={12} />
                                                        {t('removeAllTowns')}
                                                    </button>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <label className="text-[0.625rem] font-extrabold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                                                        {t('defaultPrice')}
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            value={cityPrices[city.id] || 0}
                                                            onChange={(e) => setCityPrices(prev => ({
                                                                ...prev,
                                                                [city.id]: Number(e.target.value)
                                                            }))}
                                                            className="w-20 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-none font-bold text-xs outline-none focus:border-primary transition-colors ps-6 pe-2"
                                                            min="0"
                                                        />
                                                        <DollarSign size={10} className="absolute top-1/2 -translate-y-1/2 text-slate-400 start-2" />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Places Grid */}
                                        <div className="p-4">
                                            {(isCityProcessing || isLoadingPlaces) ? (
                                                <div className="flex items-center justify-center gap-2 py-8 text-slate-400">
                                                    <Loader2 size={20} className="animate-spin" />
                                                    <span className="text-xs font-bold uppercase tracking-widest">
                                                        {t('common:loading')}
                                                    </span>
                                                </div>
                                            ) : places.length === 0 ? (
                                                <p className="text-xs text-slate-400 italic py-4 text-center">
                                                    {t('noPlacesFound')}
                                                </p>
                                            ) : (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                                    {places.map(place => {
                                                        const area = getAreaForPlace(place.id);
                                                        const isAssigned = !!area;
                                                        const isProcessing = processingPlaces.has(place.id);

                                                        return (
                                                            <div
                                                                key={place.id}
                                                                className={clsx(
                                                                    "flex items-center gap-3 p-3 border transition-all group",
                                                                    isAssigned
                                                                        ? "bg-primary/5 border-primary/30 dark:bg-primary/10"
                                                                        : "bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600",
                                                                    isProcessing && "opacity-60 pointer-events-none"
                                                                )}
                                                            >
                                                                {canUpdate && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleTogglePlace(city.id, place.id)}
                                                                        disabled={isProcessing}
                                                                        className="flex-shrink-0"
                                                                    >
                                                                        <div className={clsx(
                                                                            "w-5 h-5 border-2 flex items-center justify-center transition-all",
                                                                            isAssigned
                                                                                ? "bg-primary border-primary"
                                                                                : "border-slate-300 dark:border-slate-600 group-hover:border-primary/50"
                                                                        )}>
                                                                            {isProcessing ? (
                                                                                <Loader2 size={12} className="animate-spin text-white" />
                                                                            ) : isAssigned ? (
                                                                                <Check size={12} className="text-white" strokeWidth={3} />
                                                                            ) : null}
                                                                        </div>
                                                                    </button>
                                                                )}

                                                                <span className={clsx(
                                                                    "text-xs font-bold flex-1 truncate",
                                                                    isAssigned
                                                                        ? "text-slate-900 dark:text-slate-100"
                                                                        : "text-slate-500 dark:text-slate-400"
                                                                )}>
                                                                    {getName(place)}
                                                                </span>

                                                                {isAssigned && area && (
                                                                    <div className="relative flex-shrink-0">
                                                                        <input
                                                                            type="number"
                                                                            readOnly={!canUpdate}
                                                                            defaultValue={area.price}
                                                                            onBlur={(e) => {
                                                                                if (!canUpdate) return;
                                                                                const newPrice = Number(e.target.value);
                                                                                if (newPrice !== area.price) {
                                                                                    handleUpdatePrice(area.id, newPrice);
                                                                                }
                                                                            }}
                                                                            className={clsx(
                                                                                "w-16 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-none font-bold text-[0.6875rem] outline-none focus:border-primary transition-colors ps-5 pe-1 text-center",
                                                                                !canUpdate && "opacity-60 cursor-not-allowed"
                                                                            )}
                                                                            min="0"
                                                                        />
                                                                        <DollarSign size={8} className="absolute top-1/2 -translate-y-1/2 text-slate-400 start-1.5" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Reset All Modal */}
            <StatusModal
                isOpen={showResetConfirm}
                onClose={() => setShowResetConfirm(false)}
                type="confirm"
                title={t('resetDeliveryAreas')}
                message={t('resetDeliveryAreasMessage')}
                onConfirm={handleResetAll}
                confirmText={resetting ? t('common:loading') : t('common:confirm')}
            />

            {/* Remove City Areas Modal */}
            <StatusModal
                isOpen={!!showCityRemoveConfirm}
                onClose={() => setShowCityRemoveConfirm(null)}
                type="confirm"
                title={t('removeAllForCity')}
                message={t('removeAllForCityMessage')}
                onConfirm={() => showCityRemoveConfirm && handleRemoveAllInCity(showCityRemoveConfirm)}
                confirmText={t('common:confirm')}
            />
        </div>
    );
};

export default DeliveryAreas;
