import React, { useState, useEffect } from 'react';
import axios from '../utils/axios';
import SidebarAdmin from '../components/SidebarAdmin';
import PopupMessage from '../components/PopupMessage';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './DynamicPayslipGenerator.css';

const DynamicPayslipGenerator = () => {
    const [employees, setEmployees] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [payslipData, setPayslipData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [popup, setPopup] = useState({ show: false, type: '', message: '' });

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            const response = await axios.get('/api/employee');
            setEmployees(response.data);
        } catch (error) {
            console.error('Error fetching employees:', error);
            showPopup('error', 'Failed to fetch employees');
        }
    };

    const generatePayslip = async () => {
        if (!selectedEmployee || !selectedMonth || !selectedYear) {
            showPopup('error', 'Please select employee, month, and year');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.get('/api/payrolls/generate-payslip', {
                params: {
                    employeeId: selectedEmployee,
                    month: selectedMonth,
                    year: selectedYear
                }
            });
            setPayslipData(response.data);
            showPopup('success', 'Payslip generated successfully');
        } catch (error) {
            console.error('Error generating payslip:', error);
            showPopup('error', error.response?.data?.message || 'Failed to generate payslip');
            setPayslipData(null);
        } finally {
            setLoading(false);
        }
    };

    const downloadPDF = () => {
        if (!payslipData) return;

        const doc = new jsPDF();
        const { employee, period, salary, deductions, attendance, calculations } = payslipData;

        // Company Header
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('PayFlow Inc.', 20, 25);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('Salary Slip', 20, 35);

        // Employee Information
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Employee Information', 20, 55);
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(`Name: ${employee.name}`, 20, 70);
        doc.text(`Employee ID: ${employee.id}`, 20, 80);
        doc.text(`Position: ${employee.position}`, 20, 90);
        doc.text(`Period: ${period.month} ${period.year}`, 20, 100);

        // Attendance Information
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Attendance Details', 120, 55);
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(`Total Days in Month: ${attendance.totalDaysInMonth}`, 120, 70);
        doc.text(`Working Days: ${attendance.workingDays}`, 120, 80);
        doc.text(`Unpaid Leave Days: ${attendance.unpaidLeaveDays}`, 120, 90);
        doc.text(`Effective Working Days: ${attendance.effectiveWorkingDays}`, 120, 100);

        // Salary Details Table
        const salaryData = [
            ['Basic Salary', formatCurrency(salary.basicSalary)],
            ['HRA', formatCurrency(salary.hra)],
            ['Conveyance Allowance', formatCurrency(salary.conveyanceAllowance)],
            ['Medical Allowance', formatCurrency(salary.medicalAllowance)],
            ['Special Allowance', formatCurrency(salary.specialAllowance)],
            ['Performance Bonus', formatCurrency(salary.performanceBonus)],
            ['Gross Monthly Salary', formatCurrency(salary.grossMonthlySalary)]
        ];

        doc.autoTable({
            startY: 120,
            head: [['Earnings', 'Amount (₹)']],
            body: salaryData,
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185] },
            styles: { fontSize: 10 }
        });

        // Deductions Table
        const deductionData = [
            ['Employee PF', formatCurrency(deductions.employeePf)],
            ['Professional Tax', formatCurrency(deductions.professionalTax)],
            ['TDS', formatCurrency(deductions.tds)],
            ['Insurance Premium', formatCurrency(deductions.insurancePremium)],
            ['Total Deductions', formatCurrency(deductions.totalMonthlyDeductions)]
        ];

        const finalY = doc.lastAutoTable.finalY + 10;
        doc.autoTable({
            startY: finalY,
            head: [['Deductions', 'Amount (₹)']],
            body: deductionData,
            theme: 'grid',
            headStyles: { fillColor: [231, 76, 60] },
            styles: { fontSize: 10 }
        });

        // Final Calculations
        const calcY = doc.lastAutoTable.finalY + 15;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Final Calculations:', 20, calcY);
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(`Daily Net Salary: ${formatCurrency(calculations.dailyNetSalary)}`, 20, calcY + 15);
        doc.text(`Unpaid Leave Deduction: ${formatCurrency(calculations.unpaidLeaveDeduction)}`, 20, calcY + 25);
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`Final Net Salary: ${formatCurrency(calculations.finalNetSalary)}`, 20, calcY + 40);

        // Save PDF
        doc.save(`payslip_${employee.name}_${period.month}_${period.year}.pdf`);
    };

    const formatCurrency = (amount) => {
        if (!amount) return '₹0.00';
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    };

    const showPopup = (type, message) => {
        setPopup({ show: true, type, message });
    };

    const closePopup = () => {
        setPopup({ show: false, type: '', message: '' });
    };

    return (
        <div className="admin-dashboard-layout">
            <SidebarAdmin />
            <div className="payslip-generator">
                <div className="payslip-header">
                    <h1>Dynamic Payslip Generator</h1>
                    <p>Generate individual payslips with automatic working days and leave calculations</p>
                </div>

                {popup.show && (
                    <PopupMessage
                        type={popup.type}
                        message={popup.message}
                        onClose={closePopup}
                    />
                )}

                <div className="generator-section">
                    <div className="selection-form">
                        <h3>Select Employee and Period</h3>
                        
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="employee">Select Employee *</label>
                                <select
                                    id="employee"
                                    value={selectedEmployee}
                                    onChange={(e) => setSelectedEmployee(e.target.value)}
                                    className="form-control"
                                    required
                                >
                                    <option value="">Choose an employee...</option>
                                    {employees.map(employee => (
                                        <option key={employee.id} value={employee.id}>
                                            {employee.fullName} - {employee.position}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="month">Select Month *</label>
                                <select
                                    id="month"
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    className="form-control"
                                    required
                                >
                                    <option value="">Choose month...</option>
                                    {months.map(month => (
                                        <option key={month} value={month}>
                                            {month}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="year">Select Year *</label>
                                <select
                                    id="year"
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                    className="form-control"
                                    required
                                >
                                    {years.map(year => (
                                        <option key={year} value={year}>
                                            {year}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-actions">
                            <button
                                className="btn btn-primary"
                                onClick={generatePayslip}
                                disabled={loading}
                            >
                                {loading ? 'Generating...' : 'Generate Payslip'}
                            </button>
                        </div>
                    </div>

                    {payslipData && (
                        <div className="payslip-preview">
                            <div className="payslip-header-section">
                                <h3>Payslip Preview</h3>
                                <button
                                    className="btn btn-download"
                                    onClick={downloadPDF}
                                >
                                    Download PDF
                                </button>
                            </div>

                            <div className="payslip-content">
                                {/* Employee Details */}
                                <div className="employee-details">
                                    <h4>Employee Information</h4>
                                    <div className="detail-grid">
                                        <div><strong>Name:</strong> {payslipData.employee.name}</div>
                                        <div><strong>Employee ID:</strong> {payslipData.employee.id}</div>
                                        <div><strong>Position:</strong> {payslipData.employee.position}</div>
                                        <div><strong>Period:</strong> {payslipData.period.month} {payslipData.period.year}</div>
                                    </div>
                                </div>

                                {/* Attendance Details */}
                                <div className="attendance-details">
                                    <h4>Attendance Summary</h4>
                                    <div className="detail-grid">
                                        <div><strong>Total Days in Month:</strong> {payslipData.attendance.totalDaysInMonth}</div>
                                        <div><strong>Working Days:</strong> {payslipData.attendance.workingDays}</div>
                                        <div><strong>Unpaid Leave Days:</strong> {payslipData.attendance.unpaidLeaveDays}</div>
                                        <div><strong>Effective Working Days:</strong> {payslipData.attendance.effectiveWorkingDays}</div>
                                    </div>
                                </div>

                                {/* Salary Breakdown */}
                                <div className="salary-breakdown">
                                    <div className="earnings-section">
                                        <h4>Earnings</h4>
                                        <div className="amount-table">
                                            <div className="amount-row">
                                                <span>Basic Salary</span>
                                                <span>{formatCurrency(payslipData.salary.basicSalary)}</span>
                                            </div>
                                            <div className="amount-row">
                                                <span>HRA</span>
                                                <span>{formatCurrency(payslipData.salary.hra)}</span>
                                            </div>
                                            <div className="amount-row">
                                                <span>Conveyance Allowance</span>
                                                <span>{formatCurrency(payslipData.salary.conveyanceAllowance)}</span>
                                            </div>
                                            <div className="amount-row">
                                                <span>Medical Allowance</span>
                                                <span>{formatCurrency(payslipData.salary.medicalAllowance)}</span>
                                            </div>
                                            <div className="amount-row">
                                                <span>Special Allowance</span>
                                                <span>{formatCurrency(payslipData.salary.specialAllowance)}</span>
                                            </div>
                                            <div className="amount-row">
                                                <span>Performance Bonus</span>
                                                <span>{formatCurrency(payslipData.salary.performanceBonus)}</span>
                                            </div>
                                            <div className="amount-row total">
                                                <span><strong>Gross Monthly Salary</strong></span>
                                                <span><strong>{formatCurrency(payslipData.salary.grossMonthlySalary)}</strong></span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="deductions-section">
                                        <h4>Deductions</h4>
                                        <div className="amount-table">
                                            <div className="amount-row">
                                                <span>Employee PF</span>
                                                <span>{formatCurrency(payslipData.deductions.employeePf)}</span>
                                            </div>
                                            <div className="amount-row">
                                                <span>Professional Tax</span>
                                                <span>{formatCurrency(payslipData.deductions.professionalTax)}</span>
                                            </div>
                                            <div className="amount-row">
                                                <span>TDS</span>
                                                <span>{formatCurrency(payslipData.deductions.tds)}</span>
                                            </div>
                                            <div className="amount-row">
                                                <span>Insurance Premium</span>
                                                <span>{formatCurrency(payslipData.deductions.insurancePremium)}</span>
                                            </div>
                                            <div className="amount-row total">
                                                <span><strong>Total Deductions</strong></span>
                                                <span><strong>{formatCurrency(payslipData.deductions.totalMonthlyDeductions)}</strong></span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Final Calculations */}
                                <div className="final-calculations">
                                    <h4>Final Calculations</h4>
                                    <div className="calculation-details">
                                        <div className="calc-row">
                                            <span>Daily Net Salary:</span>
                                            <span>{formatCurrency(payslipData.calculations.dailyNetSalary)}</span>
                                        </div>
                                        <div className="calc-row">
                                            <span>Unpaid Leave Deduction ({payslipData.attendance.unpaidLeaveDays} days):</span>
                                            <span className="negative">-{formatCurrency(payslipData.calculations.unpaidLeaveDeduction)}</span>
                                        </div>
                                        <div className="calc-row final-net">
                                            <span><strong>Final Net Salary:</strong></span>
                                            <span className="final-amount"><strong>{formatCurrency(payslipData.calculations.finalNetSalary)}</strong></span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DynamicPayslipGenerator;
