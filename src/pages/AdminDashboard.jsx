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

    // Pagination for Recent Activity state
    const [activityPage, setActivityPage] = useState(1);
    const [activitiesPerPage] = useState(5);

    // Notification management state
    const [dismissedNotifications, setDismissedNotifications] = useState(new Set());
    const [showAllNotifications, setShowAllNotifications] = useState(false);

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
            notifications.push({
                id: `pending-leaves-${pendingLeaves}`,
                message: `${pendingLeaves} pending leave approvals`,
                type: 'leave',
                priority: 'high',
                timestamp: new Date(),
                action: 'Review pending leave requests'
            });
        }
        
        // Inactive users
        const inactiveUsers = users.filter(user => !user.active).length;
        if (inactiveUsers > 0) {
            notifications.push({
                id: `inactive-users-${inactiveUsers}`,
                message: `${inactiveUsers} inactive user accounts`,
                type: 'warning',
                priority: 'medium',
                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
                action: 'Review and activate accounts'
            });
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
            notifications.push({
                id: `new-joinings-${thisMonthJoinings}`,
                message: `${thisMonthJoinings} new employees this month`,
                type: 'employee',
                priority: 'low',
                timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
                action: 'Welcome new employees'
            });
        }
        
        // System health notifications
        if (users.length > 50) {
            notifications.push({
                id: 'system-scale',
                message: 'System scaling well - over 50 users registered',
                type: 'success',
                priority: 'low',
                timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
                action: 'Monitor system performance'
            });
        }
        
        // Recent activity alerts
        const recentLogins = users.filter(user => user.lastLogin && 
            new Date(user.lastLogin) > new Date(Date.now() - 24 * 60 * 60 * 1000)
        ).length;
        
        if (recentLogins > 10) {
            notifications.push({
                id: 'high-activity',
                message: `High system activity - ${recentLogins} recent logins`,
                type: 'info',
                priority: 'medium',
                timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
                action: 'Monitor system resources'
            });
        }
        
        // Default notifications if none exist
        if (notifications.length === 0) {
            notifications.push({
                id: 'system-operational',
                message: 'All systems operational',
                type: 'success',
                priority: 'low',
                timestamp: new Date(),
                action: 'Continue monitoring'
            });
            notifications.push({
                id: 'data-updated',
                message: 'Employee data up to date',
                type: 'success',
                priority: 'low',
                timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
                action: 'Review data accuracy'
            });
        }
        
        return notifications;
    };

    // Notification action handlers
    const handleDismissNotification = (index) => {
        setDismissedNotifications(prev => new Set([...prev, index]));
        
        // Show confirmation
        setPopup({ 
            show: true, 
            title: 'Notification Dismissed', 
            message: 'The notification has been dismissed successfully.', 
            type: 'success' 
        });
    };

    const handleMarkAllAsRead = () => {
        const allIndices = allNotifications.map((_, index) => index);
        setDismissedNotifications(new Set(allIndices));
        
        setPopup({ 
            show: true, 
            title: 'All Notifications Cleared', 
            message: 'All notifications have been cleared.', 
            type: 'success' 
        });
    };

    const handleViewAllNotifications = () => {
        setShowAllNotifications(true);
    };

    const handleCloseNotificationsModal = () => {
        setShowAllNotifications(false);
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'leave': return '📋';
            case 'warning': return '⚠️';
            case 'employee': return '👥';
            case 'success': return '✅';
            case 'info': return 'ℹ️';
            default: return '📢';
        }
    };

    const getNotificationTime = (timestamp) => {
        const now = new Date();
        const diff = now - new Date(timestamp);
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes} min ago`;
        if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        return `${days} day${days > 1 ? 's' : ''} ago`;
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return '#ef4444';
            case 'medium': return '#f59e0b';
            case 'low': return '#10b981';
            default: return '#6b7280';
        }
    };

    // Process the data
    const rolePieData = getDynamicRoleDistribution();
    const barData = getDynamicMonthlyJoining();
    const recentActivity = getDynamicRecentActivity();
    const allNotifications = getSystemNotifications();
    
    // Filter out dismissed notifications
    const notifications = allNotifications.filter((_, index) => !dismissedNotifications.has(index));

    // Get simple messages for dropdown display
    const notificationMessages = notifications.map(notif => notif.message);

    // For summary cards
    const hrUsers = users.filter(user => user.role?.toUpperCase() === 'HR');
    const managerUsers = users.filter(user => user.role?.toUpperCase() === 'MANAGER');
    const employeeUsers = users.filter(user => user.role?.toUpperCase() === 'EMPLOYEE');
    const activeHRs = hrUsers.filter(user => user.active).length;
    const inactiveHRs = hrUsers.filter(user => !user.active).length;
    const activeManagers = managerUsers.filter(user => user.active).length;
    const inactiveManagers = managerUsers.filter(user => !user.active).length;
    
    // Updated: Use employeeUsers.length instead of employeeCount for consistency
    const totalEmployeesFromUsers = employeeUsers.length;
    const activeEmployees = employeeUsers.filter(user => user.active).length;
    const inactiveEmployees = employeeUsers.filter(user => !user.active).length;

    const pieColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

    // Pagination for Recent Activity (moved here after recentActivity is defined)
    const totalActivityPages = Math.ceil(recentActivity.length / activitiesPerPage);
    const paginatedActivities = recentActivity.slice(
        (activityPage - 1) * activitiesPerPage, 
        activityPage * activitiesPerPage
    );

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
                    <div className="dashboard-welcome-section">
                        <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '1.8rem' }}>👋</span>
                            Welcome Back, Administrator
                        </h1>
    
                    </div>
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
                        <div className="notification-bell-wrapper" style={{ position: 'relative', zIndex: 10000 }}>
                            <div className="notification-bell" tabIndex={0} style={{ 
                                position: 'relative', 
                                cursor: 'pointer', 
                                marginLeft: 24,
                                padding: '12px',
                                borderRadius: '50%',
                                transition: 'all 0.3s ease',
                                background: 'rgba(255,255,255,0.1)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                zIndex: 10001
                            }}>
                                <FaBell size={24} style={{ color: '#4f46e5' }} />
                                {notificationMessages.length > 0 && (
                                    <span className="notification-badge" style={{
                                        position: 'absolute',
                                        top: -2,
                                        right: -2,
                                        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                                        color: '#fff',
                                        borderRadius: '50%',
                                        fontSize: 11,
                                        width: 22,
                                        height: 22,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 700,
                                        zIndex: 2,
                                        animation: 'pulse 2s infinite',
                                        boxShadow: '0 0 20px rgba(239, 68, 68, 0.5)'
                                    }}>{notificationMessages.length}</span>
                                )}
                                <div className="notifications-dropdown">
                                    <div className="dropdown-header">
                                        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1f2937' }}>Notifications</h4>
                                        <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>
                                            {notificationMessages.length} {notificationMessages.length === 1 ? 'item' : 'items'}
                                        </span>
                                    </div>
                                    <div className="notifications-list">
                                        {notificationMessages.length === 0 ? (
                                            <div className="notification-item empty-state">
                                                <div className="notification-icon">🔔</div>
                                                <div className="notification-content">
                                                    <div className="notification-text">No new notifications</div>
                                                    <div className="notification-time">All caught up!</div>
                                                </div>
                                            </div>
                                        ) : (
                                            notificationMessages.map((note, idx) => {
                                                const originalIndex = allNotifications.findIndex(n => n.message === note);
                                                const fullNotification = allNotifications[originalIndex];
                                                
                                                return (
                                                    <div 
                                                        className={`notification-item priority-${fullNotification.priority}`} 
                                                        key={originalIndex}
                                                    >
                                                        <div className="notification-icon">{getNotificationIcon(fullNotification.type)}</div>
                                                        <div className="notification-content">
                                                            <div className="notification-text">{note}</div>
                                                            <div className="notification-time">{getNotificationTime(fullNotification.timestamp)}</div>
                                                        </div>
                                                        <div className="notification-actions">
                                                            <button 
                                                                className="action-btn dismiss-btn" 
                                                                title="Dismiss"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDismissNotification(originalIndex);
                                                                }}
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                    <div className="dropdown-footer">
                                        <button 
                                            className="view-all-btn"
                                            onClick={handleViewAllNotifications}
                                        >
                                            View All Notifications
                                        </button>
                                        <button 
                                            className="mark-read-btn"
                                            onClick={handleMarkAllAsRead}
                                            disabled={notificationMessages.length === 0}
                                        >
                                            Clear All
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <style>{`
                .quick-action-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 12px 24px;
                    border: none;
                    border-radius: 12px;
                    font-size: 14px;
                    font-weight: 600;
                    background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
                    color: #475569;
                    cursor: pointer;
                    box-shadow: 0 4px 16px rgba(0,0,0,0.1), 0 2px 6px rgba(0,0,0,0.05);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    border: 1px solid rgba(226, 232, 240, 0.8);
                }
                .quick-action-btn:hover {
                    transform: translateY(-3px) scale(1.05);
                    box-shadow: 0 8px 32px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.1);
                }
                .add-user-btn {
                    background: linear-gradient(145deg, #10b981, #059669);
                    color: white;
                    border: none;
                }
                .add-user-btn:hover {
                    background: linear-gradient(145deg, #059669, #047857);
                    box-shadow: 0 8px 32px rgba(16, 185, 129, 0.4);
                }
                .export-btn {
                    background: linear-gradient(145deg, #f59e0b, #d97706);
                    color: white;
                    border: none;
                }
                .export-btn:hover {
                    background: linear-gradient(145deg, #d97706, #b45309);
                    box-shadow: 0 8px 32px rgba(245, 158, 11, 0.4);
                }
                .announce-btn {
                    background: linear-gradient(145deg, #8b5cf6, #7c3aed);
                    color: white;
                    border: none;
                }
                .announce-btn:hover {
                    background: linear-gradient(145deg, #7c3aed, #6d28d9);
                    box-shadow: 0 8px 32px rgba(139, 92, 246, 0.4);
                }
                .refresh-btn {
                    background: linear-gradient(145deg, #3b82f6, #2563eb);
                    color: white;
                    border: none;
                }
                .refresh-btn:hover:not(:disabled) {
                    background: linear-gradient(145deg, #2563eb, #1d4ed8);
                    box-shadow: 0 8px 32px rgba(59, 130, 246, 0.4);
                }
                .refresh-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none !important;
                }
                
                .summary-cards-row {
                    display: grid;
                    grid-template-columns: repeat(5, 1fr);
                    gap: 20px;
                    margin: 65px 0;
                }
                
                @media (max-width: 1400px) {
                    .summary-cards-row {
                        grid-template-columns: repeat(3, 1fr);
                    }
                }
                
                @media (max-width: 900px) {
                    .summary-cards-row {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }
                
                @media (max-width: 600px) {
                    .summary-cards-row {
                        grid-template-columns: 1fr;
                    }
                }
                
                .admin-card {
                    background: white;
                    border-radius: 16px;
                    padding: 24px;
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
                    transition: all 0.3s ease;
                    border-left: 4px solid transparent;
                    position: relative;
                    overflow: hidden;
                    min-height: 120px;
                }
                
                .admin-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
                }
                
                .admin-card.highlight-card:nth-child(1) {
                    border-left-color: #7c3aed;
                }
                
                .admin-card.highlight-card:nth-child(2) {
                    border-left-color: #ec4899;
                }
                
                .admin-card.highlight-card:nth-child(3) {
                    border-left-color: #06b6d4;
                }
                
                .admin-card.info-card:nth-child(4) {
                    border-left-color: #10b981;
                }
                
                .admin-card.info-card:nth-child(5) {
                    border-left-color: #f59e0b;
                }
                
                .card-icon {
                    width: 60px;
                    height: 60px;
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                    color: white;
                    flex-shrink: 0;
                }
                
                .hr-icon {
                    background: linear-gradient(135deg, #7c3aed, #a855f7);
                }
                
                .manager-icon {
                    background: linear-gradient(135deg, #ec4899, #f472b6);
                }
                
                .employee-icon {
                    background: linear-gradient(135deg, #06b6d4, #38bdf8);
                }
                
                .leave-icon {
                    background: linear-gradient(135deg, #10b981, #34d399);
                }
                
                .joining-icon {
                    background: linear-gradient(135deg, #f59e0b, #fbbf24);
                }
                
                .card-content {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                }
                
                .admin-section-title {
                    font-size: 12px;
                    font-weight: 600;
                    color: #6b7280;
                    margin-bottom: 8px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .admin-count {
                    font-size: 2.5rem;
                    font-weight: 700;
                    color: #1f2937;
                    margin-bottom: 12px;
                    line-height: 1;
                }
                
                .stats {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                
                .stats span {
                    font-size: 12px;
                    font-weight: 500;
                }
                
                .active-stat {
                    color: #10b981;
                }
                
                .inactive-stat {
                    color: #ef4444;
                }
                
                .approved-stat {
                    color: #3b82f6;
                }
                
                .total-stat {
                    color: #7c3aed;
                }
                
                .dashboard-charts-row {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
                    gap: 24px;
                    margin-bottom: 48px;
                }
                
                .dashboard-chart-card {
                    background: white;
                    border-radius: 20px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
                    padding: 0;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    border: 1px solid rgba(226, 232, 240, 0.6);
                    overflow: hidden;
                    position: relative;
                }
                
                .dashboard-chart-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 4px;
                    background: linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
                }
                
                .dashboard-chart-card:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 20px 48px rgba(0, 0, 0, 0.12);
                    border-color: rgba(102, 126, 234, 0.3);
                }

                .dashboard-chart-card h3 {
                    font-size: 20px;
                    font-weight: 700;
                    color: #1f2937;
                    margin: 0 0 24px 0;
                    text-align: center;
                    padding: 24px 24px 0 24px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    background-clip: text;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    position: relative;
                }
                
                .dashboard-chart-card h3::after {
                    content: '';
                    position: absolute;
                    bottom: -8px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 40px;
                    height: 3px;
                    background: linear-gradient(90deg, #667eea, #764ba2);
                    border-radius: 2px;
                }
                
                .dashboard-chart-card .chart-content {
                    padding: 0 24px 24px 24px;
                }

                .dashboard-activity-feed {
                    background: white;
                    border-radius: 20px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
                    padding: 0;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    border: 1px solid rgba(226, 232, 240, 0.6);
                    overflow: hidden;
                    position: relative;
                    margin-top: 64px;
                }
                
                .dashboard-activity-feed::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 4px;
                    background: linear-gradient(90deg, #10b981 0%, #059669 50%, #34d399 100%);
                }
                
                .dashboard-activity-feed:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 20px 48px rgba(0, 0, 0, 0.12);
                    border-color: rgba(16, 185, 129, 0.3);
                }
                
                .dashboard-activity-feed h3 {
                    font-size: 20px;
                    font-weight: 700;
                    color: #1f2937;
                    margin: 0 0 24px 0;
                    text-align: center;
                    padding: 24px 24px 0 24px;
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    background-clip: text;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                }
                
                .dashboard-activity-feed h3::after {
                    content: '';
                    position: absolute;
                    bottom: -8px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 40px;
                    height: 3px;
                    background: linear-gradient(90deg, #10b981, #059669);
                    border-radius: 2px;
                }
                
                .activity-feed-content {
                    padding: 0 24px 24px 24px;
                }
                
                .activity-list {
                    margin: 0;
                    padding: 0;
                    list-style: none;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                
                .activity-item {
                    padding: 18px 20px;
                    background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
                    border-radius: 16px;
                    border: 1px solid rgba(226, 232, 240, 0.8);
                    box-shadow: 0 4px 16px rgba(0,0,0,0.06);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    position: relative;
                    overflow: hidden;
                }
                
                .activity-item::before {
                    content: '';
                    position: absolute;
                    left: 0;
                    top: 0;
                    bottom: 0;
                    width: 4px;
                    background: linear-gradient(135deg, #10b981, #34d399);
                    transform: scaleY(0);
                    transition: transform 0.3s ease;
                }
                
                .activity-item:hover {
                    transform: translateX(12px) scale(1.02);
                    box-shadow: 0 8px 32px rgba(16, 185, 129, 0.15);
                    background: linear-gradient(145deg, #ffffff 0%, #ecfdf5 100%);
                    border-color: rgba(16, 185, 129, 0.3);
                }
                
                .activity-item:hover::before {
                    transform: scaleY(1);
                }
                
                .activity-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 12px;
                    background: linear-gradient(135deg, #10b981, #059669);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 16px;
                    flex-shrink: 0;
                    box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
                    transition: all 0.3s ease;
                }
                
                .activity-item:hover .activity-icon {
                    transform: scale(1.1) rotate(5deg);
                    box-shadow: 0 6px 24px rgba(16, 185, 129, 0.4);
                }
                
                .activity-content {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                
                .activity-text {
                    font-size: 14px;
                    color: #1f2937;
                    font-weight: 600;
                    line-height: 1.4;
                    margin: 0;
                }
                
                .activity-subtitle {
                    font-size: 12px;
                    color: #6b7280;
                    font-weight: 500;
                    margin: 0;
                }
                
                .activity-time {
                    font-size: 11px;
                    color: #11a372ff;
                    font-weight: 700;
                    padding: 6px 12px;
                    background: rgba(16, 185, 129, 0.1);
                    border-radius: 20px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    border: 1px solid rgba(16, 185, 129, 0.2);
                    transition: all 0.3s ease;
                    white-space: nowrap;
                }
                
                .activity-item:hover .activity-time {
                    background: rgba(16, 185, 129, 0.15);
                    border-color: rgba(16, 185, 129, 0.3);
                    transform: scale(1.05);
                }
                
                .pagination-controls {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 16px;
                    margin-top: 24px;
                }
                
                .pagination-btn {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 8px;
                    background: linear-gradient(145deg, #6366f1, #8b5cf6);
                    color: white;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-size: 14px;
                }
                
                .pagination-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
                }
                
                .pagination-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    transform: none !important;
                }
                
                .pagination-info {
                    font-size: 14px;
                    color: #6b7280;
                    font-weight: 600;
                }
                
                .notification-bell-wrapper {
                    position: relative;
                }
                
                .notification-bell {
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                
                .notification-bell:hover {
                    transform: scale(1.1);
                    background: rgba(79, 70, 229, 0.1) !important;
                    box-shadow: 0 8px 25px rgba(79, 70, 229, 0.3);
                }
                
                .notification-bell:hover .notifications-dropdown,
                .notification-bell:focus .notifications-dropdown {
                    display: block !important;
                    animation: slideDown 0.3s ease-out;
                }
                
                @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.1); box-shadow: 0 0 30px rgba(239, 68, 68, 0.7); }
                    100% { transform: scale(1); }
                }
                
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .notifications-dropdown {
                    display: none;
                    position: fixed;
                    top: 120px;
                    right: 40px;
                    width: 380px;
                    background: rgba(255, 255, 255, 0.98);
                    backdrop-filter: blur(20px);
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25), 0 8px 25px rgba(0, 0, 0, 0.15);
                    border-radius: 20px;
                    z-index: 9999;
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    overflow: hidden;
                }
                
                .dropdown-header {
                    padding: 20px 24px 16px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .notifications-list {
                    max-height: 400px;
                    overflow-y: auto;
                    padding: 8px;
                }
                
                .notifications-list::-webkit-scrollbar {
                    width: 6px;
                }
                
                .notifications-list::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 3px;
                }
                
                .notifications-list::-webkit-scrollbar-thumb {
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    border-radius: 3px;
                }
                
                .notification-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    padding: 16px;
                    margin: 4px 0;
                    border-radius: 16px;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    cursor: pointer;
                    position: relative;
                    background: rgba(255, 255, 255, 0.7);
                    border: 1px solid rgba(226, 232, 240, 0.5);
                }
                
                .notification-item:hover {
                    background: rgba(255, 255, 255, 0.95);
                    transform: translateX(4px) scale(1.02);
                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
                    border-color: rgba(79, 70, 229, 0.3);
                }
                
                .notification-item.priority-high {
                    border-left: 4px solid #ef4444;
                }
                
                .notification-item.priority-medium {
                    border-left: 4px solid #f59e0b;
                }
                
                .notification-item.priority-low {
                    border-left: 4px solid #10b981;
                }
                
                .notification-item.empty-state {
                    justify-content: center;
                    text-align: center;
                    padding: 32px 16px;
                    background: linear-gradient(145deg, #f8fafc, #e2e8f0);
                }
                
                .notification-icon {
                    font-size: 20px;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #f8fafc, #e2e8f0);
                    border-radius: 12px;
                    flex-shrink: 0;
                    transition: all 0.3s ease;
                }
                
                .notification-item:hover .notification-icon {
                    transform: scale(1.1);
                    background: linear-gradient(135deg, #667eea, #764ba2);
                }
                
                .notification-content {
                    flex: 1;
                    min-width: 0;
                }
                
                .notification-text {
                    font-size: 14px;
                    color: #1f2937;
                    font-weight: 500;
                    line-height: 1.4;
                    margin-bottom: 4px;
                }
                
                .notification-time {
                    font-size: 12px;
                    color: #6b7280;
                    font-weight: 400;
                }
                
                .notification-actions {
                    display: flex;
                    gap: 8px;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }
                
                .notification-item:hover .notification-actions {
                    opacity: 1;
                }
                
                .action-btn {
                    width: 32px;
                    height: 32px;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    transition: all 0.3s ease;
                }
                
                .dismiss-btn {
                    background: linear-gradient(135deg, #ef4444, #dc2626);
                    color: white;
                    font-weight: bold;
                }
                
                .dismiss-btn:hover {
                    transform: scale(1.1);
                    box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
                }
                
                .dropdown-footer {
                    padding: 16px 20px;
                    background: rgba(248, 250, 252, 0.8);
                    border-top: 1px solid rgba(226, 232, 240, 0.5);
                    display: flex;
                    gap: 12px;
                }
                
                .view-all-btn, .mark-read-btn {
                    flex: 1;
                    padding: 12px 16px;
                    border: none;
                    border-radius: 12px;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                
                .view-all-btn {
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    color: white;
                }
                
                .view-all-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
                }
                
                .mark-read-btn {
                    background: rgba(255, 255, 255, 0.8);
                    color: #4b5563;
                    border: 1px solid rgba(209, 213, 219, 0.5);
                }
                
                .mark-read-btn:hover {
                    background: rgba(243, 244, 246, 0.9);
                    transform: translateY(-2px);
                }
                
                .mark-read-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    transform: none !important;
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
                    box-shadow: 0 10px 40px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.1);
                    border-radius: 16px;
                    z-index: 10;
                    padding: 16px 12px;
                    border: 1px solid rgba(226, 232, 240, 0.8);
                }
                .notification-item {
                    padding: 12px 16px;
                    border-radius: 12px;
                    margin-bottom: 8px;
                    transition: all 0.2s ease;
                    font-size: 14px;
                    color: #374151;
                }
                .notification-item:hover {
                    background: linear-gradient(145deg, #f0f4ff, #e0e7ff);
                    transform: translateX(4px);
                }
                .notification-badge {
                    position: absolute;
                    top: -6px;
                    right: -6px;
                    background: linear-gradient(145deg, #ef4444, #dc2626);
                    color: #fff;
                    border-radius: 50%;
                    font-size: 11px;
                    width: 22px;
                    height: 22px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    z-index: 2;
                    box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
                }
                
                /* All Notifications Modal Styles */
                .notifications-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    backdrop-filter: blur(8px);
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: fadeIn 0.3s ease-out;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                .notifications-modal {
                    background: white;
                    border-radius: 20px;
                    width: 90%;
                    max-width: 900px;
                    max-height: 80vh;
                    overflow: hidden;
                    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
                    animation: slideUp 0.3s ease-out;
                }
                
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                
                .modal-header {
                    padding: 24px 32px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .close-modal-btn {
                    background: rgba(255, 255, 255, 0.2);
                    border: none;
                    color: white;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 18px;
                    transition: all 0.3s ease;
                }
                
                .close-modal-btn:hover {
                    background: rgba(255, 255, 255, 0.3);
                    transform: scale(1.1);
                }
                
                .modal-content {
                    max-height: 500px;
                    overflow-y: auto;
                    padding: 24px 32px;
                }
                
                .empty-notifications {
                    text-align: center;
                    padding: 60px 20px;
                    color: #6b7280;
                }
                
                .empty-icon {
                    font-size: 4rem;
                    margin-bottom: 16px;
                }
                
                .empty-notifications h3 {
                    font-size: 1.5rem;
                    margin-bottom: 8px;
                    color: #374151;
                }
                
                .notifications-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
                    gap: 20px;
                }
                
                .notification-card {
                    background: white;
                    border-radius: 16px;
                    border: 1px solid #e5e7eb;
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
                    transition: all 0.3s ease;
                    overflow: hidden;
                }
                
                .notification-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
                }
                
                .notification-card.dismissed {
                    opacity: 0.6;
                    background: #f9fafb;
                }
                
                .notification-card.priority-high {
                    border-left: 4px solid #ef4444;
                }
                
                .notification-card.priority-medium {
                    border-left: 4px solid #f59e0b;
                }
                
                .notification-card.priority-low {
                    border-left: 4px solid #10b981;
                }
                
                .card-header {
                    padding: 16px 20px 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .notification-timestamp {
                    font-size: 12px;
                    color: #6b7280;
                    font-weight: 500;
                }
                
                .card-body {
                    padding: 16px 20px;
                    display: flex;
                    gap: 16px;
                    align-items: flex-start;
                }
                
                .notification-icon-large {
                    font-size: 32px;
                    width: 48px;
                    height: 48px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #f8fafc, #e2e8f0);
                    border-radius: 12px;
                    flex-shrink: 0;
                }
                
                .notification-details {
                    flex: 1;
                }
                
                .notification-title {
                    font-size: 16px;
                    font-weight: 600;
                    color: #1f2937;
                    margin: 0 0 8px 0;
                    line-height: 1.4;
                }
                
                .notification-action {
                    font-size: 14px;
                    color: #6b7280;
                    margin: 0;
                    line-height: 1.4;
                }
                
                .card-footer {
                    padding: 0 20px 16px;
                    display: flex;
                    justify-content: flex-end;
                }
                
                .dismiss-card-btn {
                    background: linear-gradient(135deg, #ef4444, #dc2626);
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 8px;
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                
                .dismiss-card-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
                }
                
                .dismissed-label {
                    font-size: 12px;
                    color: #6b7280;
                    font-weight: 600;
                    padding: 8px 16px;
                    background: #f3f4f6;
                    border-radius: 8px;
                }
                
                .modal-footer {
                    padding: 20px 32px;
                    background: #f9fafb;
                    border-top: 1px solid #e5e7eb;
                    display: flex;
                    gap: 12px;
                    justify-content: flex-end;
                }
                
                .modal-action-btn {
                    padding: 12px 24px;
                    border: none;
                    border-radius: 12px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                
                .modal-action-btn.clear-all {
                    background: linear-gradient(135deg, #ef4444, #dc2626);
                    color: white;
                }
                
                .modal-action-btn.clear-all:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(239, 68, 68, 0.4);
                }
                
                .modal-action-btn.clear-all:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    transform: none !important;
                }
                
                .modal-action-btn.close {
                    background: #6b7280;
                    color: white;
                }
                
                .modal-action-btn.close:hover {
                    background: #4b5563;
                    transform: translateY(-2px);
                }
                `}</style>


                {/* Summary Cards */}
                <div className="summary-cards-row">
                    <div className="admin-card highlight-card">
                        <div className="card-icon hr-icon">
                            <FaUserPlus />
                        </div>
                        <div className="card-content">
                            <h2 className="admin-section-title">HR PERSONNEL</h2>
                            <div className="admin-count">{hrUsers.length}</div>
                            <div className="stats">
                                <span className="active-stat">● Active: {activeHRs}</span>
                                <span className="inactive-stat">● Inactive: {inactiveHRs}</span>
                            </div>
                        </div>
                    </div>
                    <div className="admin-card highlight-card">
                        <div className="card-icon manager-icon">
                            <FaUserPlus />
                        </div>
                        <div className="card-content">
                            <h2 className="admin-section-title">MANAGERS</h2>
                            <div className="admin-count">{managerUsers.length}</div>
                            <div className="stats">
                                <span className="active-stat">● Active: {activeManagers}</span>
                                <span className="inactive-stat">● Inactive: {inactiveManagers}</span>
                            </div>
                        </div>
                    </div>
                    <div className="admin-card highlight-card">
                        <div className="card-icon employee-icon">
                            <FaUserPlus />
                        </div>
                        <div className="card-content">
                            <h2 className="admin-section-title">TOTAL EMPLOYEES</h2>
                            <div className="admin-count">{totalEmployeesFromUsers}</div>
                            <div className="stats">
                                <span className="active-stat">● Active: {activeEmployees}</span>
                                <span className="inactive-stat">● Inactive: {inactiveEmployees}</span>
                            </div>
                        </div>
                    </div>
                    <div className="admin-card info-card">
                        <div className="card-icon leave-icon">
                            <FaBell />
                        </div>
                        <div className="card-content">
                            <h2 className="admin-section-title">LEAVE REQUESTS</h2>
                            <div className="admin-count">{leaves.filter(leave => leave.status === 'PENDING').length}</div>
                            <div className="stats">
                                <span className="approved-stat">● Approved: {leaves.filter(leave => leave.status === 'ACCEPTED').length}</span>
                            </div>
                        </div>
                    </div>
                    <div className="admin-card info-card">
                        <div className="card-icon joining-icon">
                            <FaUserPlus />
                        </div>
                        <div className="card-content">
                            <h2 className="admin-section-title">NEW JOININGS</h2>
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
                                <span className="total-stat">● Total: {employees.length}</span>
                            </div>
                        </div>
                    </div>
                </div>


                {/* Charts & Visualizations */}
                <div className="dashboard-charts-row">
                    <div className="dashboard-chart-card">
                        <h3>📊 Role Distribution</h3>
                        <div className="chart-content">
                            {rolePieData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie 
                                            data={rolePieData} 
                                            dataKey="value" 
                                            nameKey="name" 
                                            cx="50%" 
                                            cy="50%" 
                                            outerRadius={70}
                                            innerRadius={25}
                                            paddingAngle={3}
                                            strokeWidth={0}
                                        >
                                            {rolePieData.map((entry, idx) => (
                                                <Cell key={`cell-${idx}`} fill={pieColors[idx % pieColors.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{
                                                background: 'rgba(255, 255, 255, 0.95)',
                                                border: 'none',
                                                borderRadius: '12px',
                                                boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                                                fontSize: '14px',
                                                fontWeight: '500'
                                            }}
                                            formatter={(value, name) => [`${value} members`, name]}
                                        />
                                        <Legend 
                                            wrapperStyle={{
                                                paddingTop: '16px',
                                                fontSize: '13px',
                                                fontWeight: '500'
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    height: '220px', 
                                    color: '#64748b',
                                    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                                    borderRadius: '12px',
                                    border: '2px dashed #cbd5e1'
                                }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ 
                                            fontSize: '3rem', 
                                            marginBottom: '12px',
                                            filter: 'grayscale(0.3)'
                                        }}>📊</div>
                                        <div style={{ 
                                            fontSize: '16px', 
                                            fontWeight: '600',
                                            color: '#475569' 
                                        }}>No role data available</div>
                                        <div style={{ 
                                            fontSize: '14px', 
                                            color: '#64748b',
                                            marginTop: '4px'
                                        }}>Data will appear here once roles are assigned</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="dashboard-chart-card">
                        <h3>📈 Employees Joined This Year</h3>
                        <div className="chart-content">
                            {barData.some(item => item.employees > 0) ? (
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={barData} margin={{ top: 20, right: 20, left: 5, bottom: 5 }}>
                                        <XAxis 
                                            dataKey="month" 
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ 
                                                fontSize: 12, 
                                                fill: '#64748b',
                                                fontWeight: '500'
                                            }}
                                        />
                                        <YAxis 
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ 
                                                fontSize: 12, 
                                                fill: '#64748b',
                                                fontWeight: '500'
                                            }}
                                        />
                                        <Tooltip 
                                            contentStyle={{
                                                background: 'rgba(255, 255, 255, 0.95)',
                                                border: 'none',
                                                borderRadius: '12px',
                                                boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                                                fontSize: '14px',
                                                fontWeight: '500'
                                            }}
                                            formatter={(value) => [`${value} employees`, 'New Hires']}
                                        />
                                        <Bar 
                                            dataKey="employees" 
                                            fill="url(#barGradient)"
                                            radius={[6, 6, 0, 0]}
                                        />
                                        <defs>
                                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#667eea" stopOpacity={0.9}/>
                                                <stop offset="100%" stopColor="#764ba2" stopOpacity={0.7}/>
                                            </linearGradient>
                                        </defs>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    height: '220px', 
                                    color: '#64748b',
                                    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                                    borderRadius: '12px',
                                    border: '2px dashed #cbd5e1'
                                }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ 
                                            fontSize: '3rem', 
                                            marginBottom: '12px',
                                            filter: 'grayscale(0.3)'
                                        }}>📈</div>
                                        <div style={{ 
                                            fontSize: '16px', 
                                            fontWeight: '600',
                                            color: '#475569' 
                                        }}>No joining data for this year</div>
                                        <div style={{ 
                                            fontSize: '14px', 
                                            color: '#64748b',
                                            marginTop: '4px'
                                        }}>Hiring trends will appear here</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Recent Activity Feed */}
                <div className="dashboard-activity-feed">
                    <h3>
                        <span style={{ fontSize: '20px' }}>⚡</span>
                        Recent Activity
                    </h3>
                    <div className="activity-feed-content">
                        <div className="activity-list">
                            {paginatedActivities.length === 0 ? (
                                <div className="activity-item">
                                    <div className="activity-icon">🌟</div>
                                    <div className="activity-content">
                                        <div className="activity-text">All systems operational</div>
                                        <div className="activity-subtitle">No recent activities to display</div>
                                    </div>
                                    <div className="activity-time">Live</div>
                                </div>
                            ) : (
                                paginatedActivities.map((item, idx) => {
                                    // Enhanced activity categorization
                                    const getActivityDetails = (activityText, index) => {
                                        const lowerText = activityText.toLowerCase();
                                        
                                        // User management activities
                                        if (lowerText.includes('user') || lowerText.includes('employee') || lowerText.includes('hr') || lowerText.includes('manager')) {
                                            return {
                                                icon: index === 0 ? '�' : '👥',
                                                category: 'User Management',
                                                priority: 'high',
                                                timeLabel: index === 0 ? 'Just now' : index < 2 ? '5 min ago' : index < 4 ? '1 hour ago' : '3 hours ago'
                                            };
                                        }
                                        
                                        // Leave management activities
                                        if (lowerText.includes('leave') || lowerText.includes('vacation') || lowerText.includes('holiday')) {
                                            return {
                                                icon: index === 0 ? '🏖️' : '📅',
                                                category: 'Leave Management',
                                                priority: 'medium',
                                                timeLabel: index === 0 ? 'Just now' : index < 2 ? '10 min ago' : index < 4 ? '2 hours ago' : '4 hours ago'
                                            };
                                        }
                                        
                                        // Payroll activities
                                        if (lowerText.includes('payroll') || lowerText.includes('salary') || lowerText.includes('payment')) {
                                            return {
                                                icon: index === 0 ? '💰' : '💳',
                                                category: 'Payroll System',
                                                priority: 'high',
                                                timeLabel: index === 0 ? 'Just now' : index < 2 ? '15 min ago' : index < 4 ? '1.5 hours ago' : '5 hours ago'
                                            };
                                        }
                                        
                                        // System activities
                                        if (lowerText.includes('system') || lowerText.includes('database') || lowerText.includes('backup')) {
                                            return {
                                                icon: index === 0 ? '⚙️' : '🔧',
                                                category: 'System Operations',
                                                priority: 'low',
                                                timeLabel: index === 0 ? 'Just now' : index < 2 ? '30 min ago' : index < 4 ? '2.5 hours ago' : '6 hours ago'
                                            };
                                        }
                                        
                                        // Default activities
                                        return {
                                            icon: index === 0 ? '🔔' : index < 2 ? '📊' : index < 4 ? '📈' : '📋',
                                            category: index === 0 ? 'Live Update' : index < 2 ? 'Data Analytics' : index < 4 ? 'Performance' : 'General',
                                            priority: 'medium',
                                            timeLabel: index === 0 ? 'Just now' : index < 2 ? '20 min ago' : index < 4 ? '2 hours ago' : '4 hours ago'
                                        };
                                    };
                                    
                                    const details = getActivityDetails(item, idx);
                                    
                                    return (
                                        <div key={idx} className="activity-item">
                                            <div className="activity-icon">
                                                {idx === 0 ? '🔥' : idx < 2 ? '✨' : idx < 4 ? '📊' : '📈'}
                                            </div>
                                            <div className="activity-content">
                                                <div className="activity-text">{item}</div>
                                                <div className="activity-subtitle">
                                                    {idx === 0 ? 'Latest activity' : idx < 2 ? 'Recent update' : idx < 4 ? 'System activity' : 'Earlier today'}
                                                </div>
                                            </div>
                                            <div className="activity-time">
                                                {idx === 0 ? 'Just now' : idx < 2 ? '5 min ago' : idx < 4 ? '1 hour ago' : '3 hours ago'}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                        
                        {/* Pagination Controls */}
                        {recentActivity.length > activitiesPerPage && (
                            <div className="pagination-controls">
                                <button 
                                    className="pagination-btn"
                                    onClick={() => setActivityPage(prev => Math.max(prev - 1, 1))}
                                    disabled={activityPage === 1}
                                >
                                    Previous
                                </button>
                                <span className="pagination-info">
                                    Page {activityPage} of {totalActivityPages}
                                </span>
                                <button 
                                    className="pagination-btn"
                                    onClick={() => setActivityPage(prev => Math.min(prev + 1, totalActivityPages))}
                                    disabled={activityPage === totalActivityPages}
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
            
            {/* All Notifications Modal */}
            {showAllNotifications && (
                <div className="notifications-modal-overlay" onClick={handleCloseNotificationsModal}>
                    <div className="notifications-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>
                                All Notifications
                            </h2>
                            <button className="close-modal-btn" onClick={handleCloseNotificationsModal}>
                                ✕
                            </button>
                        </div>
                        
                        <div className="modal-content">
                            {allNotifications.length === 0 ? (
                                <div className="empty-notifications">
                                    <div className="empty-icon">🔔</div>
                                    <h3>No Notifications</h3>
                                    <p>You're all caught up! Check back later for updates.</p>
                                </div>
                            ) : (
                                <div className="notifications-grid">
                                    {allNotifications.map((notification, index) => {
                                        const isDismissed = dismissedNotifications.has(index);
                                        return (
                                            <div 
                                                key={notification.id} 
                                                className={`notification-card ${isDismissed ? 'dismissed' : ''} priority-${notification.priority}`}
                                            >
                                                <div className="card-header">
                                                    <div className="notification-type-badge" style={{ 
                                                        backgroundColor: getPriorityColor(notification.priority),
                                                        color: 'white',
                                                        padding: '4px 8px',
                                                        borderRadius: '12px',
                                                        fontSize: '12px',
                                                        fontWeight: '600',
                                                        textTransform: 'uppercase'
                                                    }}>
                                                        {notification.priority}
                                                    </div>
                                                    <div className="notification-timestamp">
                                                        {getNotificationTime(notification.timestamp)}
                                                    </div>
                                                </div>
                                                
                                                <div className="card-body">
                                                    <div className="notification-icon-large">
                                                        {getNotificationIcon(notification.type)}
                                                    </div>
                                                    <div className="notification-details">
                                                        <h4 className="notification-title">{notification.message}</h4>
                                                        <p className="notification-action">{notification.action}</p>
                                                    </div>
                                                </div>
                                                
                                                <div className="card-footer">
                                                    {!isDismissed && (
                                                        <button 
                                                            className="dismiss-card-btn"
                                                            onClick={() => handleDismissNotification(index)}
                                                        >
                                                            Dismiss
                                                        </button>
                                                    )}
                                                    {isDismissed && (
                                                        <span className="dismissed-label">Dismissed</span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        
                        <div className="modal-footer">
                            <button 
                                className="modal-action-btn clear-all"
                                onClick={handleMarkAllAsRead}
                                disabled={allNotifications.filter((_, idx) => !dismissedNotifications.has(idx)).length === 0}
                            >
                                Clear All Notifications
                            </button>
                            <button 
                                className="modal-action-btn close"
                                onClick={handleCloseNotificationsModal}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
  );
};

export default AdminDashboard;