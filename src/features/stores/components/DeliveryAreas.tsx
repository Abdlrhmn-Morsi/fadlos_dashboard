import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    MapPin,
    Plus,
    Trash2,
    Save,
    Loader2,
    CheckCircle,
    XCircle,
    Truck,
    DollarSign,
    RefreshCw,
    Filter,
    RotateCcw,
    Search
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
    const [selectedCityId, setSelectedCityId] = useState<string>('');
    const [defaultPrice, setDefaultPrice] = useState<number>(0);
    const [saving, setSaving] = useState(false);
    const [places, setPlaces] = useState<any[]>([]);
    const [selectedPlaceIds, setSelectedPlaceIds] = useState<string[]>([]);
    const [fetchingPlaces, setFetchingPlaces] = useState(false);

    // Enhancement states
    const [filterTownId, setFilterTownId] = useState<string>('all');
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchData = async (force = false) => {
        setLoading(true);
        try {
            // Check cache first
            const cachedCities = getCache<any[]>('cities_all');
            const cachedAreas = force ? null : getCache<any[]>('delivery-areas');

            if (cachedCities && cachedAreas) {

                console.log('[Cache] Loading delivery areas and cities from cache');
                setCities(cachedCities);
                setDeliveryAreas(cachedAreas);
                setLoading(false);
                return;
            }

            console.log('[API] Fetching delivery areas and cities from API');
            const [allCities, areas] = await Promise.all([
                getCities({ limit: 0 }),
                getMyStoreDeliveryAreas()
            ]);

            setCities(allCities);
            setDeliveryAreas(areas);

            // Store in cache
            setCache('cities_all', allCities);
            setCache('delivery-areas', areas);
        } catch (error) {
            console.error('Failed to fetch delivery areas:', error);
            toast.error(t('common:errorFetchingData'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        const fetchPlaces = async () => {
            if (!selectedCityId) {
                setPlaces([]);
                setSelectedPlaceIds([]);
                return;
            }
            setFetchingPlaces(true);
            try {
                const data = await getPlacesByTown(selectedCityId);
                setPlaces(data);
                // Initially select all places
                setSelectedPlaceIds(data.map((p: any) => p.id));
            } catch (error) {
                console.error('Failed to fetch places:', error);
            } finally {
                setFetchingPlaces(false);
            }
        };
        fetchPlaces();
    }, [selectedCityId]);

    const handleAssignCity = async () => {
        if (!selectedCityId) return;
        setSaving(true);
        try {
            await assignTownToStore({
                townId: selectedCityId,
                defaultPrice: defaultPrice,
                placeIds: selectedPlaceIds
            });
            toast.success(t('common:success'));
            // Invalidate cache after adding new delivery area
            invalidateCache('delivery-areas');
            fetchData(true);
            setSelectedCityId('');
            setDefaultPrice(0);
            setSelectedPlaceIds([]);
            setPlaces([]);
        } catch (error) {
            console.error('Failed to assign city:', error);
            toast.error(t('common:errorUpdatingData'));
        } finally {
            setSaving(false);
        }
    };

    const handleUpdatePrice = async (id: string, price: number) => {
        try {
            await updateDeliveryArea(id, { price });
            toast.success(t('common:success'));
            setDeliveryAreas(prev => prev.map(area => area.id === id ? { ...area, price } : area));
            // Invalidate cache after updating delivery area
            invalidateCache('delivery-areas');
        } catch (error) {
            console.error('Failed to update price:', error);
            toast.error(t('common:errorUpdatingData'));
        }
    };

    const handleRemoveArea = async (id: string) => {
        try {
            await removeDeliveryArea(id);
            toast.success(t('common:success'));
            setDeliveryAreas(prev => prev.filter(area => area.id !== id));
            // Invalidate cache after removing delivery area
            invalidateCache('delivery-areas');
        } catch (error) {
            console.error('Failed to remove delivery area:', error);
            toast.error(t('common:errorUpdatingData'));
        }
    };

    const handleResetAll = async () => {
        setResetting(true);
        try {
            await resetMyStoreDeliveryAreas();
            toast.success(t('common:success'));
            setDeliveryAreas([]);
            setFilterTownId('all');
            setShowResetConfirm(false);
            // Invalidate cache after resetting all delivery areas
            invalidateCache('delivery-areas');
        } catch (error) {
            console.error('Failed to reset delivery areas:', error);
            toast.error(t('common:errorUpdatingData'));
        } finally {
            setResetting(false);
        }
    };

    if (loading) {
        return <LoadingSpinner fullHeight={false} />;
    }

    const currentLng = i18n.language;
    const canUpdate = hasPermission(Permissions.DELIVERY_AREAS_UPDATE);

    // Get unique towns for filtering
    const uniqueTowns = Array.from(new Set(deliveryAreas.map(area => area.place?.town?.id)))
        .map(townId => {
            const area = deliveryAreas.find(a => a.place?.town?.id === townId);
            return {
                id: townId,
                enName: area?.place?.town?.enName,
                arName: area?.place?.town?.arName
            };
        })
        .filter(t => t.id);

    const filteredAreas = deliveryAreas
        .filter(area => filterTownId === 'all' || area.place?.town?.id === filterTownId)
        .filter(area => {
            if (!searchQuery) return true;
            const search = searchQuery.toLowerCase();
            const placeNameEn = area.place?.enName?.toLowerCase() || '';
            const placeNameAr = area.place?.arName?.toLowerCase() || '';
            return placeNameEn.includes(search) || placeNameAr.includes(search);
        });

    return (
        <div className="space-y-8">
            {/* Add New Delivery Area Section */}
            {canUpdate && (
                <div className="bg-slate-50 dark:bg-slate-800/30 p-6 border border-slate-200 dark:border-slate-800 rounded-none flex flex-col">
                    <h4 className="font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest text-xs mb-4 flex items-center gap-2">
                        <Plus size={14} className="text-primary" />
                        {t('addDeliveryCity')}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{t('common:city')}</label>
                            <select
                                value={selectedCityId}
                                onChange={(e) => setSelectedCityId(e.target.value)}
                                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-none font-bold text-sm outline-none focus:border-primary transition-colors"
                            >
                                <option value="">{t('selectCity')}</option>
                                {cities.map(city => (
                                    <option key={city.id} value={city.id}>
                                        {currentLng.startsWith('ar') ? city.arName : city.enName}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{t('defaultPrice')}</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={defaultPrice}
                                    onChange={(e) => setDefaultPrice(Number(e.target.value))}
                                    className={clsx(
                                        "w-full py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-none font-bold text-sm outline-none focus:border-primary transition-colors ps-8 pe-4"
                                    )}
                                    min="0"
                                />
                                <DollarSign size={14} className="absolute top-1/2 -translate-y-1/2 text-slate-400 font-bold start-3" />
                            </div>
                        </div>
                        <div className="flex items-end">
                            <button
                                type="button"
                                onClick={handleAssignCity}
                                disabled={!selectedCityId || saving || selectedPlaceIds.length === 0}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-none shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:translate-y-0"
                            >
                                {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                                {t('addArea')}
                            </button>
                        </div>
                    </div>

                    {/* Places Selection */}
                    {selectedCityId && (
                        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                            <div className="flex items-center justify-between mb-4">
                                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                                    {t('selectPlaces')} ({selectedPlaceIds.length}/{places.length})
                                </h5>
                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedPlaceIds(places.map(p => p.id))}
                                        className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                                    >
                                        {t('common:selectAll')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedPlaceIds([])}
                                        className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:underline"
                                    >
                                        {t('common:deselectAll')}
                                    </button>
                                </div>
                            </div>

                            {fetchingPlaces ? (
                                <div className="flex justify-center py-4">
                                    <Loader2 size={24} className="animate-spin text-slate-300" />
                                </div>
                            ) : places.length === 0 ? (
                                <p className="text-xs text-slate-500 italic py-2">{t('noPlacesFound')}</p>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[200px] overflow-y-auto p-1 custom-scrollbar">
                                    {places.map((place) => {
                                        const isSelected = selectedPlaceIds.includes(place.id);
                                        return (
                                            <button
                                                key={place.id}
                                                type="button"
                                                onClick={() => {
                                                    if (isSelected) {
                                                        setSelectedPlaceIds(prev => prev.filter(id => id !== place.id));
                                                    } else {
                                                        setSelectedPlaceIds(prev => [...prev, place.id]);
                                                    }
                                                }}
                                                className={clsx(
                                                    "flex items-center gap-2 p-2 border transition-all text-start",
                                                    isSelected
                                                        ? "bg-primary/5 border-primary text-primary"
                                                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                                                )}
                                            >
                                                <div className={clsx(
                                                    "w-3 h-3 border flex items-center justify-center transition-colors",
                                                    isSelected ? "bg-primary border-primary" : "border-slate-300 dark:border-slate-600"
                                                )}>
                                                    {isSelected && <Plus size={10} className="text-white" />}
                                                </div>
                                                <span className="text-[11px] font-bold truncate">
                                                    {currentLng.startsWith('ar') ? place.arName : place.enName}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    <p className="mt-4 text-[10px] text-slate-500 font-medium">
                        {t('addAreaNote')}
                    </p>
                </div>
            )}

            {/* List of Delivery Areas */}
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-4">
                            <h4 className="font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest text-xs flex items-center gap-2">
                                <Truck size={14} className="text-primary" />
                                {t('activeDeliveryAreas')}
                            </h4>
                            <div className="text-[10px] font-black px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-none">
                                {filteredAreas.length}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap justify-end">
                        {/* Town Filter */}
                        <div className="relative">
                            <Filter size={14} className="absolute top-1/2 -translate-y-1/2 text-slate-400 start-3" />
                            <select
                                value={filterTownId}
                                onChange={(e) => setFilterTownId(e.target.value)}
                                className="py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-none font-bold text-[10px] uppercase tracking-widest outline-none focus:border-primary transition-colors ps-9 pe-4"
                            >
                                <option value="all">{t('allTowns')}</option>
                                {uniqueTowns.map(town => (
                                    <option key={town.id} value={town.id}>
                                        {currentLng.startsWith('ar') ? town.arName : town.enName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Search Input */}
                        <div className="relative">
                            <Search size={14} className="absolute top-1/2 -translate-y-1/2 text-slate-400 start-3" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={t('common:search')}
                                className="py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-none font-bold text-[10px] uppercase tracking-widest outline-none focus:border-primary transition-colors ps-9 pe-4 min-w-[150px]"
                            />
                        </div>

                        {/* Reset All Button */}
                        {canUpdate && (
                            <button
                                type="button"
                                onClick={() => setShowResetConfirm(true)}
                                disabled={deliveryAreas.length === 0}
                                className="flex items-center gap-2 px-4 py-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors font-bold text-[10px] uppercase tracking-widest disabled:opacity-30"
                            >
                                <RotateCcw size={14} />
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

                {deliveryAreas.length === 0 ? (
                    <div className="py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-2 text-slate-400">
                        <Truck size={32} strokeWidth={1} />
                        <p className="font-bold text-sm uppercase tracking-widest">{t('noDeliveryAreas')}</p>
                    </div>
                ) : filteredAreas.length === 0 ? (
                    <div className="py-12 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-2 text-slate-400">
                        <Filter size={24} strokeWidth={1} />
                        <p className="font-bold text-xs uppercase tracking-widest">{t('noAreasFoundForTown')}</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {uniqueTowns
                            .map(town => ({
                                ...town,
                                areas: filteredAreas.filter(a => a.place?.town?.id === town.id)
                            }))
                            .filter(group => group.areas.length > 0)
                            .map((group) => (
                                <div key={group.id} className="space-y-4">
                                    <div className="flex items-center gap-3 pb-3 border-b-2 border-slate-200 dark:border-slate-800">
                                        <h5 className="font-black text-slate-900 dark:text-slate-100 text-base uppercase tracking-widest">
                                            {currentLng.startsWith('ar') ? group.arName : group.enName}
                                        </h5>
                                        <span className="text-sm font-black px-3 py-1 bg-primary text-white rounded-none shadow-sm">
                                            {group.areas.length}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {group.areas.map((area) => (
                                            <div
                                                key={area.id}
                                                className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between hover:border-primary/50 transition-all shadow-sm"
                                            >
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <MapPin size={14} className="text-primary" />
                                                        <span className="font-black text-slate-900 dark:text-slate-100 text-sm italic">
                                                            {currentLng.startsWith('ar') ? area.place?.arName : area.place?.enName}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <div className="relative w-24">
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
                                                                "w-full py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-none font-bold text-xs outline-none focus:border-primary transition-colors ps-6 pe-2",
                                                                !canUpdate && "opacity-60 cursor-not-allowed"
                                                            )}
                                                        />
                                                        <DollarSign size={10} className="absolute top-1/2 -translate-y-1/2 text-slate-400 start-2" />
                                                    </div>
                                                    {canUpdate && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveArea(area.id)}
                                                            className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                                            title={t('common:delete')}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                    </div>
                )}
            </div>

            {/* Reset Confirmation Modal */}
            <StatusModal
                isOpen={showResetConfirm}
                onClose={() => setShowResetConfirm(false)}
                type="confirm"
                title={t('resetDeliveryAreas')}
                message={t('resetDeliveryAreasMessage')}
                onConfirm={handleResetAll}
                confirmText={resetting ? t('common:loading') : t('common:confirm')}
            />
        </div>
    );
};

export default DeliveryAreas;
