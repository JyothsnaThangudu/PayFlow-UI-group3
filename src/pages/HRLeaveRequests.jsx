import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PopupMessage from '../components/PopupMessage';
import Sidebar from '../components/Sidebar';
import axios from '../utils/axios';
import './ManagerDashboard.css';
import {
    FaClipboardList, FaHistory, FaUsers, FaFileAlt, 
    FaHourglassHalf, FaCheckCircle, FaTimesCircle, 
    FaUserTie, FaCalendarAlt, FaBuilding, FaEnvelopeOpenText
} from 'react-icons/fa';

function HRLeaveRequests() {
    const navigate = useNavigate();
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [denyingId, setDenyingId] = useState(null);
    const [denyReason, setDenyReason] = useState('');
    const [showPopup, setShowPopup] = useState(false);
    const [popupMsg, setPopupMsg] = useState({ title: '', message: '', type: 'success' });
    const [currentPage, setCurrentPage] = useState(1);
    const [sortStatus, setSortStatus] = useState('');
    const pageSize = 5;
    
    const userRole = localStorage.getItem('role');

    // Redirect if not HR
    useEffect(() => {
        if (!userRole || userRole !== 'HR') {
            navigate('/login');
            return;
        }
    }, [userRole, navigate]);

    // Calculate dynamic statistics
    const totalRequests = leaves.length;
    const pendingRequests = useMemo(() => leaves.filter(l => l.status === 'PENDING').length, [leaves]);
    const approvedRequests = useMemo(() => leaves.filter(l => l.status === 'ACCEPTED').length, [leaves]);
    const rejectedRequests = useMemo(() => leaves.filter(l => l.status === 'DENIED' || l.status === 'REJECTED').length, [leaves]);
    const uniqueEmployees = useMemo(() => new Set(leaves.map(l => l.employeeId)).size, [leaves]);
    
    // Pagination and sorting
    const filteredLeaves = useMemo(() => {
        let sortedLeaves = [...leaves];
        // Sort by ID - newest first (chronological order)
        sortedLeaves.sort((a, b) => b.id - a.id);
        
        if (sortStatus === 'REJECTED') {
            return sortedLeaves.filter(l => l.status === 'DENIED' || l.status === 'REJECTED');
        }
        return sortStatus ? sortedLeaves.filter(l => l.status === sortStatus) : sortedLeaves;
    }, [leaves, sortStatus]);
    
    const totalPages = Math.ceil(filteredLeaves.length / pageSize);
    const paginatedLeaves = filteredLeaves.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    // Function to show popup notification
    const showNotification = (title, message, type = 'success') => {
        setPopupMsg({ title, message, type });
        setShowPopup(true);
    };

    // Fetch all leave requests (HR can see all employees' leave requests)
    useEffect(() => {
        if (userRole === 'HR') {
            setLoading(true);
            axios.get('/api/employee/leaves/all')
                .then(res => setLeaves(res.data))
                .catch(err => {
                    console.error('Failed to fetch leave requests:', err);
                    setLeaves([]);
                    showNotification('Error', 'Failed to load leave requests', 'error');
                })
                .finally(() => setLoading(false));
        }
    }, [userRole]);

    useEffect(() => {
        setCurrentPage(1);
    }, [filteredLeaves]);

    const handleAction = async (leaveId, action) => {
        try {
            const leaveToUpdate = leaves.find(l => l.id === leaveId);
            await axios.post(`/api/employee/leave/${leaveId}/action`, { action });
            setLeaves(leaves => leaves.map(l => l.id === leaveId ? { ...l, status: action === 'ACCEPT' ? 'ACCEPTED' : 'DENIED' } : l));
            setDenyingId(null);
            setDenyReason('');
            
            // Show success notification with employee name
            const employeeName = leaveToUpdate?.employeeName || `Employee ID: ${leaveToUpdate?.employeeId}`;
            const actionText = action === 'ACCEPT' ? 'accepted' : 'denied';
            showNotification(
                'Success',
                `Leave request for ${employeeName} has been ${actionText} successfully!`,
                'success'
            );
        } catch (err) {
            showNotification('Error', 'Error updating leave status. Please try again.', 'error');
        }
    };

    const handleDeny = async (e, leaveId) => {
        e.preventDefault();
        if (!denyReason.trim()) {
            showNotification('Error', 'Please provide a reason for denial.', 'error');
            return;
        }
        
        try {
            const leaveToUpdate = leaves.find(l => l.id === leaveId);
            await axios.post(`/api/employee/leave/${leaveId}/action`, { 
                action: 'DENY',
                reason: denyReason.trim()
            });
            
            setLeaves(leaves => leaves.map(l => l.id === leaveId ? { ...l, status: 'DENIED' } : l));
            setDenyingId(null);
            setDenyReason('');
            
            const employeeName = leaveToUpdate?.employeeName || `Employee ID: ${leaveToUpdate?.employeeId}`;
            showNotification(
                'Success',
                `Leave request for ${employeeName} has been denied with reason.`,
                'success'
            );
        } catch (err) {
            showNotification('Error', 'Error denying leave request. Please try again.', 'error');
        }
    };

    const formatDate = (dateString) => {
        return dateString ? new Date(dateString).toLocaleDateString('en-GB') : 'N/A';
    };

    const getStatusColor = (status) => {
        switch (status?.toUpperCase()) {
            case 'PENDING': return { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' };
            case 'ACCEPTED': return { bg: '#d1fae5', text: '#065f46', border: '#10b981' };
            case 'DENIED':
            case 'REJECTED': return { bg: '#fee2e2', text: '#991b1b', border: '#ef4444' };
            default: return { bg: '#f3f4f6', text: '#4b5563', border: '#9ca3af' };
        }
    };

    const getDepartmentColor = (dept) => {
        const colors = {
            'IT': '#3b82f6',
            'HR': '#8b5cf6', 
            'Finance': '#10b981',
            'Marketing': '#f59e0b',
            'Operations': '#ef4444',
            'Sales': '#06b6d4'
        };
        return colors[dept] || '#6b7280';
    };

    return (
        <div className="manager-dashboard-layout">
            <Sidebar />
            <main className="manager-dashboard-main">
                <div style={{ 
                    background: '#f8fafc', 
                    minHeight: '100vh', 
                    width: '100%',
                    maxWidth: '100%',
                    boxSizing: 'border-box',
                    overflowX: 'auto'
                }}>
                    {/* Header */}
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        marginBottom: '30px',
                        padding: '0 10px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <FaEnvelopeOpenText style={{ color: '#8b5cf6', fontSize: 32, marginRight: 12 }} />
                            <div>
                                <h1 style={{ 
                                    fontSize: 32, 
                                    fontWeight: 800, 
                                    color: '#1f2937',
                                    margin: 0,
                                    lineHeight: 1.2
                                }}>
                                    All Employee Leave Requests
                                </h1>
                                <p style={{ 
                                    fontSize: 16, 
                                    color: '#6b7280', 
                                    margin: '4px 0 0 0',
                                    fontWeight: 500
                                }}>
                                    Review and process leave requests from all employees across departments
                                </p>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'center', 
                            alignItems: 'center', 
                            height: '200px', 
                            fontSize: '18px', 
                            color: '#6b7280' 
                        }}>
                            Loading leave requests...
                        </div>
                    ) : (
                        <>
                            {/* Statistics Cards */}
                            <div style={{ 
                                display: 'flex', 
                                gap: 15, 
                                marginBottom: 30, 
                                flexWrap: 'wrap', 
                                justifyContent: 'center',
                                padding: '0 5px',
                                maxWidth: '100%',
                                overflowX: 'auto'
                            }}>
                                {[
                                    {
                                        icon: <FaClipboardList size={32} color="#8b5cf6" style={{ marginBottom: 8 }} />,
                                        label: 'Total Requests',
                                        value: totalRequests,
                                        sub: 'all employees',
                                        border: '2px solid #8b5cf6',
                                        bg: 'linear-gradient(135deg,#f3e8ff 80%,#e0e7ff 100%)',
                                    },
                                    {
                                        icon: <FaUsers size={32} color="#06b6d4" style={{ marginBottom: 8 }} />,
                                        label: 'Employees',
                                        value: uniqueEmployees,
                                        sub: 'submitted requests',
                                        border: '2px solid #06b6d4',
                                        bg: 'linear-gradient(135deg,#cffafe 80%,#f5f6fa 100%)',
                                    },
                                    {
                                        icon: <FaHourglassHalf size={32} color="#fbbf24" style={{ marginBottom: 8 }} />,
                                        label: 'Pending',
                                        value: pendingRequests,
                                        sub: 'awaiting approval',
                                        border: '2px solid #fbbf24',
                                        bg: 'linear-gradient(135deg,#fef3c7 80%,#f5f6fa 100%)',
                                    },
                                    {
                                        icon: <FaCheckCircle size={32} color="#22c55e" style={{ marginBottom: 8 }} />,
                                        label: 'Accepted',
                                        value: approvedRequests,
                                        sub: '',
                                        border: '2px solid #22c55e',
                                        bg: 'linear-gradient(135deg,#dcfce7 80%,#f5f6fa 100%)',
                                    },
                                    {
                                        icon: <FaTimesCircle size={32} color="#f87171" style={{ marginBottom: 8 }} />,
                                        label: 'Denied',
                                        value: rejectedRequests,
                                        sub: '',
                                        border: '2px solid #f87171',
                                        bg: 'linear-gradient(135deg,#fee2e2 80%,#f5f6fa 100%)',
                                    },
                                ].map((card) => (
                                    <div
                                        key={card.label}
                                        style={{
                                            flex: '1 1 160px', 
                                            minWidth: 160, 
                                            maxWidth: 200,
                                            background: card.bg, 
                                            borderRadius: 16, 
                                            padding: 20,
                                            boxShadow: '0 4px 16px #e0e7ef', 
                                            display: 'flex', 
                                            flexDirection: 'column',
                                            alignItems: 'center', 
                                            border: card.border,
                                            transition: 'transform 0.15s,box-shadow 0.15s',
                                            cursor: 'default', 
                                            position: 'relative',
                                        }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.boxShadow = '0 8px 24px rgba(139, 92, 246, 0.15)';
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.transform = 'translateY(0px)';
                                            e.currentTarget.style.boxShadow = '0 4px 16px #e0e7ef';
                                        }}
                                    >
                                        {card.icon}
                                        <h3 style={{ fontSize: 36, fontWeight: 800, color: '#1f2937', margin: 0 }}>
                                            {card.value}
                                        </h3>
                                        <p style={{ fontSize: 14, fontWeight: 600, color: '#4b5563', margin: '4px 0 0 0', textAlign: 'center' }}>
                                            {card.label}
                                        </p>
                                        {card.sub && (
                                            <p style={{ fontSize: 12, color: '#9ca3af', margin: '2px 0 0 0', textAlign: 'center' }}>
                                                {card.sub}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Leave Requests Table */}
                            <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center', 
                                marginBottom: 20,
                                padding: '0 10px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <FaHistory style={{ color: '#8b5cf6', fontSize: 20, marginRight: 8 }} />
                                    <span style={{ fontSize: 20, fontWeight: 700, color: '#374151' }}>
                                        Leave Requests ({filteredLeaves.length} total)
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <label style={{ fontSize: 14, fontWeight: 600, color: '#6b7280' }}>Filter by Status:</label>
                                    <select
                                        value={sortStatus}
                                        onChange={(e) => {
                                            setSortStatus(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        style={{
                                            padding: '6px 12px',
                                            borderRadius: 8,
                                            border: '1px solid #d1d5db',
                                            fontSize: 14,
                                            fontWeight: 500,
                                            cursor: 'pointer',
                                            background: '#fff'
                                        }}
                                    >
                                        <option value="">All Requests</option>
                                        <option value="PENDING">Pending</option>
                                        <option value="ACCEPTED">Accepted</option>
                                        <option value="REJECTED">Denied</option>
                                    </select>
                                </div>
                            </div>

                            {filteredLeaves.length === 0 ? (
                                <div style={{ 
                                    textAlign: 'center', 
                                    padding: '60px 20px', 
                                    color: '#9ca3af',
                                    fontSize: '18px'
                                }}>
                                    <FaFileAlt size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
                                    <p>No leave requests found</p>
                                </div>
                            ) : (
                                <div style={{ position: 'relative', display: 'flex', alignItems: 'stretch' }}>
                                    <div style={{ flex: 1, background: '#fff', borderRadius: 12, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
                                        {paginatedLeaves.length > 0 && (
                                            <div className="leave-history-table-container" style={{ 
                                                flex: 1, 
                                                overflowX: 'auto',
                                                width: '100%',
                                                maxWidth: '100%'
                                            }}>
                                                <table className="leave-history-table">
                                                    <thead>
                                                        <tr style={{ background: '#f8fafc' }}>
                                                            <th style={{ color: '#8b5cf6', padding: '16px 12px', fontWeight: 700, fontSize: 14, borderBottom: '2px solid #e5e7eb' }}>Employee</th>
                                                            <th style={{ color: '#8b5cf6', padding: '16px 12px', fontWeight: 700, fontSize: 14, borderBottom: '2px solid #e5e7eb' }}>Leave Type</th>
                                                            <th style={{ color: '#8b5cf6', padding: '16px 12px', fontWeight: 700, fontSize: 14, borderBottom: '2px solid #e5e7eb' }}>From Date</th>
                                                            <th style={{ color: '#8b5cf6', padding: '16px 12px', fontWeight: 700, fontSize: 14, borderBottom: '2px solid #e5e7eb' }}>To Date</th>
                                                            <th style={{ color: '#8b5cf6', padding: '16px 12px', fontWeight: 700, fontSize: 14, borderBottom: '2px solid #e5e7eb' }}>Days</th>
                                                            <th style={{ color: '#8b5cf6', padding: '16px 12px', fontWeight: 700, fontSize: 14, borderBottom: '2px solid #e5e7eb' }}>Reason</th>
                                                            <th style={{ color: '#8b5cf6', padding: '16px 12px', fontWeight: 700, fontSize: 14, borderBottom: '2px solid #e5e7eb' }}>Status</th>
                                                            <th style={{ color: '#8b5cf6', padding: '16px 12px', fontWeight: 700, fontSize: 14, borderBottom: '2px solid #e5e7eb' }}>Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {paginatedLeaves.map((leave) => {
                                                            const statusColor = getStatusColor(leave.status);
                                                            return (
                                                                <tr key={leave.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                                                    <td style={{ padding: '12px', fontSize: 14, color: '#374151' }}>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                            <div style={{ 
                                                                                width: 8, 
                                                                                height: 8, 
                                                                                borderRadius: '50%', 
                                                                                background: getDepartmentColor(leave.department || 'Other')
                                                                            }}></div>
                                                                            <div>
                                                                                <div style={{ fontWeight: 600 }}>{leave.employeeName || 'N/A'}</div>
                                                                                <div style={{ fontSize: 12, color: '#9ca3af' }}>ID: {leave.employeeId}</div>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td style={{ padding: '12px', fontSize: 14, color: '#6b7280' }}>
                                                                        <span style={{ 
                                                                            background: leave.isPaid ? '#d1fae5' : '#fee2e2',
                                                                            color: leave.isPaid ? '#065f46' : '#991b1b',
                                                                            padding: '2px 8px',
                                                                            borderRadius: 12,
                                                                            fontSize: 12,
                                                                            fontWeight: 600
                                                                        }}>
                                                                            {leave.type} ({leave.isPaid ? 'Paid' : 'Unpaid'})
                                                                        </span>
                                                                    </td>
                                                                    <td style={{ padding: '12px', fontSize: 14, color: '#6b7280' }}>{formatDate(leave.fromDate)}</td>
                                                                    <td style={{ padding: '12px', fontSize: 14, color: '#6b7280' }}>{formatDate(leave.toDate)}</td>
                                                                    <td style={{ padding: '12px', fontSize: 14, color: '#6b7280', fontWeight: 600 }}>{leave.leaveDays || 'N/A'}</td>
                                                                    <td style={{ padding: '12px', fontSize: 14, color: '#6b7280', maxWidth: 200 }}>
                                                                        <div title={leave.reason} style={{ 
                                                                            overflow: 'hidden', 
                                                                            textOverflow: 'ellipsis', 
                                                                            whiteSpace: 'nowrap' 
                                                                        }}>
                                                                            {leave.reason || 'No reason provided'}
                                                                        </div>
                                                                    </td>
                                                                    <td style={{ padding: '12px', fontSize: 14 }}>
                                                                        <span style={{
                                                                            padding: '4px 12px',
                                                                            borderRadius: 20,
                                                                            fontSize: 12,
                                                                            fontWeight: 600,
                                                                            textTransform: 'uppercase',
                                                                            letterSpacing: '0.5px',
                                                                            background: statusColor.bg,
                                                                            color: statusColor.text,
                                                                            border: `1px solid ${statusColor.border}`
                                                                        }}>
                                                                            {leave.status}
                                                                        </span>
                                                                    </td>
                                                                    <td style={{ padding: '12px' }}>
                                                                        {leave.status === 'PENDING' && (
                                                                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                                                <button
                                                                                    onClick={() => handleAction(leave.id, 'ACCEPT')}
                                                                                    style={{
                                                                                        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                                                                                        color: 'white',
                                                                                        border: 'none',
                                                                                        borderRadius: 8,
                                                                                        padding: '6px 10px',
                                                                                        fontSize: 12,
                                                                                        fontWeight: 600,
                                                                                        cursor: 'pointer',
                                                                                        display: 'flex',
                                                                                        alignItems: 'center',
                                                                                        gap: 4,
                                                                                        transition: 'transform 0.2s'
                                                                                    }}
                                                                                    onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
                                                                                    onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                                                                                >
                                                                                    <FaCheckCircle size={12} /> Accept
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => setDenyingId(leave.id)}
                                                                                    style={{
                                                                                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                                                                        color: 'white',
                                                                                        border: 'none',
                                                                                        borderRadius: 8,
                                                                                        padding: '6px 10px',
                                                                                        fontSize: 12,
                                                                                        fontWeight: 600,
                                                                                        cursor: 'pointer',
                                                                                        display: 'flex',
                                                                                        alignItems: 'center',
                                                                                        gap: 4,
                                                                                        transition: 'transform 0.2s'
                                                                                    }}
                                                                                    onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
                                                                                    onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                                                                                >
                                                                                    <FaTimesCircle size={12} /> Deny
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                        {leave.status !== 'PENDING' && (
                                                                            <span style={{ fontSize: 12, color: '#9ca3af' }}>
                                                                                {leave.status.toLowerCase()}
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}

                                        {/* Pagination */}
                                        {totalPages > 1 && (
                                            <div style={{ 
                                                display: 'flex', 
                                                justifyContent: 'center', 
                                                alignItems: 'center', 
                                                gap: 16, 
                                                padding: '20px',
                                                borderTop: '1px solid #f3f4f6',
                                                background: '#fafbfc'
                                            }}>
                                                <button 
                                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                                                    disabled={currentPage === 1}
                                                    style={{ 
                                                        background: currentPage === 1 ? '#e5e7eb' : '#8b5cf6', 
                                                        color: currentPage === 1 ? '#9ca3af' : '#fff', 
                                                        border: 'none', 
                                                        padding: '8px 16px', 
                                                        borderRadius: 8, 
                                                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                                        fontWeight: 600 
                                                    }}
                                                >
                                                    Previous
                                                </button>
                                                <span style={{ fontSize: 16, fontWeight: 600, color: '#374151' }}>
                                                    Page {currentPage} of {totalPages}
                                                </span>
                                                <button 
                                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                                                    disabled={currentPage === totalPages}
                                                    style={{ 
                                                        background: currentPage === totalPages ? '#e5e7eb' : '#8b5cf6', 
                                                        color: currentPage === totalPages ? '#9ca3af' : '#fff', 
                                                        border: 'none', 
                                                        padding: '8px 16px', 
                                                        borderRadius: 8, 
                                                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                                        fontWeight: 600 
                                                    }}
                                                >
                                                    Next
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Deny Modal */}
                            {denyingId && (
                                <div style={{
                                    position: 'fixed',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    zIndex: 1000
                                }}>
                                    <div style={{
                                        backgroundColor: '#fff',
                                        borderRadius: 12,
                                        padding: '24px',
                                        width: '90%',
                                        maxWidth: '500px',
                                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)'
                                    }}>
                                        <h3 style={{ marginBottom: '16px', color: '#1f2937', fontSize: '18px', fontWeight: 700 }}>
                                            Deny Leave Request
                                        </h3>
                                        <form onSubmit={(e) => handleDeny(e, denyingId)}>
                                            <textarea
                                                value={denyReason}
                                                onChange={(e) => setDenyReason(e.target.value)}
                                                placeholder="Please provide a reason for denying this leave request..."
                                                rows="4"
                                                style={{
                                                    width: '100%',
                                                    padding: '12px',
                                                    borderRadius: 8,
                                                    border: '2px solid #e5e7eb',
                                                    fontSize: 14,
                                                    resize: 'vertical',
                                                    marginBottom: '16px'
                                                }}
                                                required
                                            />
                                            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setDenyingId(null);
                                                        setDenyReason('');
                                                    }}
                                                    style={{
                                                        background: '#e5e7eb',
                                                        color: '#4b5563',
                                                        border: 'none',
                                                        borderRadius: 8,
                                                        padding: '10px 20px',
                                                        fontSize: 14,
                                                        fontWeight: 600,
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="submit"
                                                    style={{
                                                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: 8,
                                                        padding: '10px 20px',
                                                        fontSize: 14,
                                                        fontWeight: 600,
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Deny Request
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Popup Message */}
                    {showPopup && (
                        <PopupMessage
                            title={popupMsg.title}
                            message={popupMsg.message}
                            type={popupMsg.type}
                            onClose={() => setShowPopup(false)}
                        />
                    )}
                </div>
            </main>
        </div>
    );
}

export default HRLeaveRequests;
