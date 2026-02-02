import React, { useEffect } from 'react';
import { useRecoilState } from 'recoil';
import {
    MapPin,
    Plus,
    Search,
    Edit2,
    Trash2,
    Filter
} from 'lucide-react';
import {
    getTowns,
    createTown,
    updateTown,
    deleteTown,
    toggleTownStatus
} from '../api/towns.api';
import { useTranslation } from 'react-i18next';
import {
    townsState,
    townsLoadingState,
    townsSearchState,
    townsCityFilterState,
    townModalState,
    townStatusModalState
} from '../store/towns.store';
import { citiesState } from '../../cities/store/cities.store';
import { getCities } from '../../cities/api/cities.api';
import StatusModal from '../../../components/common/StatusModal';
import Modal from '../../../components/common/Modal';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useCache } from '../../../contexts/CacheContext';
import clsx from 'clsx';

const TownsList = () => {
    const { t } = useTranslation(['towns', 'common']);
    const { isRTL } = useLanguage();
    const { getCache, setCache, invalidateCache } = useCache();
    const [towns, setTowns] = useRecoilState(townsState);
    const [cities, setCities] = useRecoilState(citiesState);
    const [loading, setLoading] = useRecoilState(townsLoadingState);
    const [search, setSearch] = useRecoilState(townsSearchState);
    const [cityFilter, setCityFilter] = useRecoilState(townsCityFilterState);
    const [modal, setModal] = useRecoilState(townModalState);
    const [statusModal, setStatusModal] = useRecoilState(townStatusModalState);

    const openStatus = (type: 'success' | 'error' | 'confirm', title: string, message: string, onConfirm?: () => void) => {
        setStatusModal({ isOpen: true, type, title, message, onConfirm });
    };

    const closeStatus = () => {
        setStatusModal((prev: any) => ({ ...prev, isOpen: false }));
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            // Check cache for towns
            const townsCacheKey = 'towns';
            const citiesCacheKey = 'cities';

            const cachedTowns = getCache<any>(townsCacheKey);
            const cachedCities = getCache<any>(citiesCacheKey);

            if (cachedTowns && cachedCities) {
                setTowns(Array.isArray(cachedTowns) ? cachedTowns : []);
                setCities(Array.isArray(cachedCities) ? cachedCities : []);
                setLoading(false);
                return;
            }

            const [townsData, citiesData] = await Promise.all([
                getTowns({ includeAll: true }),
                getCities({ includeAll: true })
            ]);
            setTowns(townsData);
            setCities(citiesData);

            // Cache the responses
            setCache(townsCacheKey, townsData);
            setCache(citiesCacheKey, citiesData);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const townData = {
                enName: modal.currentTown.enName,
                arName: modal.currentTown.arName,
                isActive: modal.currentTown.isActive,
                townId: modal.currentTown.townId
            };

            if (modal.isEditing) {
                await updateTown(modal.currentTown.id, townData);
            } else {
                await createTown(townData);
            }
            setModal((prev: any) => ({ ...prev, isOpen: false }));
            // Invalidate cache after create/update
            invalidateCache('towns');
            fetchData();
            openStatus('success', t('common:success'), modal.isEditing ? t('updatedSuccess') : t('createdSuccess'));
        } catch (error: any) {
            openStatus('error', t('common:error'), error.response?.data?.message || error.message);
        }
    };

    const handleDelete = (id: any) => {
        openStatus(
            'confirm',
            t('deleteTown'),
            t('deleteConfirmation'),
            async () => {
                try {
                    await deleteTown(id);
                    // Invalidate cache after delete
                    invalidateCache('towns');
                    fetchData();
                    openStatus('success', t('common:success'), t('deletedSuccess'));
                } catch (error: any) {
                    openStatus('error', t('common:error'), error.response?.data?.message || error.message);
                }
            }
        );
    };

    const handleToggleStatus = async (town: any) => {
        try {
            await toggleTownStatus(town.id, town.isActive);
            // Invalidate cache after status toggle
            invalidateCache('towns');
            fetchData();
            openStatus('success', t('statusUpdated'), t('statusUpdateMessage', { status: town.isActive ? t('deactivated') : t('activated') }));
        } catch (error: any) {
            openStatus('error', t('updateFailed'), error.response?.data?.message || error.message);
        }
    };

    const filteredTowns = towns.filter(town => {
        const matchesSearch = (town.enName?.toLowerCase() || '').includes(search.toLowerCase()) ||
            (town.arName || '').includes(search);
        const townCityId = town.town?.id || town.townId;
        const matchesCity = cityFilter === 'all' || townCityId === cityFilter;
        return matchesSearch && matchesCity;
    });

    return (
        <div className="list-page-container p-6">
            <div className={clsx("flex flex-col lg:flex-row lg:items-center justify-between gap-4", isRTL && "flex-row-reverse")}>
                <div className={clsx("flex items-center gap-3", isRTL && "flex-row-reverse")}>
                    <div className="p-3 bg-primary-light rounded-none animate-float">
                        <MapPin size={24} className="text-primary" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{t('title')}</h2>
                </div>
                <div className={clsx("flex flex-wrap gap-3", isRTL && "flex-row-reverse")}>
                    <div className="relative group min-w-[180px]">
                        <Filter size={18} className={clsx("absolute top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-primary transition-colors", isRTL ? "right-4" : "left-4")} />
                        <select
                            className={clsx(
                                "appearance-none py-3 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-none focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none cursor-pointer transition-all shadow-sm group-hover:shadow-md text-slate-900 dark:text-slate-100",
                                isRTL ? "pr-11 pl-12 text-right" : "pl-11 pr-12"
                            )}
                            value={cityFilter}
                            onChange={(e) => setCityFilter(e.target.value)}
                        >
                            <option value="all">{t('cityFilter')}</option>
                            {cities.map(city => (
                                <option key={city.id} value={city.id}>{isRTL ? city.arName || city.enName : city.enName}</option>
                            ))}
                        </select>
                    </div>
                    <div className="relative group">
                        <Search size={18} className={clsx("absolute top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors", isRTL ? "right-4" : "left-4")} />
                        <input
                            type="text"
                            placeholder={t('searchPlaceholder')}
                            className={clsx(
                                "py-3 w-full md:w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-none focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-sm group-hover:shadow-md text-slate-900 dark:text-slate-100",
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
                                currentTown: { enName: '', arName: '', isActive: true, townId: '' } as any
                            });
                        }}
                    >
                        <Plus size={18} /> {t('addTown')}
                    </button>
                </div>
            </div>

            <div className="table-container">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-6">
                        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-none animate-spin" />
                        <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">{t('navigating')}</div>
                    </div>
                ) : (
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className={clsx("w-full border-collapse", isRTL ? "text-right" : "text-left")}>
                            <thead>
                                <tr className="bg-slate-50/80 dark:bg-slate-800/80">
                                    <th className="table-header-cell">{t('sectorEn')}</th>
                                    <th className="table-header-cell">{t('sectorAr')}</th>
                                    <th className="table-header-cell">{t('mapping')}</th>
                                    <th className="table-header-cell">{t('deployment')}</th>
                                    <th className={clsx("table-header-cell", isRTL ? "text-left" : "text-right")}>{t('governance')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                {filteredTowns.length > 0 ? (
                                    filteredTowns.map((town: any) => (
                                        <tr key={town.id} className="table-row group">
                                            <td className="table-cell">
                                                <div className="text-[15px] font-black text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">{town.enName}</div>
                                            </td>
                                            <td className="table-cell">
                                                <div className="text-sm text-slate-600 dark:text-slate-400 font-bold">{town.arName}</div>
                                            </td>
                                            <td className="table-cell">
                                                <span className="inline-flex items-center px-3 py-1 rounded-none text-[10px] font-black uppercase tracking-wider bg-primary-light text-primary">
                                                    {isRTL
                                                        ? (town.town?.arName || town.city?.arName || town.town?.enName || town.city?.enName || t('universal'))
                                                        : (town.town?.enName || town.city?.enName || t('universal'))}
                                                </span>
                                            </td>
                                            <td className="table-cell">
                                                <button
                                                    onClick={() => handleToggleStatus(town)}
                                                    className={clsx(
                                                        "inline-flex items-center gap-2 px-3 py-1 rounded-none text-[10px] font-black uppercase tracking-widest transition-all",
                                                        isRTL && "flex-row-reverse",
                                                        town.isActive
                                                            ? 'bg-emerald-50 text-emerald-600 shadow-sm shadow-emerald-100 ring-1 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-900'
                                                            : 'bg-slate-50 text-slate-400 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:ring-slate-700'
                                                    )}
                                                >
                                                    <div className={`w-1.5 h-1.5 rounded-none ${town.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                                                    {town.isActive ? t('active') : t('halted')}
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
                                                                currentTown: { ...town, townId: town.town?.id || town.townId || town.cityId } as any
                                                            });
                                                        }}
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button
                                                        className="p-3 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-none transition-all active:scale-90"
                                                        onClick={() => handleDelete(town.id)}
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="text-center py-32">
                                            <div className="flex flex-col items-center gap-3">
                                                <MapPin size={48} className="text-slate-200" />
                                                <div className="text-slate-400 font-bold text-sm tracking-tight italic">{t('noTownsFound')}</div>
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
                title={modal.isEditing ? t('reconfigureSector') : t('integrateSector')}
            >
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-3">
                        <label className={clsx("text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]", isRTL ? "mr-1 block text-right" : "ml-1")}>
                            {t('domainMapping')}
                        </label>
                        <select
                            className={clsx(
                                "w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-none focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all cursor-pointer font-bold text-slate-700 dark:text-slate-300",
                                isRTL && "text-right"
                            )}
                            value={modal.currentTown.townId}
                            onChange={(e) => setModal({ ...modal, currentTown: { ...modal.currentTown, townId: e.target.value } })}
                            required
                        >
                            <option value="" disabled>{t('selectParent')}</option>
                            {cities.map(city => (
                                <option key={city.id} value={city.id}>{isRTL ? city.arName || city.enName : city.enName}</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className={clsx("text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]", isRTL ? "mr-1 block text-right" : "ml-1")}>
                                {t('designationEn')}
                            </label>
                            <input
                                type="text"
                                value={modal.currentTown.enName}
                                onChange={(e) => setModal({ ...modal, currentTown: { ...modal.currentTown, enName: e.target.value } })}
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
                                {t('designationAr')}
                            </label>
                            <input
                                type="text"
                                value={modal.currentTown.arName}
                                onChange={(e) => setModal({ ...modal, currentTown: { ...modal.currentTown, arName: e.target.value } })}
                                required
                                placeholder={t('placeholderAr')}
                                className={clsx(
                                    "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100",
                                    isRTL && "text-right"
                                )}
                            />
                        </div>
                    </div>
                    <div className={clsx(
                        "flex items-center gap-4 bg-slate-50/50 dark:bg-slate-800/50 p-5 rounded-none border border-slate-100 dark:border-slate-700 transition-all hover:bg-slate-50 dark:hover:bg-slate-800",
                        isRTL && "flex-row-reverse"
                    )}>
                        <input
                            type="checkbox"
                            checked={modal.currentTown.isActive}
                            onChange={(e) => setModal({ ...modal, currentTown: { ...modal.currentTown, isActive: e.target.checked } })}
                            id="town-active"
                            className="w-6 h-6 rounded-none border-slate-300 dark:border-slate-600 text-primary shadow-sm"
                        />
                        <label htmlFor="town-active" className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">{t('activeJurisdiction')}</label>
                    </div>
                    <div className={clsx("flex items-center gap-3 pt-4", isRTL ? "justify-start flex-row-reverse" : "justify-end")}>
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => setModal((prev: any) => ({ ...prev, isOpen: false }))}
                        >
                            {t('common:abort')}
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                        >
                            {modal.isEditing ? t('confirmSetup') : t('finalizeAnnexation')}
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
        </div >
    );
};

export default TownsList;
