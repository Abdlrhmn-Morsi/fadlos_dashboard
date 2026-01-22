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
    RotateCcw
} from 'lucide-react';
import clsx from 'clsx';
import { getCities } from '../../cities/api/cities.api';
import {
    assignTownToStore,
    getMyStoreDeliveryAreas,
    updateDeliveryArea,
    removeDeliveryArea,
    resetMyStoreDeliveryAreas
} from '../../towns/api/towns.api';
import { toast } from '../../../utils/toast';
import StatusModal from '../../../components/common/StatusModal';

const DeliveryAreas = () => {
    const { t } = useTranslation(['stores', 'common']);
    const [loading, setLoading] = useState(true);
    const [cities, setCities] = useState<any[]>([]);
    const [deliveryAreas, setDeliveryAreas] = useState<any[]>([]);
    const [selectedCityId, setSelectedCityId] = useState<string>('');
    const [defaultPrice, setDefaultPrice] = useState<number>(0);
    const [saving, setSaving] = useState(false);

    // Enhancement states
    const [filterTownId, setFilterTownId] = useState<string>('all');
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [resetting, setResetting] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [allCities, areas] = await Promise.all([
                getCities({ limit: 1000 }),
                getMyStoreDeliveryAreas()
            ]);
            setCities(allCities);
            setDeliveryAreas(areas);
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

    const handleAssignCity = async () => {
        if (!selectedCityId) return;
        setSaving(true);
        try {
            await assignTownToStore({
                townId: selectedCityId,
                defaultPrice: defaultPrice
            });
            toast.success(t('common:success'));
            fetchData();
            setSelectedCityId('');
            setDefaultPrice(0);
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
        } catch (error) {
            console.error('Failed to reset delivery areas:', error);
            toast.error(t('common:errorUpdatingData'));
        } finally {
            setResetting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
                <Loader2 size={32} className="text-primary animate-spin" />
                <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">{t('common:loading')}</div>
            </div>
        );
    }

    const currentLng = localStorage.getItem('i18nextLng') || 'en';

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

    const filteredAreas = filterTownId === 'all'
        ? deliveryAreas
        : deliveryAreas.filter(area => area.place?.town?.id === filterTownId);

    return (
        <div className="space-y-8">
            {/* Add New Delivery Area Section */}
            <div className="bg-slate-50 dark:bg-slate-800/30 p-6 border border-slate-200 dark:border-slate-800 rounded-none">
                <h4 className="font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest text-xs mb-4 flex items-center gap-2">
                    <Plus size={14} className="text-primary" />
                    {t('addDeliveryCity', { defaultValue: 'Add Delivery City' })}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('common:city')}</label>
                        <select
                            value={selectedCityId}
                            onChange={(e) => setSelectedCityId(e.target.value)}
                            className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-none font-bold text-sm outline-none focus:border-primary transition-colors"
                        >
                            <option value="">{t('selectCity', { defaultValue: 'Select City' })}</option>
                            {cities.map(city => (
                                <option key={city.id} value={city.id}>
                                    {currentLng === 'ar' ? city.arName : city.enName}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('defaultPrice', { defaultValue: 'Default Price' })}</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={defaultPrice}
                                onChange={(e) => setDefaultPrice(Number(e.target.value))}
                                className="w-full pl-8 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-none font-bold text-sm outline-none focus:border-primary transition-colors"
                                min="0"
                            />
                            <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        </div>
                    </div>
                    <div className="flex items-end">
                        <button
                            type="button"
                            onClick={handleAssignCity}
                            disabled={!selectedCityId || saving}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-none shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:translate-y-0"
                        >
                            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                            {t('addArea', { defaultValue: 'Add Area' })}
                        </button>
                    </div>
                </div>
                <p className="mt-4 text-[10px] text-slate-500 font-medium">
                    {t('addAreaNote', { defaultValue: '* Adding a city will automatically select all its towns with the default price. You can customize them below.' })}
                </p>
            </div>

            {/* List of Delivery Areas */}
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <h4 className="font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest text-xs flex items-center gap-2">
                            <Truck size={14} className="text-primary" />
                            {t('activeDeliveryAreas', { defaultValue: 'Active Delivery Areas' })}
                        </h4>
                        <div className="text-[10px] font-black px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-none">
                            {filteredAreas.length}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Town Filter */}
                        <div className="relative">
                            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <select
                                value={filterTownId}
                                onChange={(e) => setFilterTownId(e.target.value)}
                                className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-none font-bold text-[10px] uppercase tracking-widest outline-none focus:border-primary transition-colors"
                            >
                                <option value="all">{t('allTowns', { defaultValue: 'All Towns' })}</option>
                                {uniqueTowns.map(town => (
                                    <option key={town.id} value={town.id}>
                                        {currentLng === 'ar' ? town.arName : town.enName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Reset All Button */}
                        <button
                            type="button"
                            onClick={() => setShowResetConfirm(true)}
                            disabled={deliveryAreas.length === 0}
                            className="flex items-center gap-2 px-4 py-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors font-bold text-[10px] uppercase tracking-widest disabled:opacity-30"
                        >
                            <RotateCcw size={14} />
                            {t('resetAll', { defaultValue: 'Reset All' })}
                        </button>

                        <button
                            type="button"
                            onClick={fetchData}
                            className="p-2 text-slate-400 hover:text-primary transition-colors"
                        >
                            <RefreshCw size={14} />
                        </button>
                    </div>
                </div>

                {deliveryAreas.length === 0 ? (
                    <div className="py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-2 text-slate-400">
                        <Truck size={32} strokeWidth={1} />
                        <p className="font-bold text-sm uppercase tracking-widest">{t('noDeliveryAreas', { defaultValue: 'No Delivery Areas Configured' })}</p>
                    </div>
                ) : filteredAreas.length === 0 ? (
                    <div className="py-12 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-2 text-slate-400">
                        <Filter size={24} strokeWidth={1} />
                        <p className="font-bold text-xs uppercase tracking-widest">{t('noAreasFoundForTown', { defaultValue: 'No areas found for this town' })}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredAreas.map((area) => (
                            <div
                                key={area.id}
                                className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between hover:border-primary/50 transition-all shadow-sm"
                            >
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <MapPin size={14} className="text-primary" />
                                        <span className="font-black text-slate-900 dark:text-slate-100 text-sm italic">
                                            {currentLng === 'ar' ? area.place?.arName : area.place?.enName}
                                        </span>
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                                        {currentLng === 'ar' ? area.place?.town?.arName : area.place?.town?.enName}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="relative w-24">
                                        <input
                                            type="number"
                                            defaultValue={area.price}
                                            onBlur={(e) => {
                                                const newPrice = Number(e.target.value);
                                                if (newPrice !== area.price) {
                                                    handleUpdatePrice(area.id, newPrice);
                                                }
                                            }}
                                            className="w-full pl-6 pr-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-none font-bold text-xs outline-none focus:border-primary transition-colors"
                                        />
                                        <DollarSign size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveArea(area.id)}
                                        className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                        title={t('common:delete')}
                                    >
                                        <Trash2 size={16} />
                                    </button>
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
                title={t('resetDeliveryAreas', { defaultValue: 'Reset Delivery Areas' })}
                message={t('resetDeliveryAreasMessage', { defaultValue: 'Are you sure you want to clear all configured delivery areas? This action cannot be undone.' })}
                onConfirm={handleResetAll}
                confirmText={resetting ? t('common:loading') : t('common:confirm')}
            />
        </div>
    );
};

export default DeliveryAreas;
