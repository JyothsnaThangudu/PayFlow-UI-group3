import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Sidebar from '../components/SidebarAdmin';
import PopupMessage from '../components/PopupMessage';
import './AdminDashboard.css';



const EmployeeOverview = () => {
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState("");
    const [popup, setPopup] = useState({ show: false, title: '', message: '', type: 'success' });
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    // Filter users by search
    const filteredUsers = users.filter(user => {
        const q = search.toLowerCase();
        return (
            user.name?.toLowerCase().includes(q) ||
            user.username?.toLowerCase().includes(q) ||
            user.role?.toLowerCase().includes(q)
        );
    });
    const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);
    const paginatedUsers = filteredUsers.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    useEffect(() => {
        axios.get('http://localhost:8080/api/admin/users')
            .then(res => setUsers(res.data))
            .catch(err => console.error('Failed to fetch users', err));
    }, []);

    // Handler to disable user (like AdminDashboard)
    const handleDisableUser = async (username) => {
        const confirm = window.confirm("Are you sure you want to disable this user?");
        if (!confirm) return;

        try {
            const res = await axios.put(`http://localhost:8080/api/admin/disable-user`, {
                username: username,
            });

            setPopup({ show: true, title: 'User Disabled', message: res.data.message || 'User has been disabled.', type: 'success' });
            // Refresh user list
            const updatedUsers = await axios.get('http://localhost:8080/api/admin/users');
            setUsers(updatedUsers.data);
        } catch (err) {
            setPopup({ show: true, title: 'Failed', message: err.response?.data?.message || 'Failed to disable user', type: 'error' });
            console.error('Disable user error:', err);
        }
    };

    // Handler to enable user
    const handleEnableUser = async (username) => {
        const confirm = window.confirm("Are you sure you want to enable this user?");
        if (!confirm) return;

        try {
            const res = await axios.put(`http://localhost:8080/api/admin/enable-user`, {
                username: username,
            });

            setPopup({ show: true, title: 'User Enabled', message: res.data.message || 'User has been enabled.', type: 'success' });
            // Refresh user list
            const updatedUsers = await axios.get('http://localhost:8080/api/admin/users');
            setUsers(updatedUsers.data);
        } catch (err) {
            setPopup({ show: true, title: 'Failed', message: err.response?.data?.message || 'Failed to enable user', type: 'error' });
            console.error('Enable user error:', err);
        }
    };

    return (
        <div className="admin-dashboard-layout">
            {popup.show && (
                <PopupMessage
                    title={popup.title}
                    message={popup.message}
                    type={popup.type}
                    onClose={() => setPopup(popup => ({ ...popup, show: false }))}
                />
            )}
            <Sidebar />
            <main className="admin-dashboard-main" style={{ padding: '32px 36px 36px 36px', maxWidth: 1400, margin: '0 auto', background: 'linear-gradient(135deg, #e0e7ff 0%, #f8fafc 100%)', minHeight: '100vh' }}>
                <style>{`
                .employee-overview-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 32px;
                    padding-bottom: 20px;
                    border-bottom: 2px solid #e5e7eb;
                }
                
                .employee-overview-title {
                    font-size: 2.5rem;
                    font-weight: 800;
                    color: #1f2937;
                    margin: 0;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                
                .title-emoji {
                    font-size: 2.2rem;
                    background: linear-gradient(135deg, #6366f1, #8b5cf6);
                    border-radius: 16px;
                    padding: 8px 12px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .stats-summary {
                    display: flex;
                    gap: 24px;
                    align-items: center;
                }
                
                .stat-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 16px 20px;
                    background: linear-gradient(145deg, #ffffff, #f8fafc);
                    border-radius: 16px;
                    box-shadow: 0 4px 16px rgba(0,0,0,0.08);
                    border: 1px solid rgba(226, 232, 240, 0.8);
                    transition: all 0.3s ease;
                }
                
                .stat-item:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
                }
                
                .stat-number {
                    font-size: 1.8rem;
                    font-weight: 700;
                    margin-bottom: 4px;
                }
                
                .stat-label {
                    font-size: 0.875rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .stat-item.total .stat-number { color: #6366f1; }
                .stat-item.active .stat-number { color: #10b981; }
                .stat-item.inactive .stat-number { color: #ef4444; }
                
                .employee-content-card {
                    background: rgba(255,255,255,0.95);
                    border-radius: 24px;
                    box-shadow: 0 8px 40px rgba(30,64,175,0.12), 0 4px 16px rgba(0,0,0,0.06);
                    padding: 40px 36px 32px 36px;
                    margin-top: 24px;
                    animation: fadeIn 0.8s cubic-bezier(.4,0,.2,1);
                    border: 1px solid rgba(226, 232, 240, 0.6);
                    backdrop-filter: blur(10px);
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: none; }
                }
                
                .employee-header-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 32px;
                    gap: 24px;
                    flex-wrap: wrap;
                }
                
                .search-section {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                
                .employee-search-bar {
                    padding: 14px 20px;
                    border-radius: 16px;
                    border: 2px solid #e0e7ff;
                    font-size: 1rem;
                    width: 380px;
                    background: linear-gradient(145deg, #ffffff, #f8fafc);
                    transition: all 0.3s ease;
                    box-shadow: 0 2px 8px rgba(30,64,175,0.08);
                    font-weight: 500;
                }
                
                .employee-search-bar:focus {
                    border: 2px solid #6366f1;
                    outline: none;
                    box-shadow: 0 4px 16px rgba(99,102,241,0.15);
                    transform: translateY(-2px);
                }
                
                .search-icon {
                    position: absolute;
                    left: 16px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #6b7280;
                    font-size: 1.1rem;
                }
                
                .search-wrapper {
                    position: relative;
                    display: flex;
                    align-items: center;
                }
                
                .rows-per-page-select {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-weight: 600;
                    color: #374151;
                }
                
                .rows-per-page-select select {
                    padding: 8px 12px;
                    border-radius: 12px;
                    border: 2px solid #e0e7ff;
                    background: white;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                
                .rows-per-page-select select:focus {
                    border-color: #6366f1;
                    outline: none;
                    box-shadow: 0 2px 8px rgba(99,102,241,0.15);
                }
                
                .employee-table {
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 0;
                    background: rgba(255,255,255,0.98);
                    border-radius: 20px;
                    box-shadow: 0 4px 20px rgba(30,64,175,0.08);
                    overflow: hidden;
                    margin-top: 20px;
                    border: 1px solid rgba(226, 232, 240, 0.6);
                }
                
                .employee-table th, .employee-table td {
                    padding: 18px 16px;
                    text-align: left;
                    border-bottom: 1px solid #f1f5f9;
                    font-weight: 500;
                }
                
                .employee-table th:last-child, .employee-table td:last-child {
                    text-align: center;
                }
                
                .employee-table th {
                    background: linear-gradient(145deg, #f8fafc, #f1f5f9);
                    font-weight: 700;
                    color: #374151;
                    font-size: 0.95rem;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    position: relative;
                }
                
                .employee-table th::after {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 2px;
                    background: linear-gradient(90deg, #6366f1, #8b5cf6);
                }
                
                .employee-table tbody tr {
                    transition: all 0.3s ease;
                }
                
                .employee-table tbody tr:hover {
                    background: linear-gradient(145deg, #f8fafc, #ffffff);
                    transform: scale(1.01);
                    box-shadow: 0 4px 16px rgba(99,102,241,0.08);
                }
                
                .employee-table tr:last-child td {
                    border-bottom: none;
                }
                
                .user-info {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                
                .user-avatar {
                    width: 40px;
                    height: 40px;
                    border-radius: 12px;
                    background: linear-gradient(135deg, #6366f1, #8b5cf6);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: 700;
                    font-size: 1.1rem;
                }
                
                .user-details {
                    display: flex;
                    flex-direction: column;
                }
                
                .user-name {
                    font-weight: 600;
                    color: #1f2937;
                    margin-bottom: 2px;
                }
                
                .user-email {
                    font-size: 0.875rem;
                    color: #6b7280;
                }
                
                .role-badge {
                    display: inline-flex;
                    align-items: center;
                    padding: 6px 16px;
                    border-radius: 20px;
                    font-size: 0.875rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .role-badge.admin {
                    background: linear-gradient(145deg, #fef3c7, #fde68a);
                    color: #92400e;
                    border: 1px solid #f59e0b;
                }
                
                .role-badge.hr {
                    background: linear-gradient(145deg, #e0e7ff, #c7d2fe);
                    color: #3730a3;
                    border: 1px solid #6366f1;
                }
                
                .role-badge.manager {
                    background: linear-gradient(145deg, #fce7f3, #fbcfe8);
                    color: #be185d;
                    border: 1px solid #ec4899;
                }
                
                .role-badge.employee {
                    background: linear-gradient(145deg, #d1fae5, #a7f3d0);
                    color: #047857;
                    border: 1px solid #10b981;
                }
                
                .status {
                    display: inline-flex;
                    align-items: center;
                    padding: 8px 18px;
                    border-radius: 20px;
                    font-size: 0.875rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    transition: all 0.3s ease;
                    gap: 6px;
                }
                
                .status.active {
                    background: linear-gradient(145deg, #d1fae5, #a7f3d0);
                    color: #047857;
                    border: 1px solid #10b981;
                }
                
                .status.inactive {
                    background: linear-gradient(145deg, #fee2e2, #fecaca);
                    color: #b91c1c;
                    border: 1px solid #ef4444;
                }
                
                .status-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: currentColor;
                }
                
                .disable-btn, .enable-btn {
                    border: none;
                    border-radius: 12px;
                    padding: 10px 20px;
                    font-weight: 700;
                    font-size: 0.875rem;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    min-width: 90px;
                    position: relative;
                    overflow: hidden;
                }
                
                .disable-btn::before, .enable-btn::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
                    transition: left 0.5s ease;
                }
                
                .disable-btn:hover::before, .enable-btn:hover::before {
                    left: 100%;
                }
                
                .disable-btn {
                    background: linear-gradient(135deg, #ff6b6b, #ee5a52);
                    color: white;
                    box-shadow: 0 4px 16px rgba(238, 90, 82, 0.3);
                }
                
                .disable-btn:hover {
                    background: linear-gradient(135deg, #ff5252, #e53935);
                    transform: translateY(-2px) scale(1.05);
                    box-shadow: 0 8px 24px rgba(229, 57, 53, 0.4);
                }
                
                .enable-btn {
                    background: linear-gradient(135deg, #4caf50, #43a047);
                    color: white;
                    box-shadow: 0 4px 16px rgba(67, 160, 71, 0.3);
                }
                
                .enable-btn:hover {
                    background: linear-gradient(135deg, #43a047, #388e3c);
                    transform: translateY(-2px) scale(1.05);
                    box-shadow: 0 8px 24px rgba(56, 142, 60, 0.4);
                }
                
                .disable-btn:active, .enable-btn:active {
                    transform: translateY(0) scale(0.98);
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
                }
                
                .pagination-controls {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 12px;
                    margin-top: 32px;
                    padding: 20px 0;
                }
                
                .pagination-controls button {
                    padding: 12px 20px;
                    border: none;
                    border-radius: 12px;
                    background: linear-gradient(145deg, #ffffff, #f8fafc);
                    color: #374151;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    border: 1px solid #e5e7eb;
                    min-width: 44px;
                }
                
                .pagination-controls button:hover:not(:disabled) {
                    background: linear-gradient(145deg, #6366f1, #8b5cf6);
                    color: white;
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(99, 102, 241, 0.3);
                }
                
                .pagination-controls button.active {
                    background: linear-gradient(145deg, #6366f1, #8b5cf6);
                    color: white;
                    box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);
                }
                
                .pagination-controls button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    transform: none !important;
                }
                
                .no-users-message {
                    text-align: center;
                    padding: 60px 20px;
                    color: #6b7280;
                }
                
                .no-users-icon {
                    font-size: 4rem;
                    margin-bottom: 16px;
                    opacity: 0.5;
                }
                
                @media (max-width: 768px) {
                    .employee-header-row {
                        flex-direction: column;
                        align-items: stretch;
                        gap: 16px;
                    }
                    
                    .employee-search-bar {
                        width: 100%;
                    }
                    
                    .stats-summary {
                        justify-content: center;
                        flex-wrap: wrap;
                    }
                    
                    .employee-overview-title {
                        font-size: 2rem;
                        text-align: center;
                    }
                }
                `}</style>
                {/* Header with Title and Stats */}
                <div className="employee-overview-header">
                    <h1 className="employee-overview-title">
                        <span className="title-emoji">👥</span>
                        Employee Overview
                    </h1>
                    <div className="stats-summary">
                        <div className="stat-item total">
                            <div className="stat-number">{filteredUsers.length}</div>
                            <div className="stat-label">Total Users</div>
                        </div>
                        <div className="stat-item active">
                            <div className="stat-number">{filteredUsers.filter(user => user.active !== false).length}</div>
                            <div className="stat-label">Active</div>
                        </div>
                        <div className="stat-item inactive">
                            <div className="stat-number">{filteredUsers.filter(user => user.active === false).length}</div>
                            <div className="stat-label">Inactive</div>
                        </div>
                    </div>
                </div>

                <div className="employee-content-card">
                    <div className="employee-header-row">
                        <div className="search-section">
                            <div className="search-wrapper">
                                <span className="search-icon">🔍</span>
                                <input
                                    type="text"
                                    className="employee-search-bar"
                                    placeholder="Search by name, email, or role..."
                                    value={search}
                                    onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                                    style={{ paddingLeft: '45px' }}
                                />
                            </div>
                        </div>
                        <div className="rows-per-page-select">
                            <label htmlFor="rowsPerPage">Show: </label>
                            <select id="rowsPerPage" value={rowsPerPage} onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>
                    </div>
                    {paginatedUsers.length === 0 ? (
                        <div className="no-users-message">
                            <div className="no-users-icon">🔍</div>
                            <h3>No users found</h3>
                            <p>Try adjusting your search criteria</p>
                        </div>
                    ) : (
                        <table className="employee-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedUsers.map((user, index) => (
                                    <tr key={index}>
                                        <td>
                                            <div className="user-info">
                                                <div className="user-avatar">
                                                    {user.name ? user.name.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="user-details">
                                                    <div className="user-name">{user.name || user.username}</div>
                                                    <div className="user-email">{user.username}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`role-badge ${user.role?.toLowerCase() || 'employee'}`}>
                                                {user.role || 'Employee'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`status ${user.active === false ? 'inactive' : 'active'}`}>
                                                <span className="status-dot"></span>
                                                {user.active === false ? 'Inactive' : 'Active'}
                                            </span>
                                        </td>
                                        <td>
                                            {user.active !== false ? (
                                                <button className="disable-btn" onClick={() => handleDisableUser(user.username)}>
                                                    Disable
                                                </button>
                                            ) : (
                                                <button className="enable-btn" onClick={() => handleEnableUser(user.username)}>
                                                    Enable
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="pagination-controls">
                            <button onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>&laquo; Prev</button>
                            {Array.from({ length: totalPages }, (_, i) => (
                                <button
                                    key={i + 1}
                                    className={currentPage === i + 1 ? 'active' : ''}
                                    onClick={() => setCurrentPage(i + 1)}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            <button onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>Next &raquo;</button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default EmployeeOverview;
