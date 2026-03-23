import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Truck, ShieldCheck, Mail, Phone, Search } from 'lucide-react';
import { getAllDrivers } from '../api/delivery-drivers.api';
import { toast } from '../../../utils/toast';
import { useNavigate, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { Pagination } from '../../../components/common/Pagination';

const DriverVerificationPage = () => {
    const { t } = useTranslation(['common', 'delivery']);
    const navigate = useNavigate();
    const location = useLocation();
    
    const [drivers, setDrivers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Filters & Pagination
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
    });

    const [stats, setStats] = useState({
        all: 0,
        UNDER_REVIEW: 0,
        VERIFIED: 0,
        REJECTED: 0,
    });
    
    // Debounce Ref
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

    const fetchStats = async () => {
        try {
            const statuses = ['', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED'];
            const results = await Promise.all(statuses.map(s => 
                getAllDrivers({ limit: 1, verificationStatus: s || undefined })
            ));
            
            setStats({
                all: results[0]?.meta?.total ?? (Array.isArray(results[0]) ? results[0].length : results[0]?.data?.length || 0),
                UNDER_REVIEW: results[1]?.meta?.total ?? (Array.isArray(results[1]) ? results[1].length : results[1]?.data?.length || 0),
                VERIFIED: results[2]?.meta?.total ?? (Array.isArray(results[2]) ? results[2].length : results[2]?.data?.length || 0),
                REJECTED: results[3]?.meta?.total ?? (Array.isArray(results[3]) ? results[3].length : results[3]?.data?.length || 0),
            });
        } catch (error) {
            console.error('Failed to fetch stats', error);
        }
    };

    const fetchDrivers = async (page = 1, search = searchQuery, status: string = statusFilter) => {
        try {
            setLoading(true);
            const response = await getAllDrivers({
                page,
                limit: pagination.limit,
                search: search || undefined,
                verificationStatus: status || undefined,
            });
            
            const data = response.data || (Array.isArray(response) ? response : []);
            const meta = response.meta || { total: data.length, page, limit: pagination.limit, totalPages: 1 };
            
            setDrivers(data);
            setPagination({
                page: meta.page,
                limit: meta.limit,
                total: meta.total,
                totalPages: meta.totalPages || Math.ceil(meta.total / meta.limit),
            });
        } catch (error) {
            console.error('Failed to fetch drivers', error);
            toast.error(t('common.error_fetching_data', 'Failed to load drivers'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        fetchDrivers(pagination.page, searchQuery, statusFilter);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pagination.page, statusFilter]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearchQuery(val);
        
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(() => {
            setPagination(prev => ({ ...prev, page: 1 }));
            fetchDrivers(1, val, statusFilter);
        }, 500);
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <ShieldCheck className="text-indigo-600" size={28} />
                        {t('delivery:drivers.verification.title', 'Driver Verification')}
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">{t('delivery:drivers.verification.desc', 'Review and approve driver identity documents.')}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {[
                        { label: t('total', 'Total'), value: '', count: stats.all, color: 'indigo', icon: Truck },
                        { label: t('verificationStatuses.UNDER_REVIEW', 'Reviewing'), value: 'UNDER_REVIEW', count: stats.UNDER_REVIEW, color: 'amber', icon: Search },
                        { label: t('verificationStatuses.VERIFIED', 'Verified'), value: 'VERIFIED', count: stats.VERIFIED, color: 'emerald', icon: ShieldCheck },
                        { label: t('verificationStatuses.REJECTED', 'Rejected'), value: 'REJECTED', count: stats.REJECTED, color: 'rose', icon: ShieldCheck },
                    ].map((s) => (
                        <button
                            key={s.value}
                            onClick={() => {
                                setStatusFilter(s.value);
                                setPagination(prev => ({ ...prev, page: 1 }));
                            }}
                            className={clsx(
                                "flex items-center gap-3 px-4 py-2 rounded-xl border transition-all active:scale-95 group",
                                statusFilter === s.value
                                    ? {
                                        'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20': s.color === 'indigo',
                                        'bg-amber-600 border-amber-600 text-white shadow-lg shadow-amber-600/20': s.color === 'amber',
                                        'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20': s.color === 'blue',
                                        'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-600/20': s.color === 'emerald',
                                        'bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-600/20': s.color === 'rose',
                                    }
                                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                            )}
                        >
                            <s.icon size={16} className={clsx(
                                statusFilter === s.value ? "text-white" : 
                                {
                                    'text-indigo-500': s.color === 'indigo',
                                    'text-amber-500': s.color === 'amber',
                                    'text-blue-500': s.color === 'blue',
                                    'text-emerald-500': s.color === 'emerald',
                                    'text-rose-500': s.color === 'rose',
                                }
                            )} />
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-widest">{s.label}</span>
                                <span className={clsx(
                                    "px-1.5 py-0.5 rounded text-[10px] font-black transition-colors",
                                    statusFilter === s.value 
                                        ? "bg-white/20 text-white" 
                                        : {
                                            "bg-slate-100 dark:bg-slate-800 text-slate-500": true,
                                            "group-hover:bg-indigo-50 group-hover:text-indigo-600": s.color === 'indigo',
                                            "group-hover:bg-amber-50 group-hover:text-amber-600": s.color === 'amber',
                                            "group-hover:bg-blue-50 group-hover:text-blue-600": s.color === 'blue',
                                            "group-hover:bg-emerald-50 group-hover:text-emerald-600": s.color === 'emerald',
                                            "group-hover:bg-rose-50 group-hover:text-rose-600": s.color === 'rose',
                                        }
                                )}>
                                    {s.count}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="relative">
                    <div className="absolute inset-y-0 left-inline-start-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Search size={18} />
                    </div>
                    <input
                        type="text"
                        placeholder={t('search', 'Search drivers by name, email or phone...') as string}
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="w-full pl-10 rtl:pr-10 rtl:pl-4 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {drivers.map((profile) => (
                    <div 
                        key={profile.id} 
                        onClick={() => navigate(`/drivers/verification/${profile.id}`, { state: { from: location.pathname } })}
                        className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col group cursor-pointer hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-300 transform hover:-translate-y-1"
                    >
                        {/* Status Header */}
                        <div className={clsx(
                            "px-4 py-2 text-[10px] font-black uppercase tracking-widest text-center border-b",
                            profile.verificationStatus === 'VERIFIED' ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400" :
                                profile.verificationStatus === 'REJECTED' ? "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400" :
                                    profile.verificationStatus === 'UNDER_REVIEW' ? "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400" :
                                        "bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400"
                        )}>
                            {t(`verificationStatuses.${profile.verificationStatus}`, profile.verificationStatus) as string}
                        </div>

                        {/* Driver Info */}
                        <div className="p-5 flex-1 flex flex-col items-center text-center space-y-3">
                            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-2xl text-indigo-600 shadow-inner overflow-hidden border-2 border-slate-200 dark:border-slate-700">
                                {profile.avatarUrl ? (
                                    <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    (profile.profile?.user?.name || 'U').charAt(0)
                                )}
                            </div>
                            
                            <div className="space-y-1 w-full min-w-0">
                                <h3 className="font-black text-slate-900 dark:text-white truncate text-lg group-hover:text-indigo-600 transition-colors">
                                    {profile.profile?.user?.name || 'Unknown Driver'}
                                </h3>
                                
                                <div className="flex flex-col items-center gap-1.5 text-slate-500 text-xs mt-2">
                                    <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded-md w-full justify-center truncate">
                                        <Mail size={12} className="shrink-0 text-slate-400" />
                                        <span className="truncate">{profile.profile?.user?.email || '-'}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded-md w-full justify-center truncate">
                                        <Phone size={12} className="shrink-0 text-slate-400" />
                                        <span className="truncate">{profile.profile?.user?.phone || '-'}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-auto pt-4 w-full border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                                <span className="font-bold text-slate-400 uppercase">{t('type', 'Type')}</span>
                                <span className="font-black text-slate-700 dark:text-slate-300">
                                    {t(`driverTypes.${profile.driverType}`, profile.driverType) as string}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}

                {!loading && drivers.length === 0 && (
                    <div className="col-span-full py-20 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center">
                            <ShieldCheck size={40} className="text-slate-300" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-lg font-black text-slate-900 dark:text-white">
                                {t('delivery:drivers.no_pending', 'No drivers found')}
                            </p>
                            <p className="text-sm text-slate-500">{t('try_different_search', 'Try adjusting your search or filters.')}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {!loading && pagination.totalPages > 1 && (
                <div className="mt-8 flex justify-center">
                    <Pagination
                        currentPage={pagination.page}
                        totalPages={pagination.totalPages}
                        onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
                        isLoading={loading}
                    />
                </div>
            )}
        </div>
    );
};

export default DriverVerificationPage;
