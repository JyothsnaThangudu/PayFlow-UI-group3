import React, { useEffect, useState } from 'react';
import PopupMessage from '../components/PopupMessage';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/SidebarAdmin';
import './AdminDashboard.css';
import { FaEdit, FaBell, FaUserPlus, FaFileExport, FaBullhorn, FaSync } from 'react-icons/fa';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [employeeCount, setEmployeeCount] = useState(0);
    const [loading, setLoading] = useState(true);

    // Fetch users on component mount
    const [popup, setPopup] = useState({ show: false, title: '', message: '', type: 'success' });

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                setLoading(true);
                
                // Fetch all data in parallel
                const [usersRes, employeesRes, leavesRes] = await Promise.all([
                    axios.get('http://localhost:8080/api/admin/users'),
                    axios.get('http://localhost:8080/api/employee/all-employees'),
                    axios.get('http://localhost:8080/api/employee/leaves/all')
                ]);
                
                setUsers(usersRes.data);
                setEmployees(employeesRes.data);
                setLeaves(leavesRes.data);
                setEmployeeCount(employeesRes.data.length);
                
                console.log('Users:', usersRes.data);
                console.log('Employees:', employeesRes.data);
                console.log('Leaves:', leavesRes.data);
                
            } catch (err) {
                console.error('Failed to fetch data', err);
                // Set fallback data
                setUsers([]);
                setEmployees([]);
                setLeaves([]);
                setEmployeeCount(0);
            } finally {
                setLoading(false);
            }
        };
        
        fetchAllData();
    }, []);

    const refreshData = async () => {
        setLoading(true);
        try {
            const [usersRes, employeesRes, leavesRes] = await Promise.all([
                axios.get('http://localhost:8080/api/admin/users'),
                axios.get('http://localhost:8080/api/employee/all-employees'),
                axios.get('http://localhost:8080/api/employee/leaves/all')
            ]);
            
            setUsers(usersRes.data);
            setEmployees(employeesRes.data);
            setLeaves(leavesRes.data);
            setEmployeeCount(employeesRes.data.length);
            
            console.log('Data refreshed successfully');
        } catch (err) {
            console.error('Failed to refresh data', err);
        } finally {
            setLoading(false);
        }
    };



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

    // Pagination for Employee Overview
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const totalPages = Math.ceil(users.length / rowsPerPage);
    const paginatedUsers = users.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    // Dynamic data processing functions
    const getDynamicRoleDistribution = () => {
        if (!users.length) return [];
        
        const hrUsers = users.filter(user => user.role?.toUpperCase() === 'HR');
        const managerUsers = users.filter(user => user.role?.toUpperCase() === 'MANAGER');
        const employeeUsers = users.filter(user => user.role?.toUpperCase() === 'EMPLOYEE');
        
        return [
            { name: 'HR', value: hrUsers.length },
            { name: 'Manager', value: managerUsers.length },
            { name: 'Employee', value: employeeUsers.length },
        ].filter(item => item.value > 0); // Only show roles that exist
    };

    const getDynamicMonthlyJoining = () => {
        if (!employees.length) return [];
        
        const currentYear = new Date().getFullYear();
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        // Initialize all months with 0
        const monthlyData = monthNames.map(month => ({ month, employees: 0 }));
        
        // Count employees by joining month
        employees.forEach(emp => {
            if (emp.joiningDate) {
                try {
                    const joinDate = new Date(emp.joiningDate);
                    const joinYear = joinDate.getFullYear();
                    const joinMonth = joinDate.getMonth();
                    
                    // Only count current year joinings for relevance
                    if (joinYear === currentYear) {
                        monthlyData[joinMonth].employees++;
                    }
                } catch (err) {
                    console.warn('Invalid joining date format:', emp.joiningDate);
                }
            }
        });
        
        return monthlyData;
    };

    const getDynamicRecentActivity = () => {
        const activities = [];
        const maxActivities = 10;
        
        // Recent user additions
        const recentUsers = users
            .slice(-5) // Get last 5 users
            .reverse()
            .map(user => `${user.username} registered as ${user.role}`);
        
        // Recent leave applications
        const recentLeaves = leaves
            .filter(leave => leave.status === 'PENDING' || leave.status === 'ACCEPTED')
            .slice(-5)
            .reverse()
            .map(leave => {
                const emp = employees.find(e => e.id === leave.employeeId);
                const empName = emp ? emp.fullName : `Employee #${leave.employeeId}`;
                return `${empName} ${leave.status === 'ACCEPTED' ? 'approved for' : 'applied for'} ${leave.type} leave`;
            });
        
        // Recent employee onboarding
        const recentEmployees = employees
            .filter(emp => emp.joiningDate)
            .sort((a, b) => new Date(b.joiningDate) - new Date(a.joiningDate))
            .slice(0, 3)
            .map(emp => `${emp.fullName} joined ${emp.department || 'the company'}`);
        
        // Combine all activities
        activities.push(...recentUsers);
        activities.push(...recentLeaves);
        activities.push(...recentEmployees);
        
        // If no real activities, show meaningful default messages
        if (activities.length === 0) {
            return [
                'System initialized successfully',
                'Admin dashboard loaded',
                'Ready for employee management',
                'Monitoring system activities'
            ];
        }
        
        return activities.slice(0, maxActivities);
    };

    const getSystemNotifications = () => {
        const notifications = [];
        
        // Pending leave approvals
        const pendingLeaves = leaves.filter(leave => leave.status === 'PENDING').length;
        if (pendingLeaves > 0) {
            notifications.push(`${pendingLeaves} pending leave approvals`);
        }
        
        // Inactive users
        const inactiveUsers = users.filter(user => !user.active).length;
        if (inactiveUsers > 0) {
            notifications.push(`${inactiveUsers} inactive user accounts`);
        }
        
        // Recent employee count
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const thisMonthJoinings = employees.filter(emp => {
            if (!emp.joiningDate) return false;
            try {
                const joinDate = new Date(emp.joiningDate);
                return joinDate.getMonth() === currentMonth && joinDate.getFullYear() === currentYear;
            } catch {
                return false;
            }
        }).length;
        
        if (thisMonthJoinings > 0) {
            notifications.push(`${thisMonthJoinings} new employees this month`);
        }
        
        // Default notifications if none exist
        if (notifications.length === 0) {
            notifications.push('All systems operational');
            notifications.push('Employee data up to date');
        }
        
        return notifications;
    };

    // Process the data
    const rolePieData = getDynamicRoleDistribution();
    const barData = getDynamicMonthlyJoining();
    const recentActivity = getDynamicRecentActivity();
    const notifications = getSystemNotifications();

    // For summary cards
    const hrUsers = users.filter(user => user.role?.toUpperCase() === 'HR');
    const managerUsers = users.filter(user => user.role?.toUpperCase() === 'MANAGER');
    const employeeUsers = users.filter(user => user.role?.toUpperCase() === 'EMPLOYEE');
    const activeHRs = hrUsers.filter(user => user.active).length;
    const inactiveHRs = hrUsers.filter(user => !user.active).length;
    const activeManagers = managerUsers.filter(user => user.active).length;
    const inactiveManagers = managerUsers.filter(user => !user.active).length;

    const pieColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

    // Show loading state
    if (loading) {
        return (
            <div className="admin-dashboard-layout" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e0e7ff 0%, #f8fafc 100%)', fontFamily: 'Segoe UI, Roboto, Arial, sans-serif', color: '#222' }}>
                <Sidebar />
                <main className="admin-dashboard-main" style={{ padding: '32px 36px 36px 36px', maxWidth: 1400, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ 
                            width: '60px', 
                            height: '60px', 
                            border: '4px solid #f1f5f9',
                            borderTop: '4px solid #4f46e5',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            margin: '0 auto 1rem'
                        }}></div>
                        <p style={{ fontSize: '1.2rem', color: '#64748b' }}>Loading dashboard data...</p>
                    </div>
                </main>
                <style>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="admin-dashboard-layout" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e0e7ff 0%, #f8fafc 100%)', fontFamily: 'Segoe UI, Roboto, Arial, sans-serif', color: '#222' }}>
            {popup.show && (
                <PopupMessage title={popup.title} message={popup.message} type={popup.type} onClose={() => setPopup({ ...popup, show: false })} />
            )}
            <Sidebar />
            <main className="admin-dashboard-main" style={{ padding: '32px 36px 36px 36px', maxWidth: 1400, margin: '0 auto' }}>
                {/* Header with Notifications Bell */}
                <div className="admin-dashboard-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, borderBottom: '1.5px solid #e5e7eb', paddingBottom: 18 }}>
                    <h1>Admin Dashboard</h1>
                    <div style={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                        {/* Quick Actions */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginRight: 24 }}>
                                    <button className="quick-action-btn add-user-btn" title="Add User" onClick={() => navigate('/create-user')}>
                                        <FaUserPlus style={{ marginRight: 6 }} /> Add User
                                    </button>
                                    <button className="quick-action-btn export-btn" title="Export Data" onClick={() => alert('Exporting data...')}>
                                        <FaFileExport style={{ marginRight: 6 }} /> Export
                                    </button>
                                    <button className="quick-action-btn announce-btn" title="Send Announcement" onClick={() => alert('Announcement sent!')}>
                                        <FaBullhorn style={{ marginRight: 6 }} /> Announce
                                    </button>
                                    <button 
                                        className="quick-action-btn refresh-btn" 
                                        title="Refresh Data" 
                                        onClick={refreshData}
                                        disabled={loading}
                                    >
                                        <FaSync style={{ marginRight: 6, animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Refresh
                                    </button>
                                </div>
                        {/* Notifications Bell - always at far right */}
                        <div className="notification-bell-wrapper" style={{ position: 'relative' }}>
                            <div className="notification-bell" tabIndex={0} style={{ position: 'relative', cursor: 'pointer', marginLeft: 24 }}>
                                <FaBell size={24} />
                                {notifications.length > 0 && (
                                    <span className="notification-badge" style={{
                                        position: 'absolute',
                                        top: -6,
                                        right: -6,
                                        background: '#e74c3c',
                                        color: '#fff',
                                        borderRadius: '50%',
                                        fontSize: 12,
                                        width: 20,
                                        height: 20,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 700,
                                        zIndex: 2
                                    }}>{notifications.length}</span>
                                )}
                                <div className="notifications-dropdown" style={{
                                    display: 'none',
                                    position: 'absolute',
                                    top: 32,
                                    right: 0,
                                    minWidth: 220,
                                    background: '#fff',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                    borderRadius: 8,
                                    zIndex: 10,
                                    padding: 8
                                }}>
                                    {notifications.length === 0 ? (
                                        <div className="notification-item">No new notifications</div>
                                    ) : (
                                        notifications.map((note, idx) => (
                                            <div className="notification-item" key={idx}>{note}</div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <style>{`
                .quick-action-btn {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    padding: 10px 22px;
                    border: none;
                    border-radius: 8px;
                    font-size: 1.08rem;
                    font-weight: 600;
                    background: #f4f4f4;
                    color: #333;
                    cursor: pointer;
                    box-shadow: 0 2px 12px rgba(0,0,0,0.07);
                    transition: background 0.25s, color 0.2s, box-shadow 0.2s, transform 0.18s;
                }
                .quick-action-btn:hover {
                    background: #e0e7ff;
                    color: #1e40af;
                    box-shadow: 0 4px 16px rgba(30,64,175,0.10);
                    transform: translateY(-2px) scale(1.04);
                }
                .add-user-btn {
                    background: linear-gradient(90deg, #e0f7fa 60%, #b2ebf2 100%);
                    color: #00796b;
                }
                .add-user-btn:hover {
                    background: linear-gradient(90deg, #b2ebf2 60%, #e0f7fa 100%);
                    color: #004d40;
                }
                .export-btn {
                    background: linear-gradient(90deg, #fff3e0 60%, #ffe0b2 100%);
                    color: #ef6c00;
                }
                .export-btn:hover {
                    background: linear-gradient(90deg, #ffe0b2 60%, #fff3e0 100%);
                    color: #e65100;
                }
                .announce-btn {
                    background: linear-gradient(90deg, #fce4ec 60%, #f8bbd0 100%);
                    color: #ad1457;
                }
                .announce-btn:hover {
                    background: linear-gradient(90deg, #f8bbd0 60%, #fce4ec 100%);
                    color: #880e4f;
                }
                .refresh-btn {
                    background: linear-gradient(90deg, #f3e5f5 60%, #e1bee7 100%);
                    color: #7b1fa2;
                }
                .refresh-btn:hover:not(:disabled) {
                    background: linear-gradient(90deg, #e1bee7 60%, #f3e5f5 100%);
                    color: #4a148c;
                }
                .refresh-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none !important;
                }
                .admin-card-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                    gap: 28px;
                    margin: 36px 0 32px 0;
                }
                .admin-card {
                    background: #fff;
                    border-radius: 14px;
                    box-shadow: 0 4px 24px rgba(30,64,175,0.07), 0 1.5px 6px rgba(0,0,0,0.04);
                    padding: 28px 24px 22px 24px;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    transition: box-shadow 0.2s, transform 0.18s;
                }
                .admin-card:hover {
                    box-shadow: 0 8px 32px rgba(30,64,175,0.13), 0 2px 8px rgba(0,0,0,0.06);
                    transform: translateY(-2px) scale(1.02);
                }
                .highlight-card {
                    border-left: 6px solid #6366f1;
                }
                .info-card {
                    border-left: 6px solid #06b6d4;
                }
                .admin-section-title {
                    font-size: 1.12rem;
                    font-weight: 700;
                    color: #6366f1;
                    margin-bottom: 8px;
                }
                .admin-count {
                    font-size: 2.5rem;
                    font-weight: 800;
                    color: #22223b;
                    margin-bottom: 8px;
                }
                .stats {
                    font-size: 1rem;
                    color: #64748b;
                    display: flex;
                    gap: 18px;
                }
                .dashboard-charts-row {
                    display: flex;
                    gap: 32px;
                    margin-bottom: 36px;
                    flex-wrap: wrap;
                }
                .dashboard-chart-card {
                    background: #fff;
                    border-radius: 14px;
                    box-shadow: 0 4px 24px rgba(30,64,175,0.07), 0 1.5px 6px rgba(0,0,0,0.04);
                    padding: 24px 18px 18px 18px;
                    flex: 1 1 340px;
                    min-width: 320px;
                    max-width: 480px;
                    margin-bottom: 12px;
                }
                .dashboard-activity-feed {
                    background: #fff;
                    border-radius: 14px;
                    box-shadow: 0 4px 24px rgba(30,64,175,0.07), 0 1.5px 6px rgba(0,0,0,0.04);
                    padding: 24px 18px 18px 18px;
                    margin-top: 18px;
                }
                .activity-list {
                    margin: 0;
                    padding: 0 0 0 18px;
                    font-size: 1.04rem;
                }
                .activity-list li {
                    margin-bottom: 8px;
                }
                .notification-bell-wrapper {
                    position: relative;
                }
                .notification-bell:hover .notifications-dropdown,
                .notification-bell:focus .notifications-dropdown {
                    display: block !important;
                }
                .notifications-dropdown {
                    display: none;
                    position: absolute;
                    top: 32px;
                    right: 0;
                    min-width: 240px;
                    background: #fff;
                    box-shadow: 0 4px 24px rgba(30,64,175,0.13), 0 2px 8px rgba(0,0,0,0.06);
                    border-radius: 12px;
                    z-index: 10;
                    padding: 12px 8px 8px 8px;
                    font-size: 1rem;
                }
                .notification-item {
                    padding: 8px 10px;
                    border-radius: 6px;
                    margin-bottom: 4px;
                    transition: background 0.18s;
                }
                .notification-item:hover {
                    background: #e0e7ff;
                }
                .notification-badge {
                    position: absolute;
                    top: -6px;
                    right: -6px;
                    background: #e74c3c;
                    color: #fff;
                    border-radius: 50%;
                    font-size: 12px;
                    width: 20px;
                    height: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    z-index: 2;
                }
                `}</style>

                {/* Summary Cards */}
                {/*<div className="admin-card-grid">*/}
                {/*    <div className="admin-card highlight-card">*/}
                {/*        <h2 className="admin-section-title">TOTAL HRs</h2>*/}
                {/*        <div className="admin-count">{hrUsers.length}</div>*/}
                {/*        <div className="stats">*/}
                {/*            <span>Active: {activeHRs}</span>*/}
                {/*            <span>Inactive: {inactiveHRs}</span>*/}
                {/*        </div>*/}
                {/*    </div>*/}
                {/*    <div className="admin-card highlight-card">*/}
                {/*        <h2 className="admin-section-title">TOTAL MANAGERS</h2>*/}
                {/*        <div className="admin-count">{managerUsers.length}</div>*/}
                {/*        <div className="stats">*/}
                {/*            <span>Active: {activeManagers}</span>*/}
                {/*            <span>Inactive: {inactiveManagers}</span>*/}
                {/*        </div>*/}
                {/*    </div>*/}
                {/*    <div className="admin-card highlight-card">*/}
                {/*        <h2 className="admin-section-title">TOTAL EMPLOYEES</h2>*/}
                {/*        <div className="admin-count">{employeeCount}</div>*/}
                {/*        <div className="stats">*/}
                {/*            <span>Active: {employeeUsers.filter(u => u.active).length}</span>*/}
                {/*            <span>Inactive: {employeeUsers.filter(u => !u.active).length}</span>*/}
                {/*        </div>*/}
                {/*    </div>*/}
                {/*    <div className="admin-card info-card">*/}
                {/*        <h2 className="admin-section-title">Pending Leave Requests</h2>*/}
                {/*        <div className="admin-count">{leaves.filter(leave => leave.status === 'PENDING').length}</div>*/}
                {/*        <div className="stats">*/}
                {/*            <span>Approved: {leaves.filter(leave => leave.status === 'ACCEPTED').length}</span>*/}
                {/*        </div>*/}
                {/*    </div>*/}
                {/*    <div className="admin-card info-card">*/}
                {/*        <h2 className="admin-section-title">New Joinings This Month</h2>*/}
                {/*        <div className="admin-count">*/}
                {/*            {(() => {*/}
                {/*                const currentMonth = new Date().getMonth();*/}
                {/*                const currentYear = new Date().getFullYear();*/}
                {/*                return employees.filter(emp => {*/}
                {/*                    if (!emp.joiningDate) return false;*/}
                {/*                    try {*/}
                {/*                        const joinDate = new Date(emp.joiningDate);*/}
                {/*                        return joinDate.getMonth() === currentMonth && joinDate.getFullYear() === currentYear;*/}
                {/*                    } catch {*/}
                {/*                        return false;*/}
                {/*                    }*/}
                {/*                }).length;*/}
                {/*            })()}*/}
                {/*        </div>*/}
                {/*        <div className="stats">*/}
                {/*            <span>Total: {employees.length}</span>*/}
                {/*        </div>*/}
                {/*    </div>*/}
                {/*</div>*/}

                {/* Summary Cards */}
                <div className="summary-cards-row">
                    <div className="admin-card highlight-card">
                        <h2 className="admin-section-title">TOTAL HRs</h2>
                        <div className="admin-count">{hrUsers.length}</div>
                        <div className="stats">
                            <span>Active: {activeHRs}</span>
                            <span>Inactive: {inactiveHRs}</span>
                        </div>
                    </div>
                    <div className="admin-card highlight-card">
                        <h2 className="admin-section-title">TOTAL MANAGERS</h2>
                        <div className="admin-count">{managerUsers.length}</div>
                        <div className="stats">
                            <span>Active: {activeManagers}</span>
                            <span>Inactive: {inactiveManagers}</span>
                        </div>
                    </div>
                    <div className="admin-card highlight-card">
                        <h2 className="admin-section-title">TOTAL EMPLOYEES</h2>
                        <div className="admin-count">{employeeCount}</div>
                        <div className="stats">
                            <span>Active: {employeeUsers.filter(u => u.active).length}</span>
                            <span>Inactive: {employeeUsers.filter(u => !u.active).length}</span>
                        </div>
                    </div>
                    <div className="admin-card info-card">
                        <h2 className="admin-section-title">Pending Leave Requests</h2>
                        <div className="admin-count">{leaves.filter(leave => leave.status === 'PENDING').length}</div>
                        <div className="stats">
                            <span>Approved: {leaves.filter(leave => leave.status === 'ACCEPTED').length}</span>
                        </div>
                    </div>
                    <div className="admin-card info-card">
                        <h2 className="admin-section-title">New Joinings This Month</h2>
                        <div className="admin-count">
                            {(() => {
                                const currentMonth = new Date().getMonth();
                                const currentYear = new Date().getFullYear();
                                return employees.filter(emp => {
                                    if (!emp.joiningDate) return false;
                                    try {
                                        const joinDate = new Date(emp.joiningDate);
                                        return joinDate.getMonth() === currentMonth && joinDate.getFullYear() === currentYear;
                                    } catch {
                                        return false;
                                    }
                                }).length;
                            })()}
                        </div>
                        <div className="stats">
                            <span>Total: {employees.length}</span>
                        </div>
                    </div>
                </div>


                {/* Charts & Visualizations */}
                <div className="dashboard-charts-row">
                    <div className="dashboard-chart-card">
                        <h3>Role Distribution</h3>
                        {rolePieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie data={rolePieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                                        {rolePieData.map((entry, idx) => (
                                            <Cell key={`cell-${idx}`} fill={pieColors[idx % pieColors.length]} />
                                        ))}
                                    </Pie>
                                    <Legend />
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '220px', color: '#64748b' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
                                    <div>No role data available</div>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="dashboard-chart-card">
                        <h3>Employees Joined This Year</h3>
                        {barData.some(item => item.employees > 0) ? (
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="employees" fill="#8884d8" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '220px', color: '#64748b' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📈</div>
                                    <div>No joining data for this year</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Activity Feed */}
                <div className="dashboard-activity-feed">
                    <h3>Recent Activity</h3>
                    <ul className="activity-list">
                        {recentActivity.length === 0 ? (
                            <li>No recent activity</li>
                        ) : (
                            recentActivity.map((item, idx) => (
                                <li key={idx} style={{ 
                                    padding: '0.5rem 0', 
                                    borderBottom: idx < recentActivity.length - 1 ? '1px solid #f1f5f9' : 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}>
                                    <div style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        background: '#4f46e5',
                                        flexShrink: 0
                                    }}></div>
                                    <span>{item}</span>
                                    <span style={{ 
                                        fontSize: '0.75rem', 
                                        color: '#64748b',
                                        marginLeft: 'auto'
                                    }}>
                                        {idx < 3 ? 'Recent' : (idx < 6 ? 'Today' : 'This week')}
                                    </span>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            </main>
        </div>
  );
};

export default AdminDashboard;