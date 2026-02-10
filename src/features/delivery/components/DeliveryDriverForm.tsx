import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { ArrowLeft, Save, User, Mail, Phone, Lock, Upload, Image as ImageIcon, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../../contexts/LanguageContext';
import { toast } from '../../../utils/toast';
import { createStoreDriver, getDriverById, updateStoreDriver } from '../api/delivery-drivers.api';
import clsx from 'clsx';

const DeliveryDriverForm = () => {
    const { t } = useTranslation(['common']);
    const { isRTL } = useLanguage();
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;

    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        email: '',
        phone: '',
        password: '',
    });

    const [files, setFiles] = useState<{
        identityImageFront: File | null;
        identityImageBack: File | null;
        identityImageSelfie: File | null;
    }>({
        identityImageFront: null,
        identityImageBack: null,
        identityImageSelfie: null,
    });

    const [previews, setPreviews] = useState<{
        identityImageFront: string | null;
        identityImageBack: string | null;
        identityImageSelfie: string | null;
    }>({
        identityImageFront: null,
        identityImageBack: null,
        identityImageSelfie: null,
    });

    useEffect(() => {
        if (isEditMode && id) {
            fetchDriverDetails();
        }
    }, [isEditMode, id]);

    const fetchDriverDetails = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const driver = await getDriverById(id);
            if (driver) {
                setFormData({
                    name: driver.name || '',
                    username: driver.username || '',
                    email: driver.email || '',
                    phone: driver.phone || '',
                    password: '', // Don't populate password
                });

                // Set image previews if available
                if (driver.deliveryProfile) {
                    setPreviews({
                        identityImageFront: driver.deliveryProfile.identityImageFrontUrl || null,
                        identityImageBack: driver.deliveryProfile.identityImageBackUrl || null,
                        identityImageSelfie: driver.deliveryProfile.identityImageSelfieUrl || null,
                    });
                }
            } else {
                toast.error(t('common.not_found', 'Driver not found'));
                navigate('/delivery-drivers');
            }
        } catch (error) {
            console.error('Failed to fetch driver:', error);
            toast.error(t('common.error', 'Failed to load driver details'));
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof typeof files) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFiles(prev => ({ ...prev, [field]: file }));
            setPreviews(prev => ({ ...prev, [field]: URL.createObjectURL(file) }));
        }
    };

    const removeFile = (field: keyof typeof files) => {
        setFiles(prev => ({ ...prev, [field]: null }));
        setPreviews(prev => ({ ...prev, [field]: null }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const data = {
                ...formData,
                ...files,
            };

            if (isEditMode && id) {
                // Determine what changed? For now send all that are set.
                // Remove password if empty
                if (!data.password) delete (data as any).password;

                await updateStoreDriver(id, data);
                toast.success(t('common.update_success', 'Driver updated successfully'));
            } else {
                await createStoreDriver(data);
                toast.success(t('delivery.drivers.hire_success'));
            }
            navigate('/delivery-drivers');
        } catch (error: any) {
            console.error('Failed to save driver', error);
            const message = error.response?.data?.message || t('common.error', 'Failed to save driver');
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    const FileUploadField = ({ label, field }: { label: string, field: keyof typeof files }) => (
        <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</label>
            <div className="relative">
                {previews[field] ? (
                    <div className="relative w-full h-48 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group">
                        <img src={previews[field]!} alt={label} className="w-full h-full object-cover" />
                        <button
                            type="button"
                            onClick={() => removeFile(field)}
                            className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ) : (
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-3 text-slate-400" />
                            <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">
                                <span className="font-semibold">{t('common.click_to_upload', 'Click to upload')}</span>
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">PNG, JPG (MAX. 5MB)</p>
                        </div>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, field)} />
                    </label>
                )}
            </div>
        </div>
    );

    if (loading) {
        return <div className="p-6 flex justify-center"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>;
    }

    return (
        <form onSubmit={handleSubmit} className="p-6 max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Link
                        to="/delivery-drivers"
                        className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                    >
                        <ArrowLeft size={20} className={clsx(isRTL && "rotate-180")} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            {isEditMode ? t('delivery.drivers.edit_title', 'Edit Driver') : t('delivery.drivers.create_title')}
                        </h1>
                    </div>
                </div>
                <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 font-medium disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {submitting ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <Save size={20} />
                    )}
                    <span>{t('common.save', 'Save')}</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Info */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6 md:col-span-2">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <User size={20} className="text-indigo-500" />
                        {t('delivery.drivers.personal_info')}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                {t('fields.name')} <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                {t('fields.username')} <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.username}
                                onChange={e => setFormData({ ...formData, username: e.target.value })}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                {t('fields.email')} <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <Mail size={18} className={clsx("absolute top-1/2 -translate-y-1/2 text-slate-400", isRTL ? "right-3" : "left-3")} />
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className={clsx(
                                        "w-full py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all",
                                        isRTL ? "pr-10 pl-4" : "pl-10 pr-4"
                                    )}
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                {t('fields.phone')}
                            </label>
                            <div className="relative">
                                <Phone size={18} className={clsx("absolute top-1/2 -translate-y-1/2 text-slate-400", isRTL ? "right-3" : "left-3")} />
                                <input
                                    type="text"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    className={clsx(
                                        "w-full py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all",
                                        isRTL ? "pr-10 pl-4" : "pl-10 pr-4"
                                    )}
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                {t('fields.password')} {!isEditMode && <span className="text-rose-500">*</span>}
                            </label>
                            <div className="relative">
                                <Lock size={18} className={clsx("absolute top-1/2 -translate-y-1/2 text-slate-400", isRTL ? "right-3" : "left-3")} />
                                <input
                                    type="password"
                                    required={!isEditMode}
                                    minLength={6}
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    placeholder={isEditMode ? t('common.leave_blank_to_keep', 'Leave blank to keep unchanged') : ''}
                                    className={clsx(
                                        "w-full py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all",
                                        isRTL ? "pr-10 pl-4" : "pl-10 pr-4"
                                    )}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Identity Verification */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6 md:col-span-2">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <ImageIcon size={20} className="text-indigo-500" />
                        {t('delivery.drivers.identity_verification')}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FileUploadField label={t('delivery.drivers.id_front')} field="identityImageFront" />
                        <FileUploadField label={t('delivery.drivers.id_back')} field="identityImageBack" />
                        <FileUploadField label={t('delivery.drivers.selfie')} field="identityImageSelfie" />
                    </div>
                </div>
            </div>
        </form>
    );
};

export default DeliveryDriverForm;
