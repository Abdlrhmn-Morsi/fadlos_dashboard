import React from 'react';
import { useForm } from 'react-hook-form';
import { CreateBranchDto, Branch } from '../../../types/branch';
import { MapPin, Phone, Home, Globe, Loader2 } from 'lucide-react';
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
            latitude: initialData?.latitude || 0,
            longitude: initialData?.longitude || 0,
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('addressAr')}</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                        <div className={clsx("absolute inset-y-0 flex items-center pointer-events-none", isRTL ? "right-0 pr-3" : "left-0 pl-3")}>
                            <Home className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </div>
                        <input
                            type="text"
                            {...register('addressAr', { required: t('addressArRequired') })}
                            onBlur={(e) => handleTranslate(e.target.value)}
                            className={clsx(
                                "focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 py-2.5",
                                isRTL ? "pr-10 text-right" : "pl-10",
                                errors.addressAr ? "border-red-300" : ""
                            )}
                            placeholder={t('addressAr')}
                        />
                    </div>
                    {errors.addressAr && <p className="mt-1 text-sm text-red-600">{errors.addressAr.message}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('addressEn')}</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                        <div className={clsx("absolute inset-y-0 flex items-center pointer-events-none", isRTL ? "right-0 pr-3" : "left-0 pl-3")}>
                            <Home className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </div>
                        <input
                            type="text"
                            {...register('addressEn', { required: t('addressEnRequired') })}
                            className={clsx(
                                "focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 py-2.5",
                                isRTL ? "pr-10" : "pl-10",
                                errors.addressEn ? "border-red-300" : ""
                            )}
                            placeholder={t('addressEn')}
                        />
                        {isTranslating && (
                            <div className={clsx("absolute inset-y-0 flex items-center pointer-events-none", isRTL ? "left-0 pl-3" : "right-0 pr-3")}>
                                <Loader2 className="h-4 w-4 text-indigo-500 animate-spin" />
                            </div>
                        )}
                    </div>
                    {errors.addressEn && <p className="mt-1 text-sm text-red-600">{errors.addressEn.message}</p>}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('phone')}</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                    <div className={clsx("absolute inset-y-0 flex items-center pointer-events-none", isRTL ? "right-0 pr-3" : "left-0 pl-3")}>
                        <Phone className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                        type="text"
                        {...register('phone', { required: t('phoneRequired') })}
                        className={clsx(
                            "focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 py-2.5",
                            isRTL ? "pr-10" : "pl-10",
                            errors.phone ? "border-red-300" : ""
                        )}
                        placeholder="+1 234 567 890"
                    />
                </div>
                {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('latitude')}</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                        <div className={clsx("absolute inset-y-0 flex items-center pointer-events-none", isRTL ? "right-0 pr-3" : "left-0 pl-3")}>
                            <Globe className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </div>
                        <input
                            type="number"
                            step="any"
                            {...register('latitude', {
                                required: t('latRequired'),
                                valueAsNumber: true,
                                min: { value: -90, message: t('latRange') },
                                max: { value: 90, message: t('latRange') }
                            })}
                            className={clsx(
                                "focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 py-2.5",
                                isRTL ? "pr-10" : "pl-10",
                                errors.latitude ? "border-red-300" : ""
                            )}
                            placeholder="30.0444"
                        />
                    </div>
                    {errors.latitude && <p className="mt-1 text-sm text-red-600">{errors.latitude.message}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('longitude')}</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                        <div className={clsx("absolute inset-y-0 flex items-center pointer-events-none", isRTL ? "right-0 pr-3" : "left-0 pl-3")}>
                            <Globe className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </div>
                        <input
                            type="number"
                            step="any"
                            {...register('longitude', {
                                required: t('lngRequired'),
                                valueAsNumber: true,
                                min: { value: -180, message: t('lngRange') },
                                max: { value: 180, message: t('lngRange') }
                            })}
                            className={clsx(
                                "focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 py-2.5",
                                isRTL ? "pr-10" : "pl-10",
                                errors.longitude ? "border-red-300" : ""
                            )}
                            placeholder="31.2357"
                        />
                    </div>
                    {errors.longitude && <p className="mt-1 text-sm text-red-600">{errors.longitude.message}</p>}
                </div>
            </div>

            <div className="relative flex items-start">
                <div className="flex h-5 items-center">
                    <input
                        id="isActive"
                        type="checkbox"
                        {...register('isActive')}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                </div>
                <div className={clsx("text-sm", isRTL ? "mr-3 text-right" : "ml-3")}>
                    <label htmlFor="isActive" className="font-medium text-gray-700 dark:text-gray-300">{t('activeStatus')}</label>
                    <p className="text-gray-500 dark:text-gray-400">{t('activeStatusDesc')}</p>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex justify-center py-2.5 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors duration-200"
                >
                    {isLoading ? t('saving') : t('saveBranch')}
                </button>
            </div>
        </form>
    );
};
