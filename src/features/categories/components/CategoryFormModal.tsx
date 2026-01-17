import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, LayoutGrid, Info } from 'lucide-react';
import categoriesApi from '../api/categories.api';
import { toast } from '../../../utils/toast';

interface CategoryFormModalProps {
    category?: any;
    onClose: () => void;
    onSuccess: () => void;
}

const CategoryFormModal: React.FC<CategoryFormModalProps> = ({ category, onClose, onSuccess }) => {
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        sort: 0,
        isActive: true
    });

    useEffect(() => {
        if (category) {
            setFormData({
                name: category.name || '',
                sort: category.sort || 0,
                isActive: category.isActive ?? true
            });
        }
    }, [category]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            if (category) {
                await categoriesApi.updateCategory(category.id, formData);
            } else {
                await categoriesApi.createCategory(formData);
            }
            onSuccess();
        } catch (err: any) {
            console.error('Failed to save category', err);
            toast.error(err.response?.data?.message || 'Failed to save category. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                            <LayoutGrid className="text-indigo-600 dark:text-indigo-400" size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                            {category ? 'Edit Category' : 'Create New Category'}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all duration-200"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                Category Name <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
                                placeholder="e.g. Beverages, Main Courses"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        {/* Sort Order & Active Status Row */}
                        <div className="flex items-start gap-6">
                            <div className="flex-1 space-y-2">
                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    Sort Order
                                    <div className="group relative">
                                        <Info size={14} className="text-slate-400 cursor-help" />
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                            Lower numbers appear first in the list.
                                        </div>
                                    </div>
                                </label>
                                <input
                                    type="number"
                                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                    value={formData.sort}
                                    onChange={(e) => setFormData({ ...formData, sort: parseInt(e.target.value) || 0 })}
                                />
                            </div>

                            <div className="flex-1 space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    Status
                                </label>
                                <label className="relative flex items-start p-3 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <div className="flex items-center h-5">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600"
                                            checked={formData.isActive}
                                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        />
                                    </div>
                                    <div className="ml-3 text-sm">
                                        <span className={`font-medium ${formData.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
                                            {formData.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="pt-2 flex items-center gap-3 border-t border-slate-100 dark:border-slate-800 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 px-4 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {submitting ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <Save size={18} />
                            )}
                            <span>{category ? 'Save Changes' : 'Create Category'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CategoryFormModal;
