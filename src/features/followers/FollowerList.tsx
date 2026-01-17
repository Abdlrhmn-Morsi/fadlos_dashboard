import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import followersApi from './api/followers.api';

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
            console.log('User object:', user); // Debugging

            // Extract storeId from nested store object
            const storeId = user.store?.id;

            if (!storeId) {
                setError('Store ID not found in user profile. Please re-login.');
                setLoading(false);
                return;
            }

            const response: any = await followersApi.getStoreFollowers(storeId);

            // Handle paginated response { data: [...], meta: {...} } or plain array
            if (response && typeof response === 'object' && 'data' in response && Array.isArray(response.data)) {
                setFollowers(response.data);
            } else if (Array.isArray(response)) {
                setFollowers(response);
            } else {
                console.warn('Unexpected response format:', response);
                setFollowers([]);
            }
        } catch (error) {
            console.error('Failed to fetch followers', error);
            setError('Failed to load followers.');
            setFollowers([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Store Followers</h1>

            {error ? (
                <div className="p-4 bg-rose-100 text-rose-600 rounded-lg">{error}</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {loading ? (
                        <div className="col-span-full text-center py-12 text-slate-500">Loading followers...</div>
                    ) : followers.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-slate-500">No followers yet.</div>
                    ) : (
                        followers.map((followerData: any) => {
                            const user = followerData.user || followerData;
                            return (
                                <div key={user.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                                        <User size={24} />
                                    </div>
                                    <div className="overflow-hidden">
                                        <h3 className="font-bold text-slate-800 dark:text-white truncate">
                                            {user.firstName} {user.lastName}
                                        </h3>
                                        <p className="text-sm text-slate-500 truncate">{user.email}</p>
                                    </div>
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
