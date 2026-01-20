import React, { useState, useEffect } from 'react';
import { User, Loader2, Users, ArrowUpRight } from 'lucide-react';
import followersApi from './api/followers.api';
import clsx from 'clsx';

const FollowerList = () => {
    const [followers, setFollowers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchFollowers();
    }, []);

    const fetchFollowers = async () => {
        try {
            setLoading(true);
            const userStr = localStorage.getItem('user');
            if (!userStr) throw new Error('User not found');

            const user = JSON.parse(userStr);
            const storeId = user.store?.id;

            if (!storeId) {
                setError('Authentication missing store association.');
                setLoading(false);
                return;
            }

            const response: any = await followersApi.getStoreFollowers(storeId);

            if (response && typeof response === 'object' && 'data' in response && Array.isArray(response.data)) {
                setFollowers(response.data);
            } else if (Array.isArray(response)) {
                setFollowers(response);
            } else {
                setFollowers([]);
            }
        } catch (error) {
            console.error('Failed to fetch followers', error);
            setError('System capacity issue. Failed to sync follower data.');
            setFollowers([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Store Followers</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">
                            {followers.length} Active Connection{followers.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
                <div className="hidden md:flex items-center gap-2 p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm">
                    <Users size={18} className="text-primary" />
                    <span className="font-black text-xs uppercase tracking-tight">Community Reach</span>
                </div>
            </div>

            {error ? (
                <div className="p-8 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 rounded-3xl font-bold text-sm flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center shrink-0">!</div>
                    {error}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {loading ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 size={32} className="text-primary animate-spin" />
                            <span className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] font-mono">Loading Network...</span>
                        </div>
                    ) : followers.length === 0 ? (
                        <div className="col-span-full py-24 text-center bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                            <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none inline-flex items-center justify-center mb-6">
                                <Users size={32} className="text-slate-200" />
                            </div>
                            <h2 className="text-slate-900 dark:text-white font-black uppercase tracking-tighter text-xl mb-1">Your store is evolving</h2>
                            <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Growth begins with a single connection</p>
                        </div>
                    ) : (
                        followers.map((followerData: any) => {
                            const user = followerData.user || followerData;
                            const displayName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Valued Follower';

                            return (
                                <div key={user.id} className="group bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 overflow-hidden relative active:scale-[0.98]">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 overflow-hidden group-hover:scale-110 transition-transform duration-500">
                                            {user.profileImage ? (
                                                <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <User size={24} className="group-hover:text-primary transition-colors" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter truncate text-lg group-hover:text-primary transition-colors leading-none mb-1">
                                                {displayName}
                                            </h3>
                                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.15em] flex items-center gap-1">
                                                Verified Reader
                                            </span>
                                        </div>
                                        <div className="opacity-0 group-hover:opacity-100 transition-all">
                                            <ArrowUpRight size={18} className="text-slate-300" />
                                        </div>
                                    </div>

                                    {/* High-end accent details */}
                                    <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-primary transition-colors" />
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
};

export default FollowerList;
