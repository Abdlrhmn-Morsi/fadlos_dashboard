import React, { useEffect } from 'react';
import { useRecoilState } from 'recoil';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { LucideIcon, TrendingUp, Users, ShoppingBag, DollarSign, Store } from 'lucide-react';
import { fetchDashboardStats } from './api/dashboard.api';
import {
    dashboardStatsState,
    dashboardLoadingState,
    dashboardErrorState,
    dashboardChartDataState
} from './store/dashboard.store';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

interface StatCardProps {
    title: string;
    value: string | number;
    change: string;
    icon: LucideIcon;
    color: string;
    comparisonText: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon: Icon, color, comparisonText }) => (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-none border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:-translate-y-1">
        <div className="flex justify-between items-start mb-4">
            <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</h3>
            </div>
            <div className={`w-12 h-12 rounded-none flex items-center justify-center bg-${color}-50 dark:bg-${color}-900/20 text-${color}-600 dark:text-${color}-400`}>
                <Icon size={24} />
            </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                <TrendingUp size={14} /> {change}
            </span>
            <span className="text-slate-400 dark:text-slate-500">{comparisonText}</span>
        </div>
    </div>
);

const Dashboard: React.FC = () => {
    const { t } = useTranslation(['dashboard', 'common']);
    const { isDark } = useTheme();
    const [stats, setStats] = useRecoilState(dashboardStatsState);
    const [loading, setLoading] = useRecoilState(dashboardLoadingState);
    const [error, setError] = useRecoilState(dashboardErrorState);
    const [chartData, setChartData] = useRecoilState(dashboardChartDataState);

    useEffect(() => {
        const loadDashboardData = async () => {
            setLoading(true);
            try {
                const userStr = localStorage.getItem('user');
                const user = userStr ? JSON.parse(userStr) : {};

                const dashboardData = await fetchDashboardStats(user.role);
                setStats(dashboardData);

                // Update chart data
                setChartData([
                    { name: t('week', { number: 1 }), revenue: (dashboardData.totalRevenue || 0) * 0.1 },
                    { name: t('week', { number: 2 }), revenue: (dashboardData.totalRevenue || 0) * 0.2 },
                    { name: t('week', { number: 3 }), revenue: (dashboardData.totalRevenue || 0) * 0.3 },
                    { name: t('week', { number: 4 }), revenue: (dashboardData.totalRevenue || 0) * 0.4 },
                ]);

                setError(null);
            } catch (err: any) {
                console.error("Dashboard enhancement error:", err);
                setError(t('failedToLoad') + " " + (err.response?.data?.message || err.message));
            } finally {
                setLoading(false);
            }
        };

        loadDashboardData();
    }, [setStats, setLoading, setError, setChartData]);

    // Dynamic Chart Colors
    const gridColor = isDark ? '#334155' : '#f1f5f9'; // slate-700 : slate-100
    const tooltipBg = isDark ? '#1e293b' : '#ffffff'; // slate-800 : white
    const tooltipBorder = isDark ? '#334155' : '#e2e8f0'; // slate-700 : slate-200
    const textColor = isDark ? '#94a3b8' : '#94a3b8'; // slate-400
    const cursorFill = isDark ? '#334155' : '#f8fafc'; // slate-700 : slate-50

    if (loading) return (
        <div className="flex items-center justify-center min-h-[50vh] p-6 animate-pulse">
            <div className="text-slate-500 font-medium">{t('loading')}</div>
        </div>
    );

    if (error) return (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-none-none text-rose-600 font-medium m-6">
            {error}
        </div>
    );

    return (
        <div className="p-6 space-y-8 animate-in animate-fade">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <StatCard
                    title={t('totalRevenue')}
                    value={`$${(stats.totalRevenue || 0).toLocaleString()}`}
                    change="+12.5%"
                    icon={DollarSign}
                    color="emerald"
                    comparisonText={t('vsLastPeriod')}
                />
                <StatCard
                    title={t('totalOrders')}
                    value={stats.totalOrders || 0}
                    change="+5.2%"
                    icon={ShoppingBag}
                    color="orange"
                    comparisonText={t('vsLastPeriod')}
                />
                <StatCard
                    title={t('totalStores')}
                    value={stats.totalStores || 0}
                    change="+2.4%"
                    icon={Store}
                    color="blue"
                    comparisonText={t('vsLastPeriod')}
                />
                <StatCard
                    title={t('totalProducts')}
                    value={stats.totalProducts || 0}
                    change="+8.1%"
                    icon={ShoppingBag}
                    color="indigo"
                    comparisonText={t('vsLastPeriod')}
                />
                <StatCard
                    title={t('platformUsers')}
                    value={stats.totalUsers || 0}
                    change="+3.7%"
                    icon={Users}
                    color="violet"
                    comparisonText={t('vsLastPeriod')}
                />
                <StatCard
                    title={t('avgOrderValue')}
                    value={`$${(stats.avgOrderValue || 0).toFixed(2)}`}
                    change="+1.2%"
                    icon={TrendingUp}
                    color="amber"
                    comparisonText={t('vsLastPeriod')}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-none border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{t('revenuePerformance')}</h3>
                        <select className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm rounded-none px-3 py-1.5 focus:ring-primary focus:border-primary outline-none">
                            <option>{t('last30Days')}</option>
                            <option>{t('last90Days')}</option>
                        </select>
                    </div>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: textColor, fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: textColor, fontSize: 12 }}
                                    dx={-10}
                                    tickFormatter={(val) => `$${val}`}
                                />
                                <Tooltip
                                    cursor={{ fill: cursorFill }}
                                    contentStyle={{
                                        backgroundColor: tooltipBg,
                                        borderRadius: '0px',
                                        border: `1px solid ${tooltipBorder}`,
                                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                        fontSize: '14px',
                                        color: isDark ? '#f1f5f9' : '#0f172a'
                                    }}
                                />
                                <Bar dataKey="revenue" fill="var(--primary)" radius={[6, 6, 0, 0]} barSize={32} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-none border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col transition-colors">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6">{t('recentActivity')}</h3>
                    <div className="space-y-6 flex-grow">
                        {[1, 2, 3].map((_, i) => (
                            <div key={i} className="flex gap-4 group cursor-pointer">
                                <div className="w-2.5 h-2.5 rounded-none bg-primary mt-1.5 group-hover:scale-125 transition-transform" />
                                <div>
                                    <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">{t('statsSynchronized')}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('justNow')}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="mt-6 w-full py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-none transition-colors">
                        {t('viewAllActivity')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
