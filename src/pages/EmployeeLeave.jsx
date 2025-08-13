import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PopupMessage from '../components/PopupMessage';
import axios from 'axios';
import EmployeeSidebar from '../components/EmployeeSidebar';
import './EmployeeDashboard.css';
import './EmployeeLeave.css';
import {
    FaClipboardList, FaHistory, FaPlusCircle,
    FaFileAlt, FaHourglassHalf, FaCheckCircle, FaTimesCircle
} from 'react-icons/fa';

const EmployeeLeave = () => {
    const email = localStorage.getItem('userEmail');
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
    const totalRequests = leaveHistory.length;
    const pendingRequests = leaveHistory.filter(l => l.status === 'PENDING').length;
    const approvedRequests = leaveHistory.filter(l => l.status === 'ACCEPTED').length;
    const rejectedRequests = leaveHistory.filter(l => l.status === 'DENIED' || l.status === 'REJECTED').length;
    const [leaveForm, setLeaveForm] = useState({ startDate: '', endDate: '', reason: '' });
    const [sortStatus, setSortStatus] = useState(''); // '' means no sort, otherwise sort by status
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 5;
    
    // Get filtered data based on sort status (sorted chronologically - newest first)
    const getFilteredHistory = () => {
        let filteredData = [];
        if (sortStatus === 'REJECTED') {
            filteredData = leaveHistory.filter(l => l.status === 'DENIED' || l.status === 'REJECTED');
        } else if (sortStatus) {
            filteredData = leaveHistory.filter(l => l.status === sortStatus);
        } else {
            filteredData = [...leaveHistory];
        }
        
        // Sort by ID - newest first (chronological order)
        return filteredData.sort((a, b) => b.id - a.id);
    };
    
    const filteredHistory = getFilteredHistory();
    const totalPages = Math.ceil(filteredHistory.length / pageSize);
    const paginatedHistory = filteredHistory.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    
    // Reset to first page when filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [sortStatus]);
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [leaveLoading, setLeaveLoading] = useState(false);
    const [leaveError, setLeaveError] = useState('');
    const [leaveSuccess, setLeaveSuccess] = useState('');
    const [showPopup, setShowPopup] = useState(false);
    const [popupMsg, setPopupMsg] = useState({ title: '', message: '', type: 'success' });
    const navigate = useNavigate();

    useEffect(() => {
        if (email) {
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

    const handleLeaveFormChange = (e) => {
        setLeaveForm({ ...leaveForm, [e.target.name]: e.target.value });
    };

    // Function to check for date overlaps in frontend
    const checkDateOverlap = (startDate, endDate) => {
        const newStart = new Date(startDate);
        const newEnd = new Date(endDate);
        
        return leaveHistory.some(leave => {
            // Skip denied leaves as they don't count
            if (leave.status === 'DENIED') return false;
            
            const existingStart = new Date(leave.fromDate);
            const existingEnd = new Date(leave.toDate);
            
            // Check if dates overlap: new leave overlaps with existing if
            // (newStart <= existingEnd) AND (newEnd >= existingStart)
            return (newStart <= existingEnd) && (newEnd >= existingStart);
        });
    };

    const handleLeaveApply = (e) => {
        e.preventDefault();
        setLeaveError('');
        setLeaveSuccess('');
        
        // Validation: all fields must be filled and reason must not be empty/whitespace
        if (!leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason || leaveForm.reason.trim() === '') {
            setLeaveError('All fields are required. Please fill in every field.');
            return;
        }

        // Calculate days requested for this leave
        const startDate = new Date(leaveForm.startDate);
        const endDate = new Date(leaveForm.endDate);
        const daysRequested = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

        // Client-side validation
        if (startDate > endDate) {
            setLeaveError('Start date cannot be after end date.');
            return;
        }

        // Check for overlapping dates
        if (checkDateOverlap(leaveForm.startDate, leaveForm.endDate)) {
            setLeaveError('The selected dates overlap with an existing leave request. Please choose different dates.');
            return;
        }

        // Determine if this will be paid or unpaid leave
        const willBePaid = leaveStats.remainingPaidLeaves >= daysRequested;
        const leaveType = willBePaid ? "Paid Leave" : "Unpaid Leave";

        setLeaveLoading(true);
        
        axios.post('http://localhost:8080/api/employee/leave/apply', {
            email,
            type: 'Annual',
            startDate: leaveForm.startDate,
            endDate: leaveForm.endDate,
            reason: leaveForm.reason
        })
            .then(res => {
                const message = res.data.message || `Leave request submitted successfully as ${leaveType}!`;
                setLeaveSuccess(message);
                setLeaveError('');
                setLeaveForm({ startDate: '', endDate: '', reason: '' });
                setPopupMsg({
                    title: 'Success',
                    message: message,
                    type: 'success'
                });
                setShowPopup(true);
                
                // Refresh both leave history and stats
                return Promise.all([
                    axios.get(`http://localhost:8080/api/employee/leave/history?email=${email}`),
                    axios.get(`http://localhost:8080/api/employee/leave/stats?email=${email}`)
                ]);
            })
            .then(([historyRes, statsRes]) => {
                setLeaveHistory(historyRes.data || []);
                setLeaveStats(statsRes.data);
            })
            .catch(err => {
                // Handle both string error messages and error responses
                let errorMessage = 'Failed to submit leave request.';
                if (err.response && err.response.data) {
                    errorMessage = typeof err.response.data === 'string' ? err.response.data : 'Failed to submit leave request.';
                }
                setLeaveError(errorMessage);
                setLeaveSuccess('');
                setPopupMsg({
                    title: 'Error',
                    message: errorMessage,
                    type: 'error'
                });
                setShowPopup(true);
            })
            .finally(() => setLeaveLoading(false));
    };

    return (
        <div className={`employee-leave-layout${showLeaveModal ? ' blur-bg' : ''}`} style={{ position: 'relative' }}>
            <EmployeeSidebar />
            <div className="employee-leave-content">
                <h2 className="leave-page-title"><FaClipboardList style={{ marginRight: 8 }} />Leave Management</h2>

                {/* Summary Cards */}
                <div style={{ display: 'flex', gap: 24, marginBottom: 32, flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                    {[
                        {
                            icon: <FaFileAlt size={32} color="#6366f1" style={{ marginBottom: 8 }} />,
                            label: 'Paid Leaves',
                            value: <span><span style={{ color: '#6366f1' }}>{leaveStats.totalPaidLeaves}</span> / <span style={{ color: 'tomato' }}>{leaveStats.usedPaidLeaves}</span> / <span style={{ color: '#22c55e' }}>{leaveStats.remainingPaidLeaves}</span></span>,
                            sub: 'Total/Used/Remaining',
                            border: '2px solid #6366f1',
                            bg: 'linear-gradient(135deg,#f5f6fa 80%,#e0e7ff 100%)',
                        },
                        {
                            icon: <FaFileAlt size={32} color="#f97316" style={{ marginBottom: 8 }} />,
                            label: 'Unpaid Leaves',
                            value: <span><span style={{ color: '#f97316' }}>{leaveStats.usedUnpaidLeaves}</span> / <span style={{ color: '#dc2626' }}>{leaveStats.unpaidLeavesThisMonth}</span></span>,
                            sub: 'Year Total / This Month',
                            border: '2px solid #f97316',
                            bg: 'linear-gradient(135deg,#fff7ed 80%,#fed7aa 100%)',
                        },
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
                            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-4px) scale(1.03)'}
                            onMouseOut={e => e.currentTarget.style.transform = ''}
                        >
                            {card.icon}
                            <div style={{ fontWeight: 700, fontSize: 17, color: '#222', marginBottom: 2 }}>{card.label}</div>
                            <div style={{ marginTop: 6, fontSize: 22, fontWeight: 700 }}>{card.value}</div>
                            {card.sub && <div style={{ fontSize: 13, marginTop: 4, color: '#888' }}>{card.sub}</div>}
                        </div>
                    ))}

                    {/* Apply Leave Button */}
                    <div style={{
                        flex: '1 1 180px', minWidth: 180, maxWidth: 220,
                        background: '#fff', borderRadius: 16, padding: 24,
                        boxShadow: '0 4px 16px #e0e7ef', display: 'flex',
                        flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        border: '2px dashed #6366f1', cursor: 'pointer'
                    }}
                        onMouseOver={e => e.currentTarget.style.transform = 'translateY(-4px) scale(1.03)'}
                        onMouseOut={e => e.currentTarget.style.transform = ''}
                        onClick={() => setShowLeaveModal(true)}
                    >
                        <button className="quick-link-btn" style={{ fontSize: 18, padding: '12px 32px', background: '#6366f1', color: '#fff', borderRadius: 8, border: 'none' }}>
                            <FaPlusCircle style={{ marginRight: 8 }} /> Apply Leave
                        </button>
                    </div>
                </div>

                {/* Leave History Table */}
                <div className="leave-history-card dashboard-card leave-card">
                    <div className="leave-history-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 352 }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <FaHistory style={{ color: '#6366f1', fontSize: 22, marginRight: 4 }} />
                            <span>Leave History{filteredHistory.length > 0 && <span className="record-count">({filteredHistory.length} record{filteredHistory.length > 1 ? 's' : ''})</span>}</span>
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
                                    border: '1.5px solid #6366f1',
                                    background: '#f5f6fa',
                                    color: '#222',
                                    fontWeight: 600,
                                    fontSize: 15,
                                    boxShadow: '0 2px 8px #e0e7ef',
                                    outline: 'none',
                                    transition: 'border 0.2s',
                                    cursor: 'pointer',
                                }}
                                onFocus={e => e.target.style.border = '2px solid #6366f1'}
                                onBlur={e => e.target.style.border = '1.5px solid #6366f1'}
                            >
                                <option value="">All</option>
                                <option value="ACCEPTED">Approved</option>
                                <option value="PENDING">Pending</option>
                                <option value="REJECTED">Rejected</option>
                            </select>
                        </div>
                    </div>
                    {leaveHistory.length === 0 ? (
                        <p className="leave-history-empty">No leave records found.</p>
                    ) : (
                        <div className="leave-history-table-container">
                            <div>
                                <table className="leave-history-table">
                                    <thead>
                                        <tr>
                                            <th>Start Date</th>
                                            <th>End Date</th>
                                            <th>Duration</th>
                                            <th>Leave Type</th>
                                            <th>Reason</th>
                                            <th>Status</th>
                                            <th>Manager Denial Reason</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedHistory.map((leave, idx) => {
                                            let statusClass = 'leave-history-status';
                                            let statusText = leave.status;
                                            if (leave.status === 'ACCEPTED') statusClass += ' approved';
                                            else if (leave.status === 'PENDING') statusClass += ' pending';
                                            else if (leave.status === 'DENIED' || leave.status === 'REJECTED') {
                                                statusClass += ' rejected';
                                                statusText = 'REJECTED';
                                            }

                                            let duration = '-';
                                            if (leave.fromDate && leave.toDate) {
                                                const from = new Date(leave.fromDate);
                                                const to = new Date(leave.toDate);
                                                const diff = Math.abs(to - from);
                                                duration = (Math.floor(diff / (1000 * 60 * 60 * 24)) + 1) + ' day(s)';
                                            }

                                            // Format dates with month name
                                            const dateOptions = { day: 'numeric', month: 'short', year: 'numeric' };
                                            const formattedFrom = leave.fromDate ? new Date(leave.fromDate).toLocaleDateString('en-GB', dateOptions) : '-';
                                            const formattedTo = leave.toDate ? new Date(leave.toDate).toLocaleDateString('en-GB', dateOptions) : '-';

                                            // Helper function to truncate text intelligently
                                            const truncateText = (text, maxLength = 25) => {
                                                if (!text || text === '-') return text;
                                                if (text.length <= maxLength) return text;
                                                
                                                // Find the last space before maxLength to avoid cutting words
                                                const truncated = text.substring(0, maxLength);
                                                const lastSpaceIndex = truncated.lastIndexOf(' ');
                                                
                                                if (lastSpaceIndex > maxLength * 0.6) {
                                                    // If there's a space reasonably close to maxLength, cut there
                                                    return truncated.substring(0, lastSpaceIndex) + '...';
                                                } else {
                                                    // Otherwise use the original maxLength cut
                                                    return truncated + '...';
                                                }
                                            };

                                            return (
                                                <tr key={idx}>
                                                    <td>{formattedFrom}</td>
                                                    <td>{formattedTo}</td>
                                                    <td>{duration}</td>
                                                    <td>
                                                        <span style={{
                                                            padding: '4px 8px',
                                                            borderRadius: '4px',
                                                            fontSize: '12px',
                                                            fontWeight: '500',
                                                            background: leave.isPaid === false ? '#fef3c7' : '#dbeafe',
                                                            color: leave.isPaid === false ? '#d97706' : '#1d4ed8'
                                                        }}>
                                                            {leave.isPaid === false ? 'Unpaid' : 'Paid'}
                                                        </span>
                                                    </td>
                                                    <td>{leave.reason || '-'}</td>
                                                    <td><span className={statusClass}>{statusText}</span></td>
                                                    <td>
                                                        {leave.denialReason && leave.denialReason !== '-' ? (
                                                            leave.denialReason.length > 25 ? (
                                                                <span 
                                                                    className="denial-reason-tooltip"
                                                                    data-tooltip={leave.denialReason}
                                                                    style={{ 
                                                                        cursor: 'help',
                                                                        borderBottom: '1px dotted #6366f1',
                                                                        color: '#6366f1'
                                                                    }}
                                                                >
                                                                    {truncateText(leave.denialReason)}
                                                                </span>
                                                            ) : (
                                                                <span>{leave.denialReason}</span>
                                                            )
                                                        ) : '-'}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>

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
                                                padding: '8px 16px',
                                                borderRadius: 6,
                                                border: '1px solid #d1d5db',
                                                background: currentPage === 1 ? '#f9fafb' : '#fff',
                                                color: currentPage === 1 ? '#9ca3af' : '#374151',
                                                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                                fontWeight: 500,
                                                fontSize: 14
                                            }}
                                        >
                                            Previous
                                        </button>
                                        <span style={{ 
                                            fontSize: 14, 
                                            color: '#6b7280',
                                            fontWeight: 500,
                                            padding: '0 16px'
                                        }}>
                                            Page {currentPage} of {totalPages} ({filteredHistory.length} record{filteredHistory.length !== 1 ? 's' : ''})
                                        </span>
                                        <button 
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                                            disabled={currentPage === totalPages}
                                            style={{
                                                padding: '8px 16px',
                                                borderRadius: 6,
                                                border: '1px solid #d1d5db',
                                                background: currentPage === totalPages ? '#f9fafb' : '#fff',
                                                color: currentPage === totalPages ? '#9ca3af' : '#374151',
                                                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                                fontWeight: 500,
                                                fontSize: 14
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

                {/* Popup Message */}
                {showPopup && (
                    <PopupMessage
                        title={popupMsg.title}
                        message={popupMsg.message}
                        type={popupMsg.type}
                        onClose={() => {
                            setShowPopup(false);
                            if (showLeaveModal) setShowLeaveModal(false);

                            // Reloads the current route
                            setTimeout(() => {
                                navigate(0);
                            }, 150);
                        }}
                    />
                )}

                {/* Leave Modal */}
                {showLeaveModal && (
                    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.25)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }}>
                        <div style={{ background: '#fff', padding: '36px 36px 28px 36px', borderRadius: 18, boxShadow: '0 8px 40px #6366f133, 0 1.5px 8px #0001', minWidth: 340, maxWidth: 420, width: '100%', position: 'relative', border: '1.5px solid #e0e7ef', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <button onClick={() => setShowLeaveModal(false)} style={{ position: 'absolute', top: 16, right: 20, fontSize: 26, background: 'none', border: 'none', cursor: 'pointer', color: '#6366f1', fontWeight: 700, transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = '#f87171'} onMouseOut={e => e.currentTarget.style.color = '#6366f1'}>&times;</button>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18, gap: 8 }}>
                                <FaPlusCircle style={{ color: '#6366f1', fontSize: 24 }} />
                                <span style={{ fontWeight: 700, fontSize: 22, color: '#222' }}>Apply for Leave</span>
                            </div>
                            <form className="leave-apply-form" onSubmit={handleLeaveApply} style={{ width: '100%' }}>
                                <div className="form-row" style={{ display: 'flex', gap: 16, marginBottom: 18 }}>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        <label style={{ fontWeight: 600, fontSize: 14, color: '#444', marginBottom: 4 }}>START DATE</label>
                                        <input type="date" name="startDate" value={leaveForm.startDate} onChange={handleLeaveFormChange} required style={{ padding: '10px 12px', borderRadius: 8, border: '1.5px solid #bbb', fontSize: 15, background: '#f5f6fa', outline: 'none', marginBottom: 0 }} />
                                    </div>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        <label style={{ fontWeight: 600, fontSize: 14, color: '#444', marginBottom: 4 }}>END DATE</label>
                                        <input type="date" name="endDate" value={leaveForm.endDate} onChange={handleLeaveFormChange} required style={{ padding: '10px 12px', borderRadius: 8, border: '1.5px solid #bbb', fontSize: 15, background: '#f5f6fa', outline: 'none', marginBottom: 0 }} />
                                    </div>
                                </div>
                                <div style={{ marginBottom: 18 }}>
                                    <label style={{ fontWeight: 600, fontSize: 14, color: '#444', marginBottom: 4, display: 'block' }}>Reason</label>
                                    <textarea name="reason" value={leaveForm.reason} onChange={handleLeaveFormChange} required rows={2} placeholder="Reason for leave..." style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #bbb', fontSize: 15, background: '#f5f6fa', outline: 'none', resize: 'vertical', minHeight: 48 }} />
                                </div>

                                {/* Leave Policy Note */}
                                <div style={{ 
                                    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', 
                                    border: '1px solid #0ea5e9', 
                                    borderRadius: 8, 
                                    padding: 12, 
                                    marginBottom: 18,
                                    fontSize: 13,
                                    color: '#075985'
                                }}>
                                    <div style={{ fontWeight: '600', marginBottom: 4 }}>📋 Leave Policy:</div>
                                    <div>• You have <strong>{leaveStats.remainingPaidLeaves} paid leaves</strong> remaining out of {leaveStats.totalPaidLeaves} annual quota</div>
                                    <div>• After exhausting paid leaves, additional requests will be processed as <strong>unpaid leaves</strong></div>
                                    <div>• Unpaid leaves this month: <strong>{leaveStats.unpaidLeavesThisMonth}</strong> | Total unpaid this year: <strong>{leaveStats.usedUnpaidLeaves}</strong></div>
                                </div>

                                <button className="quick-link-btn" type="submit" disabled={leaveLoading} style={{ width: '100%', fontSize: 18, padding: '13px 0', background: '#6366f1', color: '#fff', borderRadius: 10, border: 'none', fontWeight: 700, boxShadow: '0 2px 8px #6366f122', marginTop: 2, marginBottom: 6, letterSpacing: 0.5 }}>
                                    {leaveLoading ? 'Submitting...' : 'Submit Leave Request'}
                                </button>
                                {leaveError && <div className="leave-error" style={{ color: '#f87171', background: '#fee2e2', borderRadius: 6, padding: '7px 12px', marginTop: 4, fontWeight: 500, fontSize: 15 }}>{leaveError}</div>}
                                {leaveSuccess && <div className="leave-success" style={{ color: '#22c55e', background: '#dcfce7', borderRadius: 6, padding: '7px 12px', marginTop: 4, fontWeight: 500, fontSize: 15 }}>{leaveSuccess}</div>}
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmployeeLeave;
