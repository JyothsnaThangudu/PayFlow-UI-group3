import React, { useState, useEffect } from 'react';
import axios from '../utils/axios';
import './PaymentHoldManagement.css';

const PaymentHoldManagement = () => {
    const [employees, setEmployees] = useState([]);
    const [payrollsOnHold, setPayrollsOnHold] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [holdReason, setHoldReason] = useState('');
    const [customReason, setCustomReason] = useState('');
    const [holdMonth, setHoldMonth] = useState(new Date().getMonth() + 1); // Current month
    const [holdYear, setHoldYear] = useState(new Date().getFullYear()); // Current year
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
        fetchCurrentUser();
        fetchEmployees();
        fetchPayrollsOnHold();
    }, []);

    const fetchCurrentUser = () => {
        // Get current user from localStorage or context
        let userData = {};
        try {
            userData = JSON.parse(localStorage.getItem('user') || '{}');
        } catch (error) {
            console.error('Error parsing user data from localStorage:', error);
            userData = {};
        }
        
        const userEmail = localStorage.getItem('userEmail');
        const employeeId = localStorage.getItem('employeeId');
        
        // If no user data, create a default user object
        if (!userData.id) {
            userData.id = employeeId ? parseInt(employeeId) : 1; // Use employeeId or default to 1
            userData.role = 'ADMIN'; // Default role
            userData.email = userEmail || 'admin@payflow.com';
            userData.name = 'System Admin';
            
            // Store the updated user data back to localStorage
            localStorage.setItem('user', JSON.stringify(userData));
        }
        
        console.log('Current user data:', userData);
        console.log('LocalStorage user:', localStorage.getItem('user'));
        console.log('LocalStorage userEmail:', localStorage.getItem('userEmail'));
        console.log('LocalStorage employeeId:', localStorage.getItem('employeeId'));
        
        setCurrentUser(userData);
        
        // Clear any previous error messages once user is loaded
        if (userData && userData.id) {
            setMessage({ type: '', text: '' });
        }
    };

    const fetchEmployees = async () => {
        try {
            console.log('DEBUG: Fetching employees with payslips...');
            const response = await axios.get('/api/payslip/employees');
            console.log('DEBUG: Employees with payslips response:', response.data);
            setEmployees(response.data);
            console.log('DEBUG: Set employees state to:', response.data.length, 'employees');
        } catch (error) {
            console.error('Error fetching employees with payslips:', error);
            showMessage('error', 'Failed to fetch employees with payslips');
        }
    };

    const fetchPayrollsOnHold = async () => {
        try {
            console.log('DEBUG: Fetching payslips on hold...');
            const response = await axios.get('/api/payment-hold/list');
            console.log('DEBUG: Payslips on hold response:', response.data);
            setPayrollsOnHold(response.data || []);
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

        // Use custom reason if "Custom" is selected
        const finalReason = holdReason === 'Custom' ? customReason.trim() : holdReason;
        if (!finalReason) {
            showMessage('error', 'Please provide a hold reason');
            return;
        }

        setLoading(true);
        try {
            // Ensure we have user data, with more robust checking
            let userForRequest = currentUser;
            if (!userForRequest || !userForRequest.id) {
                // Last resort fallback
                userForRequest = {
                    id: 1,
                    role: 'ADMIN',
                    email: 'admin@payflow.com',
                    name: 'System Admin'
                };
                console.log('Using fallback user for payment hold:', userForRequest);
            }

            console.log('Placing payment hold with user:', userForRequest);
            console.log('Hold details:', {
                employeeId: selectedEmployee,
                holdReason: finalReason,
                holdMonth: holdMonth,
                holdYear: holdYear
            });
            console.log('Selected employee from state:', selectedEmployee);
            console.log('Selected employee type:', typeof selectedEmployee);

            const response = await axios.post('/api/payment-hold/place', {
                employeeId: selectedEmployee,
                holdReason: finalReason,
                holdByUserId: userForRequest.id,
                holdByUserRole: userForRequest.role || 'ADMIN',
                holdMonth: holdMonth,
                holdYear: holdYear
            });

            if (response.data.success) {
                showMessage('success', response.data.message);
                setSelectedEmployee('');
                setHoldReason('');
                setCustomReason('');
                setHoldMonth(new Date().getMonth() + 1);
                setHoldYear(new Date().getFullYear());
                fetchPayrollsOnHold(); // Refresh the holds list
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
            const response = await axios.post('/api/payment-hold/release', {
                employeeId: employeeId,
                releasedByUserId: currentUser.id,
                releasedByUserRole: currentUser.role || 'HR'
            });

            if (response.data.success) {
                showMessage('success', response.data.message);
                fetchPayrollsOnHold(); // Refresh the holds list
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

    return (
        <div className="payment-hold-management">
            <div className="page-header">
                <h1>Payment Hold Management</h1>
                <p>Manage employee payment holds</p>
            </div>

            {message.text && (
                <div className={`message ${message.type}`}>
                    {message.text}
                </div>
            )}

            <div className="hold-management-content">
                {/* Place Hold Section */}
                <div className="place-hold-section">
                    <h2>Place Payment Hold</h2>
                    <form onSubmit={placePaymentHold} className="place-hold-form">
                        <div className="form-group">
                            <label htmlFor="employee">Select Employee:</label>
                            <select
                                id="employee"
                                value={selectedEmployee}
                                onChange={(e) => {
                                    const selectedId = e.target.value;
                                    console.log('Employee dropdown changed:', selectedId);
                                    console.log('Employee list:', employees);
                                    const selectedEmp = employees.find(emp => emp.id.toString() === selectedId);
                                    console.log('Selected employee:', selectedEmp);
                                    setSelectedEmployee(selectedId);
                                }}
                                required
                            >
                                <option value="">Choose an employee...</option>
                                {employees.map(employee => (
                                    <option key={employee.id} value={employee.id}>
                                        {employee.fullName} - {employee.department}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="holdMonth">Hold Month:</label>
                                <select
                                    id="holdMonth"
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
                                <label htmlFor="holdYear">Hold Year:</label>
                                <select
                                    id="holdYear"
                                    value={holdYear}
                                    onChange={(e) => setHoldYear(parseInt(e.target.value))}
                                    required
                                >
                                    {[2024, 2025, 2026].map(year => (
                                        <option key={year} value={year}>
                                            {year}
                                        </option>
                                    ))}
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
                    <h2>Current Payment Holds ({payrollsOnHold.length})</h2>
                    
                    {payrollsOnHold.length === 0 ? (
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
                                        <th>Net Salary</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payrollsOnHold.map((payslip) => (
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
    );
};

export default PaymentHoldManagement;
