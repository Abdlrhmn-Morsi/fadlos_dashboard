import React from 'react';
import { useForm } from 'react-hook-form';
import { CreateBranchDto, Branch } from '../../../types/branch';
import { MapPin, Phone, Home, Globe, Loader2 } from 'lucide-react';
import toolsApi from '../../../services/tools.api';
import { toast } from '../../../utils/toast';

interface BranchFormProps {
    initialData?: Branch;
    onSubmit: (data: CreateBranchDto) => void;
    isLoading: boolean;
}

export const BranchForm: React.FC<BranchFormProps> = ({ initialData, onSubmit, isLoading }) => {
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
                toast.success('Address auto-translated to English');
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address (Arabic)</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Home className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </div>
                        <input
                            type="text"
                            {...register('addressAr', { required: 'Arabic address is required' })}
                            onBlur={(e) => handleTranslate(e.target.value)}
                            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 py-2.5 text-right"
                            placeholder="العنوان بالعربي"
                        />
                    </div>
                    {errors.addressAr && <p className="mt-1 text-sm text-red-600">{errors.addressAr.message}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address (English)</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Home className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </div>
                        <input
                            type="text"
                            {...register('addressEn', { required: 'English address is required' })}
                            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 py-2.5"
                            placeholder="Address in English"
                        />
                        {isTranslating && (
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <Loader2 className="h-4 w-4 text-indigo-500 animate-spin" />
                            </div>
                        )}
                    </div>
                    {errors.addressEn && <p className="mt-1 text-sm text-red-600">{errors.addressEn.message}</p>}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                        type="text"
                        {...register('phone', { required: 'Phone is required' })}
                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 py-2.5"
                        placeholder="+1 234 567 890"
                    />
                </div>
                {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Latitude</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Globe className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </div>
                        <input
                            type="number"
                            step="any"
                            {...register('latitude', {
                                required: 'Latitude is required',
                                valueAsNumber: true,
                                min: { value: -90, message: 'Latitude must be between -90 and 90' },
                                max: { value: 90, message: 'Latitude must be between -90 and 90' }
                            })}
                            className={`focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 py-2.5 ${errors.latitude ? 'border-red-300' : ''}`}
                            placeholder="30.0444"
                        />
                    </div>
                    {errors.latitude && <p className="mt-1 text-sm text-red-600">{errors.latitude.message}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Longitude</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Globe className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </div>
                        <input
                            type="number"
                            step="any"
                            {...register('longitude', {
                                required: 'Longitude is required',
                                valueAsNumber: true,
                                min: { value: -180, message: 'Longitude must be between -180 and 180' },
                                max: { value: 180, message: 'Longitude must be between -180 and 180' }
                            })}
                            className={`focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 py-2.5 ${errors.longitude ? 'border-red-300' : ''}`}
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
                <div className="ml-3 text-sm">
                    <label htmlFor="isActive" className="font-medium text-gray-700 dark:text-gray-300">Active Status</label>
                    <p className="text-gray-500 dark:text-gray-400">Enable or disable this branch for customers.</p>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex justify-center py-2.5 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors duration-200"
                >
                    {isLoading ? 'Saving...' : 'Save Branch'}
                </button>
            </div>
        </form>
    );
};
