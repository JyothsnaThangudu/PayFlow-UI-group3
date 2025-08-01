// src/pages/Notifications.jsx
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaBell } from 'react-icons/fa';
// import './Notifications.css';

function Notifications() {
    const location = useLocation();
    const navigate = useNavigate();
    const notifications = location.state?.notifications || [];

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return '#ef4444';
            case 'medium': return '#f59e0b';
            case 'low': return '#10b981';
            default: return '#6366f1';
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid date';

        const now = new Date();
        const diff = now - date;
        const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="notifications-page">
            <div className="notifications-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <FaArrowLeft /> Back
                </button>
                <h2><FaBell /> All Notifications</h2>
            </div>

            {notifications.length > 0 ? (
                <ul className="notifications-list">
                    {notifications.map((n) => (
                        <li key={n.id} className={`notification-card priority-${n.priority}`}>
                            <div className="notification-main">
                                <div className="icon" style={{ color: getPriorityColor(n.priority) }}>
                                    {n.icon || <FaBell />}
                                </div>
                                <div className="content">
                                    <p>{n.message}</p>
                                    <span className="date">{formatDate(n.date)}</span>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="no-notifications">
                    <FaBell />
                    <p>No notifications available.</p>
                </div>
            )}
        </div>
    );
}

export default Notifications;
