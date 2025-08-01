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
            setPopup({ show: true, title: 'Failed', message: 'Failed to disable user', type: 'error' });
            console.error(err);
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
            <main className="admin-dashboard-main" style={{ padding: '32px 36px 36px 36px', maxWidth: 1200, margin: '0 auto' }}>
                <style>{`
                .employee-content-card {
                    background: rgba(255,255,255,0.92);
                    border-radius: 18px;
                    box-shadow: 0 6px 32px rgba(30,64,175,0.10), 0 2px 8px rgba(0,0,0,0.04);
                    padding: 36px 32px 28px 32px;
                    margin-top: 18px;
                    animation: fadeIn 0.7s cubic-bezier(.4,0,.2,1);
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(24px); }
                    to { opacity: 1; transform: none; }
                }
                .employee-header-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 24px;
                }
                .employee-search-bar {
                    padding: 10px 18px;
                    border-radius: 10px;
                    border: 1.5px solid #e0e7ff;
                    font-size: 1.08rem;
                    width: 340px;
                    background: #f8fafc;
                    transition: border 0.18s, box-shadow 0.18s;
                    box-shadow: 0 1px 4px rgba(30,64,175,0.06);
                }
                .employee-search-bar:focus {
                    border: 1.5px solid #6366f1;
                    outline: none;
                    box-shadow: 0 2px 8px rgba(99,102,241,0.10);
                }
                .employee-table {
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 0;
                    background: rgba(255,255,255,0.98);
                    border-radius: 12px;
                    box-shadow: 0 2px 12px rgba(30,64,175,0.07);
                    overflow: hidden;
                    margin-top: 12px;
                }
                .employee-table th, .employee-table td {
                    padding: 14px 12px;
                    text-align: left;
                    border-bottom: 1px solid #e5e7eb;
                }
                .employee-table th {
                    background: #f3f4f6;
                    font-weight: 700;
                    color: #374151;
                }
                .employee-table tr:last-child td {
                    border-bottom: none;
                }
                .status {
                    display: inline-block;
                    padding: 5px 16px;
                    border-radius: 16px;
                    font-size: 1rem;
                    font-weight: 600;
                    background: #e0e7ff;
                    color: #3730a3;
                    border: 1px solid #c7d2fe;
                    transition: background 0.18s, color 0.18s;
                }
                .status.active {
                    background: #d1fae5;
                    color: #047857;
                    border-color: #6ee7b7;
                }
                .status.inactive {
                    background: #fee2e2;
                    color: #b91c1c;
                    border-color: #fecaca;
                }
                .disable-btn {
                    background: linear-gradient(90deg, #fff3e0 60%, #ffe0b2 100%);
                    color: #ef6c00;
                    border: none;
                    border-radius: 8px;
                    padding: 7px 18px;
                    font-weight: 600;
                    font-size: 1rem;
                    cursor: pointer;
                    box-shadow: 0 1px 4px rgba(30,64,175,0.07);
                    transition: background 0.18s, color 0.18s, box-shadow 0.18s, transform 0.15s;
                }
                .disable-btn:hover {
                    background: linear-gradient(90deg, #ffe0b2 60%, #fff3e0 100%);
                    color: #e65100;
                    box-shadow: 0 2px 8px rgba(239,108,0,0.10);
                    transform: translateY(-2px) scale(1.04);
                }
                .disabled-text {
                    color: #a1a1aa;
                    font-weight: 600;
                }
                `}</style>
                <div className="employee-content-card">
                    <div className="employee-header-row">
                        <h2 className="section-title">Employee Overview</h2>
                        <input
                            type="text"
                            className="employee-search-bar"
                            placeholder="Search by name, email, or role..."
                            value={search}
                            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                        />
                        <div className="rows-per-page-select">
                            <label htmlFor="rowsPerPage">Rows per page: </label>
                            <select id="rowsPerPage" value={rowsPerPage} onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>
                    </div>
                    <table className="employee-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedUsers.map((user, index) => (
                                <tr key={index}>
                                    <td>{user.name}</td>
                                    <td>{user.username}</td>
                                    <td>{user.role}</td>
                                    <td>
                                        <span className={`status ${user.active === false ? 'inactive' : 'active'}`}>
                                            {user.active === false ? 'Inactive' : 'Active'}
                                        </span>
                                    </td>
                                    <td>
                                        {user.active ? (
                                            <button className="disable-btn" onClick={() => handleDisableUser(user.username)}>
                                                Disable
                                            </button>
                                        ) : (
                                            <span className="disabled-text">Disabled</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
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
