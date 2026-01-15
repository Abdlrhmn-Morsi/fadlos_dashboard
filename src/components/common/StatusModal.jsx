import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react';
import './StatusModal.css';

const StatusModal = ({
    isOpen,
    onClose,
    type = 'success', // success, error, confirm
    title,
    message,
    onConfirm,
    confirmText = 'Confirm',
    cancelText = 'Cancel'
}) => {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircle className="status-icon success" size={48} />;
            case 'error':
                return <XCircle className="status-icon error" size={48} />;
            case 'confirm':
                return <AlertTriangle className="status-icon confirm" size={48} />;
            default:
                return <CheckCircle className="status-icon success" size={48} />;
        }
    };

    return (
        <div className="status-modal-overlay">
            <div className="status-modal-content glass">
                <button className="status-modal-close" onClick={onClose}>
                    <X size={20} />
                </button>

                <div className="status-modal-body">
                    {getIcon()}
                    <h3>{title}</h3>
                    <p>{message}</p>
                </div>

                <div className="status-modal-footer">
                    {type === 'confirm' ? (
                        <>
                            <button className="btn btn-secondary" onClick={onClose}>
                                {cancelText}
                            </button>
                            <button className="btn btn-danger" onClick={() => {
                                onConfirm();
                                onClose();
                            }}>
                                {confirmText}
                            </button>
                        </>
                    ) : (
                        <button className="btn btn-primary" onClick={onClose}>
                            Done
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StatusModal;
