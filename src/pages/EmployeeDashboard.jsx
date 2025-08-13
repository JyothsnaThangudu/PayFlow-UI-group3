import React, { useEffect, useState, useMemo } from 'react';
import EmployeeSidebar from '../components/EmployeeSidebar';
import './EmployeeDashboard.css';
import axios from 'axios';
import { FaUserCircle, FaBuilding, FaBriefcase, FaCalendarAlt, FaEnvelope, FaPhone, FaMoneyBill, FaClipboardList, FaBell } from 'react-icons/fa';

const EmployeeDashboard = () => {
    const [employee, setEmployee] = useState(null);
    const email = localStorage.getItem('userEmail');

    // Leave state
    const [leaveHistory, setLeaveHistory] = useState([]);
    const [leaveStats, setLeaveStats] = useState({
        totalPaidLeaves: 12,
        usedPaidLeaves: 0,
        remainingPaidLeaves: 12,
        usedUnpaidLeaves: 0,
        unpaidLeavesThisMonth: 0,
        currentMonth: new Date().getMonth() + 1,
        currentYear: new Date().getFullYear()
    });

    // Payment hold state
    const [paymentHoldStatus, setPaymentHoldStatus] = useState(null);
    const [notifications, setNotifications] = useState([]);

    const totalLeaves = 12;

    const usedLeaves = useMemo(() => {
        return leaveHistory.filter(l => l.status === 'ACCEPTED').reduce((total, leave) => {
            if (leave.leaveDays) {
                return total + leave.leaveDays;
            } else if (leave.fromDate && leave.toDate) {
                const days = Math.ceil((new Date(leave.toDate) - new Date(leave.fromDate)) / (1000 * 60 * 60 * 24)) + 1;
                return total + days;
            }
            return total;
        }, 0);
    }, [leaveHistory]);

    const remainingLeaves = Math.max(0, totalLeaves - leaveStats.usedPaidLeaves);

    useEffect(() => {
        if (email) {
            // Fetch employee details
            axios.get(`http://localhost:8080/api/employee?email=${email}`)
                .then(res => {
                    if (Array.isArray(res.data) && res.data.length > 0) {
                        setEmployee(res.data[0]);
                        // Check payment hold status after getting employee details
                        checkPaymentHoldStatus(res.data[0].id);
                    } else if (res.data) {
                        setEmployee(res.data);
                        // Check payment hold status after getting employee details
                        checkPaymentHoldStatus(res.data.id);
                    }
                })
                .catch(err => console.error('Failed to fetch employee details', err));

            // Fetch leave history
            axios.get(`http://localhost:8080/api/employee/leave/history?email=${email}`)
                .then(res => {
                    setLeaveHistory(res.data || []);
                })
                .catch(() => {
                    setLeaveHistory([]);
                });

            // Fetch leave statistics
            axios.get(`http://localhost:8080/api/employee/leave/stats?email=${email}`)
                .then(res => {
                    setLeaveStats(res.data);
                })
                .catch(err => {
                    console.error('Failed to fetch leave stats', err);
                });
        }
    }, [email]);

    // Check payment hold status
    const checkPaymentHoldStatus = async (employeeId) => {
        try {
            const response = await axios.get(`/api/payment-hold/status/${employeeId}`);
            setPaymentHoldStatus(response.data);
            
            // Add payment hold notification if exists
            if (response.data.isOnHold) {
                const holdNotification = {
                    id: 'payment-hold',
                    type: 'warning',
                    title: 'Payment Hold Notice',
                    message: `Your payment is currently on hold. Reason: ${response.data.holdReason || 'Administrative review'}`,
                    date: response.data.holdDate,
                    priority: 'high'
                };
                setNotifications(prev => [holdNotification, ...prev]);
            }
        } catch (error) {
            console.error('Error checking payment hold status:', error);
        }
    };

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="employee-dashboard-layout">
            <EmployeeSidebar />
            <div className="employee-dashboard-content">
                <div className="profile-header">
                    <div className="profile-avatar">
                        <FaUserCircle size={72} color="#6366f1" />
                    </div>
                    <div className="profile-header-info">
                        <h2>{employee ? `Welcome ${employee.fullName}!` : 'Welcome!'}</h2>
                        {employee && (
                            <div className="profile-header-meta">
                                <span><FaBuilding /> {employee.department}</span>
                                <span><FaBriefcase /> {employee.role}</span>
                                <span><FaCalendarAlt /> Joined: {employee.joiningDate}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="dashboard-cards">
                    <div className="dashboard-card notifications-card">
                        <h3><FaBell /> Notifications</h3>
                        <ul className="notifications-list">
                            {notifications.length > 0 ? (
                                notifications.map(notification => (
                                    <li key={notification.id} className={`notification-item ${notification.type}`}>
                                        <div className="notification-content">
                                            <strong>{notification.title}</strong>
                                            <p>{notification.message}</p>
                                            {notification.date && (
                                                <small>Hold placed on: {formatDate(notification.date)}</small>
                                            )}
                                        </div>
                                    </li>
                                ))
                            ) : (
                                <li>No new notifications.</li>
                            )}
                        </ul>
                    </div>

                    <div className="dashboard-card leave-card">
                        <h3><FaClipboardList /> Leave Summary</h3>
                        <div style={{ marginBottom: '12px' }}>
                            <p style={{ margin: '4px 0' }}><b>Paid Leaves:</b></p>
                            <p style={{ margin: '2px 0', fontSize: '14px' }}>
                                <span style={{ color: '#6366f1' }}>Total: {leaveStats.totalPaidLeaves}</span> | 
                                <span style={{ color: 'tomato', marginLeft: '8px' }}>Used: {leaveStats.usedPaidLeaves}</span> | 
                                <span style={{ color: '#22c55e', marginLeft: '8px' }}>Remaining: {leaveStats.remainingPaidLeaves}</span>
                            </p>
                        </div>
                        <div style={{ marginBottom: '12px' }}>
                            <p style={{ margin: '4px 0' }}><b>Unpaid Leaves:</b></p>
                            <p style={{ margin: '2px 0', fontSize: '14px' }}>
                                <span style={{ color: 'orange' }}>Year Total: {leaveStats.usedUnpaidLeaves}</span> | 
                                <span style={{ color: 'red', marginLeft: '8px' }}>This Month: {leaveStats.unpaidLeavesThisMonth}</span>
                            </p>
                        </div>
                        <p style={{ fontSize: '12px', color: '#666', fontStyle: 'italic' }}>
                            Note: After using all paid leaves, additional requests will be unpaid.
                        </p>
                    </div>

                    <div className="dashboard-card payroll-card">
                        <h3><FaMoneyBill /> Payroll</h3>
                        {paymentHoldStatus && paymentHoldStatus.isOnHold ? (
                            <div className="payment-hold-alert">
                                <div className="hold-status">
                                    <span className="hold-badge">⏸️ Payment On Hold</span>
                                    <p><b>Reason:</b> {paymentHoldStatus.holdReason || 'Administrative review'}</p>
                                    <p><b>Hold Date:</b> {formatDate(paymentHoldStatus.holdDate)}</p>
                                    <small>Please contact HR for more information.</small>
                                </div>
                            </div>
                        ) : (
                            <>
                                <p><b>Latest Payslip:</b> <span style={{ color: '#6366f1' }}>Not Available</span></p>
                                <p><b>Salary:</b> <span style={{ color: '#6366f1' }}>Confidential</span></p>
                                <button className="quick-link-btn" style={{ marginTop: 8 }}>Download Payslip</button>
                            </>
                        )}
                    </div>
                </div>

                <div className="quick-links">
                    <button className="quick-link-btn">Update Profile</button>
                    <button className="quick-link-btn">Change Password</button>
                    <button className="quick-link-btn">Contact HR</button>
                </div>
            </div>
        </div>
    );
};

export default EmployeeDashboard;
