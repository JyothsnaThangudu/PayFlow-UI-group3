import React, { useState, useEffect } from 'react';
import axios from '../utils/axios';
import './PaymentHoldModal.css';

const PaymentHoldModal = ({ isOpen, onClose, userRole = 'ADMIN', managerId = null }) => {
    const [employees, setEmployees] = useState([]);
    const [payslipsOnHold, setPayslipsOnHold] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [holdReason, setHoldReason] = useState('');
    const [customReason, setCustomReason] = useState('');
    const [holdMonth, setHoldMonth] = useState(new Date().getMonth() + 1);
    const [holdYear, setHoldYear] = useState(new Date().getFullYear());
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [currentUser, setCurrentUser] = useState(null);

    const holdReasons = [
        { value: '', label: 'Select a reason...' },
        { category: 'Administrative', options: [
            { value: 'Pending Documentation', label: 'Pending Documentation - Missing or incomplete documents' },
            { value: 'Background Verification', label: 'Background Verification - Pending background check' },
            { value: 'Compliance Review', label: 'Compliance Review - Regulatory compliance issues' },
            { value: 'Data Verification', label: 'Data Verification - Employee information needs verification' }
        ]},
        { category: 'Performance & Disciplinary', options: [
            { value: 'Performance Review', label: 'Performance Review - Under performance improvement plan' },
            { value: 'Disciplinary Action', label: 'Disciplinary Action - Pending investigation' },
            { value: 'Attendance Issues', label: 'Attendance Issues - Excessive absenteeism' },
            { value: 'Policy Violation', label: 'Policy Violation - Breach of company policies' }
        ]},
        { category: 'Financial & Legal', options: [
            { value: 'Legal Issues', label: 'Legal Issues - Court orders or legal proceedings' },
            { value: 'Overpayment Recovery', label: 'Overpayment Recovery - Previous overpayment recovery' },
            { value: 'Expense Reconciliation', label: 'Expense Reconciliation - Outstanding expenses' },
            { value: 'Tax Issues', label: 'Tax Issues - Tax compliance problems' }
        ]},
        { category: 'Operational', options: [
            { value: 'Manager Approval Pending', label: 'Manager Approval Pending - Awaiting manager sign-off' },
            { value: 'HR Review Required', label: 'HR Review Required - HR department review needed' },
            { value: 'Technical Issues', label: 'Technical Issues - Banking or payment processing problems' },
            { value: 'System Migration', label: 'System Migration - During payroll system changes' }
        ]},
        { category: 'Employee-Specific', options: [
            { value: 'Resignation Process', label: 'Resignation Process - Notice period with pending items' },
            { value: 'Medical Leave', label: 'Medical Leave - Coordination with insurance/benefits' },
            { value: 'Contract Issues', label: 'Contract Issues - Employment contract disputes' },
            { value: 'Training Completion', label: 'Training Completion - Mandatory training not completed' }
        ]},
        { value: 'Custom', label: 'Other - Custom reason' }
    ];

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    useEffect(() => {
        if (isOpen) {
            fetchCurrentUser();
            fetchEmployees();
            fetchPayslipsOnHold();
        }
    }, [isOpen]);

    const fetchCurrentUser = () => {
        let userData = {};
        try {
            userData = JSON.parse(localStorage.getItem('user') || '{}');
        } catch (error) {
            console.error('Error parsing user data from localStorage:', error);
            userData = {};
        }
        
        const userEmail = localStorage.getItem('userEmail');
        const employeeId = localStorage.getItem('employeeId');
        
        if (!userData.id) {
            userData.id = employeeId ? parseInt(employeeId) : 1;
            userData.role = userRole;
            userData.email = userEmail || 'admin@payflow.com';
            userData.name = userRole === 'MANAGER' ? 'Manager' : userRole === 'HR' ? 'HR Staff' : 'System Admin';
            
            localStorage.setItem('user', JSON.stringify(userData));
        }
        
        setCurrentUser(userData);
    };

    const fetchEmployees = async () => {
        try {
            console.log('DEBUG: Fetching employees with payslips...');
            const response = await axios.get('/api/payslip/employees');
            console.log('DEBUG: Employees with payslips response:', response.data);
            
            // If manager role, filter to only their team members
            let filteredEmployees = response.data;
            if (userRole === 'MANAGER' && managerId) {
                filteredEmployees = response.data.filter(emp => emp.managerId === managerId);
            }
            
            setEmployees(filteredEmployees);
            console.log('DEBUG: Set employees state to:', filteredEmployees.length, 'employees');
        } catch (error) {
            console.error('Error fetching employees with payslips:', error);
            showMessage('error', 'Failed to fetch employees with payslips');
        }
    };

    const fetchPayslipsOnHold = async () => {
        try {
            console.log('DEBUG: Fetching payslips on hold...');
            const response = await axios.get('/api/payment-hold/list');
            console.log('DEBUG: Payslips on hold response:', response.data);
            
            // If manager role, filter to only their team members
            let filteredPayslips = response.data || [];
            if (userRole === 'MANAGER' && managerId) {
                const teamEmployeeIds = employees.map(emp => emp.id);
                filteredPayslips = (response.data || []).filter(payslip => teamEmployeeIds.includes(payslip.employeeId));
            }
            
            setPayslipsOnHold(filteredPayslips);
        } catch (error) {
            console.error('Error fetching payslips on hold:', error);
        }
    };

    const placePaymentHold = async (e) => {
        e.preventDefault();
        if (!selectedEmployee || !holdReason) {
            showMessage('error', 'Please select an employee and provide a hold reason');
            return;
        }

        const finalReason = holdReason === 'Custom' ? customReason.trim() : holdReason;
        if (!finalReason) {
            showMessage('error', 'Please provide a hold reason');
            return;
        }

        setLoading(true);
        try {
            let userForRequest = currentUser;
            if (!userForRequest || !userForRequest.id) {
                userForRequest = {
                    id: managerId || 1,
                    role: userRole,
                    email: `${userRole.toLowerCase()}@payflow.com`,
                    name: `${userRole} User`
                };
            }

            const response = await axios.post('/api/payment-hold/place', {
                employeeId: selectedEmployee,
                holdReason: finalReason,
                holdByUserId: userForRequest.id,
                holdByUserRole: userRole,
                holdMonth: holdMonth,
                holdYear: holdYear
            });

            if (response.data.success) {
                showMessage('success', response.data.message);
                // Reset form
                setSelectedEmployee('');
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

    const releasePaymentHold = async (employeeId) => {
        if (!window.confirm('Are you sure you want to release this payment hold?')) {
            return;
        }

        setLoading(true);
        try {
            let userForRequest = currentUser;
            if (!userForRequest || !userForRequest.id) {
                userForRequest = {
                    id: managerId || 1,
                    role: userRole,
                    email: `${userRole.toLowerCase()}@payflow.com`,
                    name: `${userRole} User`
                };
            }

            const response = await axios.post('/api/payment-hold/release', {
                employeeId: employeeId,
                releasedByUserId: userForRequest.id,
                releasedByUserRole: userRole
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
        return employee ? employee.department : null;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (!isOpen) return null;

    const getRoleTitle = (role) => {
        switch(role) {
            case 'ADMIN': return 'Payment Hold Management - Administrator';
            case 'HR': return 'Payment Hold Management - HR Department';
            case 'MANAGER': return 'Payment Hold Management - Team Manager';
            default: return 'Payment Hold Management';
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="payment-hold-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{getRoleTitle(userRole)}</h2>
                    <button className="modal-close-btn" onClick={onClose}>×</button>
                </div>

                <div className="modal-content">
                    {message.text && (
                        <div className={`message ${message.type}`}>
                            {message.text}
                        </div>
                    )}

                    {/* Place Hold Form */}
                    <div className="place-hold-section">
                        <h3>Place Payment Hold</h3>
                        <form onSubmit={placePaymentHold} className="hold-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="employee">Select Employee:</label>
                                    <select
                                        id="employee"
                                        value={selectedEmployee}
                                        onChange={(e) => setSelectedEmployee(e.target.value)}
                                        required
                                    >
                                        <option value="">-- Select Employee --</option>
                                        {employees.map((employee) => (
                                            <option key={employee.id} value={employee.id}>
                                                {employee.fullName} ({employee.department || 'N/A'})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="month">Hold Month:</label>
                                    <select
                                        id="month"
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
                                    <label htmlFor="year">Hold Year:</label>
                                    <select
                                        id="year"
                                        value={holdYear}
                                        onChange={(e) => setHoldYear(parseInt(e.target.value))}
                                        required
                                    >
                                        <option value={2024}>2024</option>
                                        <option value={2025}>2025</option>
                                        <option value={2026}>2026</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="holdReason">Hold Reason:</label>
                                <select
                                    id="holdReason"
                                    value={holdReason}
                                    onChange={(e) => setHoldReason(e.target.value)}
                                    required
                                >
                                    {holdReasons.map((item, index) => {
                                        if (item.category) {
                                            return (
                                                <optgroup key={index} label={item.category}>
                                                    {item.options.map((option, optIndex) => (
                                                        <option key={optIndex} value={option.value}>
                                                            {option.label}
                                                        </option>
                                                    ))}
                                                </optgroup>
                                            );
                                        } else {
                                            return (
                                                <option key={index} value={item.value}>
                                                    {item.label}
                                                </option>
                                            );
                                        }
                                    })}
                                </select>
                            </div>

                            {holdReason === 'Custom' && (
                                <div className="form-group">
                                    <label htmlFor="customReason">Custom Reason:</label>
                                    <textarea
                                        id="customReason"
                                        value={customReason}
                                        onChange={(e) => setCustomReason(e.target.value)}
                                        placeholder="Enter custom hold reason..."
                                        rows="3"
                                        required
                                    />
                                </div>
                            )}

                            <button
                                type="submit"
                                className="place-hold-btn"
                                disabled={loading}
                            >
                                {loading ? 'Placing Hold...' : 'Place Payment Hold'}
                            </button>
                        </form>
                    </div>

                    {/* Current Holds Section */}
                    <div className="current-holds-section">
                        <h3>Current Payment Holds ({payslipsOnHold.length})</h3>
                        
                        {payslipsOnHold.length === 0 ? (
                            <div className="no-holds-message">
                                <p>No payment holds currently active.</p>
                            </div>
                        ) : (
                            <div className="holds-table-container">
                                <table className="holds-table">
                                    <thead>
                                        <tr>
                                            <th>Employee</th>
                                            <th>Department</th>
                                            <th>Hold Period</th>
                                            <th>Hold Reason</th>
                                            <th>Hold Date</th>
                                            <th>Hold By</th>
                                            <th>Net Pay</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payslipsOnHold.map((payslip) => (
                                            <tr key={payslip.payslipId}>
                                                <td>
                                                    <div className="employee-info">
                                                        <strong>{getEmployeeName(payslip.employeeId)}</strong>
                                                        <small>ID: {payslip.employeeId}</small>
                                                    </div>
                                                </td>
                                                <td>{getEmployeeDepartment(payslip.employeeId) || 'N/A'}</td>
                                                <td>
                                                    <div className="hold-period">
                                                        {payslip.month && payslip.year ? 
                                                            `${payslip.month} ${payslip.year}` : 
                                                            'Current Period'
                                                        }
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="hold-reason">
                                                        {payslip.holdReason || 'No reason provided'}
                                                    </div>
                                                </td>
                                                <td>{formatDate(payslip.holdDate)}</td>
                                                <td>
                                                    <span className="hold-by-badge">
                                                        {payslip.holdByUserRole || 'HR'}
                                                    </span>
                                                </td>
                                                <td className="salary-amount">
                                                    ₹{payslip.netPay?.toLocaleString() || '0'}
                                                </td>
                                                <td>
                                                    <button
                                                        onClick={() => releasePaymentHold(payslip.employeeId)}
                                                        className="release-hold-btn"
                                                        disabled={loading}
                                                    >
                                                        Release Hold
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
            </div>
        </div>
    );
};

export default PaymentHoldModal;
