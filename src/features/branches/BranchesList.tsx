import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCache } from '../../contexts/CacheContext';
import { branchesApi } from './api/branches.api';
import { Branch, CreateBranchDto, UpdateBranchDto } from '../../types/branch';
import { BranchForm } from './components/BranchForm';
import { Modal } from '../../components/ui/Modal';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import { Pencil, Trash2, Plus, MapPin, Search, Phone, Home, Globe } from 'lucide-react';

import toast from 'react-hot-toast';
import clsx from 'clsx';

export const BranchesList: React.FC = () => {
    const { t } = useTranslation(['branches', 'common']);
    const { isRTL } = useLanguage();
    const { getCache, setCache, invalidateCache } = useCache();
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
            // Check cache first
            const cacheKey = 'branches';
            const cachedData = getCache<Branch[]>(cacheKey);
            if (cachedData) {
                setBranches(Array.isArray(cachedData) ? cachedData : []);
                setLoading(false);
                return;
            }

            const data = await branchesApi.findAllByStore();
            setBranches(data);
            // Cache the response
            setCache(cacheKey, data);
        } catch (error) {
            toast.error(t('loadError'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBranches();
    }, []);

    // Refetch data when component becomes visible (e.g., navigating back or closing modal)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                fetchBranches();
            }
        };

        const handleFocus = () => {
            fetchBranches();
        };

        // Listen for visibility changes and window focus
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
        };
    }, []);

    const handleCreate = async (data: CreateBranchDto) => {
        setIsSaving(true);
        try {
            const newBranch: any = await branchesApi.create(data);
            const branchData = newBranch.data || newBranch; // Handle potential response wrapping

            toast.success(t('createSuccess'));
            setIsModalOpen(false);

            // Optimistic update
            setBranches(prev => [...prev, branchData]);

            // Invalidate cache
            invalidateCache('branches');
        } catch (error) {
            toast.error(t('createError'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdate = async (id: string, data: UpdateBranchDto) => {
        setIsSaving(true);
        try {
            const updatedBranch: any = await branchesApi.update(id, data);
            const branchData = updatedBranch.data || updatedBranch; // Handle potential response wrapping

            toast.success(t('updateSuccess'));
            setIsModalOpen(false);
            setEditingBranch(null);

            // Optimistic update
            setBranches(prev => prev.map(b => b.id === id ? branchData : b));

            // Invalidate cache
            invalidateCache('branches');
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
            // Invalidate cache after delete
            invalidateCache('branches');
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

    const handleCopyLink = (link?: string) => {
        if (!link) return;
        navigator.clipboard.writeText(link);
        toast.success(t('common:copied'));
    };


    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    return (
        <div className="px-4 sm:px-6 lg:px-8 py-10 bg-gray-50/50 dark:bg-gray-900/50 min-h-screen">
            {/* Header Section */}
            <div className="relative mb-6">
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl"></div>
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl"></div>

                <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="max-w-2xl">
                        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-none mb-2">
                            {t('title')}
                            <span className="text-indigo-600">.</span>
                        </h1>
                        <p className="text-base text-gray-600 dark:text-gray-400 font-medium">
                            {t('subtitle')}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="group relative inline-flex items-center justify-center rounded bg-indigo-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-indigo-500/20 transition-all duration-300 hover:bg-indigo-700 hover:-translate-y-1 active:scale-95 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        <Plus size={18} className={clsx(isRTL ? "ml-2" : "mr-2")} />
                        {t('addBranch')}
                    </button>
                </div>
            </div>

            {/* Actions Bar */}
            <div className="sticky top-4 z-10 backdrop-blur-xl bg-white/70 dark:bg-gray-800/70 border border-white dark:border-gray-700 rounded p-4 shadow-sm mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between transition-all duration-300">
                <div className="relative w-full sm:max-w-md group">
                    <div className={clsx("absolute inset-y-0 flex items-center pointer-events-none transition-colors group-focus-within:text-indigo-500", isRTL ? "right-0 pr-4" : "left-0 pl-4")}>
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder={t('searchPlaceholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={clsx(
                            "block w-full py-3.5 border-none rounded bg-gray-100/50 dark:bg-gray-700/50 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500/20 sm:text-sm transition-all shadow-inner",
                            isRTL ? "pr-12 pl-4" : "pl-12 pr-4"
                        )}
                    />
                </div>

                <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-medium px-4">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
                    {filteredBranches.length} {t('common:results')}
                </div>
            </div>

            {/* Grid display */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredBranches.length > 0 ? (
                    filteredBranches.map((branch) => (
                        <div key={branch.id} className="group relative bg-white dark:bg-gray-800 rounded border border-gray-100 dark:border-gray-700 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(79,70,229,0.1)] transition-all duration-500 flex flex-col overflow-hidden">
                            {/* Card Content */}
                            <div className="p-4 flex-1">
                                <div className="flex justify-between items-center mb-4">
                                    <div className={clsx(
                                        "flex items-center gap-2 rounded px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest",
                                        branch.isActive
                                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                                            : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
                                    )}>
                                        <span className={clsx(
                                            "h-2 w-2 rounded-full",
                                            branch.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                                        )} />
                                        {branch.isActive ? t('active') : t('inactive')}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => openEditModal(branch)}
                                            className="p-2 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-300"
                                            title={t('editBranch')}
                                        >
                                            <Pencil size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(branch.id)}
                                            className="p-2 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-rose-50 dark:hover:bg-rose-900/30 hover:text-rose-600 dark:hover:text-rose-400 transition-all duration-300"
                                            title={t('deleteBranch')}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded group-hover:scale-110 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 transition-all duration-500">
                                            <Home className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-1">{t('branchLocation')}</p>
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-snug mb-1 group-hover:text-indigo-600 transition-colors">
                                                {branch.addressAr}
                                            </h3>
                                            {branch.addressEn && (
                                                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium leading-relaxed">
                                                    {branch.addressEn}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="flex-shrink-0 p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded group-hover:scale-110 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-500/20 transition-all duration-500">
                                            <Phone className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-0.5">{t('contactDetails')}</p>
                                            <p className="text-base font-bold text-gray-900 dark:text-white tabular-nums tracking-wide">
                                                {branch.phone}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card Footer Actions */}
                            {branch.link && (
                                <div className="p-4 bg-gray-50/50 dark:bg-gray-700/30 border-t border-gray-100 dark:border-gray-700 flex gap-3">
                                    <a
                                        href={branch.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-indigo-600 dark:hover:bg-indigo-600 hover:text-white dark:hover:text-white hover:border-indigo-600 dark:hover:border-indigo-600 transition-all duration-300 group/btn shadow-sm active:scale-95"
                                    >
                                        <MapPin size={16} className="text-emerald-500 group-hover/btn:text-white transition-colors" />
                                        <span>{t('navigateOnMaps')}</span>
                                    </a>
                                    <button
                                        onClick={() => handleCopyLink(branch.link)}
                                        className="p-3 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 active:scale-90"
                                        title={t('common:copy')}
                                    >
                                        <Globe size={16} />
                                    </button>
                                </div>
                            )}

                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-32 bg-white dark:bg-gray-800 rounded border-2 border-dashed border-gray-200 dark:border-gray-700 text-center flex flex-col items-center justify-center space-y-8 shadow-inner overflow-hidden relative">
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent"></div>
                        <div className="relative group">
                            <div className="absolute -inset-4 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all duration-500"></div>
                            <div className="relative w-28 h-28 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center animate-bounce duration-[3s]">
                                <Search className="h-12 w-12 text-indigo-400" />
                            </div>
                        </div>
                        <div className="max-w-sm px-6">
                            <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">{t('noBranches')}</h3>
                            <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                                {searchTerm ? t('noMatchingBranches', { term: searchTerm }) : t('emptyEcosystem')}
                            </p>
                        </div>
                        <button
                            onClick={openCreateModal}
                            className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-8 py-3 rounded font-bold hover:bg-indigo-600 hover:text-white transition-all duration-300"
                        >
                            {t('addBranch')}
                        </button>
                    </div>
                )}
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
