import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PopupMessage from '../components/PopupMessage';
import ConfirmationModal from '../components/ConfirmationModal';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import './EmployeeDashboard.css';
import './EmployeeResignation.css';
import './ManagerDashboard.css';
import {
    FaClipboardList, FaHistory, FaFileAlt, FaHourglassHalf, 
    FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaUserTimes,
    FaCalendarAlt, FaClock, FaComments, FaEdit, FaUser, FaBuilding
} from 'react-icons/fa';

const HRResignationRequests = () => {
    const [resignations, setResignations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showPopup, setShowPopup] = useState(false);
    const [popupMsg, setPopupMsg] = useState({ title: '', message: '', type: '' });
    const [sortStatus, setSortStatus] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [confirmModal, setConfirmModal] = useState(null);
    const [processingResignation, setProcessingResignation] = useState(null);
    const [comments, setComments] = useState('');
    const [approvedLastWorkingDay, setApprovedLastWorkingDay] = useState('');
    const pageSize = 5;

    const navigate = useNavigate();
    const userRole = localStorage.getItem('role');

    // Redirect if not logged in as HR/Admin
    useEffect(() => {
        if (!userRole || (userRole !== 'HR' && userRole !== 'ADMIN')) {
            navigate('/login');
            return;
        }
    }, [userRole, navigate]);

    // Fetch all resignations (HR can see all resignations)
    useEffect(() => {
        if (userRole === 'HR' || userRole === 'ADMIN') {
            setLoading(true);
            axios.get('http://localhost:8080/api/resignation/all')
                .then(res => {
                    setResignations(res.data || []);
                })
                .catch(err => {
                    console.error('Failed to fetch resignations', err);
                    setResignations([]);
                    showNotification('Error', 'Failed to load resignation requests', 'error');
                })
                .finally(() => setLoading(false));
        }
    }, [userRole]);

    const showNotification = (title, message, type) => {
        setPopupMsg({ title, message, type });
        setShowPopup(true);
    };

    const handleProcessResignation = (resignation, action) => {
        setProcessingResignation(resignation);
        setComments('');
        
        if (action === 'APPROVED') {
            setApprovedLastWorkingDay(resignation.requestedLastWorkingDay);
        } else {
            setApprovedLastWorkingDay('');
        }

        const actionText = action === 'APPROVED' ? 'approve' : 'reject';
        setConfirmModal({
            title: `${action === 'APPROVED' ? 'Approve' : 'Reject'} Resignation`,
            message: `Are you sure you want to ${actionText} this resignation request from ${resignation.employeeName}?`,
            onConfirm: () => submitResignationAction(resignation.id, action),
            onCancel: () => {
                setProcessingResignation(null);
                setConfirmModal(null);
                setComments('');
                setApprovedLastWorkingDay('');
            }
        });
    };

    const submitResignationAction = (resignationId, action) => {
        const processedBy = localStorage.getItem('email') || localStorage.getItem('userEmail');
        
        const requestData = {
            action: action,
            comments: comments.trim() || (action === 'APPROVED' ? 'Resignation approved by HR' : 'Resignation rejected by HR'),
            processedBy: processedBy,
            approvedLastWorkingDay: action === 'APPROVED' ? approvedLastWorkingDay : null
        };

        axios.post(`http://localhost:8080/api/resignation/${resignationId}/action`, requestData)
            .then(res => {
                showNotification(
                    'Success', 
                    `Resignation ${action.toLowerCase()} successfully!`, 
                    'success'
                );
                
                // Refresh resignations list
                return axios.get('http://localhost:8080/api/resignation/all');
            })
            .then(res => {
                if (res) setResignations(res.data || []);
            })
            .catch(err => {
                console.error('Error processing resignation:', err);
                showNotification(
                    'Error', 
                    err.response?.data || 'Failed to process resignation request', 
                    'error'
                );
            })
            .finally(() => {
                setProcessingResignation(null);
                setConfirmModal(null);
                setComments('');
                setApprovedLastWorkingDay('');
            });
    };

    // Filter and sort resignations
    const filteredResignations = sortStatus 
        ? resignations.filter(r => r.status === sortStatus)
        : resignations;

    const paginatedResignations = filteredResignations.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const totalPages = Math.ceil(filteredResignations.length / pageSize);

    // Statistics
    const totalRequests = resignations.length;
    const pendingRequests = resignations.filter(r => r.status === 'PENDING').length;
    const approvedRequests = resignations.filter(r => r.status === 'APPROVED').length;
    const rejectedRequests = resignations.filter(r => r.status === 'REJECTED').length;
    const withdrawnRequests = resignations.filter(r => r.status === 'WITHDRAWN').length;

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-GB');
    };

    const truncateText = (text, maxLength = 25) => {
        if (!text || text.length <= maxLength) return text;
        const truncated = text.substring(0, maxLength);
        return truncated + '...';
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
                            <FaUserTimes style={{ color: '#dc2626', fontSize: 32, marginRight: 12 }} />
                            <div>
                                <h1 style={{ 
                                    fontSize: 32, 
                                    fontWeight: 800, 
                                    color: '#1f2937',
                                    margin: 0,
                                    lineHeight: 1.2
                                }}>
                                    All Employee Resignation Requests
                                </h1>
                                <p style={{ 
                                    fontSize: 16, 
                                    color: '#6b7280', 
                                    margin: '4px 0 0 0',
                                    fontWeight: 500
                                }}>
                                    Review and process resignation requests from all employees
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
                            Loading resignation requests...
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
                                        icon: <FaClipboardList size={32} color="#6366f1" style={{ marginBottom: 8 }} />,
                                        label: 'Total Requests',
                                        value: totalRequests,
                                        sub: 'all time',
                                        border: '2px solid #6366f1',
                                        bg: 'linear-gradient(135deg,#f5f6fa 80%,#e0e7ff 100%)',
                                    },
                                    {
                                        icon: <FaHourglassHalf size={32} color="#fbbf24" style={{ marginBottom: 8 }} />,
                                        label: 'Pending',
                                        value: pendingRequests,
                                        sub: 'awaiting action',
                                        border: '2px solid #fbbf24',
                                        bg: 'linear-gradient(135deg,#fef9c3 80%,#f5f6fa 100%)',
                                    },
                                    {
                                        icon: <FaCheckCircle size={32} color="#22c55e" style={{ marginBottom: 8 }} />,
                                        label: 'Approved',
                                        value: approvedRequests,
                                        sub: '',
                                        border: '2px solid #22c55e',
                                        bg: 'linear-gradient(135deg,#dcfce7 80%,#f5f6fa 100%)',
                                    },
                                    {
                                        icon: <FaTimesCircle size={32} color="#f87171" style={{ marginBottom: 8 }} />,
                                        label: 'Rejected',
                                        value: rejectedRequests,
                                        sub: '',
                                        border: '2px solid #f87171',
                                        bg: 'linear-gradient(135deg,#fee2e2 80%,#f5f6fa 100%)',
                                    },
                                    {
                                        icon: <FaExclamationTriangle size={32} color="#a855f7" style={{ marginBottom: 8 }} />,
                                        label: 'Withdrawn',
                                        value: withdrawnRequests,
                                        sub: '',
                                        border: '2px solid #a855f7',
                                        bg: 'linear-gradient(135deg,#f3e8ff 80%,#f5f6fa 100%)',
                                    },
                                ].map((card, idx) => (
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
                                            e.currentTarget.style.boxShadow = '0 8px 24px rgba(99, 102, 241, 0.15)';
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

                            {/* Resignations Table */}
                            <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center', 
                                marginBottom: 20,
                                padding: '0 10px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <FaHistory style={{ color: '#dc2626', fontSize: 20, marginRight: 8 }} />
                                    <span style={{ fontSize: 20, fontWeight: 700, color: '#374151' }}>
                                        Resignation Requests ({filteredResignations.length} total)
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
                                        <option value="APPROVED">Approved</option>
                                        <option value="REJECTED">Rejected</option>
                                        <option value="WITHDRAWN">Withdrawn</option>
                                    </select>
                                </div>
                            </div>

                            {filteredResignations.length === 0 ? (
                                <div style={{ 
                                    textAlign: 'center', 
                                    padding: '60px 20px', 
                                    color: '#9ca3af',
                                    fontSize: '18px'
                                }}>
                                    <FaFileAlt size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
                                    <p>No resignation requests found</p>
                                </div>
                            ) : (
                                <div style={{ position: 'relative', display: 'flex', alignItems: 'stretch' }}>
                                    <div style={{ flex: 1, background: '#fff', borderRadius: 12, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
                                        {paginatedResignations.length > 0 && (
                                            <div className="leave-history-table-container" style={{ 
                                                flex: 1, 
                                                overflowX: 'auto',
                                                width: '100%',
                                                maxWidth: '100%'
                                            }}>
                                                <table className="leave-history-table">
                                                    <thead>
                                                        <tr style={{ background: '#f8fafc' }}>
                                                            <th style={{ color: '#6366f1', padding: '16px 12px', fontWeight: 700, fontSize: 14, borderBottom: '2px solid #e5e7eb' }}>Employee</th>
                                                            <th style={{ color: '#6366f1', padding: '16px 12px', fontWeight: 700, fontSize: 14, borderBottom: '2px solid #e5e7eb' }}>Department</th>
                                                            <th style={{ color: '#6366f1', padding: '16px 12px', fontWeight: 700, fontSize: 14, borderBottom: '2px solid #e5e7eb' }}>Submission Date</th>
                                                            <th style={{ color: '#6366f1', padding: '16px 12px', fontWeight: 700, fontSize: 14, borderBottom: '2px solid #e5e7eb' }}>Requested Last Day</th>
                                                            <th style={{ color: '#6366f1', padding: '16px 12px', fontWeight: 700, fontSize: 14, borderBottom: '2px solid #e5e7eb' }}>Approved Last Day</th>
                                                            <th style={{ color: '#6366f1', padding: '16px 12px', fontWeight: 700, fontSize: 14, borderBottom: '2px solid #e5e7eb' }}>Notice Period</th>
                                                            <th style={{ color: '#6366f1', padding: '16px 12px', fontWeight: 700, fontSize: 14, borderBottom: '2px solid #e5e7eb' }}>Reason</th>
                                                            <th style={{ color: '#6366f1', padding: '16px 12px', fontWeight: 700, fontSize: 14, borderBottom: '2px solid #e5e7eb' }}>Status</th>
                                                            <th style={{ color: '#6366f1', padding: '16px 12px', fontWeight: 700, fontSize: 14, borderBottom: '2px solid #e5e7eb' }}>Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {paginatedResignations.map((resignation, index) => {
                                                            return (
                                                                <tr key={resignation.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                                                    <td style={{ padding: '12px', fontSize: 14, color: '#374151' }}>
                                                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                            <span style={{ fontWeight: 600 }}>{resignation.employeeName || 'N/A'}</span>
                                                                            <span style={{ fontSize: 12, color: '#9ca3af' }}>({resignation.employeeDesignation || 'N/A'})</span>
                                                                        </div>
                                                                    </td>
                                                                    <td style={{ padding: '12px', fontSize: 14, color: '#6b7280' }}>{resignation.employeeDepartment || 'N/A'}</td>
                                                                    <td style={{ padding: '12px', fontSize: 14, color: '#6b7280' }}>{formatDate(resignation.submissionDate)}</td>
                                                                    <td style={{ padding: '12px', fontSize: 14, color: '#6b7280' }}>{formatDate(resignation.requestedLastWorkingDay)}</td>
                                                                    <td style={{ padding: '12px', fontSize: 14, color: '#6b7280' }}>{formatDate(resignation.approvedLastWorkingDay) || '-'}</td>
                                                                    <td style={{ padding: '12px', fontSize: 14, color: '#6b7280' }}>
                                                                        {resignation.noticePeriodDays ? `${resignation.noticePeriodDays} days` : '-'}
                                                                    </td>
                                                                    <td style={{ padding: '12px', fontSize: 14, color: '#6b7280' }}>
                                                                        <span title={resignation.reason}>{truncateText(resignation.reason, 15)}</span>
                                                                    </td>
                                                                    <td style={{ padding: '12px', fontSize: 14 }}>
                                                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                                                            <span style={{
                                                                                padding: '4px 12px',
                                                                                borderRadius: 20,
                                                                                fontSize: 12,
                                                                                fontWeight: 600,
                                                                                textTransform: 'uppercase',
                                                                                letterSpacing: '0.5px',
                                                                                background: resignation.status === 'PENDING' ? '#fef3c7' : 
                                                                                           resignation.status === 'APPROVED' ? '#d1fae5' : 
                                                                                           resignation.status === 'REJECTED' ? '#fee2e2' : 
                                                                                           resignation.status === 'WITHDRAWN' ? '#f3e8ff' : '#f3f4f6',
                                                                                color: resignation.status === 'PENDING' ? '#92400e' : 
                                                                                       resignation.status === 'APPROVED' ? '#065f46' : 
                                                                                       resignation.status === 'REJECTED' ? '#991b1b' : 
                                                                                       resignation.status === 'WITHDRAWN' ? '#6b21a8' : '#4b5563'
                                                                            }}>
                                                                                {resignation.status}
                                                                            </span>
                                                                        </div>
                                                                    </td>
                                                                    <td style={{ padding: '12px' }}>
                                                                        {resignation.status === 'PENDING' && (
                                                                            <div style={{ 
                                                                                display: 'flex', 
                                                                                gap: 8, 
                                                                                alignItems: 'center' 
                                                                            }}>
                                                                                <button
                                                                                    onClick={() => handleProcessResignation(resignation, 'APPROVED')}
                                                                                    style={{
                                                                                        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                                                                                        color: 'white',
                                                                                        border: 'none',
                                                                                        borderRadius: 8,
                                                                                        padding: '8px 12px',
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
                                                                                    <FaCheckCircle size={12} /> Approve
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => handleProcessResignation(resignation, 'REJECTED')}
                                                                                    style={{
                                                                                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                                                                        color: 'white',
                                                                                        border: 'none',
                                                                                        borderRadius: 8,
                                                                                        padding: '8px 12px',
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
                                                                                    <FaTimesCircle size={12} /> Reject
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                        {resignation.status !== 'PENDING' && (
                                                                            <span style={{ fontSize: 12, color: '#9ca3af' }}>
                                                                                {resignation.status.toLowerCase()}
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
                                                        background: currentPage === 1 ? '#e5e7eb' : '#dc2626', 
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
                                                        background: currentPage === totalPages ? '#e5e7eb' : '#dc2626', 
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
                        </>
                    )}

                    {/* Processing Modal */}
                    {processingResignation && (
                        <div className="leave-modal-overlay">
                            <div className="leave-modal" style={{ maxWidth: 550, width: '90%' }}>
                                <button 
                                    onClick={() => {
                                        setProcessingResignation(null);
                                        setComments('');
                                        setApprovedLastWorkingDay('');
                                    }} 
                                    style={{ 
                                        position: 'absolute', 
                                        top: 16, 
                                        right: 20, 
                                        fontSize: 26, 
                                        background: 'none', 
                                        border: 'none', 
                                        cursor: 'pointer', 
                                        color: '#dc2626', 
                                        fontWeight: 700, 
                                        transition: 'color 0.2s' 
                                    }} 
                                    onMouseOver={e => e.currentTarget.style.color = '#b91c1c'} 
                                    onMouseOut={e => e.currentTarget.style.color = '#dc2626'}
                                >
                                    &times;
                                </button>
                                
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18, gap: 8 }}>
                                    <FaUserTimes style={{ color: '#dc2626', fontSize: 24 }} />
                                    <span style={{ fontWeight: 700, fontSize: 22, color: '#222' }}>
                                        Process Resignation Request
                                    </span>
                                </div>
                                
                                <div style={{ marginBottom: 16 }}>
                                    <h4>Employee: {processingResignation.employeeName}</h4>
                                    <p>Requested Last Working Day: {formatDate(processingResignation.requestedLastWorkingDay)}</p>
                                    <p>Reason: {processingResignation.reason}</p>
                                </div>

                                {/* Show approved last working day input only for approval */}
                                <div style={{ marginBottom: 16 }}>
                                    <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: '#374151' }}>
                                        Approved Last Working Day
                                    </label>
                                    <input
                                        type="date"
                                        value={approvedLastWorkingDay}
                                        onChange={(e) => setApprovedLastWorkingDay(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: 12,
                                            borderRadius: 8,
                                            border: '2px solid #e5e7eb',
                                            fontSize: 16,
                                            transition: 'border-color 0.2s'
                                        }}
                                        onFocus={e => e.target.style.borderColor = '#dc2626'}
                                        onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                                    />
                                </div>

                                <div style={{ marginBottom: 16 }}>
                                    <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: '#374151' }}>
                                        Comments (Optional)
                                    </label>
                                    <textarea
                                        value={comments}
                                        onChange={(e) => setComments(e.target.value)}
                                        placeholder="Add any comments for the employee..."
                                        rows="4"
                                        style={{
                                            width: '100%',
                                            padding: 12,
                                            borderRadius: 8,
                                            border: '2px solid #e5e7eb',
                                            fontSize: 16,
                                            transition: 'border-color 0.2s',
                                            resize: 'vertical'
                                        }}
                                        onFocus={e => e.target.style.borderColor = '#dc2626'}
                                        onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Confirmation Modal */}
                    {confirmModal && (
                        <ConfirmationModal
                            isOpen={true}
                            title={confirmModal.title}
                            message={confirmModal.message}
                            onConfirm={confirmModal.onConfirm}
                            onClose={confirmModal.onCancel}
                            confirmText="Yes, Proceed"
                            cancelText="Cancel"
                            type="danger"
                        />
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
};

export default HRResignationRequests;
