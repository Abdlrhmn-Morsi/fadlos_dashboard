import React, { useState, useEffect } from 'react';
import {
    Map,
    Plus,
    Search,
    Edit2,
    Trash2,
    CheckCircle,
    XCircle
} from 'lucide-react';
import api from '../../../services/api';
import StatusModal from '../../../components/common/StatusModal';
import Modal from '../../../components/common/Modal';
import '../../users/components/UsersList.css';

const CitiesList = () => {
    const [cities, setCities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentCity, setCurrentCity] = useState({ id: '', enName: '', arName: '', isActive: true });
    const [search, setSearch] = useState('');

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

    const fetchCities = async () => {
        setLoading(true);
        try {
            const response = await api.get('/towns');
            const data = response.data.data || response.data;
            setCities(Array.isArray(data) ? data : (data.data || []));
        } catch (error) {
            console.error('Failed to fetch cities:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCities();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await api.patch(`/towns/${currentCity.id}`, {
                    enName: currentCity.enName,
                    arName: currentCity.arName,
                    isActive: currentCity.isActive
                });
            } else {
                await api.post('/towns', {
                    enName: currentCity.enName,
                    arName: currentCity.arName,
                    isActive: currentCity.isActive
                });
            }
            setShowModal(false);
            fetchCities();
            openStatus('success', 'Success!', `City has been ${isEditing ? 'updated' : 'created'} successfully.`);
        } catch (error) {
            openStatus('error', 'Error', error.response?.data?.message || error.message);
        }
    };

    const handleDelete = (id) => {
        openStatus(
            'confirm',
            'Delete City',
            'Are you sure you want to delete this city? This action cannot be undone.',
            async () => {
                try {
                    await api.delete(`/towns/${id}`);
                    fetchCities();
                    openStatus('success', 'Deleted!', 'City has been deleted successfully.');
                } catch (error) {
                    openStatus('error', 'Error', error.response?.data?.message || error.message);
                }
            }
        );
    };

    const handleToggleStatus = async (city) => {
        try {
            const action = city.isActive ? 'deactivate' : 'activate';
            await api.patch(`/towns/${city.id}/${action}`);
            fetchCities();
            openStatus('success', 'Status Updated', `City has been ${city.isActive ? 'deactivated' : 'activated'} successfully.`);
        } catch (error) {
            openStatus('error', 'Update Failed', error.response?.data?.message || error.message);
        }
    };

    const filteredCities = cities.filter(city =>
        (city.enName?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (city.arName || '').includes(search)
    );

    return (
        <div className="users-list-container">
            <div className="list-header">
                <div className="header-title">
                    <Map size={24} className="text-primary" />
                    <h2>Cities Management</h2>
                </div>
                <div className="header-actions">
                    <div className="search-box">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search cities..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button className="btn btn-primary" onClick={() => {
                        setIsEditing(false);
                        setCurrentCity({ id: '', enName: '', arName: '', isActive: true });
                        setShowModal(true);
                    }}>
                        <Plus size={18} /> Add City
                    </button>
                </div>
            </div>

            <div className="table-container card">
                {loading ? (
                    <div className="loading-state">Loading cities...</div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name (English)</th>
                                <th>Name (Arabic)</th>
                                <th>Status</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCities.length > 0 ? (
                                filteredCities.map(city => (
                                    <tr key={city.id}>
                                        <td><strong>{city.enName}</strong></td>
                                        <td>{city.arName}</td>
                                        <td>
                                            <button
                                                className={`badge ${city.isActive ? 'badge-success' : 'badge-gray'}`}
                                                onClick={() => handleToggleStatus(city)}
                                                style={{ border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                            >
                                                {city.isActive ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                                {city.isActive ? 'Active' : 'Inactive'}
                                            </button>
                                        </td>
                                        <td className="text-right">
                                            <div className="d-flex justify-content-end gap-2">
                                                <button className="icon-btn" onClick={() => {
                                                    setIsEditing(true);
                                                    setCurrentCity(city);
                                                    setShowModal(true);
                                                }}>
                                                    <Edit2 size={16} />
                                                </button>
                                                <button className="icon-btn text-danger" onClick={() => handleDelete(city.id)}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="text-center p-6">No cities found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={isEditing ? 'Edit City' : 'Add New City'}
            >
                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label>English Name</label>
                        <input
                            type="text"
                            value={currentCity.enName}
                            onChange={(e) => setCurrentCity({ ...currentCity, enName: e.target.value })}
                            required
                            placeholder="e.g. Cairo"
                        />
                    </div>
                    <div className="form-group">
                        <label>Arabic Name</label>
                        <input
                            type="text"
                            value={currentCity.arName}
                            onChange={(e) => setCurrentCity({ ...currentCity, arName: e.target.value })}
                            required
                            placeholder="مثلاً القاهرة"
                        />
                    </div>
                    <div className="form-group checkbox-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={currentCity.isActive}
                                onChange={(e) => setCurrentCity({ ...currentCity, isActive: e.target.checked })}
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

export default CitiesList;
