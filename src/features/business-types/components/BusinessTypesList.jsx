import React, { useState, useEffect } from 'react';
import {
    Briefcase,
    Plus,
    Search,
    Edit2,
    CheckCircle,
    XCircle
} from 'lucide-react';
import api from '../../../services/api';
import StatusModal from '../../../components/common/StatusModal';
import Modal from '../../../components/common/Modal';
import '../../users/components/UsersList.css';

const BusinessTypesList = () => {
    const [businessTypes, setBusinessTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentType, setCurrentType] = useState({ id: '', en_name: '', ar_name: '', code: '', is_active: true });
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

    const fetchBusinessTypes = async () => {
        setLoading(true);
        try {
            const response = await api.get('/business-types');
            const responseBody = response.data;
            const data = responseBody.data || responseBody;

            if (data && typeof data === 'object' && !Array.isArray(data)) {
                setBusinessTypes(Object.values(data));
            } else {
                setBusinessTypes(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Failed to fetch business types:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBusinessTypes();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                en_name: currentType.en_name,
                ar_name: currentType.ar_name,
                code: currentType.code,
                is_active: currentType.is_active
            };

            if (isEditing) {
                await api.patch(`/business-types/${currentType.id}`, payload);
            } else {
                await api.post('/business-types', payload);
            }
            setShowModal(false);
            fetchBusinessTypes();
            openStatus('success', 'Success!', `Business type has been ${isEditing ? 'updated' : 'created'} successfully.`);
        } catch (error) {
            openStatus('error', 'Error', error.response?.data?.message || error.message);
        }
    };

    const handleToggleStatus = async (type) => {
        try {
            await api.patch(`/business-types/${type.id}`, { is_active: !type.is_active });
            fetchBusinessTypes();
            openStatus('success', 'Status Updated', `Business type has been ${type.is_active ? 'deactivated' : 'activated'} successfully.`);
        } catch (error) {
            openStatus('error', 'Update Failed', error.response?.data?.message || error.message);
        }
    };

    const filteredTypes = businessTypes.filter(type =>
        (type.en_name?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (type.ar_name || '').includes(search) ||
        (type.code?.toLowerCase() || '').includes(search.toLowerCase())
    );

    return (
        <div className="users-list-container">
            <div className="list-header">
                <div className="header-title">
                    <Briefcase size={24} className="text-primary" />
                    <h2>Business Types Management</h2>
                </div>
                <div className="header-actions">
                    <div className="search-box">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search types..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button className="btn btn-primary" onClick={() => {
                        setIsEditing(false);
                        setCurrentType({ id: '', en_name: '', ar_name: '', code: '', is_active: true });
                        setShowModal(true);
                    }}>
                        <Plus size={18} /> Add Type
                    </button>
                </div>
            </div>

            <div className="table-container card">
                {loading ? (
                    <div className="loading-state">Loading types...</div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name (English)</th>
                                <th>Name (Arabic)</th>
                                <th>Code</th>
                                <th>Status</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTypes.length > 0 ? (
                                filteredTypes.map(type => (
                                    <tr key={type.id}>
                                        <td><strong>{type.en_name}</strong></td>
                                        <td>{type.ar_name}</td>
                                        <td><code>{type.code}</code></td>
                                        <td>
                                            <button
                                                className={`badge ${type.is_active ? 'badge-success' : 'badge-gray'}`}
                                                onClick={() => handleToggleStatus(type)}
                                                style={{ border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                            >
                                                {type.is_active ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                                {type.is_active ? 'Active' : 'Inactive'}
                                            </button>
                                        </td>
                                        <td className="text-right">
                                            <div className="d-flex justify-content-end gap-2">
                                                <button className="icon-btn" onClick={() => {
                                                    setIsEditing(true);
                                                    setCurrentType(type);
                                                    setShowModal(true);
                                                }}>
                                                    <Edit2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="text-center p-6">No business types found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={isEditing ? 'Edit Business Type' : 'Add New Business Type'}
            >
                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label>English Name</label>
                        <input
                            type="text"
                            value={currentType.en_name}
                            onChange={(e) => setCurrentType({ ...currentType, en_name: e.target.value })}
                            required
                            placeholder="e.g. Restaurant"
                        />
                    </div>
                    <div className="form-group">
                        <label>Arabic Name</label>
                        <input
                            type="text"
                            value={currentType.ar_name}
                            onChange={(e) => setCurrentType({ ...currentType, ar_name: e.target.value })}
                            required
                            placeholder="مثلاً مطعم"
                        />
                    </div>
                    <div className="form-group">
                        <label>Code</label>
                        <input
                            type="text"
                            value={currentType.code}
                            onChange={(e) => setCurrentType({ ...currentType, code: e.target.value })}
                            required
                            placeholder="e.g. restaurant"
                            disabled={isEditing}
                        />
                    </div>
                    <div className="form-group checkbox-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={currentType.is_active}
                                onChange={(e) => setCurrentType({ ...currentType, is_active: e.target.checked })}
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

export default BusinessTypesList;
