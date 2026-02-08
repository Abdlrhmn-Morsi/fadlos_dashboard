import React, { useEffect } from 'react';
import { useRecoilState } from 'recoil';
import {
    Tags,
    Plus,
    Search,
    Edit2,
    Filter,
} from 'lucide-react';
import {
    getBusinessCategories,
    createBusinessCategory,
    updateBusinessCategory,
    toggleBusinessCategoryStatus
} from '../api/business-categories.api';
import { getBusinessTypes } from '../../business-types/api/business-types.api';
import { useTranslation } from 'react-i18next';
import {
    businessCategoriesState,
    businessCategoriesLoadingState,
    businessCategoriesSearchState,
    businessCategoriesFilterState,
    businessCategoryModalState,
    businessCategoryStatusModalState
} from '../store/business-categories.store';
import StatusModal from '../../../components/common/StatusModal';
import Modal from '../../../components/common/Modal';
import { useLanguage } from '../../../contexts/LanguageContext';
import clsx from 'clsx';

const BusinessCategoriesList = () => {
    const { t } = useTranslation(['businessCategories', 'common']);
    const { isRTL } = useLanguage();
    const [categories, setCategories] = useRecoilState(businessCategoriesState);
    const [loading, setLoading] = useRecoilState(businessCategoriesLoadingState);
    const [search, setSearch] = useRecoilState(businessCategoriesSearchState);
    const [filter, setFilter] = useRecoilState(businessCategoriesFilterState);
    const [modal, setModal] = useRecoilState(businessCategoryModalState);
    const [statusModal, setStatusModal] = useRecoilState(businessCategoryStatusModalState);
    const [businessTypes, setBusinessTypes] = React.useState<any[]>([]);

    const openStatus = (type: 'success' | 'error' | 'confirm', title: string, message: string, onConfirm?: () => void) => {
        setStatusModal({ isOpen: true, type, title, message, onConfirm });
    };

    const closeStatus = () => {
        setStatusModal((prev: any) => ({ ...prev, isOpen: false }));
    };

    const fetchBusinessTypes = async () => {
        try {
            const data = await getBusinessTypes();
            setBusinessTypes(data);
        } catch (error) {
            console.error('Failed to fetch business types:', error);
        }
    };

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const data = await getBusinessCategories(filter || '');
            setCategories(data);
        } catch (error) {
            console.error('Failed to fetch business categories:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBusinessTypes();
        fetchCategories();
    }, [filter]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                name: modal.currentCategory.name,
                nameAr: modal.currentCategory.nameAr,
                businessTypeId: modal.currentCategory.businessTypeId,
                isActive: modal.currentCategory.isActive,
                sort: modal.currentCategory.sort || 0,
            };

            if (modal.isEditing && modal.currentCategory.id) {
                await updateBusinessCategory(modal.currentCategory.id, payload);
            } else {
                await createBusinessCategory(payload);
            }
            setModal((prev: any) => ({ ...prev, isOpen: false }));
            fetchCategories();
            openStatus('success', t('common:success'), modal.isEditing ? t('updatedSuccess') : t('createdSuccess'));
        } catch (error: any) {
            openStatus('error', t('common:error'), error.response?.data?.message || error.message);
        }
    };

    const handleToggleStatus = async (category: any) => {
        try {
            await toggleBusinessCategoryStatus(category.id);
            fetchCategories();
            openStatus('success', t('statusUpdated'), t('statusUpdateMessage', { status: category.isActive ? t('deactivated') : t('activated') }));
        } catch (error: any) {
            openStatus('error', t('updateFailed'), error.response?.data?.message || error.message);
        }
    };

    const filteredCategories = categories.filter(category =>
        (category.name?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (category.nameAr || '').includes(search) ||
        (category.code?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (category.businessType?.en_name?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (category.businessType?.ar_name || '').includes(search)
    );

    return (
        <div className="list-page-container p-6">
            <div className={clsx("flex flex-col md:flex-row md:items-center justify-between gap-4")}>
                <div className={clsx("flex items-center gap-3")}>
                    <div className="p-3 bg-primary-light rounded-[4px] animate-float">
                        <Tags size={24} className="text-primary" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{t('title')}</h2>
                </div>
                <div className={clsx("flex flex-wrap gap-3")}>
                    <div className="relative group">
                        <Search size={18} className={clsx("absolute top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors", isRTL ? "right-4" : "left-4")} />
                        <input
                            type="text"
                            placeholder={t('searchPlaceholder')}
                            className={clsx(
                                "py-3 w-full md:w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[4px] focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-sm group-hover:shadow-md text-slate-900 dark:text-slate-100",
                                isRTL ? "pr-11 pl-4" : "pl-11 pr-4"
                            )}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="relative group">
                        <Filter size={18} className={clsx("absolute top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors pointer-events-none", isRTL ? "right-4" : "left-4")} />
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className={clsx(
                                "py-3 w-full md:w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[4px] focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-sm group-hover:shadow-md text-slate-900 dark:text-slate-100",
                                isRTL ? "pr-11 pl-4" : "pl-11 pr-4"
                            )}
                        >
                            <option value="">{t('allBusinessTypes')}</option>
                            {businessTypes.map((type) => (
                                <option key={type.id} value={type.id}>
                                    {isRTL ? type.ar_name : type.en_name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button
                        className="btn btn-primary"
                        onClick={() => {
                            setModal({
                                isOpen: true,
                                isEditing: false,
                                currentCategory: {
                                    id: '',
                                    name: '',
                                    nameAr: '',
                                    code: '',
                                    businessTypeId: '',
                                    isActive: true,
                                    sort: 0,
                                }
                            });
                        }}
                    >
                        <Plus size={18} /> {t('newCategory')}
                    </button>
                </div>
            </div>

            <div className="table-container">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-6">
                        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-none animate-spin" />
                        <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">{t('loading')}</div>
                    </div>
                ) : (
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className={clsx("w-full border-collapse")}>
                            <thead>
                                <tr className="bg-slate-50/80 dark:bg-slate-800/80">
                                    <th className="table-header-cell">{t('nameEn')}</th>
                                    <th className="table-header-cell">{t('nameAr')}</th>
                                    <th className="table-header-cell">{t('businessType')}</th>
                                    <th className="table-header-cell">{t('code')}</th>
                                    <th className="table-header-cell">{t('status')}</th>
                                    <th className={clsx("table-header-cell text-end")}>{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                {filteredCategories.length > 0 ? (
                                    filteredCategories.map((category: any) => (
                                        <tr key={category.id} className="table-row group">
                                            <td className="table-cell">
                                                <div className="text-[15px] font-black text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">{category.name}</div>
                                            </td>
                                            <td className="table-cell">
                                                <div className="text-sm text-slate-600 dark:text-slate-400 font-bold">{category.nameAr}</div>
                                            </td>
                                            <td className="table-cell">
                                                <div className="text-sm text-slate-600 dark:text-slate-400 font-bold">
                                                    {isRTL ? category.businessType?.ar_name : category.businessType?.en_name}
                                                </div>
                                            </td>
                                            <td className="table-cell">
                                                <code className="px-3 py-1 bg-slate-900 border border-slate-700 text-primary-light rounded-[4px] text-[10px] font-black tracking-widest uppercase">
                                                    {category.code}
                                                </code>
                                            </td>
                                            <td className="table-cell">
                                                <button
                                                    onClick={() => handleToggleStatus(category)}
                                                    className={clsx(
                                                        "inline-flex items-center gap-2 px-3 py-1 rounded-[4px] text-[10px] font-black uppercase tracking-widest transition-all",
                                                        category.isActive
                                                            ? 'bg-emerald-50 text-emerald-600 shadow-sm shadow-emerald-100 ring-1 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-900'
                                                            : 'bg-slate-50 text-slate-400 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:ring-slate-700'
                                                    )}
                                                >
                                                    <div className={`w-1.5 h-1.5 rounded-full ${category.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                                                    {category.isActive ? t('active') : t('inactive')}
                                                </button>
                                            </td>
                                            <td className={clsx("table-cell text-end")}>
                                                <button
                                                    className="p-3 text-slate-300 hover:text-primary hover:bg-primary-light rounded-[4px] transition-all active:scale-90"
                                                    onClick={() => {
                                                        setModal({
                                                            isOpen: true,
                                                            isEditing: true,
                                                            currentCategory: category
                                                        });
                                                    }}
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="text-center py-32">
                                            <div className="flex flex-col items-center gap-3">
                                                <Tags size={48} className="text-slate-200" />
                                                <div className="text-slate-400 font-bold text-sm tracking-tight italic">{t('noCategoriesFound')}</div>
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
                title={modal.isEditing ? t('editCategory') : t('createCategory')}
            >
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className={clsx("text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-1")}>
                                {t('nameEn')}
                            </label>
                            <input
                                type="text"
                                value={modal.currentCategory.name || ''}
                                onChange={(e) => setModal({ ...modal, currentCategory: { ...modal.currentCategory, name: e.target.value } })}
                                required
                                placeholder={t('nameEnPlaceholder')}
                                className={clsx(
                                    "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                                )}
                            />
                        </div>
                        <div className="space-y-3">
                            <label className={clsx("text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-1")}>
                                {t('nameAr')}
                            </label>
                            <input
                                type="text"
                                value={modal.currentCategory.nameAr || ''}
                                onChange={(e) => setModal({ ...modal, currentCategory: { ...modal.currentCategory, nameAr: e.target.value } })}
                                required
                                placeholder={t('nameArPlaceholder')}
                                className={clsx(
                                    "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                                )}
                            />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <label className={clsx("text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-1")}>
                            {t('businessType')}
                        </label>
                        <select
                            value={modal.currentCategory.businessTypeId || ''}
                            onChange={(e) => setModal({ ...modal, currentCategory: { ...modal.currentCategory, businessTypeId: e.target.value } })}
                            required
                            className={clsx(
                                "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                            )}
                        >
                            <option value="">{t('selectBusinessType')}</option>
                            {businessTypes.map((type) => (
                                <option key={type.id} value={type.id}>
                                    {isRTL ? type.ar_name : type.en_name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-3">
                        <label className={clsx("text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-1")}>
                            {t('sortOrder')}
                        </label>
                        <input
                            type="number"
                            value={modal.currentCategory.sort || 0}
                            onChange={(e) => setModal({ ...modal, currentCategory: { ...modal.currentCategory, sort: parseInt(e.target.value) || 0 } })}
                            className={clsx(
                                "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                            )}
                            placeholder={t('sortOrderPlaceholder')}
                        />
                    </div>
                    <div className={clsx(
                        "flex items-center gap-4 bg-slate-50/50 dark:bg-slate-800/50 p-5 rounded-[4px] border border-slate-100 dark:border-slate-700 transition-all hover:bg-slate-50 dark:hover:bg-slate-800"
                    )}>
                        <input
                            type="checkbox"
                            checked={modal.currentCategory.isActive ?? true}
                            onChange={(e) => setModal({ ...modal, currentCategory: { ...modal.currentCategory, isActive: e.target.checked } })}
                            id="category-active"
                            className="w-6 h-6 rounded-[4px] border-slate-300 dark:border-slate-600 text-primary shadow-sm"
                        />
                        <label htmlFor="category-active" className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">{t('activeStatus')}</label>
                    </div>
                    <div className={clsx("flex items-center gap-3 pt-4 justify-end")}>
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => setModal((prev: any) => ({ ...prev, isOpen: false }))}
                        >
                            {t('common:cancel')}
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                        >
                            {modal.isEditing ? t('updateCategory') : t('createCategory')}
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

export default BusinessCategoriesList;
