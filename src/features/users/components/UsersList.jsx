import React, { useState, useEffect } from 'react';
import {
    Users,
    Search,
    Filter,
    MoreVertical,
    Shield,
    Store,
    User as UserIcon,
    ShoppingBag
} from 'lucide-react';
import api from '../../../services/api';
import './UsersList.css';

const UsersList = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        role: '',
        search: ''
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
    });

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                search: filters.search,
            };

            if (filters.role && filters.role !== 'all') {
                params.role = filters.role;
            }

            const response = await api.get('/users', { params });
            const responseBody = response.data;

            // structure: { data: [...], meta: {...} }
            if (responseBody.data && Array.isArray(responseBody.data)) {
                setUsers(responseBody.data);
                if (responseBody.meta) {
                    setPagination(prev => ({
                        ...prev,
                        total: responseBody.meta.total,
                        totalPages: responseBody.meta.totalPages
                    }));
                }
            }
            // structure: { data: { data: [...], meta: ... } } (Double wrapped)
            else if (responseBody.data && responseBody.data.data && Array.isArray(responseBody.data.data)) {
                setUsers(responseBody.data.data);
                if (responseBody.data.meta) {
                    setPagination(prev => ({
                        ...prev,
                        total: responseBody.data.meta.total,
                        totalPages: responseBody.data.meta.totalPages
                    }));
                }
            } else {
                setUsers([]);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [pagination.page, filters.role]); // Debounce search in real app

    const handleSearch = (e) => {
        e.preventDefault();
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchUsers();
    };

    const getRoleBadge = (role) => {
        switch (role) {
            case 'store_owner':
                return <span className="badge badge-primary"><Store size={12} /> Store Owner</span>;
            case 'employee':
                return <span className="badge badge-info"><Shield size={12} /> Employee</span>;
            case 'customer':
                return <span className="badge badge-secondary"><ShoppingBag size={12} /> Customer</span>;
            default:
                return <span className="badge badge-gray"><UserIcon size={12} /> {role}</span>;
        }
    };

    return (
        <div className="users-list-container">
            <div className="list-header">
                <div className="header-title">
                    <Users size={24} className="text-primary" />
                    <h2>User Management</h2>
                </div>

                <div className="header-actions">
                    <form onSubmit={handleSearch} className="search-box">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        />
                    </form>

                    <div className="filter-box">
                        <Filter size={18} className="filter-icon" />
                        <select
                            value={filters.role}
                            onChange={(e) => {
                                setFilters(prev => ({ ...prev, role: e.target.value }));
                                setPagination(prev => ({ ...prev, page: 1 }));
                            }}
                        >
                            <option value="">All Roles</option>
                            <option value="customer">Customers</option>
                            <option value="store_owner">Store Owners</option>
                            <option value="employee">Employees</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="table-container card">
                {loading ? (
                    <div className="loading-state">Loading users...</div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Role</th>
                                <th>Contact</th>
                                <th>Status</th>
                                <th>Joined</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length > 0 ? (
                                users.map(user => (
                                    <tr key={user.id}>
                                        <td>
                                            <div className="user-info-cell">
                                                <div className="avatar__small">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="user-name">{user.name}</div>
                                                    <div className="user-username">@{user.username}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{getRoleBadge(user.role)}</td>
                                        <td>
                                            <div className="contact-info">
                                                <div>{user.email}</div>
                                                <div className="text-muted text-xs">{user.phone || '-'}</div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`status-dot ${user.isActive ? 'active' : 'inactive'}`}></span>
                                            {user.isActive ? 'Active' : 'Inactive'}
                                        </td>
                                        <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <button className="icon-btn">
                                                <MoreVertical size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="text-center p-6">No users found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination controls could go here */}
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

export default UsersList;
