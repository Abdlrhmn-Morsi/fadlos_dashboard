import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Truck, ShieldCheck, Image as ImageIcon, CheckCircle, XCircle, User, Mail, Phone, Calendar, Info, ExternalLink } from 'lucide-react';
import { getAllDrivers, verifyDriver } from '../api/delivery-drivers.api';
import { toast } from '../../../utils/toast';
import { ConfirmModal } from '../../../components/ConfirmModal';
import clsx from 'clsx';

const DriverVerificationPage = () => {
    const { t } = useTranslation(['common', 'delivery']);
    const [drivers, setDrivers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState({
        isOpen: false,
        driverId: '',
        status: '',
        driverName: '',
        notes: ''
    });

    useEffect(() => {
        fetchDrivers();
    }, []);

    const fetchDrivers = async () => {
        try {
            setLoading(true);
            const data = await getAllDrivers();
            setDrivers(data);
        } catch (error) {
            console.error('Failed to fetch drivers', error);
            toast.error(t('common.error_fetching_data', 'Failed to load drivers'));
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyClick = (driverId: string, name: string, status: string) => {
        setModal({
            isOpen: true,
            driverId,
            status,
            driverName: name,
            notes: ''
        });
    };

    const confirmVerification = async () => {
        try {
            await verifyDriver(modal.driverId, modal.status, modal.notes);
            toast.success(t('verificationSuccess', 'Driver verification updated successfully'));
            setModal({ ...modal, isOpen: false });
            fetchDrivers();
        } catch (error) {
            console.error('Failed to verify driver', error);
            toast.error(t('verificationError', 'Failed to update verification status'));
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <ShieldCheck className="text-indigo-600" size={28} />
                        {t('delivery.drivers.verification.title', 'Driver Verification')}
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">{t('delivery.drivers.verification.desc', 'Review and approve driver identity documents.')}</p>
                </div>
                <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800 flex items-center gap-2">
                    <Truck className="text-indigo-600" size={20} />
                    <span className="text-sm font-black text-indigo-700 dark:text-indigo-400">{drivers.length} {t('delivery.drivers.total', 'Drivers Total')}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {drivers.map((profile) => (
                    <div key={profile.id} className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col group hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-300">
                        {/* Status Header */}
                        <div className={clsx(
                            "px-4 py-2 text-[10px] font-black uppercase tracking-widest text-center border-b",
                            profile.verificationStatus === 'VERIFIED' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                profile.verificationStatus === 'REJECTED' ? "bg-rose-50 text-rose-600 border-rose-100" :
                                    profile.verificationStatus === 'PENDING' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                        "bg-slate-50 text-slate-600 border-slate-100"
                        )}>
                            {t(`verificationStatuses.${profile.verificationStatus}`, profile.verificationStatus) as string}
                        </div>

                        {/* Driver Info */}
                        <div className="p-5 space-y-4 flex-1">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-xl text-indigo-600 shadow-inner">
                                    {profile.user?.name?.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-black text-slate-900 dark:text-white truncate">{profile.user?.name}</h3>
                                    <div className="flex items-center gap-1 text-slate-400 text-xs">
                                        <Mail size={12} />
                                        <span className="truncate">{profile.user?.email}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="space-y-1">
                                    <p className="text-slate-400 font-bold uppercase tracking-tighter">{t('type', 'Type')}</p>
                                    <p className="font-black text-slate-700 dark:text-slate-300">{t(`driverTypes.${profile.driverType}`, profile.driverType) as string}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-slate-400 font-bold uppercase tracking-tighter">{t('fields.phone', 'Phone')}</p>
                                    <p className="font-black text-slate-700 dark:text-slate-300">{profile.user?.phone || '-'}</p>
                                </div>
                            </div>

                            {/* Verification Notes */}
                            {profile.verificationNotes && (
                                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800/50">
                                    <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                                        <Info size={12} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{t('reason', 'Reason')}</span>
                                    </div>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic">"{profile.verificationNotes}"</p>
                                </div>
                            )}

                            {/* Documents Grid */}
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('documents', 'Verification Documents')}</p>
                                <div className="grid grid-cols-3 gap-2">
                                    <DocPreview url={profile.identityImageFrontUrl} label={t('delivery.drivers.id_front')} />
                                    <DocPreview url={profile.identityImageBackUrl} label={t('delivery.drivers.id_back')} />
                                    <DocPreview url={profile.identityImageSelfieUrl} label={t('delivery.drivers.selfie')} />
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
                            <button
                                onClick={() => handleVerifyClick(profile.user.id, profile.user.name, 'VERIFIED')}
                                disabled={profile.verificationStatus === 'VERIFIED'}
                                className={clsx(
                                    "flex-1 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-sm",
                                    profile.verificationStatus === 'VERIFIED'
                                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                        : "bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-emerald-200 dark:hover:shadow-none"
                                )}
                            >
                                <CheckCircle size={16} />
                                {t('approve', 'Approve')}
                            </button>
                            <button
                                onClick={() => handleVerifyClick(profile.user.id, profile.user.name, 'REJECTED')}
                                disabled={profile.verificationStatus === 'REJECTED'}
                                className={clsx(
                                    "flex-1 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-sm",
                                    profile.verificationStatus === 'REJECTED'
                                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                        : "bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100"
                                )}
                            >
                                <XCircle size={16} />
                                {t('reject', 'Reject')}
                            </button>
                        </div>
                    </div>
                ))}

                {drivers.length === 0 && (
                    <div className="col-span-full py-20 bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center">
                            <ShieldCheck size={40} className="text-slate-300" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-lg font-black text-slate-900 dark:text-white">
                                {t('delivery.drivers.no_pending', 'No drivers awaiting verification')}
                            </p>
                            <p className="text-sm text-slate-500 max-w-xs mx-auto">
                                {t('delivery.drivers.verification.desc', 'Review and approve driver identity documents.')}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Verification Reason Modal */}
            {modal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 space-y-6">
                            <div className="space-y-2">
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                                    {modal.status === 'VERIFIED' ? t('approve', 'Approve') : t('reject', 'Reject')} {modal.driverName}
                                </h2>
                                <p className="text-slate-500 text-sm">
                                    {modal.status === 'VERIFIED'
                                        ? t('approve_confirm_msg', 'Are you sure you want to verify this driver? They will be able to start accepting orders immediately.')
                                        : t('reject_confirm_msg', 'Please provide a reason for rejecting this driver\'s application.')}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('reason', 'Reason')} ({t('optional', 'Optional')})</label>
                                <textarea
                                    className="w-full h-32 p-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:ring-0 transition-all outline-none resize-none text-sm"
                                    placeholder={t('provideReason', 'Provide a reason (optional)')}
                                    value={modal.notes}
                                    onChange={(e) => setModal({ ...modal, notes: e.target.value })}
                                />
                            </div>

                            <div className="flex items-center gap-4 pt-2">
                                <button
                                    onClick={() => setModal({ ...modal, isOpen: false })}
                                    className="flex-1 py-4 font-black text-sm uppercase tracking-widest text-slate-500 hover:text-slate-700 transition-colors"
                                >
                                    {t('cancel', 'Cancel')}
                                </button>
                                <button
                                    onClick={confirmVerification}
                                    className={clsx(
                                        "flex-[2] py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-white transition-all shadow-lg hover:translate-y-[-2px] active:translate-y-0",
                                        modal.status === 'VERIFIED'
                                            ? "bg-emerald-600 shadow-emerald-200 dark:shadow-none hover:bg-emerald-700"
                                            : "bg-rose-600 shadow-rose-200 dark:shadow-none hover:bg-rose-700"
                                    )}
                                >
                                    {t('confirm', 'Confirm')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const DocPreview = ({ url, label }: { url: string | null; label: string }) => {
    if (!url) {
        return (
            <div className="aspect-[4/3] bg-slate-50 dark:bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center p-2 text-center opacity-50">
                <ImageIcon size={20} className="text-slate-300 mb-1" />
                <span className="text-[8px] font-bold text-slate-400 truncate w-full px-1">{label}</span>
            </div>
        );
    }

    return (
        <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="group relative aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 shadow-sm transition-all hover:scale-105 hover:shadow-md"
        >
            <img src={url} alt={label} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-indigo-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <ExternalLink size={20} className="text-white" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-slate-900/60 backdrop-blur-sm p-1">
                <p className="text-[8px] font-black text-white text-center truncate">{label}</p>
            </div>
        </a>
    );
};

export default DriverVerificationPage;
