import React from 'react';
import { useForm } from 'react-hook-form';
import { CreateBranchDto, Branch } from '../../../types/branch';
import { getMyStoreDeliveryAreas } from '../../../features/towns/api/towns.api';
import { Phone, Home, Globe, Loader2, MapPin, Star, Zap, ExternalLink } from 'lucide-react';

import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../../contexts/LanguageContext';
import toolsApi from '../../../services/tools.api';
import { toast } from '../../../utils/toast';
import clsx from 'clsx';

interface BranchFormProps {
    initialData?: Branch;
    onSubmit: (data: CreateBranchDto) => void;
    isLoading: boolean;
}

export const BranchForm: React.FC<BranchFormProps> = ({ initialData, onSubmit, isLoading }) => {
    const { t } = useTranslation(['branches', 'common']);
    const { isRTL } = useLanguage();
    const [isTranslating, setIsTranslating] = React.useState(false);

    const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<CreateBranchDto>({
        defaultValues: {
            addressAr: '',
            addressEn: '',
            phone: '',
            isActive: true,
            link: '',
            townId: '',
            placeId: '',
            isMainBranch: false,
            latitude: undefined,
            longitude: undefined,
        },
    });

    React.useEffect(() => {
        if (initialData) {
            reset({
                addressAr: initialData.addressAr || '',
                addressEn: initialData.addressEn || '',
                phone: initialData.phone || '',
                isActive: initialData.isActive ?? true,
                link: initialData.link || '',
                townId: initialData.townId || initialData.town?.id || '',
                placeId: initialData.placeId || initialData.place?.id || '',
                isMainBranch: initialData.isMainBranch || false,
                latitude: initialData.latitude ? Number(initialData.latitude) : undefined,
                longitude: initialData.longitude ? Number(initialData.longitude) : undefined,
            });
        } else {
            reset({
                addressAr: '',
                addressEn: '',
                phone: '',
                isActive: true,
                link: '',
                townId: '',
                placeId: '',
                isMainBranch: false,
                latitude: undefined,
                longitude: undefined,
            });
        }
    }, [initialData, reset]);

    const [towns, setTowns] = React.useState<any[]>([]);
    const [places, setPlaces] = React.useState<any[]>([]);
    const [deliveryAreas, setDeliveryAreas] = React.useState<any[]>([]);
    const [loadingTowns, setLoadingTowns] = React.useState(false);
    const [loadingPlaces, setLoadingPlaces] = React.useState(false);

    const selectedTownId = watch('townId');

    // Fetch delivery areas once
    React.useEffect(() => {
        const fetchDeliveryAreas = async () => {
            try {
                setLoadingTowns(true);
                const areas = await getMyStoreDeliveryAreas();
                setDeliveryAreas(areas);

                const uniqueTownsMap = new Map();
                areas.forEach((area: any) => {
                    const town = area.place.town;
                    if (!uniqueTownsMap.has(town.id)) {
                        uniqueTownsMap.set(town.id, town);
                    }
                });
                setTowns(Array.from(uniqueTownsMap.values()));
            } catch (error) {
                console.error('Failed to fetch delivery areas:', error);
                toast.error(t('failedToFetchTowns', 'Failed to load delivery areas'));
            } finally {
                setLoadingTowns(false);
            }
        };
        fetchDeliveryAreas();
    }, [t]);

    // Restore Town selection when towns list is populated
    React.useEffect(() => {
        const townId = initialData?.townId || initialData?.town?.id;
        if (townId && towns.length > 0) {
            const hasInitialTown = towns.some((t: any) => t.id === townId);
            if (hasInitialTown) {
                setValue('townId', townId, { shouldValidate: true });
            }
        }
    }, [towns, initialData, setValue]);

    // Filter places based on town selection
    React.useEffect(() => {
        if (!selectedTownId || deliveryAreas.length === 0) {
            setPlaces([]);
            return;
        }
        const townPlaces = deliveryAreas
            .filter((area: any) => area.place.town.id === selectedTownId)
            .map((area: any) => area.place);
        setPlaces(townPlaces);
    }, [selectedTownId, deliveryAreas]);

    // Restore Place selection when places list is populated
    React.useEffect(() => {
        const townId = initialData?.townId || initialData?.town?.id;
        const placeId = initialData?.placeId || initialData?.place?.id;
        if (placeId && places.length > 0 && selectedTownId === townId) {
            const hasInitialPlace = places.some(p => p.id === placeId);
            if (hasInitialPlace) {
                setValue('placeId', placeId, { shouldValidate: true });
            }
        }
    }, [places, initialData, selectedTownId, setValue]);

    const addressEn = watch('addressEn');

    const handleTranslate = async (value: string) => {
        if (!value || addressEn) return;
        try {
            setIsTranslating(true);
            const res: any = await toolsApi.translate(value, 'ar', 'en');
            const translated = typeof res === 'string' ? res : res.translatedText;
            if (translated) {
                setValue('addressEn', translated);
                toast.success(t('autoTranslated'));
            }
        } catch (error) {
            console.error("Translation error", error);
        } finally {
            setIsTranslating(false);
        }
    };

    const extractCoordinates = () => {
        const link = watch('link');
        if (!link) {
            toast.error(t('linkRequired'));
            return;
        }

        // Try to match @lat,lng format
        const atMatch = link.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (atMatch) {
            setValue('latitude', parseFloat(atMatch[1]));
            setValue('longitude', parseFloat(atMatch[2]));
            toast.success(t('coordinatesExtracted'));
            return;
        }

        // Try to match q=lat,lng format
        const qMatch = link.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (qMatch) {
            setValue('latitude', parseFloat(qMatch[1]));
            setValue('longitude', parseFloat(qMatch[2]));
            toast.success(t('coordinatesExtracted'));
            return;
        }

        // Try to match search/lat,lng format
        const searchMatch = link.match(/search\/(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (searchMatch) {
            setValue('latitude', parseFloat(searchMatch[1]));
            setValue('longitude', parseFloat(searchMatch[2]));
            toast.success(t('coordinatesExtracted'));
            return;
        }

        toast.error(t('extractionFailed'));
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-2">
            {!loadingTowns && deliveryAreas.length === 0 && (
                <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded p-4 mb-6">
                    <p className="text-sm font-bold text-amber-600 dark:text-amber-400">
                        {t('noDeliveryAreasDefined')}
                    </p>
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">
                        {t('town')} <span className="text-rose-500">*</span>
                    </label>
                    <div className="group relative">
                        <div className={clsx("absolute inset-y-0 flex items-center pointer-events-none transition-colors group-focus-within:text-indigo-500 px-4", isRTL ? "right-0" : "left-0")}>
                            <MapPin className="h-5 w-5 text-gray-400 group-hover:scale-110 transition-transform" />
                        </div>
                        <select
                            {...register('townId', { required: t('townRequired') })}
                            className={clsx(
                                "block w-full py-4 bg-gray-50 dark:bg-gray-800 border-none rounded text-sm font-medium transition-all focus:ring-2 focus:ring-indigo-500/20 shadow-inner appearance-none",
                                isRTL ? "pr-12 pl-4 text-right" : "pl-12 pr-4",
                                errors.townId ? "ring-2 ring-rose-500/20" : ""
                            )}
                        >
                            <option value="">{t('town')}</option>
                            {towns.map(town => (
                                <option key={town.id} value={town.id}>
                                    {isRTL ? town.arName : town.enName}
                                </option>
                            ))}
                        </select>
                        {loadingTowns && (
                            <div className={clsx("absolute inset-y-0 flex items-center px-4", isRTL ? "left-0" : "right-0")}>
                                <Loader2 className="h-4 w-4 text-indigo-500 animate-spin" />
                            </div>
                        )}
                    </div>
                    {errors.townId && <p className="text-[10px] font-bold text-rose-500 mt-1 ml-1">{errors.townId.message}</p>}
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">
                        {t('place')} <span className="text-rose-500">*</span>
                    </label>
                    <div className="group relative">
                        <div className={clsx("absolute inset-y-0 flex items-center pointer-events-none transition-colors group-focus-within:text-indigo-500 px-4", isRTL ? "right-0" : "left-0")}>
                            <MapPin className="h-5 w-5 text-gray-400 group-hover:scale-110 transition-transform" />
                        </div>
                        <select
                            {...register('placeId', { required: t('placeRequired') })}
                            className={clsx(
                                "block w-full py-4 bg-gray-50 dark:bg-gray-800 border-none rounded text-sm font-medium transition-all focus:ring-2 focus:ring-indigo-500/20 shadow-inner appearance-none",
                                isRTL ? "pr-12 pl-4 text-right" : "pl-12 pr-4",
                                errors.placeId ? "ring-2 ring-rose-500/20" : "",
                                !selectedTownId ? "opacity-50 cursor-not-allowed" : ""
                            )}
                            disabled={!selectedTownId}
                        >
                            <option value="">{t('place')}</option>
                            {places.map(place => (
                                <option key={place.id} value={place.id}>
                                    {isRTL ? place.arName : place.enName}
                                </option>
                            ))}
                        </select>
                        {loadingPlaces && (
                            <div className={clsx("absolute inset-y-0 flex items-center px-4", isRTL ? "left-0" : "right-0")}>
                                <Loader2 className="h-4 w-4 text-indigo-500 animate-spin" />
                            </div>
                        )}
                    </div>
                    {errors.placeId && <p className="text-[10px] font-bold text-rose-500 mt-1 ml-1">{errors.placeId.message}</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">
                        {t('addressAr')} <span className="text-rose-500">*</span>
                    </label>
                    <div className="group relative">
                        <div className={clsx("absolute inset-y-0 flex items-center pointer-events-none transition-colors group-focus-within:text-indigo-500 px-4", isRTL ? "right-0" : "left-0")}>
                            <Home className="h-5 w-5 text-gray-400 group-hover:scale-110 transition-transform" />
                        </div>
                        <input
                            type="text"
                            {...register('addressAr', { required: t('addressArRequired') })}
                            onBlur={(e) => handleTranslate(e.target.value)}
                            className={clsx(
                                "block w-full py-4 bg-gray-50 dark:bg-gray-800 border-none rounded text-sm font-medium transition-all focus:ring-2 focus:ring-indigo-500/20 shadow-inner",
                                isRTL ? "pr-12 pl-4 text-right" : "pl-12 pr-4",
                                errors.addressAr ? "ring-2 ring-rose-500/20" : ""
                            )}
                            placeholder={t('addressAr')}
                        />
                    </div>
                    {errors.addressAr && <p className="text-[10px] font-bold text-rose-500 mt-1 ml-1">{errors.addressAr.message}</p>}
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">
                        {t('addressEn')} <span className="text-rose-500">*</span>
                    </label>
                    <div className="group relative">
                        <div className={clsx("absolute inset-y-0 flex items-center pointer-events-none transition-colors group-focus-within:text-indigo-500 px-4", isRTL ? "right-0" : "left-0")}>
                            <Home className="h-5 w-5 text-gray-400 group-hover:scale-110 transition-transform" />
                        </div>
                        <input
                            type="text"
                            {...register('addressEn', { required: t('addressEnRequired') })}
                            className={clsx(
                                "block w-full py-4 bg-gray-50 dark:bg-gray-800 border-none rounded text-sm font-medium transition-all focus:ring-2 focus:ring-indigo-500/20 shadow-inner",
                                isRTL ? "pr-12 pl-4" : "pl-12 pr-4",
                                errors.addressEn ? "ring-2 ring-rose-500/20" : ""
                            )}
                            placeholder={t('addressEn')}
                        />
                        {isTranslating && (
                            <div className={clsx("absolute inset-y-0 flex items-center px-4", isRTL ? "left-0" : "right-0")}>
                                <Loader2 className="h-4 w-4 text-indigo-500 animate-spin" />
                            </div>
                        )}
                    </div>
                    {errors.addressEn && <p className="text-[10px] font-bold text-rose-500 mt-1 ml-1">{errors.addressEn.message}</p>}
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">
                    {t('phone')} <span className="text-rose-500">*</span>
                </label>
                <div className="group relative">
                    <div className={clsx("absolute inset-y-0 flex items-center pointer-events-none transition-colors group-focus-within:text-indigo-500 px-4", isRTL ? "right-0" : "left-0")}>
                        <Phone className="h-5 w-5 text-gray-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <input
                        type="text"
                        {...register('phone', { required: t('phoneRequired') })}
                        className={clsx(
                            "block w-full py-4 bg-gray-50 dark:bg-gray-800 border-none rounded text-sm font-medium transition-all focus:ring-2 focus:ring-indigo-500/20 shadow-inner",
                            isRTL ? "pr-12 pl-4 text-left" : "pl-12 pr-4",
                            errors.phone ? "ring-2 ring-rose-500/20" : ""
                        )}
                        placeholder="+1 234 567 890"
                    />
                </div>
                {errors.phone && <p className="text-[10px] font-bold text-rose-500 mt-1 ml-1">{errors.phone.message}</p>}
            </div>

            <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">
                    {t('link')} <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-4">
                    <div className="group relative flex-1">
                        <div className={clsx("absolute inset-y-0 flex items-center pointer-events-none transition-colors group-focus-within:text-indigo-500 px-4", isRTL ? "right-0" : "left-0")}>
                            <Globe className="h-5 w-5 text-gray-400 group-hover:scale-110 transition-transform" />
                        </div>
                        <input
                            type="url"
                            {...register('link', { required: t('linkRequired') })}
                            className={clsx(
                                "block w-full py-4 bg-gray-50 dark:bg-gray-800 border-none rounded text-sm font-medium transition-all focus:ring-2 focus:ring-indigo-500/20 shadow-inner",
                                isRTL ? "pr-12 pl-4 text-left" : "pl-12 pr-4",
                                errors.link ? "ring-2 ring-rose-500/20" : ""
                            )}
                            placeholder="https://maps.google.com/..."
                        />
                    </div>
                    <button
                        type="button"
                        onClick={extractCoordinates}
                        className="btn btn-secondary px-6 flex items-center gap-2 group/extract"
                        title={t('extractCoords')}
                    >
                        <Zap size={18} className="text-amber-500 group-hover/extract:scale-125 transition-transform" />
                        <span className="hidden md:inline">{t('extract')}</span>
                    </button>
                </div>
                <p className="px-1 text-[10px] font-medium text-gray-500 dark:text-gray-400 italic">
                    {t('linkDescription')}
                </p>
                {errors.link && <p className="text-[10px] font-bold text-rose-500 mt-1 ml-1">{errors.link.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">
                        {t('latitude')} <span className="text-rose-500">*</span>
                    </label>
                    <div className="group relative">
                        <div className={clsx("absolute inset-y-0 flex items-center pointer-events-none transition-colors group-focus-within:text-indigo-500 px-4", isRTL ? "right-0" : "left-0")}>
                            <MapPin className="h-5 w-5 text-gray-400 group-hover:scale-110 transition-transform" />
                        </div>
                        <input
                            type="number"
                            step="any"
                            {...register('latitude', {
                                required: t('latRequired'),
                                valueAsNumber: true
                            })}
                            className={clsx(
                                "block w-full py-4 bg-gray-50 dark:bg-gray-800 border-none rounded text-sm font-medium transition-all focus:ring-2 focus:ring-indigo-500/20 shadow-inner",
                                isRTL ? "pr-12 pl-4 text-left" : "pl-12 pr-4",
                                errors.latitude ? "ring-2 ring-rose-500/20" : ""
                            )}
                            placeholder="0.0000"
                        />
                    </div>
                    {errors.latitude && <p className="text-[10px] font-bold text-rose-500 mt-1 ml-1">{errors.latitude.message}</p>}
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">
                        {t('longitude')} <span className="text-rose-500">*</span>
                    </label>
                    <div className="group relative">
                        <div className={clsx("absolute inset-y-0 flex items-center pointer-events-none transition-colors group-focus-within:text-indigo-500 px-4", isRTL ? "right-0" : "left-0")}>
                            <Globe className="h-5 w-5 text-gray-400 group-hover:scale-110 transition-transform" />
                        </div>
                        <input
                            type="number"
                            step="any"
                            {...register('longitude', {
                                required: t('lngRequired'),
                                valueAsNumber: true
                            })}
                            className={clsx(
                                "block w-full py-4 bg-gray-50 dark:bg-gray-800 border-none rounded text-sm font-medium transition-all focus:ring-2 focus:ring-indigo-500/20 shadow-inner",
                                isRTL ? "pr-12 pl-4 text-left" : "pl-12 pr-4",
                                errors.longitude ? "ring-2 ring-rose-500/20" : ""
                            )}
                            placeholder="0.0000"
                        />
                    </div>
                    {errors.longitude && <p className="text-[10px] font-bold text-rose-500 mt-1 ml-1">{errors.longitude.message}</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <label htmlFor="isActive" className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded border border-gray-100 dark:border-gray-700/50 flex items-center justify-between group/status cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex gap-4 items-center">
                        <div className={clsx(
                            "p-3 rounded transition-all duration-500",
                            watch('isActive')
                                ? "bg-emerald-500/10 text-emerald-600"
                                : "bg-gray-500/10 text-gray-500"
                        )}>
                            <div className={clsx(
                                "h-3 w-3 rounded-full",
                                watch('isActive') ? "bg-emerald-500 animate-pulse" : "bg-gray-400"
                            )} />
                        </div>
                        <div>
                            <span className="font-bold text-gray-900 dark:text-white select-none">
                                {t('activeStatus')}
                            </span>
                        </div>
                    </div>
                    <div className="relative inline-flex items-center">
                        <input
                            id="isActive"
                            type="checkbox"
                            {...register('isActive')}
                            className="sr-only peer"
                        />
                        <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500 dark:peer-checked:bg-emerald-500"></div>
                    </div>
                </label>

                <label htmlFor="isMainBranch" className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded border border-gray-100 dark:border-gray-700/50 flex items-center justify-between group/status cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex gap-4 items-center">
                        <div className={clsx(
                            "p-3 rounded transition-all duration-500",
                            watch('isMainBranch')
                                ? "bg-amber-500/10 text-amber-600"
                                : "bg-gray-500/10 text-gray-500"
                        )}>
                            <Star className={clsx(
                                "h-5 w-5",
                                watch('isMainBranch') ? "fill-amber-500 text-amber-500" : "text-gray-400"
                            )} />
                        </div>
                        <div>
                            <span className="font-bold text-gray-900 dark:text-white select-none">
                                {t('isMainBranch')}
                            </span>
                        </div>
                    </div>
                    <div className="relative inline-flex items-center">
                        <input
                            id="isMainBranch"
                            type="checkbox"
                            {...register('isMainBranch')}
                            className="sr-only peer"
                        />
                        <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-amber-500 dark:peer-checked:bg-amber-500"></div>
                    </div>
                </label>
            </div>

            <div className="flex justify-end pt-4">
                <button
                    type="submit"
                    disabled={isLoading}
                    className="group relative inline-flex items-center justify-center rounded bg-indigo-600 px-10 py-4 text-sm font-bold text-white shadow-xl shadow-indigo-500/20 transition-all duration-300 hover:bg-indigo-700 hover:-translate-y-1 active:scale-95 disabled:opacity-50 overflow-hidden min-w-[160px]"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        t('saveBranch')
                    )}
                </button>
            </div>
        </form>
    );

};
