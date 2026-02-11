import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import {
    ArrowLeft, Save, User, Mail, Phone, Lock, Upload,
    Image as ImageIcon, X, Bike, CreditCard, Camera, Info,
    Footprints, Eye, EyeOff, XCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../../contexts/LanguageContext';
import { toast } from '../../../utils/toast';
import { createStoreDriver, getDriverById, updateStoreDriver } from '../api/delivery-drivers.api';
import clsx from 'clsx';

import { VehicleType } from '../../../types/vehicle-type';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { useCache } from '../../../contexts/CacheContext';

const DeliveryDriverForm = () => {
    const { t } = useTranslation(['common']);
    const { invalidateCache } = useCache();
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
        vehicleType: 'bicycle',
    });
    const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState<string | null>(null);
    const [originalFormData, setOriginalFormData] = useState<any>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const [showPassword, setShowPassword] = useState(false);

    const [files, setFiles] = useState<{
        avatar: File | null;
        identityImageFront: File | null;
        identityImageBack: File | null;
        identityImageSelfie: File | null;
    }>({
        avatar: null,
        identityImageFront: null,
        identityImageBack: null,
        identityImageSelfie: null,
    });

    const [previews, setPreviews] = useState<{
        avatar: string | null;
        identityImageFront: string | null;
        identityImageBack: string | null;
        identityImageSelfie: string | null;
    }>({
        avatar: null,
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
                const driverData = {
                    name: driver.name || '',
                    username: driver.username || '',
                    email: driver.email || '',
                    phone: driver.phone || '',
                    password: '', // Don't populate password
                    vehicleType: driver.deliveryProfile?.vehicleType || 'bicycle',
                };
                setFormData(driverData);
                setOriginalFormData(driverData);
                setVerificationStatus(driver.deliveryProfile?.verificationStatus || null);
                setRejectionReason(driver.deliveryProfile?.rejectionReason || null);

                // Set image previews if available
                if (driver.deliveryProfile) {
                    setPreviews({
                        avatar: driver.deliveryProfile.avatarUrl || null,
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

    // ... handleFileChange, removeFile, handleSubmit ...

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
                // Remove password if empty
                if (!data.password) delete (data as any).password;

                const hasNewIdentityImages = !!(files.identityImageFront || files.identityImageBack || files.identityImageSelfie);
                const hasNewAvatar = !!files.avatar;

                // Check if any field changed (except password and vehicleType)
                const anyFieldChanged = Object.keys(formData).some(key => {
                    if (key === 'password' || key === 'vehicleType') return false;
                    return formData[key as keyof typeof formData] !== originalFormData?.[key as keyof typeof formData];
                });

                const becomesUnderReview = anyFieldChanged || hasNewAvatar || hasNewIdentityImages;

                if (becomesUnderReview && !showConfirmModal) {
                    setShowConfirmModal(true);
                    return;
                }

                await updateStoreDriver(id, data);
                toast.success(t('common.update_success', 'Driver updated successfully'));
            } else {
                await createStoreDriver(data);
                toast.success(t('delivery.drivers.hire_success'));
            }

            // Invalidate drivers cache
            invalidateCache('delivery_drivers');

            navigate('/delivery-drivers');
        } catch (error: any) {
            console.error('Failed to save driver', error);
            const message = error.response?.data?.message || t('common.error', 'Failed to save driver');
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    // ... FileUploadField and other render logic ...

    const FileUploadField = ({ label, field, icon: Icon, description }: { label: string, field: keyof typeof files, icon: any, description?: string }) => (
        <div className="space-y-2">
            <div className="flex flex-col h-10 justify-end mb-2">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</label>
                {description && <p className="text-[10px] leading-tight text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>}
            </div>
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
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors bg-white dark:bg-slate-900/50">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
                            <div className="mb-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-full text-indigo-500 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                                <Icon size={32} />
                            </div>
                            <p className="mb-1 text-sm text-slate-700 dark:text-slate-200">
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
        <>
            <form onSubmit={handleSubmit} className="p-6 max-w-4xl mx-auto space-y-6">
                {isEditMode && verificationStatus === 'REJECTED' && rejectionReason && (
                    <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl flex gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
                        <XCircle size={20} className="text-rose-500 shrink-0" />
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-rose-800 dark:text-rose-300 uppercase tracking-tight">
                                {t('delivery.drivers.rejected_title', 'Verification Rejected')}
                            </p>
                            <p className="text-sm text-rose-600 dark:text-rose-400 font-medium">
                                {rejectionReason}
                            </p>
                        </div>
                    </div>
                )}
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
                            {isEditMode && verificationStatus && (
                                <div className="flex items-center gap-3 mt-1">
                                    <span className={clsx(
                                        "px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider",
                                        verificationStatus === 'VERIFIED' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20" :
                                            verificationStatus === 'REJECTED' ? "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20" :
                                                "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20"
                                    )}>
                                        {t(`verificationStatuses.${verificationStatus}`)}
                                    </span>
                                    {verificationStatus === 'UNDER_REVIEW' && (
                                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 italic">
                                            <Info size={14} className="text-amber-500" />
                                            {t('delivery.drivers.under_review')}
                                        </div>
                                    )}
                                </div>
                            )}

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
                        <div className="flex flex-col md:flex-row gap-8">
                            {/* Avatar Upload */}
                            <div className="flex flex-col items-center gap-4">
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    {t('fields.avatar', 'Profile Photo')} <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative group">
                                    <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center relative">
                                        {previews.avatar ? (
                                            <img src={previews.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={48} className="text-slate-300" />
                                        )}
                                        <label className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity text-[10px] font-bold uppercase tracking-wider text-center p-2">
                                            <Camera size={20} className="mb-1" />
                                            {t('common.click_to_upload')}
                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'avatar')} />
                                        </label>
                                    </div>
                                    {files.avatar && (
                                        <button
                                            type="button"
                                            onClick={() => removeFile('avatar')}
                                            className="absolute -top-1 -right-1 p-1 bg-rose-500 text-white rounded-full shadow-lg"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                            type={showPassword ? "text" : "password"}
                                            required={!isEditMode}
                                            minLength={6}
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                            placeholder={isEditMode ? t('common.leave_blank_to_keep', 'Leave blank to keep unchanged') : ''}
                                            className={clsx(
                                                "w-full py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all",
                                                isRTL ? "pr-10 pl-12" : "pl-10 pr-12"
                                            )}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className={clsx(
                                                "absolute top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors focus:outline-none",
                                                isRTL ? "left-3" : "right-3"
                                            )}
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                {t('fields.vehicle_type', 'Vehicle Type')}
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                                {Object.values(VehicleType).map((type) => {
                                    let VehicleIcon = Bike;
                                    if (type === VehicleType.WALKING) VehicleIcon = Footprints;
                                    if (type === VehicleType.BICYCLE) VehicleIcon = Bike;
                                    if (type === VehicleType.TRICYCLE) VehicleIcon = Bike;
                                    if (type === VehicleType.MOTORCYCLE) VehicleIcon = Bike;

                                    const isSelected = formData.vehicleType === type;

                                    return (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, vehicleType: type })}
                                            className={clsx(
                                                "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 gap-2 h-24",
                                                isSelected
                                                    ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 shadow-sm"
                                                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/50"
                                            )}
                                        >
                                            <VehicleIcon size={24} className={isSelected ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 shadow-sm"} />
                                            <span className="text-xs font-semibold break-words text-center">
                                                {t(`vehicle_types.${type}`, type)}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Identity Verification - Restricted to REJECTED for updates */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6 md:col-span-2">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <ImageIcon size={20} className="text-indigo-500" />
                                {t('delivery.drivers.identity_verification')}
                            </h3>
                            {isEditMode && verificationStatus !== 'REJECTED' && (
                                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-3 py-1 rounded-full font-bold uppercase tracking-widest border border-slate-200 dark:border-slate-700">
                                    {t('delivery.drivers.locked_verification', 'Read Only')}
                                </span>
                            )}
                        </div>


                        <div className={clsx(
                            "grid grid-cols-1 md:grid-cols-3 gap-6",
                            isEditMode && verificationStatus !== 'REJECTED' && "pointer-events-none opacity-80"
                        )}>
                            <FileUploadField
                                label={t('delivery.drivers.id_front')}
                                field="identityImageFront"
                                icon={CreditCard}
                            />
                            <FileUploadField
                                label={t('delivery.drivers.id_back')}
                                field="identityImageBack"
                                icon={CreditCard}
                            />
                            <FileUploadField
                                label={t('delivery.drivers.selfie')}
                                field="identityImageSelfie"
                                icon={Camera}
                                description={t('delivery.drivers.selfie_desc')}
                            />
                        </div>
                    </div>
                </div>
            </form>

            <ConfirmModal
                isOpen={showConfirmModal}
                title={t('delivery.drivers.confirm_update_title', 'Sensitive Update')}
                message={t('delivery.drivers.confirm_update_message', 'Updating your profile information will set your verification status back to UNDER REVIEW. Do you want to continue?')}
                onConfirm={() => {
                    setShowConfirmModal(false);
                    handleSubmit({ preventDefault: () => { } } as any); // Trigger submit again, now with modal bypassed
                }}
                onCancel={() => setShowConfirmModal(false)}
            />
        </>
    );
};

export default DeliveryDriverForm;
