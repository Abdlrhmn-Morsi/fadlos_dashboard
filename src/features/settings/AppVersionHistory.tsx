import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

interface AppVersionHistoryItem {
    id: string;
    platform: string;
    storeUrl: string;
    latestVersion: string;
    minSupportedVersion: string;
    exactBlockedVersion: string;
    maintenanceMode: boolean;
    maintenanceMessage: string;
    isForceUpdate: boolean;
    updatedBy: string;
    createdAt: string;
}

const AppVersionHistory: React.FC = () => {
    const { t } = useTranslation('dashboard');
    const navigate = useNavigate();
    const [history, setHistory] = useState<AppVersionHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const response = await api.get('/app-version/history');
            const data = response.data.data || response.data;
            setHistory(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching history:', error);
            toast.error('Failed to load version history');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate('/settings')}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <History className="w-6 h-6" />
                        App Version History
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        View log of all app configuration changes
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-300">Date</th>
                                <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-300">Platform</th>
                                <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-300">Store URL</th>
                                <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-300">Latest Ver</th>
                                <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-300">Min Version</th>
                                <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-300">Blocked Version</th>
                                <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-300">Status</th>
                                <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-300">Updated By</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-slate-500">Loading history...</td>
                                </tr>
                            ) : history.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-slate-500">No history found</td>
                                </tr>
                            ) : (
                                history.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="p-4 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                            {new Date(item.createdAt).toLocaleString()}
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                                ${item.platform === 'android'
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                                                }`}>
                                                {item.platform}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-slate-600 dark:text-slate-400 max-w-xs truncate" title={item.storeUrl || ''}>
                                            {item.storeUrl || '-'}
                                        </td>
                                        <td className="p-4 text-sm font-medium text-slate-900 dark:text-white">
                                            {item.latestVersion || '-'}
                                        </td>
                                        <td className="p-4 text-sm font-medium text-slate-900 dark:text-white">
                                            {item.minSupportedVersion || '-'}
                                        </td>
                                        <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
                                            {item.exactBlockedVersion || '-'}
                                        </td>
                                        <td className="p-4">
                                            {item.maintenanceMode ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                                                    Maintenance
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                                                    Active
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-sm text-slate-500 dark:text-slate-400">
                                            {item.updatedBy || 'System'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AppVersionHistory;
