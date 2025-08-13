import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PopupMessage from '../components/PopupMessage';
import ConfirmationModal from '../components/ConfirmationModal';
import axios from 'axios';
import EmployeeSidebar from '../components/EmployeeSidebar';
import './EmployeeDashboard.css';
import './EmployeeLeave.css';
import {
    FaClipboardList, FaHistory, FaPlusCircle, FaFileAlt, FaHourglassHalf, 
    FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaUserTimes,
    FaCalendarAlt, FaClock, FaComments, FaEdit
} from 'react-icons/fa';

const EmployeeResignation = () => {
    const email = localStorage.getItem('userEmail') || localStorage.getItem('email');
    const userRole = localStorage.getItem('role');
    const [resignationHistory, setResignationHistory] = useState([]);
    const [showResignationModal, setShowResignationModal] = useState(false);
    const [resignationForm, setResignationForm] = useState({ 
        requestedLastWorkingDay: '', 
        reason: '' 
    });
    const [resignationLoading, setResignationLoading] = useState(false);
    const [resignationError, setResignationError] = useState('');
    const [resignationSuccess, setResignationSuccess] = useState('');
    const [showPopup, setShowPopup] = useState(false);
    const [popupMsg, setPopupMsg] = useState({ title: '', message: '', type: '' });
    const [sortStatus, setSortStatus] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [confirmModal, setConfirmModal] = useState(null);
    const [customReason, setCustomReason] = useState('');
    const pageSize = 5;

    const navigate = useNavigate();

    // Redirect if not logged in or not an employee
    useEffect(() => {
        if (!email || userRole !== 'EMPLOYEE') {
            navigate('/login');
            return;
        }
    }, [email, userRole, navigate]);

    // Fetch resignation history
    useEffect(() => {
        if (email) {
            axios.get(`http://localhost:8080/api/resignation/history?email=${email}`)
                .then(res => {
                    setResignationHistory(res.data || []);
                })
                .catch(err => {
                    console.error('Failed to fetch resignation history', err);
                    setResignationHistory([]);
                });
        }
    }, [email]);

    // Calculate statistics
    const totalRequests = resignationHistory.length;
    const pendingRequests = resignationHistory.filter(r => r.status === 'PENDING').length;
    const approvedRequests = resignationHistory.filter(r => r.status === 'APPROVED').length;
    const rejectedRequests = resignationHistory.filter(r => r.status === 'REJECTED').length;
    const withdrawnRequests = resignationHistory.filter(r => r.status === 'WITHDRAWN').length;

    // Filter and pagination logic
    const getFilteredHistory = () => {
        let filteredData = [];
        if (sortStatus === 'REJECTED') {
            filteredData = resignationHistory.filter(r => r.status === 'REJECTED');
        } else if (sortStatus) {
            filteredData = resignationHistory.filter(r => r.status === sortStatus);
        } else {
            filteredData = [...resignationHistory];
        }
        
        return filteredData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    };

    const filteredHistory = getFilteredHistory();
    const totalPages = Math.ceil(filteredHistory.length / pageSize);
    const paginatedHistory = filteredHistory.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    // Check if employee has active resignation
    const hasActiveResignation = resignationHistory.some(r => r.status === 'PENDING' || r.status === 'APPROVED');

    const handleResignationFormChange = (e) => {
        setResignationForm({ ...resignationForm, [e.target.name]: e.target.value });
    };

    const handleCustomReasonChange = (e) => {
        setCustomReason(e.target.value);
    };

    const showNotification = (title, message, type) => {
        setPopupMsg({ title, message, type });
        setShowPopup(true);
    };

    const handleResignationSubmit = (e) => {
        e.preventDefault();
        console.log('Form submission started');
        console.log('Form data:', resignationForm);
        console.log('Custom reason:', customReason);
        
        setResignationError('');
        setResignationSuccess('');

        // Get the final reason
        const finalReason = resignationForm.reason === 'Other' ? customReason : resignationForm.reason;
        console.log('Final reason:', finalReason);
        
        // Validation
        if (!resignationForm.requestedLastWorkingDay || !finalReason || finalReason.trim() === '') {
            console.log('Validation failed: Missing required fields');
            setResignationError('All fields are required. Please fill in every field.');
            return;
        }

        if (resignationForm.reason === 'Other' && customReason.trim().length < 10) {
            console.log('Validation failed: Custom reason too short');
            setResignationError('Custom reason must be at least 10 characters long.');
            return;
        }

        // Date validation
        const selectedDate = new Date(resignationForm.requestedLastWorkingDay);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        if (selectedDate < tomorrow) {
            console.log('Validation failed: Date is in the past');
            setResignationError('Last working day must be at least tomorrow.');
            return;
        }

        console.log('All validation passed, showing confirmation modal');
        // Show confirmation modal
        setConfirmModal({
            title: 'Submit Resignation Request',
            message: `Are you sure you want to submit your resignation request?\n\nLast Working Day: ${resignationForm.requestedLastWorkingDay}\nReason: ${finalReason}`,
            onConfirm: () => {
                console.log('User confirmed resignation submission');
                setConfirmModal(null); // Close the confirmation modal first
                submitResignation(finalReason);
            },
            onCancel: () => {
                console.log('User cancelled resignation submission');
                setConfirmModal(null);
            }
        });
        console.log('Confirmation modal set');
    };

    const submitResignation = (reason) => {
        console.log('Starting resignation submission...');
        console.log('Employee email:', email);
        console.log('Reason:', reason);
        console.log('Form data:', resignationForm);
        
        setResignationLoading(true);
        
        const resignationData = {
            employeeEmail: email,
            requestedLastWorkingDay: resignationForm.requestedLastWorkingDay,
            reason: reason
        };

        console.log('Sending resignation data to API:', resignationData);

        axios.post('http://localhost:8080/api/resignation/submit', resignationData)
            .then(res => {
                console.log('SUCCESS: Resignation submitted:', res.data);
                setResignationSuccess('Resignation request submitted successfully!');
                setResignationForm({ requestedLastWorkingDay: '', reason: '' });
                setCustomReason('');
                setShowResignationModal(false);
                setConfirmModal(null);
                
                showNotification(
                    'Success',
                    'Your resignation request has been submitted successfully and sent to your manager for review.',
                    'success'
                );
                
                // Refresh resignation history
                return axios.get(`http://localhost:8080/api/resignation/history?email=${email}`);
            })
            .then(res => {
                if (res) setResignationHistory(res.data || []);
            })
            .catch(err => {
                console.error('ERROR: Failed to submit resignation:', err);
                console.error('Error details:', err.response?.data);
                let errorMessage = 'Failed to submit resignation request.';
                if (err.response && err.response.data) {
                    errorMessage = typeof err.response.data === 'string' ? err.response.data : 'Failed to submit resignation request.';
                }
                setResignationError(errorMessage);
                setResignationSuccess('');
                showNotification(
                    'Error',
                    errorMessage,
                    'error'
                );
                setConfirmModal(null);
            })
            .finally(() => {
                console.log('Resignation submission process completed');
                setResignationLoading(false);
            });
    };

    const handleWithdrawResignation = (resignationId) => {
        setConfirmModal({
            title: 'Withdraw Resignation',
            message: 'Are you sure you want to withdraw your resignation request? This action cannot be undone.',
            onConfirm: () => withdrawResignation(resignationId),
            onCancel: () => setConfirmModal(null)
        });
    };

    const withdrawResignation = (resignationId) => {
        axios.post(`http://localhost:8080/api/resignation/${resignationId}/withdraw?employeeEmail=${email}`)
            .then(res => {
                showNotification(
                    'Success',
                    'Your resignation request has been withdrawn successfully.',
                    'success'
                );
                setConfirmModal(null);
                
                // Refresh resignation history
                return axios.get(`http://localhost:8080/api/resignation/history?email=${email}`);
            })
            .then(res => {
                if (res) setResignationHistory(res.data || []);
            })
            .catch(err => {
                let errorMessage = 'Failed to withdraw resignation request.';
                if (err.response && err.response.data) {
                    errorMessage = typeof err.response.data === 'string' ? err.response.data : 'Failed to withdraw resignation request.';
                }
                showNotification(
                    'Error',
                    errorMessage,
                    'error'
                );
                setConfirmModal(null);
            });
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

    const predefinedReasons = [
        'Better Career Opportunity',
        'Higher Salary Offer',
        'Work-Life Balance',
        'Personal Reasons',
        'Health Issues',
        'Relocation',
        'Career Change',
        'Further Studies',
        'Family Commitments',
        'Retirement',
        'Other'
    ];

    return (
        <div className="employee-dashboard-layout">
            <EmployeeSidebar />
            <main className="employee-dashboard-main">
                <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '20px' }}>
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
                                    Resignation Management
                                </h1>
                                <p style={{ 
                                    fontSize: 16, 
                                    color: '#6b7280', 
                                    margin: '4px 0 0 0',
                                    fontWeight: 500
                                }}>
                                    Manage your resignation requests and track their status
                                </p>
                            </div>
                        </div>
                        
                        {!hasActiveResignation && (
                            <button
                                className="quick-link-btn"
                                onClick={() => setShowResignationModal(true)}
                                style={{
                                    background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                                    color: '#fff',
                                    border: 'none',
                                    padding: '12px 24px',
                                    borderRadius: 12,
                                    fontSize: 16,
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 14px rgba(220, 38, 38, 0.3)',
                                    transition: 'all 0.3s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8
                                }}
                            >
                                <FaPlusCircle /> Submit Resignation
                            </button>
                        )}
                    </div>

                    {/* Statistics Cards */}
                    <div style={{ 
                        display: 'flex', 
                        gap: 20, 
                        marginBottom: 30, 
                        flexWrap: 'wrap', 
                        justifyContent: 'center',
                        padding: '0 10px'
                    }}>
                        {[
                            {
                                icon: <FaClipboardList size={32} color="#6366f1" style={{ marginBottom: 8 }} />,
                                label: 'Total Requests',
                                value: totalRequests,
                                sub: '',
                                border: '2px solid #6366f1',
                                bg: 'linear-gradient(135deg,#f5f6fa 80%,#e0e7ff 100%)',
                            },
                            {
                                icon: <FaHourglassHalf size={32} color="#fbbf24" style={{ marginBottom: 8 }} />,
                                label: 'Pending',
                                value: pendingRequests,
                                sub: '',
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
                                    flex: '1 1 180px', minWidth: 180, maxWidth: 220,
                                    background: card.bg, borderRadius: 16, padding: 24,
                                    boxShadow: '0 4px 16px #e0e7ef', display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', border: card.border,
                                    transition: 'transform 0.15s,box-shadow 0.15s',
                                    cursor: 'default', position: 'relative',
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

                    {/* Active Resignation Alert */}
                    {hasActiveResignation && (
                        <div style={{
                            background: 'linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%)',
                            border: '1px solid #f59e0b',
                            borderRadius: 12,
                            padding: 16,
                            marginBottom: 24,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12
                        }}>
                            <FaExclamationTriangle style={{ color: '#f59e0b', fontSize: 20 }} />
                            <div style={{ color: '#92400e', fontWeight: 600 }}>
                                You have an active resignation request. You cannot submit a new request until the current one is processed or withdrawn.
                            </div>
                        </div>
                    )}

                    {/* Resignation History */}
                    <div className="leave-history-section" style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}>
                        <div className="leave-history-header" style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            marginBottom: 24,
                            paddingBottom: 16,
                            borderBottom: '2px solid #e5e7eb'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <FaHistory style={{ color: '#dc2626', fontSize: 22, marginRight: 4 }} />
                                <span>Resignation History{filteredHistory.length > 0 && <span className="record-count">({filteredHistory.length} record{filteredHistory.length > 1 ? 's' : ''})</span>}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <label htmlFor="sort-status" style={{ fontSize: 14, color: '#444', marginRight: 8, fontWeight: 500 }}>Sort by Status:</label>
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
                                        transition: 'border 0.2s',
                                        cursor: 'pointer',
                                    }}
                                    onFocus={e => e.target.style.border = '2px solid #dc2626'}
                                    onBlur={e => e.target.style.border = '1.5px solid #dc2626'}
                                >
                                    <option value="">All</option>
                                    <option value="PENDING">Pending</option>
                                    <option value="APPROVED">Approved</option>
                                    <option value="REJECTED">Rejected</option>
                                    <option value="WITHDRAWN">Withdrawn</option>
                                </select>
                            </div>
                        </div>
                        
                        {resignationHistory.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
                                <FaFileAlt size={64} style={{ color: '#d1d5db', marginBottom: 16 }} />
                                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No Resignation Records Found</div>
                                <div style={{ fontSize: 14 }}>You haven't submitted any resignation requests yet.</div>
                            </div>
                        ) : (
                            <div className="leave-history-table-container">
                                <div>
                                    <table className="leave-history-table">
                                        <thead>
                                            <tr>
                                                <th>Submission Date</th>
                                                <th>Requested Last Day</th>
                                                <th>Approved Last Day</th>
                                                <th>Notice Period</th>
                                                <th>Reason</th>
                                                <th>Status</th>
                                                <th>Manager Comments</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginatedHistory.map((resignation, idx) => {
                                                let statusClass = 'leave-history-status';
                                                let statusText = resignation.status;
                                                if (resignation.status === 'APPROVED') statusClass += ' approved';
                                                else if (resignation.status === 'PENDING') statusClass += ' pending';
                                                else if (resignation.status === 'REJECTED') {
                                                    statusClass += ' rejected';
                                                } else if (resignation.status === 'WITHDRAWN') {
                                                    statusClass += ' withdrawn';
                                                }

                                                const noticePeriod = calculateNoticePeriod(resignation.resignationDate, resignation.requestedLastWorkingDay);

                                                return (
                                                    <tr key={resignation.id} style={{ background: '#ffffff' }}>
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
                                                        <td style={{ maxWidth: '200px', wordBreak: 'break-word' }}>
                                                            {resignation.managerComments && resignation.managerComments !== '-' ? (
                                                                resignation.managerComments.length > 25 ? (
                                                                    <span 
                                                                        title={resignation.managerComments}
                                                                        style={{ 
                                                                            cursor: 'help',
                                                                            borderBottom: '1px dotted #dc2626',
                                                                            color: '#dc2626'
                                                                        }}
                                                                    >
                                                                        {truncateText(resignation.managerComments, 25)}
                                                                    </span>
                                                                ) : (
                                                                    <span>{resignation.managerComments}</span>
                                                                )
                                                            ) : '-'}
                                                        </td>
                                                        <td>
                                                            {resignation.status === 'PENDING' && (
                                                                <button
                                                                    onClick={() => handleWithdrawResignation(resignation.id)}
                                                                    style={{
                                                                        background: '#f59e0b',
                                                                        color: '#fff',
                                                                        border: 'none',
                                                                        padding: '6px 12px',
                                                                        borderRadius: 6,
                                                                        fontSize: 12,
                                                                        fontWeight: 600,
                                                                        cursor: 'pointer',
                                                                        transition: 'background 0.2s'
                                                                    }}
                                                                    onMouseEnter={e => e.target.style.background = '#d97706'}
                                                                    onMouseLeave={e => e.target.style.background = '#f59e0b'}
                                                                >
                                                                    Withdraw
                                                                </button>
                                                            )}
                                                            {resignation.status !== 'PENDING' && (
                                                                <span style={{ fontSize: 12, color: '#6b7280', fontStyle: 'italic' }}>
                                                                    No actions available
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>

                                    {/* Pagination */}
                                    {filteredHistory.length > pageSize && (
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
                            </div>
                        )}
                    </div>
                </div>

                {/* Resignation Modal */}
                {showResignationModal && (
                    <div className="leave-modal-overlay">
                        <div className="leave-modal" style={{ maxWidth: 550, width: '90%' }}>
                            <button 
                                onClick={() => setShowResignationModal(false)} 
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
                                <span style={{ fontWeight: 700, fontSize: 22, color: '#222' }}>Submit Resignation</span>
                            </div>
                            
                            <form className="leave-apply-form" onSubmit={handleResignationSubmit} style={{ width: '100%' }}>
                                {/* Important Notice */}
                                <div style={{ 
                                    background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', 
                                    border: '1px solid #f87171', 
                                    borderRadius: 8, 
                                    padding: 12, 
                                    marginBottom: 18,
                                    fontSize: 13,
                                    color: '#991b1b'
                                }}>
                                    <div style={{ fontWeight: '600', marginBottom: 4 }}>⚠️ Important Notice:</div>
                                    <div>• This resignation request will be sent to your manager for approval</div>
                                    <div>• Please ensure you have discussed this with your manager beforehand</div>
                                    <div>• You can withdraw your request only if it's still pending</div>
                                </div>

                                <div style={{ marginBottom: 16 }}>
                                    <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: '#374151' }}>
                                        <FaCalendarAlt style={{ marginRight: 8, color: '#dc2626' }} />
                                        Requested Last Working Day *
                                    </label>
                                    <input
                                        type="date"
                                        name="requestedLastWorkingDay"
                                        value={resignationForm.requestedLastWorkingDay}
                                        onChange={handleResignationFormChange}
                                        min={new Date(Date.now() + 86400000).toISOString().split('T')[0]} // Tomorrow
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
                                        <FaComments style={{ marginRight: 8, color: '#dc2626' }} />
                                        Resignation Reason *
                                    </label>
                                    <select
                                        name="reason"
                                        value={resignationForm.reason}
                                        onChange={handleResignationFormChange}
                                        style={{
                                            width: '100%',
                                            padding: 12,
                                            borderRadius: 8,
                                            border: '2px solid #e5e7eb',
                                            fontSize: 16,
                                            transition: 'border-color 0.2s',
                                            background: '#fff'
                                        }}
                                        onFocus={e => e.target.style.borderColor = '#dc2626'}
                                        onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                                    >
                                        <option value="">Select a reason...</option>
                                        {predefinedReasons.map(reason => (
                                            <option key={reason} value={reason}>{reason}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Custom Reason Input */}
                                {resignationForm.reason === 'Other' && (
                                    <div style={{ marginBottom: 16 }}>
                                        <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: '#374151' }}>
                                            <FaEdit style={{ marginRight: 8, color: '#dc2626' }} />
                                            Custom Reason * <span style={{ fontSize: '12px', color: '#6b7280' }}>({customReason.length}/500)</span>
                                        </label>
                                        <textarea
                                            value={customReason}
                                            onChange={handleCustomReasonChange}
                                            maxLength={500}
                                            rows={4}
                                            placeholder="Please provide your specific reason for resignation (minimum 10 characters)..."
                                            style={{
                                                width: '100%',
                                                padding: 12,
                                                borderRadius: 8,
                                                border: '2px solid #e5e7eb',
                                                fontSize: 16,
                                                transition: 'border-color 0.2s',
                                                resize: 'vertical',
                                                minHeight: '100px'
                                            }}
                                            onFocus={e => e.target.style.borderColor = '#dc2626'}
                                            onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                                        />
                                        {customReason.length < 10 && customReason.length > 0 && (
                                            <div style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}>
                                                Custom reason must be at least 10 characters long
                                            </div>
                                        )}
                                    </div>
                                )}

                                <button 
                                    className="quick-link-btn" 
                                    type="submit" 
                                    disabled={resignationLoading} 
                                    onClick={(e) => {
                                        console.log('Button clicked!');
                                        handleResignationSubmit(e);
                                    }}
                                    style={{ 
                                        width: '100%', 
                                        fontSize: 18, 
                                        padding: '13px 0', 
                                        background: resignationLoading ? '#9ca3af' : 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)', 
                                        color: '#fff', 
                                        borderRadius: 10, 
                                        border: 'none', 
                                        fontWeight: 700, 
                                        boxShadow: '0 2px 8px rgba(220, 38, 38, 0.2)', 
                                        marginTop: 2, 
                                        marginBottom: 6, 
                                        letterSpacing: 0.5,
                                        cursor: resignationLoading ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {resignationLoading ? 'Submitting...' : 'Submit Resignation Request'}
                                </button>
                                
                                {resignationError && (
                                    <div style={{ 
                                        color: '#f87171', 
                                        background: '#fee2e2', 
                                        borderRadius: 6, 
                                        padding: '7px 12px', 
                                        marginTop: 4, 
                                        fontWeight: 500, 
                                        fontSize: 15 
                                    }}>
                                        {resignationError}
                                    </div>
                                )}
                            </form>
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
                        confirmText="Yes, Submit"
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
            </main>
        </div>
    );
};

export default EmployeeResignation;
