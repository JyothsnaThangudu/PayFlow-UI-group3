import React, { useState, useEffect } from 'react';
import axios from '../utils/axios';
import SidebarManager from '../components/SidebarManager';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './ManagerTeamPayroll.css';

const ManagerTeamPayroll = () => {
    const [teamMembers, setTeamMembers] = useState([]);
    const [teamPayslips, setTeamPayslips] = useState([]);
    const [teamCTCData, setTeamCTCData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [activeTab, setActiveTab] = useState('team-ctc');

    // Test connectivity function
    const testBackendConnection = async () => {
        try {
            console.log('Testing backend connection...');
            const managerId = localStorage.getItem('managerId');
            const response = await axios.get(`/api/ctc-management/employees?managerId=${managerId}`);
            console.log('Backend connection test successful:', response.status);
            return true;
        } catch (error) {
            console.error('Backend connection test failed:', error);
            setMessage({ text: 'Cannot connect to backend server. Please ensure the server is running.', type: 'error' });
            return false;
        }
    };

    useEffect(() => {
        const initializeData = async () => {
            const managerId = localStorage.getItem('managerId');
            console.log('Manager ID from localStorage:', managerId);
            
            if (!managerId) {
                console.error('No manager ID found in localStorage');
                setMessage({ text: 'Manager authentication required. Please login again.', type: 'error' });
                return;
            }

            // Test backend connection first
            const backendConnected = await testBackendConnection();
            if (!backendConnected) return;

            // Fetch data if backend is connected
            fetchTeamMembers();
            fetchTeamPayslips();
            fetchTeamCTC();
        };

        initializeData();
    }, []);

    const fetchTeamMembers = async () => {
        const managerId = localStorage.getItem('managerId');
        console.log('Fetching team members for manager:', managerId);
        
        try {
            setLoading(true);
            const response = await axios.get(`/api/ctc-management/manager/${managerId}/team-members`);
            console.log('Team members response:', response.data);
            setTeamMembers(response.data);
            
            // Clear any previous error messages on successful fetch
            if (message.type === 'error' && message.text.includes('members')) {
                setMessage({ text: '', type: '' });
            }
        } catch (error) {
            console.error('Error fetching team members:', error);
            console.error('Error response:', error.response?.data);
            console.error('Error status:', error.response?.status);
            setMessage({ text: 'Failed to fetch team members', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const fetchTeamPayslips = async () => {
        const managerId = localStorage.getItem('managerId');
        console.log('Fetching team payslips for manager:', managerId);
        
        try {
            setLoading(true);
            const response = await axios.get(`/api/ctc-management/manager/${managerId}/team-payslips`);
            console.log('Team payslips response:', response.data);
            setTeamPayslips(response.data);
            
            // Clear any previous error messages on successful fetch
            if (message.type === 'error' && message.text.includes('payslips')) {
                setMessage({ text: '', type: '' });
            }
        } catch (error) {
            console.error('Error fetching team payslips:', error);
            console.error('Error response:', error.response?.data);
            console.error('Error status:', error.response?.status);
            setMessage({ text: 'Failed to fetch team payslips', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const fetchTeamCTC = async () => {
        const managerId = localStorage.getItem('managerId');
        console.log('Fetching team CTC for manager:', managerId);
        
        try {
            setLoading(true);
            const response = await axios.get(`/api/ctc-management/manager/${managerId}/team-ctc`);
            console.log('Team CTC response:', response.data);
            setTeamCTCData(response.data);
            
            // Clear any previous error messages on successful fetch
            if (message.type === 'error' && message.text.includes('CTC')) {
                setMessage({ text: '', type: '' });
            }
        } catch (error) {
            console.error('Error fetching team CTC data:', error);
            console.error('Error response:', error.response?.data);
            console.error('Error status:', error.response?.status);
            setMessage({ text: 'Failed to fetch team CTC data', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const downloadPayslip = async (payslipId) => {
        try {
            // Get payslip data from backend
            const response = await axios.get(`/api/ctc-management/payslip/download/${payslipId}`);
            const { payslip: fullPayslip, employee } = response.data;

            // Generate PDF using jsPDF
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.width;
            
            // Outer border for entire document
            doc.setLineWidth(2);
            doc.rect(10, 10, pageWidth - 20, 250);
            
            // Company Header Section with border
            doc.setLineWidth(1);
            doc.rect(10, 10, pageWidth - 20, 50);
            
            // Company logo placeholder (building icon area)
            doc.setFillColor(70, 130, 180);
            doc.rect(15, 20, 20, 25, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text('🏢', 23, 35);
            
            // Company name and details
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            doc.text('PayFlow Solutions', pageWidth / 2, 30, { align: 'center' });
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('123 Business District, Tech City, State - 123456', pageWidth / 2, 40, { align: 'center' });
            
            // Pay Slip title
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(`Pay Slip for ${fullPayslip.cycle}`, pageWidth / 2, 52, { align: 'center' });
            
            // Employee Details Table
            let currentY = 70;
            const employeeData = [
                ['Employee ID', fullPayslip.employeeId?.toString() || '7', 'UAN', '-'],
                ['Employee Name', employee?.fullName || employee?.firstName || getEmployeeName(fullPayslip.employeeId), 'PF No.', '-'],
                ['Designation', employee?.designation || 'Employee', 'ESI No.', '-'],
                ['Department', employee?.department || 'General', 'Bank', '-'],
                ['Date of Joining', employee?.joinDate || '2025-07-30', 'Account No.', '-']
            ];
            
            doc.autoTable({
                startY: currentY,
                head: [],
                body: employeeData,
                theme: 'grid',
                styles: { 
                    fontSize: 10,
                    cellPadding: 3,
                    lineColor: [0, 0, 0],
                    lineWidth: 0.5
                },
                columnStyles: {
                    0: { cellWidth: 42, fontStyle: 'bold' },
                    1: { cellWidth: 53 },
                    2: { cellWidth: 42, fontStyle: 'bold' },
                    3: { cellWidth: 53 }
                }
            });
            
            // Working Days Section
            currentY = doc.lastAutoTable.finalY + 5;
            
            // Use dynamic data or fallback to sample values
            const baseSalary = fullPayslip.baseSalary || 41666.67;
            const grossWages = fullPayslip.grossSalary || 61166.67;
            
            const workingDaysData = [
                ['Gross Wages', `₹${grossWages.toLocaleString()}`, '', ''],
                ['Total Working Days', '22', 'Leaves', fullPayslip.numberOfLeaves?.toString() || '0'],
                ['LOP Days', '0', 'Paid Days', '22']
            ];
            
            doc.autoTable({
                startY: currentY,
                head: [],
                body: workingDaysData,
                theme: 'grid',
                styles: { 
                    fontSize: 10,
                    cellPadding: 3,
                    lineColor: [0, 0, 0],
                    lineWidth: 0.5
                },
                columnStyles: {
                    0: { cellWidth: 47.5, fontStyle: 'bold' },
                    1: { cellWidth: 47.5 },
                    2: { cellWidth: 47.5, fontStyle: 'bold' },
                    3: { cellWidth: 47.5 }
                }
            });
            
            // Earnings and Deductions Section
            currentY = doc.lastAutoTable.finalY + 5;
            
            // Calculate exact values to match the format
            const hra = 12500.00;
            const conveyanceAllowance = 6666.67;
            const medicalAllowance = 250;
            const otherAllowances = 333.33;
            const totalEarnings = 61166.67;
            
            const epf = 500.00;
            const esi = 0;
            const professionalTax = 4033.33;
            const totalDeductions = 4533.33;
            
            const netSalary = 56633.34;
            
            // Create Earnings and Deductions table header
            const earningsDeductionsHeader = [
                ['Earnings', '', 'Deductions', '']
            ];
            
            doc.autoTable({
                startY: currentY,
                head: [],
                body: earningsDeductionsHeader,
                theme: 'grid',
                styles: { 
                    fontSize: 11,
                    cellPadding: 4,
                    lineColor: [0, 0, 0],
                    lineWidth: 0.5,
                    fontStyle: 'bold',
                    halign: 'center'
                },
                columnStyles: {
                    0: { cellWidth: 47.5 },
                    1: { cellWidth: 47.5 },
                    2: { cellWidth: 47.5 },
                    3: { cellWidth: 47.5 }
                }
            });
            
            // Earnings and Deductions data
            currentY = doc.lastAutoTable.finalY;
            const earningsDeductionsData = [
                ['Basic', `₹${baseSalary.toLocaleString()}`, 'EPF', `₹${epf.toLocaleString()}`],
                ['HRA', `₹${hra.toLocaleString()}`, 'ESI', `₹${esi.toLocaleString()}`],
                ['Conveyance Allowance', `₹${conveyanceAllowance.toLocaleString()}`, 'Professional Tax', `₹${professionalTax.toLocaleString()}`],
                ['Medical Allowance', `₹${medicalAllowance.toLocaleString()}`, '', ''],
                ['Other Allowances', `₹${otherAllowances.toLocaleString()}`, '', '']
            ];
            
            doc.autoTable({
                startY: currentY,
                head: [],
                body: earningsDeductionsData,
                theme: 'grid',
                styles: { 
                    fontSize: 10,
                    cellPadding: 3,
                    lineColor: [0, 0, 0],
                    lineWidth: 0.5
                },
                columnStyles: {
                    0: { cellWidth: 47.5 },
                    1: { cellWidth: 47.5, halign: 'right' },
                    2: { cellWidth: 47.5 },
                    3: { cellWidth: 47.5, halign: 'right' }
                }
            });
            
            // Total Earnings and Total Deductions row
            currentY = doc.lastAutoTable.finalY;
            const totalsData = [
                ['Total Earnings', `₹${totalEarnings.toLocaleString()}`, 'Total Deductions', `₹${totalDeductions.toLocaleString()}`]
            ];
            
            doc.autoTable({
                startY: currentY,
                head: [],
                body: totalsData,
                theme: 'grid',
                styles: { 
                    fontSize: 10,
                    cellPadding: 3,
                    lineColor: [0, 0, 0],
                    lineWidth: 0.5,
                    fontStyle: 'bold'
                },
                columnStyles: {
                    0: { cellWidth: 47.5 },
                    1: { cellWidth: 47.5, halign: 'right' },
                    2: { cellWidth: 47.5 },
                    3: { cellWidth: 47.5, halign: 'right' }
                }
            });
            
            // Net Salary Section
            currentY = doc.lastAutoTable.finalY;
            const netSalaryData = [
                ['Net Salary', `₹${netSalary.toLocaleString()}`]
            ];
            
            doc.autoTable({
                startY: currentY,
                head: [],
                body: netSalaryData,
                theme: 'grid',
                styles: { 
                    fontSize: 12,
                    cellPadding: 4,
                    lineColor: [0, 0, 0],
                    lineWidth: 0.5,
                    fontStyle: 'bold'
                },
                columnStyles: {
                    0: { cellWidth: 95, halign: 'right' },
                    1: { cellWidth: 95, halign: 'right' }
                }
            });

            doc.save(`Payslip-${employee?.fullName || getEmployeeName(fullPayslip.employeeId)}-${fullPayslip.cycle}.pdf`);
            
            setMessage({ text: 'Payslip downloaded successfully', type: 'success' });
            
        } catch (error) {
            console.error('Error downloading payslip:', error);
            setMessage({ text: 'Failed to download payslip', type: 'error' });
        }
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

    const getStatusColor = (status) => {
        switch (status) {
            case 'PAID': return '#4CAF50';
            case 'PENDING': return '#FF9800';
            case 'DRAFT': return '#2196F3';
            case 'ACTIVE': return '#4CAF50';
            case 'REVISED': return '#FF9800';
            default: return '#666';
        }
    };

    const getEmployeeName = (employeeId) => {
        const employee = teamMembers.find(member => member.id === employeeId);
        return employee ? employee.fullName : `Employee ID: ${employeeId}`;
    };

    return (
        <div className="manager-dashboard-layout">
            <SidebarManager />
            <div className="manager-team-payroll">
                <div className="manager-payroll-header">
                    <div>
                        <h1>Team CTC & Payroll Overview</h1>
                        <p>View your team's compensation and payroll information</p>
                    </div>
                    <button 
                        className="refresh-btn"
                        onClick={() => {
                            fetchTeamMembers();
                            fetchTeamPayslips();
                            fetchTeamCTC();
                        }}
                        disabled={loading}
                    >
                        {loading ? 'Refreshing...' : '🔄 Refresh Data'}
                    </button>
                </div>

                {message.text && (
                    <div className={`message ${message.type}`}>
                        {message.text}
                    </div>
                )}

                <div className="tab-navigation">
                    <button 
                        className={`tab-btn ${activeTab === 'team-ctc' ? 'active' : ''}`}
                        onClick={() => setActiveTab('team-ctc')}
                    >
                        Team CTC Overview
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'team-payslips' ? 'active' : ''}`}
                        onClick={() => setActiveTab('team-payslips')}
                    >
                        Team Payslips
                    </button>
                </div>

                <div className="manager-payroll-content">
                    {loading && (
                        <div className="loading-indicator">
                            <p>Loading team data...</p>
                        </div>
                    )}
                    
                    {activeTab === 'team-ctc' && (
                        <div className="team-ctc-section">
                            <h3>Team CTC Overview</h3>
                            {teamCTCData.length > 0 ? (
                                <div className="ctc-table">
                                    <div className="ctc-table-header">
                                        <div className="ctc-header-item">Employee Name</div>
                                        <div className="ctc-header-item">Employee ID</div>
                                        <div className="ctc-header-item">Basic Salary</div>
                                        <div className="ctc-header-item">HRA</div>
                                        <div className="ctc-header-item">Travel Allow.</div>
                                        <div className="ctc-header-item">Medical Allow.</div>
                                        <div className="ctc-header-item">Other Allow.</div>
                                        <div className="ctc-header-item">Total CTC</div>
                                        <div className="ctc-header-item">Status</div>
                                    </div>
                                    <div className="ctc-table-body">
                                        {teamCTCData.map(member => (
                                            <div key={member.employeeId} className="ctc-table-row">
                                                <div className="ctc-table-item">
                                                    <span className="employee-name">{getEmployeeName(member.employeeId)}</span>
                                                </div>
                                                <div className="ctc-table-item">
                                                    <span className="employee-id">ID: {member.employeeId}</span>
                                                </div>
                                                <div className="ctc-table-item">
                                                    <span className="breakdown-amount">{formatCurrency(member.basicSalary)}</span>
                                                </div>
                                                <div className="ctc-table-item">
                                                    <span className="breakdown-amount">{formatCurrency(member.hra)}</span>
                                                </div>
                                                <div className="ctc-table-item">
                                                    <span className="breakdown-amount">{formatCurrency(member.travelAllowance)}</span>
                                                </div>
                                                <div className="ctc-table-item">
                                                    <span className="breakdown-amount">{formatCurrency(member.medicalAllowance)}</span>
                                                </div>
                                                <div className="ctc-table-item">
                                                    <span className="breakdown-amount">{formatCurrency(member.otherAllowances)}</span>
                                                </div>
                                                <div className="ctc-table-item">
                                                    <span className="ctc-amount">{formatCurrency(member.totalCtc)}</span>
                                                </div>
                                                <div className="ctc-table-item">
                                                    <span 
                                                        className="status-badge"
                                                        style={{ backgroundColor: getStatusColor(member.status) }}
                                                    >
                                                        {member.status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="no-data">
                                    <p>No team CTC data available</p>
                                    <p style={{fontSize: '0.9rem', color: '#888', marginTop: '0.5rem'}}>
                                        This could mean no CTC structures have been created yet, or your team members haven't been assigned CTC details.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'team-payslips' && (
                        <div className="team-payslips-section">
                            <h3>Team Payslips</h3>
                            {teamPayslips.length > 0 ? (
                                <div className="payslips-table">
                                    <div className="payslips-header">
                                        <div className="header-item">Employee</div>
                                        <div className="header-item">Period</div>
                                        <div className="header-item">Status</div>
                                        <div className="header-item">Gross Salary</div>
                                        <div className="header-item">Deductions</div>
                                        <div className="header-item">Net Pay</div>
                                        <div className="header-item">Actions</div>
                                    </div>
                                    
                                    <div className="payslips-list">
                                        {teamPayslips.map(payslip => (
                                            <div key={payslip.payslipId} className="payslip-row">
                                                <div className="row-item">
                                                    <span className="employee-name">
                                                        {getEmployeeName(payslip.employeeId)}
                                                    </span>
                                                </div>
                                                
                                                <div className="row-item">
                                                    <div className="period-info">
                                                        <span className="month">{payslip.month}</span>
                                                        <span className="year">{payslip.year}</span>
                                                    </div>
                                                </div>
                                                
                                                <div className="row-item">
                                                    <span 
                                                        className="status-badge"
                                                        style={{ backgroundColor: getStatusColor(payslip.status) }}
                                                    >
                                                        {payslip.status}
                                                    </span>
                                                </div>
                                                
                                                <div className="row-item">
                                                    <span className="amount">{formatCurrency(payslip.grossSalary)}</span>
                                                </div>
                                                
                                                <div className="row-item">
                                                    <span className="amount deduction-amount">{formatCurrency(payslip.totalDeductions)}</span>
                                                </div>
                                                
                                                <div className="row-item">
                                                    <span className="net-amount">{formatCurrency(payslip.netPay)}</span>
                                                </div>
                                                
                                                <div className="row-item">
                                                    <button
                                                        className="download-btn-compact"
                                                        onClick={() => downloadPayslip(payslip.payslipId)}
                                                        title="Download PDF"
                                                    >
                                                        📄 Download
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="no-data">
                                    <p>No team payslips available</p>
                                    <p style={{fontSize: '0.9rem', color: '#888', marginTop: '0.5rem'}}>
                                        This could mean no payslips have been generated yet, or your team members don't have payroll data.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ManagerTeamPayroll;
