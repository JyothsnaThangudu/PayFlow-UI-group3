import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarManager from '../components/SidebarManager';
import ConfirmationModal from '../components/ConfirmationModal';
import axios from '../utils/axios';
import { FaLock, FaUnlock, FaSearch, FaCalendarAlt, FaUser, FaPlus, FaList } from 'react-icons/fa';
import './ManagerPaymentHolds.css';

const ManagerPaymentHolds = () => {
    const navigate = useNavigate();
    const [employees, setEmployees] = useState([]);
    const [payslipsOnHold, setPayslipsOnHold] = useState([]);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
    const [holdMonth, setHoldMonth] = useState(new Date().getMonth() + 1);
    const [holdYear, setHoldYear] = useState(new Date().getFullYear());
    const [holdReason, setHoldReason] = useState('');
    const [customReason, setCustomReason] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingHolds, setLoadingHolds] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [confirmModal, setConfirmModal] = useState({ 
        isOpen: false, 
        employeeId: null, 
        employeeName: '' 
    });

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const years = [2024, 2025, 2026];

    const holdReasons = [
        { value: 'Performance Issues', label: 'Performance Issues' },
        { value: 'Team Management', label: 'Team Management' },
        { value: 'Project Concerns', label: 'Project Concerns' },
        { value: 'Attendance Issues', label: 'Attendance Issues' },
        { value: 'Quality Issues', label: 'Quality Issues' },
        { value: 'Behavioral Concerns', label: 'Behavioral Concerns' },
        { value: 'Investigation Pending', label: 'Investigation Pending' },
        { value: 'Other', label: 'Other' }
    ];

    useEffect(() => {
        checkUserAuth();
        fetchTeamEmployees();
        fetchPayslipsOnHold();
    }, []);

    const checkUserAuth = () => {
        const userRole = localStorage.getItem('role');
        if (!userRole || userRole !== 'MANAGER') {
            navigate('/login');
            return;
        }
    };

    const fetchTeamEmployees = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const currentUserId = localStorage.getItem('userId');
            
            const response = await axios.get('/api/payslip/employees', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.data && response.data.length > 0) {
                // Filter employees who are managed by this manager
                const teamMembers = response.data.filter(emp => emp.managerId == currentUserId);
                setEmployees(teamMembers);
                
                if (teamMembers.length === 0) {
                    showMessage('info', 'No team members found under your management.');
                }
            } else {
                showMessage('error', 'No employees found in the system.');
            }
        } catch (error) {
            console.error('Error fetching team employees:', error);
            showMessage('error', 'Failed to fetch team employees');
        }
    };

    const fetchPayslipsOnHold = async () => {
        try {
            setLoadingHolds(true);
            const response = await axios.get('/api/payment-hold/list');
            
            // Filter holds for team members only
            const currentUserId = localStorage.getItem('userId');
            const teamMemberIds = employees.map(emp => emp.id);
            const teamHolds = response.data?.filter(hold => teamMemberIds.includes(hold.employeeId)) || [];
            
            setPayslipsOnHold(teamHolds);
        } catch (error) {
            console.error('Error fetching payment holds:', error);
            showMessage('error', 'Failed to fetch payment holds');
        } finally {
            setLoadingHolds(false);
        }
    };

    // Re-fetch holds when employees are updated
    useEffect(() => {
        if (employees.length > 0) {
            fetchPayslipsOnHold();
        }
    }, [employees]);

    const handlePlaceHold = async (e) => {
        e.preventDefault();
        if (!selectedEmployeeId || !holdReason) {
            showMessage('error', 'Please fill in all required fields');
            return;
        }

        // Check if "Other" is selected and custom reason is required
        if (holdReason === 'Other' && !customReason.trim()) {
            showMessage('error', 'Please provide a custom reason when selecting "Other"');
            return;
        }

        setLoading(true);
        try {
            const finalReason = holdReason === 'Other' ? customReason.trim() : holdReason;
            const response = await axios.post('/api/payment-hold/place', {
                employeeId: selectedEmployeeId,
                holdReason: finalReason,
                holdByUserId: localStorage.getItem('userId') || 1,
                holdByUserRole: 'MANAGER',
                holdMonth: holdMonth,
                holdYear: holdYear
            });

            if (response.data.success) {
                showMessage('success', response.data.message);
                // Reset form
                setSelectedEmployeeId('');
                setHoldReason('');
                setCustomReason('');
                setHoldMonth(new Date().getMonth() + 1);
                setHoldYear(new Date().getFullYear());
                // Refresh data
                fetchPayslipsOnHold();
            } else {
                showMessage('error', response.data.message);
            }
        } catch (error) {
            console.error('Error placing payment hold:', error);
            showMessage('error', error.response?.data?.message || 'Failed to place payment hold');
        } finally {
            setLoading(false);
        }
    };

    const handleReleaseHold = async (employeeId) => {
        const employeeName = getEmployeeName(employeeId);
        setConfirmModal({ 
            isOpen: true, 
            employeeId, 
            employeeName 
        });
    };

    const confirmReleaseHold = async () => {
        const { employeeId } = confirmModal;
        setLoading(true);
        try {
            const response = await axios.post('/api/payment-hold/release', {
                employeeId: employeeId,
                releasedByUserId: localStorage.getItem('userId') || 1,
                releasedByUserRole: 'MANAGER'
            });

            if (response.data.success) {
                showMessage('success', response.data.message);
                fetchPayslipsOnHold();
            } else {
                showMessage('error', response.data.message);
            }
        } catch (error) {
            console.error('Error releasing payment hold:', error);
            showMessage('error', error.response?.data?.message || 'Failed to release payment hold');
        } finally {
            setLoading(false);
        }
    };

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    };

    const getEmployeeName = (employeeId) => {
        const employee = employees.find(emp => emp.id === employeeId);
        return employee ? employee.fullName : `Employee ID: ${employeeId}`;
    };

    const getEmployeeDepartment = (employeeId) => {
        const employee = employees.find(emp => emp.id === employeeId);
        return employee ? employee.department : 'N/A';
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const filteredHolds = payslipsOnHold.filter(hold => {
        const employeeName = getEmployeeName(hold.employeeId).toLowerCase();
        return employeeName.includes(searchTerm.toLowerCase());
    });

    return (
        <div className="manager-payment-holds-layout">
            <SidebarManager />
            <main className="manager-payment-holds-main">
                <div className="manager-payment-holds-header">
                    <h1><FaLock /> Payment Hold Management - Team Manager</h1>
                    <p>Manage payment holds for your team members</p>
                </div>

                {message.text && (
                    <div className={`message ${message.type}`}>
                        {message.text}
                    </div>
                )}

                <div className="manager-payment-holds-content">
                    {/* Place Hold Section */}
                    <div className="place-hold-card">
                        <div className="card-header">
                            <h2><FaPlus /> Place New Payment Hold</h2>
                        </div>
                        <form onSubmit={handlePlaceHold} className="place-hold-form">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label><FaUser /> Select Team Member</label>
                                    <select
                                        value={selectedEmployeeId}
                                        onChange={(e) => setSelectedEmployeeId(e.target.value)}
                                        required
                                    >
                                        <option value="">-- Select Team Member --</option>
                                        {employees.map((employee) => (
                                            <option key={employee.id} value={employee.id}>
                                                {employee.fullName} ({employee.department || 'N/A'})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label><FaCalendarAlt /> Hold Month</label>
                                    <select
                                        value={holdMonth}
                                        onChange={(e) => setHoldMonth(parseInt(e.target.value))}
                                        required
                                    >
                                        {months.map((month, index) => (
                                            <option key={index + 1} value={index + 1}>
                                                {month}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label><FaCalendarAlt /> Hold Year</label>
                                    <select
                                        value={holdYear}
                                        onChange={(e) => setHoldYear(parseInt(e.target.value))}
                                        required
                                    >
                                        {years.map(year => (
                                            <option key={year} value={year}>{year}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group full-width">
                                    <label>Hold Reason</label>
                                    <select
                                        value={holdReason}
                                        onChange={(e) => setHoldReason(e.target.value)}
                                        required
                                    >
                                        <option value="">-- Select Reason --</option>
                                        {holdReasons.map((reason) => (
                                            <option key={reason.value} value={reason.value}>
                                                {reason.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {holdReason === 'Other' && (
                                    <div className="form-group full-width">
                                        <label>Custom Reason</label>
                                        <input
                                            type="text"
                                            placeholder="Enter custom reason for payment hold..."
                                            value={customReason}
                                            onChange={(e) => setCustomReason(e.target.value)}
                                            required
                                            maxLength={200}
                                        />
                                        <small style={{ color: '#666', fontSize: '0.85rem', marginTop: '4px' }}>
                                            {customReason.length}/200 characters
                                        </small>
                                    </div>
                                )}
                            </div>

                            <button type="submit" className="place-hold-btn" disabled={loading}>
                                <FaLock />
                                {loading ? 'Placing Hold...' : 'Place Payment Hold'}
                            </button>
                        </form>
                    </div>

                    {/* Current Holds Section */}
                    <div className="current-holds-card">
                        <div className="card-header">
                            <h2><FaList /> Team Payment Holds ({payslipsOnHold.length})</h2>
                            <div className="search-box">
                                <FaSearch />
                                <input
                                    type="text"
                                    placeholder="Search by team member name..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        {loadingHolds ? (
                            <div className="loading-state">
                                <div className="spinner"></div>
                                <p>Loading payment holds...</p>
                            </div>
                        ) : filteredHolds.length === 0 ? (
                            <div className="empty-state">
                                <FaLock className="empty-icon" />
                                <h3>No Active Payment Holds</h3>
                                <p>{searchTerm ? 'No holds match your search criteria.' : 'There are currently no payment holds for your team members.'}</p>
                            </div>
                        ) : (
                            <div className="holds-table-container">
                                <table className="holds-table">
                                    <thead>
                                        <tr>
                                            <th>Team Member Details</th>
                                            <th>Department</th>
                                            <th>Hold Period</th>
                                            <th>Reason</th>
                                            <th>Hold Date</th>
                                            <th>Net Pay</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredHolds.map((payslip) => (
                                            <tr key={payslip.payslipId}>
                                                <td>
                                                    <div className="employee-info">
                                                        <strong>{getEmployeeName(payslip.employeeId)}</strong>
                                                        <small>ID: {payslip.employeeId}</small>
                                                    </div>
                                                </td>
                                                <td>{getEmployeeDepartment(payslip.employeeId)}</td>
                                                <td>
                                                    <div className="hold-period">
                                                        <FaCalendarAlt />
                                                        {payslip.month && payslip.year ? 
                                                            `${payslip.month} ${payslip.year}` : 
                                                            'Current Period'
                                                        }
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="hold-reason-badge">
                                                        {payslip.holdReason || 'No reason provided'}
                                                    </span>
                                                </td>
                                                <td>{formatDate(payslip.holdDate)}</td>
                                                <td className="salary-amount">
                                                    ₹{payslip.netPay?.toLocaleString() || '0'}
                                                </td>
                                                <td>
                                                    <button
                                                        onClick={() => handleReleaseHold(payslip.employeeId)}
                                                        className="release-btn"
                                                        disabled={loading}
                                                        title="Release payment hold"
                                                    >
                                                        <FaUnlock />
                                                        Release
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </main>
            
            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, employeeId: null, employeeName: '' })}
                onConfirm={confirmReleaseHold}
                title="Release Payment Hold"
                message={`Are you sure you want to release the payment hold for ${confirmModal.employeeName}? This action cannot be undone.`}
                confirmText="Release Hold"
                cancelText="Cancel"
                type="warning"
            />
        </div>
    );
};

export default ManagerPaymentHolds;
