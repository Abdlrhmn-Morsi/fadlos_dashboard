import React, { useEffect, useState } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { TrendingUp, Users, ShoppingBag, DollarSign, Store } from 'lucide-react';
import api from '../../services/api';
import './Dashboard.css';

const StatCard = ({ title, value, change, icon: Icon, color }) => (
    <div className="card stat-card">
        <div className="stat-content">
            <div>
                <p className="stat-title">{title}</p>
                <h3 className="stat-value">{value}</h3>
            </div>
            <div className={`stat-icon bg-${color}-light text-${color}`}>
                <Icon size={24} />
            </div>
        </div>
        <div className="stat-change">
            <span className="text-success flex items-center gap-1">
                <TrendingUp size={14} /> {change}
            </span>
            <span className="text-muted">vs last period</span>
        </div>
    </div>
);

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        totalUsers: 0,
        totalStores: 0,
        totalProducts: 0,
        avgOrderValue: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [chartData, setChartData] = useState([]);
    const [userRole, setUserRole] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const userStr = localStorage.getItem('user');
                const user = userStr ? JSON.parse(userStr) : {};
                setUserRole(user.role);

                let revenue = 0;
                let ordersCount = 0;
                let usersCount = 0;
                let storesCountCount = 0;
                let productsCountCount = 0;
                let avgValue = 0;

                // Backend uses lowercase role strings: super_admin, store_owner
                if (user.role === 'super_admin') {
                    // Admin: Fetch all separate resources
                    const [usersRes, storesRes, ordersRes, productsRes] = await Promise.all([
                        api.get('/users').catch(() => ({ data: { meta: { total: 0 } } })),
                        api.get('/stores').catch(() => ({ data: { meta: { total: 0 } } })),
                        api.get('/orders').catch(() => ({ data: { orders: [] } })),
                        api.get('/products').catch(() => ({ data: { meta: { total: 0 } } }))
                    ]);

                    usersCount = usersRes.data.meta?.total || 0;
                    storesCountCount = storesRes.data.meta?.total || 0;
                    productsCountCount = productsRes.data.meta?.total || 0;

                    const orders = ordersRes.data.orders || [];
                    ordersCount = orders.length;
                    revenue = orders
                        .filter(o => o.status === 'DELIVERED')
                        .reduce((sum, o) => sum + Number(o.total), 0);

                    avgValue = ordersCount > 0 ? revenue / ordersCount : 0;

                } else {
                    // Store Owner: Fetch summary stats
                    const statsRes = await api.get('/orders/stats/summary?period=30d');
                    const data = statsRes.data.data || statsRes.data;

                    revenue = data.totalRevenue || 0;
                    ordersCount = data.totalOrders || 0;
                    avgValue = data.averageOrderValue || 0;
                    usersCount = 0;

                    // Fetch store-specific counts if needed
                    const [storesRes, productsRes] = await Promise.all([
                        api.get('/stores').catch(() => ({ data: { meta: { total: 0 } } })),
                        api.get('/products/store-products').catch(() => ({ data: { meta: { total: 0 } } }))
                    ]);
                    storesCountCount = storesRes.data.meta?.total || 0;
                    productsCountCount = productsRes.data.meta?.total || 0;
                }

                setStats({
                    totalRevenue: revenue,
                    totalOrders: ordersCount,
                    totalUsers: usersCount,
                    totalStores: storesCountCount,
                    totalProducts: productsCountCount,
                    avgOrderValue: avgValue
                });

                // Mock chart data distribution based on total revenue
                setChartData([
                    { name: 'Week 1', revenue: revenue * 0.1 },
                    { name: 'Week 2', revenue: revenue * 0.2 },
                    { name: 'Week 3', revenue: revenue * 0.3 },
                    { name: 'Week 4', revenue: revenue * 0.4 },
                ]);

            } catch (err) {
                console.error("Dashboard fetch error:", err);
                setError("Failed to load dashboard data. " + (err.response?.data?.message || err.message));
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <div className="p-6">Loading dashboard...</div>;
    if (error) return <div className="p-6 text-danger">{error}</div>;

    return (
        <div className="dashboard-page">
            <div className="stats-grid">
                <StatCard
                    title="Total Revenue"
                    value={`$${stats.totalRevenue.toLocaleString()}`}
                    change="+0%"
                    icon={DollarSign}
                    color="success"
                />
                <StatCard
                    title="Total Orders"
                    value={stats.totalOrders}
                    change="+0%"
                    icon={ShoppingBag}
                    color="primary"
                />
                <StatCard
                    title={userRole === 'super_admin' ? "Total Users" : "Customer Rating"}
                    value={userRole === 'super_admin' ? stats.totalUsers : "N/A"}
                    change=""
                    icon={Users}
                    color="info"
                />
                <StatCard
                    title="Avg. Order Value"
                    value={`$${stats.avgOrderValue.toFixed(2)}`}
                    change=""
                    icon={TrendingUp}
                    color="warning"
                />
                <StatCard
                    title="Total Stores"
                    value={stats.totalStores}
                    change=""
                    icon={Store}
                    color="primary"
                />
                <StatCard
                    title="Total Products"
                    value={stats.totalProducts}
                    change=""
                    icon={ShoppingBag}
                    color="success"
                />
            </div>

            <div className="charts-section">
                <div className="card chart-card">
                    <div className="card-header">
                        <h3>Revenue Overview</h3>
                        <select className="period-select">
                            <option>Last 30 days</option>
                        </select>
                    </div>
                    <div className="chart-wrapper">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} prefix="$" />
                                <Tooltip
                                    cursor={{ fill: '#eff6ff' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card recent-activity">
                    <h3>Recent Activity</h3>
                    <div className="activity-list">
                        <div className="p-4 text-muted text-sm">Real-time activity feed coming soon.</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
