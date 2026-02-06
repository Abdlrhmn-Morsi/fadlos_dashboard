import React from 'react';
import { useForm } from 'react-hook-form';
import { CreateBranchDto, Branch } from '../../../types/branch';
import { Phone, Home, Globe, Loader2 } from 'lucide-react';

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

    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<CreateBranchDto>({
        defaultValues: {
            addressAr: initialData?.addressAr || '',
            addressEn: initialData?.addressEn || '',
            phone: initialData?.phone || '',
            isActive: initialData?.isActive ?? true,
            link: initialData?.link || '',
        },
    });

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

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-2">
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
                    {t('link')}
                </label>
                <div className="group relative">
                    <div className={clsx("absolute inset-y-0 flex items-center pointer-events-none transition-colors group-focus-within:text-indigo-500 px-4", isRTL ? "right-0" : "left-0")}>
                        <Globe className="h-5 w-5 text-gray-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <input
                        type="url"
                        {...register('link')}
                        className={clsx(
                            "block w-full py-4 bg-gray-50 dark:bg-gray-800 border-none rounded text-sm font-medium transition-all focus:ring-2 focus:ring-indigo-500/20 shadow-inner",
                            isRTL ? "pr-12 pl-4 text-left" : "pl-12 pr-4",
                            errors.link ? "ring-2 ring-rose-500/20" : ""
                        )}
                        placeholder="https://maps.google.com/..."
                    />
                </div>
                <p className="px-1 text-[10px] font-medium text-gray-500 dark:text-gray-400 italic">
                    {t('linkDescription')}
                </p>
                {errors.link && <p className="text-[10px] font-bold text-rose-500 mt-1 ml-1">{errors.link.message}</p>}
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded border border-gray-100 dark:border-gray-700/50 flex items-center justify-between group/status">
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
                        <label htmlFor="isActive" className="font-bold text-gray-900 dark:text-white cursor-pointer select-none">
                            {t('activeStatus')}
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                            {t('activeStatusDesc')}
                        </p>
                    </div>
                </div>
                <div className="relative inline-flex items-center cursor-pointer">
                    <input
                        id="isActive"
                        type="checkbox"
                        {...register('isActive')}
                        className="sr-only peer"
                    />
                    <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600"></div>
                </div>
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
