import React, { useState, useEffect } from 'react';
import {
    MapPin,
    Plus,
    Search,
    Edit2,
    Trash2,
    CheckCircle,
    XCircle,
    Filter
} from 'lucide-react';
import api from '../../../services/api';
import StatusModal from '../../../components/common/StatusModal';
import Modal from '../../../components/common/Modal';
import '../../users/components/UsersList.css';

const TownsList = () => {
    const [towns, setTowns] = useState([]);
    const [cities, setCities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentTown, setCurrentTown] = useState({ id: '', enName: '', arName: '', isActive: true, townId: '' });
    const [search, setSearch] = useState('');
    const [selectedCityFilter, setSelectedCityFilter] = useState('all');

    // Status Modal State
    const [statusModal, setStatusModal] = useState({
        isOpen: false,
        type: 'success',
        title: '',
        message: '',
        onConfirm: null
    });

    const openStatus = (type, title, message, onConfirm = null) => {
        setStatusModal({ isOpen: true, type, title, message, onConfirm });
    };

    const closeStatus = () => {
        setStatusModal(prev => ({ ...prev, isOpen: false }));
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const [townsRes, citiesRes] = await Promise.all([
                api.get('/places'),
                api.get('/towns')
            ]);

            const townsData = townsRes.data.data || townsRes.data;
            setTowns(Array.isArray(townsData) ? townsData : (townsData.data || []));

            const citiesData = citiesRes.data.data || citiesRes.data;
            setCities(Array.isArray(citiesData) ? citiesData : (citiesData.data || []));
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await api.patch(`/places/${currentTown.id}`, {
                    enName: currentTown.enName,
                    arName: currentTown.arName,
                    isActive: currentTown.isActive,
                    townId: currentTown.townId
                });
            } else {
                await api.post('/places', {
                    enName: currentTown.enName,
                    arName: currentTown.arName,
                    isActive: currentTown.isActive,
                    townId: currentTown.townId
                });
            }
            setShowModal(false);
            fetchData();
            openStatus('success', 'Success!', `Town has been ${isEditing ? 'updated' : 'created'} successfully.`);
        } catch (error) {
            openStatus('error', 'Error', error.response?.data?.message || error.message);
        }
    };

    const handleDelete = (id) => {
        openStatus(
            'confirm',
            'Delete Town',
            'Are you sure you want to delete this town? This action cannot be undone.',
            async () => {
                try {
                    await api.delete(`/places/${id}`);
                    fetchData();
                    openStatus('success', 'Deleted!', 'Town has been deleted successfully.');
                } catch (error) {
                    openStatus('error', 'Error', error.response?.data?.message || error.message);
                }
            }
        );
    };

    const handleToggleStatus = async (town) => {
        try {
            const action = town.isActive ? 'deactivate' : 'activate';
            await api.patch(`/places/${town.id}/${action}`);
            fetchData();
            openStatus('success', 'Status Updated', `Town has been ${town.isActive ? 'deactivated' : 'activated'} successfully.`);
        } catch (error) {
            openStatus('error', 'Update Failed', error.response?.data?.message || error.message);
        }
    };

    const filteredTowns = towns.filter(town => {
        const matchesSearch = (town.enName?.toLowerCase() || '').includes(search.toLowerCase()) ||
            (town.arName || '').includes(search);
        const townCityId = town.town?.id || town.townId;
        const matchesCity = selectedCityFilter === 'all' || townCityId === selectedCityFilter;
        return matchesSearch && matchesCity;
    });

    return (
        <div className="users-list-container">
            <div className="list-header">
                <div className="header-title">
                    <MapPin size={24} className="text-primary" />
                    <h2>Towns Management</h2>
                </div>
                <div className="header-actions">
                    <div className="filter-group">
                        <Filter size={18} className="text-muted" />
                        <select
                            className="btn btn-secondary"
                            style={{ height: '42px', padding: '0 1rem' }}
                            value={selectedCityFilter}
                            onChange={(e) => setSelectedCityFilter(e.target.value)}
                        >
                            <option value="all">All Cities</option>
                            {cities.map(city => (
                                <option key={city.id} value={city.id}>{city.enName}</option>
                            ))}
                        </select>
                    </div>
                    <div className="search-box">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search towns..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button className="btn btn-primary" onClick={() => {
                        setIsEditing(false);
                        setCurrentTown({ id: '', enName: '', arName: '', isActive: true, townId: cities[0]?.id || '' });
                        setShowModal(true);
                    }}>
                        <Plus size={18} /> Add Town
                    </button>
                </div>
            </div>

            <div className="table-container card">
                {loading ? (
                    <div className="loading-state">Loading towns...</div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name (English)</th>
                                <th>Name (Arabic)</th>
                                <th>City</th>
                                <th>Status</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTowns.length > 0 ? (
                                filteredTowns.map(town => (
                                    <tr key={town.id}>
                                        <td><strong>{town.enName}</strong></td>
                                        <td>{town.arName}</td>
                                        <td>
                                            <span className="badge badge-info" style={{ backgroundColor: '#e0f2fe', color: '#0369a1' }}>
                                                {town.town?.enName || 'Unknown City'}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                className={`badge ${town.isActive ? 'badge-success' : 'badge-gray'}`}
                                                onClick={() => handleToggleStatus(town)}
                                                style={{ border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                            >
                                                {town.isActive ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                                {town.isActive ? 'Active' : 'Inactive'}
                                            </button>
                                        </td>
                                        <td className="text-right">
                                            <div className="d-flex justify-content-end gap-2">
                                                <button className="icon-btn" onClick={() => {
                                                    setIsEditing(true);
                                                    setCurrentTown({ ...town, townId: town.town?.id || town.townId });
                                                    setShowModal(true);
                                                }}>
                                                    <Edit2 size={16} />
                                                </button>
                                                <button className="icon-btn text-danger" onClick={() => handleDelete(town.id)}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="text-center p-6">No towns found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={isEditing ? 'Edit Town' : 'Add New Town'}
            >
                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label>Parent City</label>
                        <select
                            className="modal-select"
                            style={{ width: '100%', height: '42px', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '0 1rem' }}
                            value={currentTown.townId}
                            onChange={(e) => setCurrentTown({ ...currentTown, townId: e.target.value })}
                            required
                        >
                            <option value="" disabled>Select a city</option>
                            {cities.map(city => (
                                <option key={city.id} value={city.id}>{city.enName}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>English Name</label>
                        <input
                            type="text"
                            value={currentTown.enName}
                            onChange={(e) => setCurrentTown({ ...currentTown, enName: e.target.value })}
                            required
                            placeholder="e.g. Maadi"
                        />
                    </div>
                    <div className="form-group">
                        <label>Arabic Name</label>
                        <input
                            type="text"
                            value={currentTown.arName}
                            onChange={(e) => setCurrentTown({ ...currentTown, arName: e.target.value })}
                            required
                            placeholder="مثلاً المعادي"
                        />
                    </div>
                    <div className="form-group checkbox-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={currentTown.isActive}
                                onChange={(e) => setCurrentTown({ ...currentTown, isActive: e.target.checked })}
                            />
                            <span>Is Active</span>
                        </label>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary">{isEditing ? 'Update' : 'Create'}</button>
                    </div>
                </form>
            </Modal>

            <StatusModal
                isOpen={statusModal.isOpen}
                onClose={closeStatus}
                type={statusModal.type}
                title={statusModal.title}
                message={statusModal.message}
                onConfirm={statusModal.onConfirm}
            />
        </div>
    );
};

export default TownsList;
