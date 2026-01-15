import React, { useState, useEffect } from 'react';
import {
    Store,
    Search,
    MapPin,
    MoreVertical,
    CheckCircle,
    XCircle,
    Clock
} from 'lucide-react';
import api from '../../../services/api';
import '../../users/components/UsersList.css'; // Reuse styles for consistency

const StoresList = () => {
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: ''
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
    });

    const fetchStores = async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                search: filters.search
            };

            const response = await api.get('/stores', { params });
            const responseBody = response.data;

            if (responseBody.data && Array.isArray(responseBody.data)) {
                setStores(responseBody.data);
                if (responseBody.meta) {
                    setPagination(prev => ({
                        ...prev,
                        total: responseBody.meta.total,
                        totalPages: responseBody.meta.totalPages
                    }));
                }
            } else if (responseBody.data && responseBody.data.data && Array.isArray(responseBody.data.data)) {
                setStores(responseBody.data.data);
                if (responseBody.data.meta) {
                    setPagination(prev => ({
                        ...prev,
                        total: responseBody.data.meta.total,
                        totalPages: responseBody.data.meta.totalPages
                    }));
                }
            } else {
                setStores([]);
            }
        } catch (error) {
            console.error('Failed to fetch stores:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStores();
    }, [pagination.page]);

    const handleSearch = (e) => {
        e.preventDefault();
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchStores();
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'ACTIVE':
                return <span className="badge badge-success" style={{ backgroundColor: '#dcfce7', color: '#10b981' }}><CheckCircle size={12} /> Active</span>;
            case 'INACTIVE':
                return <span className="badge badge-gray"><XCircle size={12} /> Inactive</span>;
            case 'PENDING':
                return <span className="badge badge-warning" style={{ backgroundColor: '#fef3c7', color: '#f59e0b' }}><Clock size={12} /> Pending</span>;
            default:
                return status;
        }
    };

    return (
        <div className="users-list-container">
            <div className="list-header">
                <div className="header-title">
                    <Store size={24} className="text-primary" />
                    <h2>Store Management</h2>
                </div>

                <div className="header-actions">
                    <form onSubmit={handleSearch} className="search-box">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search stores..."
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        />
                    </form>
                </div>
            </div>

            <div className="table-container card">
                {loading ? (
                    <div className="loading-state">Loading stores...</div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Store</th>
                                <th>Owner</th>
                                <th>Location</th>
                                <th>Status</th>
                                <th>Orders</th>
                                <th>Revenue</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stores.length > 0 ? (
                                stores.map(store => (
                                    <tr key={store.id}>
                                        <td>
                                            <div className="user-info-cell">
                                                {store.logo && (
                                                    <img src={store.logo} alt="" className="avatar__small" style={{ objectFit: 'cover' }} />
                                                )}
                                                <div>
                                                    <div className="user-name">{store.name}</div>
                                                    <div className="text-xs text-muted">{store.businessType?.en_name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{store.owner?.name}</td>
                                        <td>
                                            <div className="d-flex items-center gap-2">
                                                <MapPin size={14} className="text-muted" />
                                                <span className="text-sm">
                                                    {store.towns && store.towns.length > 0 ? store.towns[0].enName : '-'}
                                                </span>
                                            </div>
                                        </td>
                                        <td>{getStatusBadge(store.status)}</td>
                                        <td>{store.totalOrders || 0}</td>
                                        <td>${store.totalRevenue || 0}</td>
                                        <td>
                                            <button className="icon-btn">
                                                <MoreVertical size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="text-center p-6">No stores found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
                <div className="pagination">
                    <button
                        disabled={pagination.page === 1}
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                        className="btn btn-secondary btn-sm"
                    >
                        Previous
                    </button>
                    <span>Page {pagination.page} of {pagination.totalPages}</span>
                    <button
                        disabled={pagination.page >= pagination.totalPages}
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                        className="btn btn-secondary btn-sm"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default StoresList;
