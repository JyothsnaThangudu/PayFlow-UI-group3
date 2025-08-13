import React, { useEffect } from 'react';
import './PopupMessage.css';

const ICONS = {
    success: (
        <svg className="popup-icon" width="80" height="80" viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="36" stroke="#A5DC86" strokeWidth="4" fill="#F6FFF6" />
            <path d="M25 41L37 53L56 31" stroke="#6BCB77" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    error: (
        <svg className="popup-icon" width="80" height="80" viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="36" stroke="#e57373" strokeWidth="4" fill="#FFF6F6" />
            <path d="M30 30L50 50M50 30L30 50" stroke="#e53935" strokeWidth="5" strokeLinecap="round" />
        </svg>
    ),
    info: (
        <svg className="popup-icon" width="80" height="80" viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="36" stroke="#2196f3" strokeWidth="4" fill="#F6FAFF" />
            <text x="40" y="52" textAnchor="middle" fontSize="40" fill="#2196f3">i</text>
        </svg>
    )
};

export default function PopupMessage({ title, message, type = 'success', onClose }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000); // 5 seconds
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`popup-message-modal`}>
            <div className={`popup-message-content ${type}`}>
                {ICONS[type]}
                {title && <div className="popup-title">{title}</div>}
                <div className="popup-text">{message}</div>
            </div>
        </div>
    );
}
