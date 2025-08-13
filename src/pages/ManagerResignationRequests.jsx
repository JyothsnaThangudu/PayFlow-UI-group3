import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PopupMessage from '../components/PopupMessage';
import ConfirmationModal from '../components/ConfirmationModal';
import axios from 'axios';
import SidebarManager from '../components/SidebarManager';
import './EmployeeDashboard.css';
import './EmployeeResignation.css';
import './ManagerDashboard.css';
import {
    FaClipboardList, FaHistory, FaFileAlt, FaHourglassHalf, 
    FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaUserTimes,
    FaCalendarAlt, FaClock, FaComments, FaEdit, FaUser, FaBuilding
} from 'react-icons/fa';

const ManagerResignationRequests = () => {
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
    const managerId = localStorage.getItem('userId');

    // Redirect if not logged in
    useEffect(() => {
        if (!managerId) {
            navigate('/manager-login');
            return;
        }
    }, [managerId, navigate]);

    // Fetch resignations
    useEffect(() => {
        if (managerId) {
            setLoading(true);
            axios.get(`http://localhost:8080/api/resignation/manager/${managerId}`)
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
    }, [managerId]);

    // Calculate statistics
    const totalRequests = resignations.length;
    const pendingRequests = resignations.filter(r => r.status === 'PENDING').length;
    const approvedRequests = resignations.filter(r => r.status === 'APPROVED').length;
    const rejectedRequests = resignations.filter(r => r.status === 'REJECTED').length;
    const withdrawnRequests = resignations.filter(r => r.status === 'WITHDRAWN').length;

    // Filter and pagination logic
    const getFilteredResignations = () => {
        let filteredData = [];
        if (sortStatus === 'REJECTED') {
            filteredData = resignations.filter(r => r.status === 'REJECTED');
        } else if (sortStatus) {
            filteredData = resignations.filter(r => r.status === sortStatus);
        } else {
            filteredData = [...resignations];
        }
        
        return filteredData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    };

    const filteredResignations = getFilteredResignations();
    const totalPages = Math.ceil(filteredResignations.length / pageSize);
    const paginatedResignations = filteredResignations.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const showNotification = (title, message, type) => {
        setPopupMsg({ title, message, type });
        setShowPopup(true);
    };

    const handleProcessResignation = (resignation, action) => {
        setProcessingResignation({ ...resignation, action });
        setComments('');
        setApprovedLastWorkingDay(resignation.requestedLastWorkingDay);
    };

    const submitProcessResignation = () => {
        if (!processingResignation) return;

        if (processingResignation.action === 'REJECT' && !comments.trim()) {
            showNotification('Error', 'Please provide comments for rejection', 'error');
            return;
        }

        const payload = {
            action: processingResignation.action,
            comments: comments.trim() || (processingResignation.action === 'APPROVE' ? 'Approved by manager' : ''),
            processedBy: localStorage.getItem('userEmail') || 'Manager',
            approvedLastWorkingDay: processingResignation.action === 'APPROVE' ? approvedLastWorkingDay : null
        };

        axios.post(`http://localhost:8080/api/resignation/${processingResignation.id}/action`, payload)
            .then(res => {
                const action = processingResignation.action;
                const employeeName = processingResignation.employeeName;
                
                showNotification(
                    'Success',
                    `Resignation request for ${employeeName} has been ${action.toLowerCase()}d successfully!`,
                    'success'
                );

                // Update the local state
                setResignations(prev => prev.map(r => 
                    r.id === processingResignation.id 
                        ? { ...r, status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED', 
                            managerComments: comments.trim(),
                            approvedLastWorkingDay: action === 'APPROVE' ? approvedLastWorkingDay : null }
                        : r
                ));

                setProcessingResignation(null);
                setComments('');
                setApprovedLastWorkingDay('');
            })
            .catch(err => {
                let errorMessage = 'Failed to process resignation request';
                if (err.response && err.response.data) {
                    errorMessage = typeof err.response.data === 'string' ? err.response.data : errorMessage;
                }
                showNotification('Error', errorMessage, 'error');
            });
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const calculateNoticePeriod = (resignationDate, lastWorkingDay) => {
        if (!resignationDate || !lastWorkingDay) return '-';
        const start = new Date(resignationDate);
        const end = new Date(lastWorkingDay);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    };

    const truncateText = (text, maxLength = 30) => {
        if (!text || text === '-') return text;
        if (text.length <= maxLength) return text;
        
        const truncated = text.substring(0, maxLength);
        const lastSpaceIndex = truncated.lastIndexOf(' ');
        
        if (lastSpaceIndex > maxLength * 0.6) {
            return truncated.substring(0, lastSpaceIndex) + '...';
        }
        return truncated + '...';
    };

    return (
        <div className="manager-dashboard-layout">
            <SidebarManager />
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
                                    Team Resignation Requests
                                </h1>
                                <p style={{ 
                                    fontSize: 16, 
                                    color: '#6b7280', 
                                    margin: '4px 0 0 0',
                                    fontWeight: 500
                                }}>
                                    Review and process resignation requests from your team members
                                </p>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px', fontSize: '18px', color: '#666' }}>
                            Loading team resignation requests...
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
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 4px 16px #e0e7ef';
                                        }}
                                    >
                                        {card.icon}
                                        <div style={{ fontSize: 28, fontWeight: 900, color: '#1f2937', marginBottom: 4 }}>
                                            {card.value}
                                        </div>
                                        <div style={{ fontSize: 15, fontWeight: 600, color: '#4b5563', textAlign: 'center' }}>
                                            {card.label}
                                        </div>
                                        {card.sub && (
                                            <div style={{ fontSize: 13, color: '#6b7280', textAlign: 'center', marginTop: 4 }}>
                                                {card.sub}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Resignations Table */}
                            <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}>
                                <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center', 
                                    marginBottom: 24,
                                    paddingBottom: 16,
                                    borderBottom: '2px solid #e5e7eb'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <FaHistory style={{ color: '#dc2626', fontSize: 22, marginRight: 8 }} />
                                        <span style={{ fontSize: 20, fontWeight: 600 }}>
                                            Resignation Requests
                                            {resignations.length > 0 && <span className="record-count"> ({resignations.length} total)</span>}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <label htmlFor="sort-status" style={{ fontSize: 14, color: '#444', marginRight: 8, fontWeight: 500 }}>Filter by Status:</label>
                                        <select
                                            id="sort-status"
                                            value={sortStatus}
                                            onChange={e => setSortStatus(e.target.value)}
                                            style={{
                                                padding: '7px 18px',
                                                borderRadius: 8,
                                                border: '1.5px solid #dc2626',
                                                background: '#f5f6fa',
                                                color: '#222',
                                                fontWeight: 600,
                                                fontSize: 15,
                                                boxShadow: '0 2px 8px #e0e7ef',
                                                outline: 'none',
                                                cursor: 'pointer',
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
                                    <div style={{ textAlign: 'center', padding: '40px', color: '#666', fontSize: '16px' }}>
                                        <FaFileAlt size={48} style={{ color: '#ccc', marginBottom: 16 }} />
                                        <div>No resignation requests found.</div>
                                    </div>
                                ) : (
                                    <div className="leave-requests-container">
                                        <div style={{ position: 'relative', display: 'flex', alignItems: 'stretch' }}>
                                            <div className="leave-history-table-container" style={{ 
                                                flex: 1, 
                                                overflowX: 'auto',
                                                width: '100%',
                                                maxWidth: '100%'
                                            }}>
                                                <table className="leave-history-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Employee</th>
                                                            <th>Department</th>
                                                            <th>Submission Date</th>
                                                            <th>Requested Last Day</th>
                                                            <th>Approved Last Day</th>
                                                            <th>Notice Period</th>
                                                            <th>Reason</th>
                                                            <th>Status</th>
                                                            <th>Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {paginatedResignations.map((resignation, idx) => {
                                                            let statusClass = 'leave-history-status';
                                                            let statusText = resignation.status;
                                                            if (resignation.status === 'APPROVED') statusClass += ' approved';
                                                            else if (resignation.status === 'PENDING') statusClass += ' pending';
                                                            else if (resignation.status === 'REJECTED') statusClass += ' rejected';
                                                            else if (resignation.status === 'WITHDRAWN') statusClass += ' withdrawn';

                                                            const noticePeriod = calculateNoticePeriod(resignation.resignationDate, resignation.requestedLastWorkingDay);

                                                            return (
                                                                <tr key={resignation.id}>
                                                                    <td>
                                                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                            <span style={{ fontWeight: 600, color: '#374151' }}>
                                                                                {resignation.employeeName}
                                                                            </span>
                                                                            <span style={{ fontSize: 12, color: '#6b7280' }}>
                                                                                {resignation.role} ({resignation.position})
                                                                            </span>
                                                                        </div>
                                                                    </td>
                                                                    <td>{resignation.department}</td>
                                                                    <td>{formatDate(resignation.resignationDate)}</td>
                                                                    <td>{formatDate(resignation.requestedLastWorkingDay)}</td>
                                                                    <td>{resignation.approvedLastWorkingDay ? formatDate(resignation.approvedLastWorkingDay) : '-'}</td>
                                                                    <td>{noticePeriod}</td>
                                                                    <td style={{ maxWidth: '200px', wordBreak: 'break-word' }}>
                                                                        {resignation.reason && resignation.reason.length > 30 ? (
                                                                            <span 
                                                                                title={resignation.reason}
                                                                                style={{ 
                                                                                    cursor: 'help',
                                                                                    borderBottom: '1px dotted #dc2626',
                                                                                    color: '#dc2626'
                                                                                }}
                                                                            >
                                                                                {truncateText(resignation.reason)}
                                                                            </span>
                                                                        ) : (
                                                                            resignation.reason || '-'
                                                                        )}
                                                                    </td>
                                                                    <td><span className={statusClass}>{statusText}</span></td>
                                                                    <td>
                                                                        {resignation.status === 'PENDING' && (
                                                                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                                                                <button 
                                                                                    onClick={() => handleProcessResignation(resignation, 'APPROVE')}
                                                                                    style={{ 
                                                                                        background: '#22c55e', color: '#fff', border: 'none', 
                                                                                        padding: '6px 12px', borderRadius: 6, cursor: 'pointer',
                                                                                        fontSize: 12, fontWeight: 600, marginBottom: 4
                                                                                    }}
                                                                                >
                                                                                    ✓ Approve
                                                                                </button>
                                                                                <button 
                                                                                    onClick={() => handleProcessResignation(resignation, 'REJECT')}
                                                                                    style={{ 
                                                                                        background: '#f87171', color: '#fff', border: 'none', 
                                                                                        padding: '6px 12px', borderRadius: 6, cursor: 'pointer',
                                                                                        fontSize: 12, fontWeight: 600
                                                                                    }}
                                                                                >
                                                                                    ✗ Reject
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                        {resignation.status !== 'PENDING' && (
                                                                            <span style={{ fontSize: 12, color: '#888', fontStyle: 'italic' }}>
                                                                                {resignation.status === 'APPROVED' ? 'Approved' : 
                                                                                 resignation.status === 'REJECTED' ? 'Rejected' :
                                                                                 resignation.status === 'WITHDRAWN' ? 'Withdrawn' : 'No action needed'}
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {/* Pagination */}
                                        {filteredResignations.length > pageSize && (
                                            <div style={{ 
                                                display: 'flex', 
                                                justifyContent: 'center', 
                                                alignItems: 'center', 
                                                marginTop: 20, 
                                                gap: 16,
                                                padding: '16px 0'
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
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Processing Modal */}
                {processingResignation && (
                    <div className="leave-modal-overlay">
                        <div className="leave-modal" style={{ maxWidth: 600, width: '90%' }}>
                            <button 
                                onClick={() => setProcessingResignation(null)} 
                                style={{ 
                                    position: 'absolute', 
                                    top: 16, 
                                    right: 20, 
                                    fontSize: 26, 
                                    background: 'none', 
                                    border: 'none', 
                                    cursor: 'pointer', 
                                    color: '#dc2626', 
                                    fontWeight: 700
                                }}
                            >
                                &times;
                            </button>
                            
                            <div style={{ marginBottom: 24 }}>
                                <h3 style={{ 
                                    fontSize: 24, 
                                    fontWeight: 700, 
                                    color: '#1f2937',
                                    marginBottom: 16,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12
                                }}>
                                    <FaUserTimes style={{ color: '#dc2626' }} />
                                    {processingResignation.action === 'APPROVE' ? 'Approve' : 'Reject'} Resignation Request
                                </h3>
                                
                                {/* Employee Details */}
                                <div style={{ 
                                    background: '#f8fafc', 
                                    border: '1px solid #e5e7eb', 
                                    borderRadius: 8, 
                                    padding: 16,
                                    marginBottom: 20
                                }}>
                                    <div style={{ fontWeight: 600, marginBottom: 8, color: '#374151' }}>Employee Details:</div>
                                    <div><strong>Name:</strong> {processingResignation.employeeName}</div>
                                    <div><strong>Department:</strong> {processingResignation.department}</div>
                                    <div><strong>Role:</strong> {processingResignation.role} ({processingResignation.position})</div>
                                    <div><strong>Submission Date:</strong> {formatDate(processingResignation.resignationDate)}</div>
                                    <div><strong>Requested Last Working Day:</strong> {formatDate(processingResignation.requestedLastWorkingDay)}</div>
                                    <div><strong>Notice Period:</strong> {calculateNoticePeriod(processingResignation.resignationDate, processingResignation.requestedLastWorkingDay)}</div>
                                    <div><strong>Reason:</strong> {processingResignation.reason}</div>
                                </div>

                                {/* Approval Date Input */}
                                {processingResignation.action === 'APPROVE' && (
                                    <div style={{ marginBottom: 16 }}>
                                        <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: '#374151' }}>
                                            <FaCalendarAlt style={{ marginRight: 8, color: '#dc2626' }} />
                                            Approved Last Working Day *
                                        </label>
                                        <input
                                            type="date"
                                            value={approvedLastWorkingDay}
                                            onChange={e => setApprovedLastWorkingDay(e.target.value)}
                                            min={new Date().toISOString().split('T')[0]}
                                            style={{
                                                width: '100%',
                                                padding: 12,
                                                border: '2px solid #e5e7eb',
                                                borderRadius: 8,
                                                fontSize: 16
                                            }}
                                        />
                                        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                                            You can modify the last working day if needed (default: employee's requested date)
                                        </div>
                                    </div>
                                )}

                                {/* Comments Input */}
                                <div style={{ marginBottom: 20 }}>
                                    <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: '#374151' }}>
                                        <FaComments style={{ marginRight: 8, color: '#dc2626' }} />
                                        Comments {processingResignation.action === 'REJECT' && '*'}
                                    </label>
                                    <textarea
                                        value={comments}
                                        onChange={e => setComments(e.target.value)}
                                        rows={4}
                                        placeholder={processingResignation.action === 'APPROVE' ? 
                                            'Optional comments for approval...' : 
                                            'Please provide reason for rejection...'}
                                        style={{
                                            width: '100%',
                                            padding: 12,
                                            border: '2px solid #e5e7eb',
                                            borderRadius: 8,
                                            fontSize: 16,
                                            resize: 'vertical'
                                        }}
                                    />
                                </div>

                                {/* Action Buttons */}
                                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                                    <button
                                        onClick={() => setProcessingResignation(null)}
                                        style={{
                                            background: '#6b7280',
                                            color: '#fff',
                                            border: 'none',
                                            padding: '10px 20px',
                                            borderRadius: 8,
                                            cursor: 'pointer',
                                            fontWeight: 600
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={submitProcessResignation}
                                        style={{
                                            background: processingResignation.action === 'APPROVE' ? '#22c55e' : '#f87171',
                                            color: '#fff',
                                            border: 'none',
                                            padding: '10px 20px',
                                            borderRadius: 8,
                                            cursor: 'pointer',
                                            fontWeight: 600
                                        }}
                                    >
                                        {processingResignation.action === 'APPROVE' ? 'Approve Resignation' : 'Reject Resignation'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
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
            </main>
        </div>
    );
};

export default ManagerResignationRequests;
