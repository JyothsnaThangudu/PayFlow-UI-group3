import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import Sidebar from '../components/Sidebar';
import './AdminCTCStructures.css';

const HRCTCStructures = () => {
    const navigate = useNavigate();
    const [employees, setEmployees] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [ctcData, setCTCData] = useState({
        employeeId: '',
        effectiveFrom: '',
        basicSalary: '',
        hra: '',
        allowances: '',
        bonuses: '',
        pfContribution: '',
        gratuity: '',
        revisionReason: ''
    });
    const [ctcHistory, setCTCHistory] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            const response = await axios.get('/api/employee');
            setEmployees(response.data);
        } catch (error) {
            console.error('Error fetching employees:', error);
            showMessage('error', 'Failed to fetch employees');
        }
    };

    const fetchCTCHistory = async (employeeId) => {
        try {
            const response = await axios.get(`/api/ctc-management/ctc/history/${employeeId}`);
            setCTCHistory(response.data);
        } catch (error) {
            console.error('Error fetching CTC history:', error);
            setCTCHistory([]);
        }
    };

    const handleEmployeeSelect = (employeeId) => {
        setSelectedEmployee(employeeId);
        setCTCData({ ...ctcData, employeeId });
        if (employeeId) {
            fetchCTCHistory(employeeId);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCTCData({ ...ctcData, [name]: value });
    };

    const calculateTotalCTC = () => {
        const { basicSalary, hra, allowances, bonuses, pfContribution, gratuity } = ctcData;
        return (
            parseFloat(basicSalary || 0) +
            parseFloat(hra || 0) +
            parseFloat(allowances || 0) +
            parseFloat(bonuses || 0) +
            parseFloat(pfContribution || 0) +
            parseFloat(gratuity || 0)
        ).toFixed(2);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await axios.post('/api/ctc-management/ctc/add', ctcData);
            showMessage('success', 'CTC details added successfully');
            resetForm();
            if (selectedEmployee) {
                fetchCTCHistory(selectedEmployee);
            }
        } catch (error) {
            console.error('Error adding CTC:', error);
            showMessage('error', error.response?.data?.message || 'Failed to add CTC details');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setCTCData({
            employeeId: selectedEmployee,
            effectiveFrom: '',
            basicSalary: '',
            hra: '',
            allowances: '',
            bonuses: '',
            pfContribution: '',
            gratuity: '',
            revisionReason: ''
        });
        setShowModal(false);
    };

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    };

    const formatCurrency = (amount) => {
        // Handle null, undefined, empty string, or NaN values
        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || amount === null || amount === undefined || amount === '') {
            return '₹0.00';
        }
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(numericAmount);
    };

    return (
        <div className="admin-dashboard-layout">
            <Sidebar />
            <div className="ctc-management">
                <div className="ctc-header">
                    <h1>CTC Structures</h1>
                    <p>Manage employee compensation and salary structures</p>
                </div>

            {message.text && (
                <div className={`message ${message.type}`}>
                    {message.text}
                </div>
            )}

            <div className="ctc-content">
                {/* Employee Selection */}
                <div className="employee-selection">
                    <h3>Select Employee</h3>
                    <select
                        value={selectedEmployee}
                        onChange={(e) => handleEmployeeSelect(e.target.value)}
                        className="employee-select"
                    >
                        <option value="">Choose an employee...</option>
                        {employees.map(employee => (
                            <option key={employee.id} value={employee.id}>
                                {employee.fullName} - {employee.email}
                            </option>
                        ))}
                    </select>
                </div>

                {selectedEmployee && (
                    <>
                        {/* Add New CTC Button */}
                        <div className="action-buttons">
                            <button
                                className="btn-primary"
                                onClick={() => {
                                    const currentCTC = ctcHistory.length > 0 ? ctcHistory[0] : null;
                                    const queryParams = new URLSearchParams({
                                        employeeId: selectedEmployee,
                                        ...(currentCTC && { currentCTC: currentCTC.annualCtc || currentCTC.totalCtc })
                                    });
                                    navigate(`/hr-ctc-auto-calculator?${queryParams.toString()}`);
                                }}
                            >
                                Add New CTC Structure
                            </button>
                        </div>

                        {/* CTC History */}
                        <div className="ctc-history">
                            <h3>CTC History</h3>
                            {ctcHistory.length > 0 ? (
                                <div className="history-table">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Effective From</th>
                                                <th>Basic Salary</th>
                                                <th>HRA</th>
                                                <th>Allowances</th>
                                                <th>Total CTC</th>
                                                <th>Status</th>
                                                <th>Revision Reason</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {ctcHistory.map(ctc => (
                                                <tr key={ctc.ctcId}>
                                                    <td>{new Date(ctc.effectiveFrom).toLocaleDateString()}</td>
                                                    <td>{formatCurrency(ctc.basicSalary)}</td>
                                                    <td>{formatCurrency(ctc.hra)}</td>
                                                    <td>{formatCurrency(ctc.allowances)}</td>
                                                    <td className="total-ctc">{formatCurrency(ctc.totalCtc)}</td>
                                                    <td>
                                                        <span className={`status ${ctc.status.toLowerCase()}`}>
                                                            {ctc.status}
                                                        </span>
                                                    </td>
                                                    <td>{ctc.revisionReason || '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="no-data">
                                    <p>No CTC history found for this employee</p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Modal for Adding CTC */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3>Add New CTC Structure</h3>
                            <button
                                className="close-btn"
                                onClick={() => setShowModal(false)}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="ctc-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Effective From</label>
                                    <input
                                        type="date"
                                        name="effectiveFrom"
                                        value={ctcData.effectiveFrom}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Basic Salary</label>
                                    <input
                                        type="number"
                                        name="basicSalary"
                                        value={ctcData.basicSalary}
                                        onChange={handleInputChange}
                                        placeholder="0.00"
                                        step="0.01"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>HRA</label>
                                    <input
                                        type="number"
                                        name="hra"
                                        value={ctcData.hra}
                                        onChange={handleInputChange}
                                        placeholder="0.00"
                                        step="0.01"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Allowances</label>
                                    <input
                                        type="number"
                                        name="allowances"
                                        value={ctcData.allowances}
                                        onChange={handleInputChange}
                                        placeholder="0.00"
                                        step="0.01"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Bonuses</label>
                                    <input
                                        type="number"
                                        name="bonuses"
                                        value={ctcData.bonuses}
                                        onChange={handleInputChange}
                                        placeholder="0.00"
                                        step="0.01"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>PF Contribution</label>
                                    <input
                                        type="number"
                                        name="pfContribution"
                                        value={ctcData.pfContribution}
                                        onChange={handleInputChange}
                                        placeholder="0.00"
                                        step="0.01"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Gratuity</label>
                                    <input
                                        type="number"
                                        name="gratuity"
                                        value={ctcData.gratuity}
                                        onChange={handleInputChange}
                                        placeholder="0.00"
                                        step="0.01"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Total CTC (Calculated)</label>
                                    <input
                                        type="text"
                                        value={formatCurrency(calculateTotalCTC())}
                                        readOnly
                                        className="calculated-field"
                                    />
                                </div>
                            </div>

                            <div className="form-group full-width">
                                <label>Revision Reason</label>
                                <textarea
                                    name="revisionReason"
                                    value={ctcData.revisionReason}
                                    onChange={handleInputChange}
                                    placeholder="Reason for CTC revision..."
                                    rows="3"
                                />
                            </div>

                            <div className="form-actions">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={resetForm}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={loading}
                                >
                                    {loading ? 'Adding...' : 'Add CTC Structure'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            </div>
        </div>
    );
};

export default HRCTCStructures;
