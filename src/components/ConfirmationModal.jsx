import React from 'react';
import { FaExclamationTriangle, FaTimes, FaCheck } from 'react-icons/fa';
import './ConfirmationModal.css';

const ConfirmationModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title = "Confirm Action", 
    message = "Are you sure you want to proceed?",
    confirmText = "Confirm",
    cancelText = "Cancel",
    type = "warning" // warning, danger, info
}) => {
    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    const getIconByType = () => {
        switch (type) {
            case 'danger':
                return <FaExclamationTriangle className="modal-icon danger" />;
            case 'warning':
                return <FaExclamationTriangle className="modal-icon warning" />;
            case 'info':
                return <FaCheck className="modal-icon info" />;
            default:
                return <FaExclamationTriangle className="modal-icon warning" />;
        }
    };

    return (
        <div className="confirmation-modal-overlay" onClick={onClose}>
            <div className="confirmation-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    {getIconByType()}
                    <button className="close-btn" onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>
                
                <div className="modal-body">
                    <h3 className="modal-title">{title}</h3>
                    <p className="modal-message">{message}</p>
                </div>
                
                <div className="modal-footer">
                    <button 
                        className="btn-cancel" 
                        onClick={onClose}
                    >
                        {cancelText}
                    </button>
                    <button 
                        className={`btn-confirm ${type}`}
                        onClick={handleConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
