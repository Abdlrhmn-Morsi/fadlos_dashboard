import React, { useEffect } from 'react';
import { useRecoilState } from 'recoil';
import {
    Briefcase,
    Plus,
    Search,
    Edit2,
    CheckCircle,
    XCircle
} from 'lucide-react';
import {
    getBusinessTypes,
    createBusinessType,
    updateBusinessType,
    toggleBusinessTypeStatus
} from '../api/business-types.api';
import { useTranslation } from 'react-i18next';
import {
    businessTypesState,
    businessTypesLoadingState,
    businessTypesSearchState,
    businessTypeModalState,
    businessTypeStatusModalState
} from '../store/business-types.store';
import StatusModal from '../../../components/common/StatusModal';
import Modal from '../../../components/common/Modal';

const BusinessTypesList = () => {
    const { t } = useTranslation(['businessTypes', 'common']);
    const [businessTypes, setBusinessTypes] = useRecoilState(businessTypesState);
    const [loading, setLoading] = useRecoilState(businessTypesLoadingState);
    const [search, setSearch] = useRecoilState(businessTypesSearchState);
    const [modal, setModal] = useRecoilState(businessTypeModalState);
    const [statusModal, setStatusModal] = useRecoilState(businessTypeStatusModalState);

    const openStatus = (type: any, title: string, message: string, onConfirm: any = null) => {
        setStatusModal({ isOpen: true, type, title, message, onConfirm });
    };

    const closeStatus = () => {
        setStatusModal(prev => ({ ...prev, isOpen: false }));
    };

    const fetchBusinessTypes = async () => {
        setLoading(true);
        try {
            const data = await getBusinessTypes();
            setBusinessTypes(data);
        } catch (error) {
            console.error('Failed to fetch business types:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBusinessTypes();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                en_name: modal.currentType.en_name,
                ar_name: modal.currentType.ar_name,
                code: modal.currentType.code,
                is_active: modal.currentType.is_active
            };

            if (modal.isEditing) {
                await updateBusinessType(modal.currentType.id, payload);
            } else {
                await createBusinessType(payload);
            }
            setModal(prev => ({ ...prev, isOpen: false }));
            fetchBusinessTypes();
            openStatus('success', t('success'), modal.isEditing ? t('updatedSuccess') : t('createdSuccess'));
        } catch (error: any) {
            openStatus('error', t('common:error'), error.response?.data?.message || error.message);
        }
    };

    const handleToggleStatus = async (type: any) => {
        try {
            await toggleBusinessTypeStatus(type.id, type.is_active);
            fetchBusinessTypes();
            openStatus('success', t('statusUpdated'), t('statusUpdateMessage', { status: type.is_active ? t('deactivated') : t('activated') }));
        } catch (error: any) {
            openStatus('error', t('updateFailed'), error.response?.data?.message || error.message);
        }
    };

    const filteredTypes = businessTypes.filter(type =>
        (type.en_name?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (type.ar_name || '').includes(search) ||
        (type.code?.toLowerCase() || '').includes(search.toLowerCase())
    );

    return (
        <div className="list-page-container p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary-light rounded-none-[1.25rem] animate-float">
                        <Briefcase size={24} className="text-primary" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{t('title')}</h2>
                </div>
                <div className="flex flex-wrap gap-3">
                    <div className="relative group">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder={t('searchPlaceholder')}
                            className="pl-11 pr-4 py-3 w-full md:w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-none-none focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-sm group-hover:shadow-md text-slate-900 dark:text-slate-100"
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
                                currentType: { id: '', en_name: '', ar_name: '', code: '', is_active: true }
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
                        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-none-none animate-spin" />
                        <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">{t('classifying')}</div>
                    </div>
                ) : (
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/80 dark:bg-slate-800/80">
                                    <th className="table-header-cell">{t('industryEn')}</th>
                                    <th className="table-header-cell">{t('industryAr')}</th>
                                    <th className="table-header-cell">{t('systemCode')}</th>
                                    <th className="table-header-cell">{t('lifecycle')}</th>
                                    <th className="table-header-cell text-right">{t('governance')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                {filteredTypes.length > 0 ? (
                                    filteredTypes.map(type => (
                                        <tr key={type.id} className="table-row group">
                                            <td className="table-cell">
                                                <div className="text-[15px] font-black text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">{type.en_name}</div>
                                            </td>
                                            <td className="table-cell">
                                                <div className="text-sm text-slate-600 dark:text-slate-400 font-bold">{type.ar_name}</div>
                                            </td>
                                            <td className="table-cell">
                                                <code className="px-3 py-1 bg-slate-900 border border-slate-700 text-primary-light rounded-none-none text-[10px] font-black tracking-widest uppercase">
                                                    {type.code}
                                                </code>
                                            </td>
                                            <td className="table-cell">
                                                <button
                                                    onClick={() => handleToggleStatus(type)}
                                                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-none-none text-[10px] font-black uppercase tracking-widest transition-all ${type.is_active ? 'bg-emerald-50 text-emerald-600 shadow-sm shadow-emerald-100 ring-1 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-900' : 'bg-slate-50 text-slate-400 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:ring-slate-700'}`}
                                                >
                                                    <div className={`w-1.5 h-1.5 rounded-none-none ${type.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                                                    {type.is_active ? t('active') : t('locked')}
                                                </button>
                                            </td>
                                            <td className="table-cell text-right">
                                                <button
                                                    className="p-3 text-slate-300 hover:text-primary hover:bg-primary-light rounded-none-none transition-all active:scale-90"
                                                    onClick={() => {
                                                        setModal({
                                                            isOpen: true,
                                                            isEditing: true,
                                                            currentType: type
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
                                        <td colSpan={5} className="text-center py-32">
                                            <div className="flex flex-col items-center gap-3">
                                                <Briefcase size={48} className="text-slate-200" />
                                                <div className="text-slate-400 font-bold text-sm tracking-tight italic">{t('noTypesFound')}</div>
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
                onClose={() => setModal(prev => ({ ...prev, isOpen: false }))}
                title={modal.isEditing ? t('sectorOptimization') : t('sectorIntegration')}
            >
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{t('identityEn')}</label>
                            <input
                                type="text"
                                value={modal.currentType.en_name}
                                onChange={(e) => setModal({ ...modal, currentType: { ...modal.currentType, en_name: e.target.value } })}
                                required
                                placeholder={t('placeholderEn')}
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{t('identityAr')}</label>
                            <input
                                type="text"
                                value={modal.currentType.ar_name}
                                onChange={(e) => setModal({ ...modal, currentType: { ...modal.currentType, ar_name: e.target.value } })}
                                required
                                placeholder={t('placeholderAr')}
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                            />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{t('systemCoreCode')}</label>
                        <input
                            type="text"
                            value={modal.currentType.code}
                            onChange={(e) => setModal({ ...modal, currentType: { ...modal.currentType, code: e.target.value } })}
                            className={`${modal.isEditing ? 'opacity-60 cursor-not-allowed' : ''} bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100`}
                            required
                            placeholder={t('codePlaceholder')}
                            disabled={modal.isEditing}
                        />
                        {!modal.isEditing && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight ml-1">{t('codeWarning')}</p>}
                    </div>
                    <div className="flex items-center gap-4 bg-slate-50/50 dark:bg-slate-800/50 p-5 rounded-none-[2rem] border border-slate-100 dark:border-slate-700 transition-all hover:bg-slate-50 dark:hover:bg-slate-800">
                        <input
                            type="checkbox"
                            checked={modal.currentType.is_active}
                            onChange={(e) => setModal({ ...modal, currentType: { ...modal.currentType, is_active: e.target.checked } })}
                            id="type-active"
                            className="w-6 h-6 rounded-none-none border-slate-300 dark:border-slate-600 text-primary shadow-sm"
                        />
                        <label htmlFor="type-active" className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">{t('operationalAuthorization')}</label>
                    </div>
                    <div className="flex items-center justify-end gap-3 pt-4">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => setModal(prev => ({ ...prev, isOpen: false }))}
                        >
                            {t('common:abort')}
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                        >
                            {modal.isEditing ? t('confirmChanges') : t('finalizeAnnexation')}
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

export default BusinessTypesList;

