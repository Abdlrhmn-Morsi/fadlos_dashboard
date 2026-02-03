import React, { useEffect } from 'react';
import { useRecoilState } from 'recoil';
import {
    Map,
    Plus,
    Search,
    Edit2,
    Trash2,
} from 'lucide-react';
import {
    getCities,
    createCity,
    updateCity,
    deleteCity,
    toggleCityStatus
} from '../api/cities.api';
import { useTranslation } from 'react-i18next';
import {
    citiesState,
    citiesLoadingState,
    citiesSearchState,
    cityModalState,
    cityStatusModalState
} from '../store/cities.store';
import StatusModal from '../../../components/common/StatusModal';
import Modal from '../../../components/common/Modal';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useCache } from '../../../contexts/CacheContext';
import clsx from 'clsx';

const CitiesList = () => {
    const { t } = useTranslation(['cities', 'common']);
    const { isRTL } = useLanguage();
    const { getCache, setCache, invalidateCache } = useCache();
    const [cities, setCities] = useRecoilState(citiesState);
    const [loading, setLoading] = useRecoilState(citiesLoadingState);
    const [search, setSearch] = useRecoilState(citiesSearchState);
    const [modal, setModal] = useRecoilState(cityModalState);
    const [statusModal, setStatusModal] = useRecoilState(cityStatusModalState);

    const openStatus = (type: 'success' | 'error' | 'confirm', title: string, message: string, onConfirm?: () => void) => {
        setStatusModal({ isOpen: true, type, title, message, onConfirm });
    };

    const closeStatus = () => {
        setStatusModal((prev: any) => ({ ...prev, isOpen: false }));
    };

    const fetchCities = async () => {
        setLoading(true);
        try {
            const cacheKey = 'cities';
            const cachedData = getCache<any>(cacheKey);

            if (cachedData) {
                setCities(Array.isArray(cachedData) ? cachedData : []);
                setLoading(false);
                return;
            }

            const data = await getCities({ includeAll: true });
            setCities(data);
            setCache(cacheKey, data);
        } catch (error) {
            console.error('Failed to fetch cities:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCities();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const cityData = {
                enName: modal.currentCity.enName,
                arName: modal.currentCity.arName,
                isActive: modal.currentCity.isActive
            };

            if (modal.isEditing) {
                await updateCity(modal.currentCity.id, cityData);
            } else {
                await createCity(cityData);
            }
            setModal((prev: any) => ({ ...prev, isOpen: false }));
            invalidateCache('cities');
            fetchCities();
            openStatus('success', t('common:success'), modal.isEditing ? t('updatedSuccess') : t('createdSuccess'));
        } catch (error: any) {
            openStatus('error', t('common:error'), error.response?.data?.message || error.message);
        }
    };

    const handleDelete = (id: any) => {
        openStatus(
            'confirm',
            t('deleteCity'),
            t('deleteConfirmation'),
            async () => {
                try {
                    await deleteCity(id);
                    invalidateCache('cities');
                    fetchCities();
                    openStatus('success', t('common:success'), t('deletedSuccess'));
                } catch (error: any) {
                    openStatus('error', t('common:error'), error.response?.data?.message || error.message);
                }
            }
        );
    };

    const handleToggleStatus = async (city: any) => {
        try {
            await toggleCityStatus(city.id, city.isActive);
            invalidateCache('cities');
            fetchCities();
            openStatus('success', t('statusUpdated'), t('statusUpdateMessage', { status: city.isActive ? t('deactivated') : t('activated') }));
        } catch (error: any) {
            openStatus('error', t('updateFailed'), error.response?.data?.message || error.message);
        }
    };

    const filteredCities = cities.filter(city =>
        (city.enName?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (city.arName || '').includes(search)
    );

    return (
        <div className="list-page-container p-6">
            <div className={clsx("flex flex-col md:flex-row md:items-center justify-between gap-4", isRTL && "flex-row-reverse")}>
                <div className={clsx("flex items-center gap-3", isRTL && "flex-row-reverse")}>
                    <div className="p-3 bg-primary-light rounded-none animate-float">
                        <Map size={24} className="text-primary" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{t('title')}</h2>
                </div>
                <div className={clsx("flex flex-wrap gap-3", isRTL && "flex-row-reverse")}>
                    <div className="relative group">
                        <Search size={18} className={clsx("absolute top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors", isRTL ? "right-4" : "left-4")} />
                        <input
                            type="text"
                            placeholder={t('searchPlaceholder')}
                            className={clsx(
                                "py-3 w-full md:w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-none focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-sm group-hover:shadow-md text-slate-900 dark:text-slate-100",
                                isRTL ? "pr-11 pl-4 text-right" : "pl-11 pr-4"
                            )}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button
                        className="btn btn-primary"
                        onClick={() => {
                            setModal({
                                isOpen: true,
                                isEditing: false,
                                currentCity: { id: '', enName: '', arName: '', isActive: true }
                            });
                        }}
                    >
                        <Plus size={18} /> {t('newCenter')}
                    </button>
                </div>
            </div>

            <div className="table-container">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-6">
                        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-none animate-spin" />
                        <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">{t('mapping')}</div>
                    </div>
                ) : (
                    <div className="overflow-x-auto custom-scrollbar">
                        <table
                            dir={isRTL ? 'rtl' : 'ltr'}
                            className={clsx("w-full border-collapse", isRTL ? "text-right" : "text-left")}
                        >
                            <thead>
                                <tr className="bg-slate-50/80 dark:bg-slate-800/80">
                                    <th className="table-header-cell">{t('domainEn')}</th>
                                    <th className="table-header-cell">{t('domainAr')}</th>
                                    <th className="table-header-cell">{t('presence')}</th>
                                    <th className={clsx("table-header-cell", isRTL ? "text-left" : "text-right")}>{t('governance')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                {filteredCities.length > 0 ? (
                                    filteredCities.map((city: any) => (
                                        <tr key={city.id} className="table-row group">
                                            <td className="table-cell">
                                                <div className="text-[15px] font-black text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">{city.enName}</div>
                                            </td>
                                            <td className="table-cell">
                                                <div className="text-sm text-slate-600 dark:text-slate-400 font-bold">{city.arName}</div>
                                            </td>
                                            <td className="table-cell">
                                                <button
                                                    onClick={() => handleToggleStatus(city)}
                                                    className={clsx(
                                                        "inline-flex items-center gap-2 px-3 py-1 rounded-none text-[10px] font-black uppercase tracking-widest transition-all",
                                                        isRTL && "flex-row-reverse",
                                                        city.isActive
                                                            ? 'bg-emerald-50 text-emerald-600 shadow-sm shadow-emerald-100 ring-1 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-900'
                                                            : 'bg-slate-50 text-slate-400 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:ring-slate-700'
                                                    )}
                                                >
                                                    <div className={`w-1.5 h-1.5 rounded-none ${city.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                                                    {city.isActive ? t('deployed') : t('offline')}
                                                </button>
                                            </td>
                                            <td className={clsx("table-cell", isRTL ? "text-left" : "text-right")}>
                                                <div className={clsx("flex gap-2", isRTL ? "justify-start" : "justify-end")}>
                                                    <button
                                                        className="p-3 text-slate-300 hover:text-primary hover:bg-primary-light rounded-none transition-all active:scale-90"
                                                        onClick={() => {
                                                            setModal({
                                                                isOpen: true,
                                                                isEditing: true,
                                                                currentCity: city
                                                            });
                                                        }}
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button
                                                        className="p-3 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-none transition-all active:scale-90"
                                                        onClick={() => handleDelete(city.id)}
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="text-center py-32">
                                            <div className="flex flex-col items-center gap-3">
                                                <Map size={48} className="text-slate-200" />
                                                <div className="text-slate-400 font-bold text-sm tracking-tight italic">{t('noCitiesFound')}</div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <Modal
                isOpen={modal.isOpen}
                onClose={() => setModal((prev: any) => ({ ...prev, isOpen: false }))}
                title={modal.isEditing ? t('modifyCenter') : t('establishCenter')}
            >
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-3">
                        <label className={clsx("text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]", isRTL ? "mr-1 block text-right" : "ml-1")}>
                            {t('universalDesignationEn')}
                        </label>
                        <input
                            type="text"
                            value={modal.currentCity.enName}
                            onChange={(e) => setModal({ ...modal, currentCity: { ...modal.currentCity, enName: e.target.value } })}
                            required
                            placeholder={t('placeholderEn')}
                            className={clsx(
                                "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100",
                                isRTL && "text-right"
                            )}
                        />
                    </div>
                    <div className="space-y-3">
                        <label className={clsx("text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]", isRTL ? "mr-1 block text-right" : "ml-1")}>
                            {t('nativeDesignationAr')}
                        </label>
                        <input
                            type="text"
                            value={modal.currentCity.arName}
                            onChange={(e) => setModal({ ...modal, currentCity: { ...modal.currentCity, arName: e.target.value } })}
                            required
                            placeholder={t('placeholderAr')}
                            className={clsx(
                                "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100",
                                isRTL && "text-right"
                            )}
                        />
                    </div>
                    <div className={clsx(
                        "flex items-center gap-4 bg-slate-50/50 dark:bg-slate-800/50 p-5 rounded-none border border-slate-100 dark:border-slate-700 transition-all hover:bg-slate-50 dark:hover:bg-slate-800",
                        isRTL && "flex-row-reverse"
                    )}>
                        <input
                            type="checkbox"
                            checked={modal.currentCity.isActive}
                            onChange={(e) => setModal({ ...modal, currentCity: { ...modal.currentCity, isActive: e.target.checked } })}
                            id="city-active"
                            className="w-6 h-6 rounded-none border-slate-300 dark:border-slate-600 text-primary shadow-sm"
                        />
                        <label htmlFor="city-active" className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">{t('activeDeployment')}</label>
                    </div>
                    <div className={clsx("flex items-center gap-3 pt-4", isRTL ? "justify-start flex-row-reverse" : "justify-end")}>
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => setModal((prev: any) => ({ ...prev, isOpen: false }))}
                        >
                            {t('abort')}
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                        >
                            {modal.isEditing ? t('confirmChanges') : t('finalizeCreation')}
                        </button>
                    </div>
                </form>
            </Modal>


            <StatusModal
                isOpen={statusModal.isOpen}
                onClose={closeStatus}
                type={statusModal.type}
                title={statusModal.title}
                message={statusModal.message}
                onConfirm={statusModal.onConfirm}
            />
        </div>
    );
};

export default CitiesList;
