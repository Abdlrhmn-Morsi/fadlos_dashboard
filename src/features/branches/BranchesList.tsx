import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import { branchesApi } from './api/branches.api';
import { Branch, CreateBranchDto, UpdateBranchDto } from '../../types/branch';
import { BranchForm } from './components/BranchForm';
import { Modal } from '../../components/ui/Modal';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import { Pencil, Trash2, Plus, MapPin, Search, Phone, Home } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export const BranchesList: React.FC = () => {
    const { t } = useTranslation(['branches', 'common']);
    const { isRTL } = useLanguage();
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [branchToDelete, setBranchToDelete] = useState<string | null>(null);

    const filteredBranches = branches.filter(branch =>
        (branch.addressAr?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            branch.addressEn?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        branch.phone.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const fetchBranches = async () => {
        try {
            const data = await branchesApi.findAllByStore();
            setBranches(data);
        } catch (error) {
            toast.error(t('loadError'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBranches();
    }, []);

    const handleCreate = async (data: CreateBranchDto) => {
        setIsSaving(true);
        try {
            await branchesApi.create(data);
            toast.success(t('createSuccess'));
            setIsModalOpen(false);
            fetchBranches();
        } catch (error) {
            toast.error(t('createError'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdate = async (id: string, data: UpdateBranchDto) => {
        setIsSaving(true);
        try {
            await branchesApi.update(id, data);
            toast.success(t('updateSuccess'));
            setIsModalOpen(false);
            setEditingBranch(null);
            fetchBranches();
        } catch (error) {
            toast.error(t('updateError'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = (id: string) => {
        setBranchToDelete(id);
    };

    const handleConfirmDelete = async () => {
        if (!branchToDelete) return;
        setIsSaving(true);
        try {
            await branchesApi.remove(branchToDelete);
            toast.success(t('deleteSuccess'));
            setBranches(branches.filter(b => b.id !== branchToDelete));
            setBranchToDelete(null);
        } catch (error) {
            toast.error(t('deleteError'));
        } finally {
            setIsSaving(false);
        }
    };

    const openCreateModal = () => {
        setEditingBranch(null);
        setIsModalOpen(true);
    };

    const openEditModal = (branch: Branch) => {
        setEditingBranch(branch);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingBranch(null);
    };

    if (loading) return <div>{t('common:loading')}</div>;

    return (
        <div className="px-4 sm:px-6 lg:px-8 py-8">
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white underline decoration-indigo-500 decoration-4 underline-offset-8">{t('title')}</h1>
                    <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                        {t('subtitle')}
                    </p>
                </div>
                <div className={clsx("mt-4 sm:mt-0 sm:flex-none", isRTL ? "sm:mr-16" : "sm:ml-16")}>
                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="inline-flex items-center justify-center rounded-xl border border-transparent bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 hover:-translate-y-0.5 transition-all duration-200"
                    >
                        <Plus size={20} className={isRTL ? "ml-2" : "mr-2"} />
                        {t('addBranch')}
                    </button>
                </div>
            </div>

            <div className="mt-8">
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-8">
                    <div className="relative w-full sm:max-w-md">
                        <div className={clsx("absolute inset-y-0 flex items-center pointer-events-none", isRTL ? "right-0 pr-3" : "left-0 pl-3")}>
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder={t('searchPlaceholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={clsx(
                                "block w-full pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all duration-200 shadow-sm",
                                isRTL ? "pr-10" : "pl-10"
                            )}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredBranches.length > 0 ? (
                        filteredBranches.map((branch) => (
                            <div key={branch.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group relative">
                                <div className="p-6 flex-1">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className={clsx(
                                            "inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider",
                                            branch.isActive
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                                        )}>
                                            <span className={clsx(
                                                "h-2 w-2 rounded-full animate-pulse",
                                                isRTL ? "ml-2" : "mr-2",
                                                branch.isActive ? 'bg-emerald-500' : 'bg-rose-500'
                                            )} />
                                            {branch.isActive ? t('active') : t('inactive')}
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                            <button
                                                onClick={() => openEditModal(branch)}
                                                className="p-2.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors shadow-sm"
                                                title={t('editBranch')}
                                            >
                                                <Pencil className="h-4.5 w-4.5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(branch.id)}
                                                className="p-2.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors shadow-sm"
                                                title={t('deleteBranch')}
                                            >
                                                <Trash2 className="h-4.5 w-4.5" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-5">
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                                                <Home className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">{t('branchLocation')}</p>
                                                <p className="text-gray-900 dark:text-white font-bold text-xl leading-tight mb-1.5">{branch.addressAr}</p>
                                                {branch.addressEn && (
                                                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium italic">{branch.addressEn}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                                                <Phone className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{t('contactDetails')}</p>
                                                <p className="text-gray-900 dark:text-white font-bold">{branch.phone}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 bg-gray-50 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-700/50">
                                    <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${branch.latitude},${branch.longitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-3 w-full py-3.5 px-6 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl text-sm font-bold text-gray-700 dark:text-gray-100 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 dark:hover:bg-indigo-600 dark:hover:border-indigo-600 transition-all duration-300 shadow-sm"
                                    >
                                        <MapPin className="h-5 w-5 text-emerald-500 group-hover:text-white" />
                                        <span>{t('navigateOnMaps')}</span>
                                    </a>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-24 bg-white dark:bg-gray-800 rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-gray-700 text-center shadow-inner">
                            <div className="mx-auto w-24 h-24 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mb-6">
                                <Search className="h-12 w-12 text-indigo-300" />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">{t('noBranches')}</h3>
                            <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto font-medium">
                                {searchTerm ? t('noMatchingBranches', { term: searchTerm }) : t('emptyEcosystem')}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingBranch ? t('editBranch') : t('addBranch')}
            >
                <BranchForm
                    initialData={editingBranch || undefined}
                    onSubmit={(data) => editingBranch ? handleUpdate(editingBranch.id, data) : handleCreate(data)}
                    isLoading={isSaving}
                />
            </Modal>

            <ConfirmationModal
                isOpen={!!branchToDelete}
                title={t('deleteBranch')}
                message={t('deleteConfirmation')}
                confirmLabel={t('common:delete')}
                cancelLabel={t('common:cancel')}
                onConfirm={handleConfirmDelete}
                onCancel={() => setBranchToDelete(null)}
                isLoading={isSaving}
                type="danger"
            />
        </div>
    );
};
