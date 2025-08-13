import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from '../utils/axios';
import SidebarAdmin from '../components/SidebarAdmin';
import Sidebar from '../components/Sidebar';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './PayrollDashboardNew.css';

const PayrollDashboard = () => {
    const location = useLocation();
    const isHRRoute = location.pathname.includes('/manager/');
    
    const [employees, setEmployees] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [payslipData, setPayslipData] = useState({
        employeeId: '',
        payrollMonth: '',
        payrollYear: new Date().getFullYear(),
        workingDays: 22,
        attendedDays: '',
        overtime: 0,
        medicalAllowance: 0,
        travelAllowance: 0,
        professionalTax: 200,
        incomeTax: 0,
        otherDeductions: 0,
        notes: ''
    });
    const [payslips, setPayslips] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [selectedPayslip, setSelectedPayslip] = useState(null);
    const [calculatedPayslip, setCalculatedPayslip] = useState(null);
    const [autoCalculating, setAutoCalculating] = useState(false);

    // Pagination and filtering state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [filterEmployee, setFilterEmployee] = useState('');
    const [filterMonth, setFilterMonth] = useState('');
    const [filteredPayslips, setFilteredPayslips] = useState([]);

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    useEffect(() => {
        fetchEmployees();
        fetchAllPayslips();
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

    const fetchAllPayslips = async () => {
        try {
            console.log('Fetching payslips from: /api/ctc-management/payslip/all');
            const response = await axios.get('/api/ctc-management/payslip/all');
            console.log('Payslips response:', response.data);
            setPayslips(response.data);
            setFilteredPayslips(response.data); // Initialize filtered payslips
        } catch (error) {
            console.error('Error fetching payslips:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setPayslipData({ ...payslipData, [name]: value });
    };

    const handleEmployeeSelect = (employeeId) => {
        setSelectedEmployee(employeeId);
        setPayslipData({ ...payslipData, employeeId });
    };

    const generateIndividualPayslip = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await axios.post('/api/ctc-management/payslip/generate', payslipData);
            showMessage('success', 'Payslip generated successfully');
            resetForm();
            fetchAllPayslips();
        } catch (error) {
            console.error('Error generating payslip:', error);
            showMessage('error', error.response?.data?.message || 'Failed to generate payslip');
        } finally {
            setLoading(false);
        }
    };

    // Function to automatically calculate payslip when employee, month, and year are selected
    const calculateAutomaticPayslip = async () => {
        if (!selectedEmployee || !payslipData.payrollMonth || !payslipData.payrollYear) {
            setCalculatedPayslip(null);
            return;
        }

        setAutoCalculating(true);
        try {
            const monthIndex = months.indexOf(payslipData.payrollMonth) + 1;
            const response = await axios.get(
                `/api/payslip/calculate/${selectedEmployee}/${payslipData.payrollYear}/${monthIndex}`
            );
            setCalculatedPayslip(response.data);
        } catch (error) {
            console.error('Error calculating payslip:', error);
            showMessage('error', 'Failed to calculate payslip automatically');
            setCalculatedPayslip(null);
        } finally {
            setAutoCalculating(false);
        }
    };

    // Effect to trigger automatic calculation when selections change
    useEffect(() => {
        calculateAutomaticPayslip();
    }, [selectedEmployee, payslipData.payrollMonth, payslipData.payrollYear]);

    // Function to generate and save payslip to database
    const generateAndSavePayslip = async () => {
        if (!calculatedPayslip) return;

        setLoading(true);
        try {
            // Prepare payslip data for backend
            const payslipData = {
                employeeId: calculatedPayslip.employeeId,
                employeeName: calculatedPayslip.employeeName,
                payrollMonth: months[calculatedPayslip.month - 1],
                payrollYear: calculatedPayslip.year,
                workingDays: calculatedPayslip.totalWorkingDays,
                attendedDays: calculatedPayslip.effectiveWorkingDays,
                grossSalary: calculatedPayslip.monthlyNetSalary,
                totalDeductions: calculatedPayslip.monthlyNetSalary - calculatedPayslip.finalNetSalary,
                netPay: calculatedPayslip.finalNetSalary,
                unpaidLeaveDays: calculatedPayslip.unpaidLeaveDays,
                unpaidLeaveDeduction: calculatedPayslip.unpaidLeaveDeduction,
                basicSalary: calculatedPayslip.basicSalary,
                hra: calculatedPayslip.hra,
                medicalAllowance: calculatedPayslip.medicalAllowance,
                conveyanceAllowance: calculatedPayslip.conveyanceAllowance,
                specialAllowance: calculatedPayslip.specialAllowance,
                performanceBonus: calculatedPayslip.performanceBonus,
                providentFund: calculatedPayslip.providentFund,
                professionalTax: calculatedPayslip.professionalTax,
                incomeTax: calculatedPayslip.incomeTax,
                insurancePremium: calculatedPayslip.insurancePremium,
                status: 'GENERATED'
            };

            // Save to database
            await axios.post('/api/ctc-management/payslip/generate', payslipData);
            
            showMessage('success', 'Payslip generated and saved successfully!');
            
            // Reset form and close modal
            resetForm();
            
            // Refresh payslips table
            fetchAllPayslips();
            
        } catch (error) {
            console.error('Error saving payslip:', error);
            showMessage('error', error.response?.data?.message || 'Failed to generate payslip');
        } finally {
            setLoading(false);
        }
    };

    // Function to generate PDF from calculated payslip
    const generateCalculatedPayslipPDF = () => {
        if (!calculatedPayslip) return;

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        
        // Document styling
        doc.setLineWidth(2);
        doc.rect(10, 10, pageWidth - 20, 250);
        
        // Header
        doc.setFontSize(20);
        doc.setFont(undefined, 'bold');
        doc.text('PAYSLIP', pageWidth / 2, 30, { align: 'center' });
        
        // Employee details
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.text(`Employee: ${calculatedPayslip.employeeName}`, 20, 50);
        doc.text(`Position: ${calculatedPayslip.employeePosition}`, 20, 60);
        doc.text(`Month/Year: ${months[calculatedPayslip.month - 1]} ${calculatedPayslip.year}`, 20, 70);
        
        // Working days information
        doc.text(`Total Working Days: ${calculatedPayslip.totalWorkingDays}`, 20, 85);
        doc.text(`Unpaid Leave Days: ${calculatedPayslip.unpaidLeaveDays}`, 20, 95);
        doc.text(`Effective Working Days: ${calculatedPayslip.effectiveWorkingDays}`, 20, 105);
        
        // Salary breakdown
        let yPos = 125;
        doc.setFont(undefined, 'bold');
        doc.text('EARNINGS', 20, yPos);
        yPos += 10;
        
        doc.setFont(undefined, 'normal');
        doc.text(`Basic Salary: ₹${calculatedPayslip.basicSalary?.toFixed(2) || '0.00'}`, 25, yPos);
        yPos += 10;
        doc.text(`HRA: ₹${calculatedPayslip.hra?.toFixed(2) || '0.00'}`, 25, yPos);
        yPos += 10;
        doc.text(`Medical Allowance: ₹${calculatedPayslip.medicalAllowance?.toFixed(2) || '0.00'}`, 25, yPos);
        yPos += 10;
        doc.text(`Conveyance Allowance: ₹${calculatedPayslip.conveyanceAllowance?.toFixed(2) || '0.00'}`, 25, yPos);
        yPos += 10;
        doc.text(`Special Allowance: ₹${calculatedPayslip.specialAllowance?.toFixed(2) || '0.00'}`, 25, yPos);
        yPos += 10;
        doc.text(`Performance Bonus: ₹${calculatedPayslip.performanceBonus?.toFixed(2) || '0.00'}`, 25, yPos);
        
        yPos += 20;
        doc.setFont(undefined, 'bold');
        doc.text('DEDUCTIONS', 20, yPos);
        yPos += 10;
        
        doc.setFont(undefined, 'normal');
        doc.text(`Provident Fund: ₹${calculatedPayslip.providentFund?.toFixed(2) || '0.00'}`, 25, yPos);
        yPos += 10;
        doc.text(`Professional Tax: ₹${calculatedPayslip.professionalTax?.toFixed(2) || '0.00'}`, 25, yPos);
        yPos += 10;
        doc.text(`Income Tax: ₹${calculatedPayslip.incomeTax?.toFixed(2) || '0.00'}`, 25, yPos);
        yPos += 10;
        doc.text(`Insurance Premium: ₹${calculatedPayslip.insurancePremium?.toFixed(2) || '0.00'}`, 25, yPos);
        yPos += 10;
        doc.text(`Unpaid Leave Deduction: ₹${calculatedPayslip.unpaidLeaveDeduction?.toFixed(2) || '0.00'}`, 25, yPos);
        
        yPos += 20;
        doc.setFont(undefined, 'bold');
        doc.text(`NET SALARY: ₹${calculatedPayslip.finalNetSalary?.toFixed(2) || '0.00'}`, 20, yPos);
        
        // Footer
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 245);
        
        // Save the PDF
        doc.save(`${calculatedPayslip.employeeName}_${months[calculatedPayslip.month - 1]}_${calculatedPayslip.year}_Payslip.pdf`);
    };

    const downloadPayslip = async (payslipId) => {
        try {
            // Get payslip data from backend
            const response = await axios.get(`/api/ctc-management/payslip/download/${payslipId}`);
            const payslipData = response.data;
            
            // Debug: Log the full response to understand the data structure
            console.log('Full payslip response:', response.data);
            console.log('Payslip data keys:', Object.keys(payslipData));
            
            // Check if the data is nested in another object
            const actualPayslipData = payslipData.payslip || payslipData.data || payslipData;
            console.log('Actual payslip data:', actualPayslipData);

            // Generate PDF using the professional template format
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.width;
            
            // Outer border for entire document
            doc.setLineWidth(2);
            doc.rect(10, 10, pageWidth - 20, 250);
            
            // Company Header Section with border
            doc.setLineWidth(1);
            doc.rect(10, 10, pageWidth - 20, 50);
            
            // Company logo placeholder
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
            doc.text(`Pay Slip for ${actualPayslipData.payrollMonth || actualPayslipData.month || 'N/A'} ${actualPayslipData.payrollYear || actualPayslipData.year || 'N/A'}`, pageWidth / 2, 52, { align: 'center' });
            
            // Employee Details Table
            let currentY = 70;
            
            // Debug log to see what data we have
            console.log('Payslip data for PDF:', actualPayslipData);
            
            const employeeData = [
                ['Employee ID', actualPayslipData.employeeId?.toString() || actualPayslipData.id?.toString() || '-', 'UAN', '-'],
                ['Employee Name', actualPayslipData.employeeName || actualPayslipData.name || actualPayslipData.fullName || '-', 'PF No.', '-'],
                ['Designation', actualPayslipData.employeePosition || actualPayslipData.designation || actualPayslipData.position || '-', 'ESI No.', '-'],
                ['Department', actualPayslipData.department || 'IT', 'Bank', '-'],
                ['Date of Joining', actualPayslipData.joiningDate || actualPayslipData.dateOfJoining || actualPayslipData.joinDate || '-', 'Account No.', '-']
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
            
            const workingDaysData = [
                ['Gross Wages', `₹${actualPayslipData.grossSalary?.toLocaleString() || '0'}`, '', ''],
                ['Total Working Days', actualPayslipData.workingDays?.toString() || '22', 'Leaves', actualPayslipData.unpaidLeaveDays?.toString() || '0'],
                ['LOP Days', actualPayslipData.unpaidLeaveDays?.toString() || '0', 'Paid Days', actualPayslipData.attendedDays?.toString() || '22']
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
            
            // Prepare earnings and deductions data with real employee data
            const earningsDeductionsData = [];
            
            // Add earnings with corresponding deductions in parallel
            const earningsItems = [];
            const deductionsItems = [];
            
            // Collect earnings
            if (actualPayslipData.basicSalary && actualPayslipData.basicSalary > 0) {
                earningsItems.push(['Basic', `₹${actualPayslipData.basicSalary.toLocaleString()}`]);
            }
            if (actualPayslipData.hra && actualPayslipData.hra > 0) {
                earningsItems.push(['HRA', `₹${actualPayslipData.hra.toLocaleString()}`]);
            }
            if (actualPayslipData.conveyanceAllowance && actualPayslipData.conveyanceAllowance > 0) {
                earningsItems.push(['Conveyance Allowance', `₹${actualPayslipData.conveyanceAllowance.toLocaleString()}`]);
            }
            if (actualPayslipData.medicalAllowance && actualPayslipData.medicalAllowance > 0) {
                earningsItems.push(['Medical Allowance', `₹${actualPayslipData.medicalAllowance.toLocaleString()}`]);
            }
            if (actualPayslipData.specialAllowance && actualPayslipData.specialAllowance > 0) {
                earningsItems.push(['Other Allowances', `₹${actualPayslipData.specialAllowance.toLocaleString()}`]);
            }
            if (actualPayslipData.performanceBonus && actualPayslipData.performanceBonus > 0) {
                earningsItems.push(['Performance Bonus', `₹${actualPayslipData.performanceBonus.toLocaleString()}`]);
            }
            
            // Collect deductions
            if (actualPayslipData.providentFund && actualPayslipData.providentFund > 0) {
                deductionsItems.push(['EPF', `₹${actualPayslipData.providentFund.toLocaleString()}`]);
            }
            if (actualPayslipData.incomeTax && actualPayslipData.incomeTax > 0) {
                deductionsItems.push(['Income Tax', `₹${actualPayslipData.incomeTax.toLocaleString()}`]);
            }
            if (actualPayslipData.professionalTax && actualPayslipData.professionalTax > 0) {
                deductionsItems.push(['Professional Tax', `₹${actualPayslipData.professionalTax.toLocaleString()}`]);
            }
            if (actualPayslipData.insurancePremium && actualPayslipData.insurancePremium > 0) {
                deductionsItems.push(['Insurance', `₹${actualPayslipData.insurancePremium.toLocaleString()}`]);
            }
            if (actualPayslipData.unpaidLeaveDeduction && actualPayslipData.unpaidLeaveDeduction > 0) {
                deductionsItems.push(['LOP Deduction', `₹${actualPayslipData.unpaidLeaveDeduction.toLocaleString()}`]);
            }
            
            // Add ESI as zero if no ESI data
            if (deductionsItems.length === 0 || !deductionsItems.find(item => item[0] === 'ESI')) {
                deductionsItems.push(['ESI', '₹0']);
            }
            
            // Combine earnings and deductions in parallel rows
            const maxRows = Math.max(earningsItems.length, deductionsItems.length);
            
            for (let i = 0; i < maxRows; i++) {
                const earningsRow = earningsItems[i] || ['', ''];
                const deductionsRow = deductionsItems[i] || ['', ''];
                earningsDeductionsData.push([
                    earningsRow[0], 
                    earningsRow[1], 
                    deductionsRow[0], 
                    deductionsRow[1]
                ]);
            }
            
            // If no data, add placeholder row
            if (earningsDeductionsData.length === 0) {
                earningsDeductionsData.push(['', '₹0', '', '₹0']);
            }
            
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
                ['Total Earnings', `₹${actualPayslipData.grossSalary?.toLocaleString() || '0'}`, 'Total Deductions', `₹${actualPayslipData.totalDeductions?.toLocaleString() || '0'}`]
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
                ['Net Salary', `₹${actualPayslipData.netPay?.toLocaleString() || actualPayslipData.finalNetSalary?.toLocaleString() || '0'}`]
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

            // Footer
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 15, 255);
            
            // Save the PDF
            const fileName = `Payslip-${actualPayslipData.employeeName || 'Employee'}-${actualPayslipData.payrollMonth || actualPayslipData.month || 'Unknown'}_${actualPayslipData.payrollYear || actualPayslipData.year || 'Unknown'}.pdf`;
            doc.save(fileName);
            
            showMessage('success', 'Payslip downloaded successfully');
            
        } catch (error) {
            console.error('Error downloading payslip:', error);
            showMessage('error', 'Failed to download payslip');
        }
    };

    const viewPayslip = (payslip) => {
        setSelectedPayslip(payslip);
    };

    const resetForm = () => {
        setPayslipData({
            employeeId: '',
            payrollMonth: '',
            payrollYear: new Date().getFullYear(),
            workingDays: 22,
            attendedDays: '',
            overtime: 0,
            medicalAllowance: 0,
            travelAllowance: 0,
            professionalTax: 200,
            incomeTax: 0,
            otherDeductions: 0,
            notes: ''
        });
        setSelectedEmployee('');
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

    const getStatusColor = (status) => {
        switch (status) {
            case 'GENERATED': return '#4CAF50';
            case 'SENT': return '#2196F3';
            case 'REVISED': return '#FF9800';
            case 'PAID': return '#4CAF50';
            case 'PENDING': return '#FF9800';
            case 'ON_HOLD': return '#dc2626';
            case 'SCHEDULED': return '#6366f1';
            default: return '#666';
        }
    };

    const getEmployeeName = (employeeId) => {
        const employee = employees.find(emp => emp.id === employeeId);
        return employee ? (employee.fullName || employee.firstName) : `Employee ${employeeId}`;
    };

    // Filtering and Pagination Functions
    const filterPayslips = () => {
        let filtered = [...payslips];

        // Filter by employee
        if (filterEmployee) {
            filtered = filtered.filter(payslip => {
                const employeeName = getEmployeeName(payslip.employeeId).toLowerCase();
                return employeeName.includes(filterEmployee.toLowerCase());
            });
        }

        // Filter by month
        if (filterMonth) {
            filtered = filtered.filter(payslip => {
                const payslipMonth = payslip.payrollMonth || payslip.month || '';
                return payslipMonth.toLowerCase() === filterMonth.toLowerCase();
            });
        }

        setFilteredPayslips(filtered);
        setCurrentPage(1); // Reset to first page when filtering
    };

    // Apply filters whenever payslips or filter values change
    useEffect(() => {
        filterPayslips();
    }, [payslips, filterEmployee, filterMonth]);

    // Pagination calculations
    const totalPages = Math.ceil(filteredPayslips.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPayslips = filteredPayslips.slice(startIndex, endIndex);

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handleItemsPerPageChange = (e) => {
        setItemsPerPage(parseInt(e.target.value));
        setCurrentPage(1); // Reset to first page
    };

    const clearFilters = () => {
        setFilterEmployee('');
        setFilterMonth('');
        setCurrentPage(1);
    };

    // Get unique months from payslips for dropdown
    const getUniqueMonths = () => {
        const months = [...new Set(payslips.map(payslip => payslip.payrollMonth || payslip.month))];
        return months.filter(month => month).sort();
    };

    // Get unique employees for dropdown
    const getUniqueEmployees = () => {
        const employeeIds = [...new Set(payslips.map(payslip => payslip.employeeId))];
        return employeeIds.map(id => ({
            id,
            name: getEmployeeName(id)
        })).sort((a, b) => a.name.localeCompare(b.name));
    };

    // Manual Payroll Generation Functions
    const [manualGenerationLoading, setManualGenerationLoading] = useState(false);
    const [schedulerStatus, setSchedulerStatus] = useState(null);
    const [showSpecificMonthModal, setShowSpecificMonthModal] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [showCurrentMonthModal, setShowCurrentMonthModal] = useState(false);
    const [specificMonthData, setSpecificMonthData] = useState({
        month: '',
        year: new Date().getFullYear()
    });

    // Fetch scheduler status
    const fetchSchedulerStatus = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/payroll/scheduler/status');
            setSchedulerStatus(response.data);
            showMessage('success', 'Scheduler status updated successfully');
        } catch (error) {
            console.error('Error fetching scheduler status:', error);
            showMessage('error', 'Failed to fetch scheduler status');
        } finally {
            setLoading(false);
        }
    };

    // Generate current month payroll manually
    const generateCurrentMonthPayroll = async () => {
        setManualGenerationLoading(true);
        try {
            const response = await axios.post('/api/payroll/scheduler/generate-current-month', null, {
                params: {
                    generatedBy: isHRRoute ? 'HR_MANUAL' : 'ADMIN_MANUAL'
                }
            });

            if (response.data.success) {
                showMessage('success', `✅ Successfully generated ${response.data.payslipsGenerated} payslips for ${response.data.month} ${response.data.year}`);
                fetchAllPayslips(); // Refresh the payslip list
                setShowCurrentMonthModal(false);
            } else {
                showMessage('error', response.data.message || 'Failed to generate payroll');
            }
        } catch (error) {
            console.error('Error generating payroll:', error);
            showMessage('error', 'Failed to generate payroll: ' + (error.response?.data?.message || error.message));
        } finally {
            setManualGenerationLoading(false);
        }
    };

    // Generate specific month payroll manually
    const generateSpecificMonthPayroll = async () => {
        if (!specificMonthData.month || !specificMonthData.year) {
            showMessage('error', 'Please select both month and year');
            return;
        }

        setManualGenerationLoading(true);
        try {
            const response = await axios.post('/api/payroll/scheduler/generate-specific', null, {
                params: {
                    month: specificMonthData.month,
                    year: parseInt(specificMonthData.year),
                    generatedBy: isHRRoute ? 'HR_MANUAL' : 'ADMIN_MANUAL'
                }
            });

            if (response.data.success) {
                showMessage('success', `✅ Successfully generated ${response.data.payslipsGenerated} payslips for ${response.data.month} ${response.data.year}`);
                fetchAllPayslips(); // Refresh the payslip list
                setShowSpecificMonthModal(false);
                setSpecificMonthData({ month: '', year: new Date().getFullYear() });
            } else {
                showMessage('error', response.data.message || 'Failed to generate payroll');
            }
        } catch (error) {
            console.error('Error generating payroll:', error);
            showMessage('error', 'Failed to generate payroll: ' + (error.response?.data?.message || error.message));
        } finally {
            setManualGenerationLoading(false);
        }
    };

    const handleSpecificMonthInputChange = (e) => {
        const { name, value } = e.target;
        setSpecificMonthData({ ...specificMonthData, [name]: value });
    };

    // Fetch scheduler status on component mount
    useEffect(() => {
        fetchSchedulerStatus();
    }, []);

    return (
        <div className={isHRRoute ? "hr-dashboard-layout" : "admin-dashboard-layout"}>
            {isHRRoute ? <Sidebar /> : <SidebarAdmin />}
            <div className="payroll-dashboard">
                <div className="payroll-header">
                    <h1>Payroll Dashboard</h1>
                    <p>Generate and manage employee payslips</p>
                </div>

                {/* Enhanced Automatic Payroll Scheduler Section */}
                <div className="scheduler-card" style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    padding: '25px',
                    borderRadius: '15px',
                    marginBottom: '25px',
                    boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                    <div className="scheduler-header" style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '20px'
                    }}>
                        <div className="scheduler-title">
                            <h3 style={{ 
                                margin: 0, 
                                fontSize: '24px',
                                fontWeight: '700',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px'
                            }}>
                                🤖 Automatic Payroll Scheduler
                            </h3>
                            <p style={{ 
                                margin: '8px 0 0 0', 
                                fontSize: '15px',
                                opacity: '0.9',
                                fontWeight: '400'
                            }}>
                                Automated payroll generation at month-end with manual override capabilities
                            </p>
                        </div>
                        {schedulerStatus && (
                            <div className="scheduler-status-badge" style={{
                                background: 'rgba(255, 255, 255, 0.2)',
                                padding: '12px 18px',
                                borderRadius: '25px',
                                border: '2px solid rgba(76, 175, 80, 0.6)',
                                backdropFilter: 'blur(10px)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <div style={{
                                    width: '10px',
                                    height: '10px',
                                    backgroundColor: '#4CAF50',
                                    borderRadius: '50%',
                                    animation: 'pulse 2s infinite'
                                }}></div>
                                <span style={{ 
                                    fontWeight: '600',
                                    fontSize: '14px'
                                }}>
                                    Scheduler Active
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Quick Stats Row */}
                    {schedulerStatus && (
                        <div className="scheduler-stats" style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '15px',
                            marginBottom: '20px'
                        }}>
                            <div className="stat-card" style={{
                                background: 'rgba(255, 255, 255, 0.15)',
                                padding: '15px',
                                borderRadius: '10px',
                                textAlign: 'center',
                                backdropFilter: 'blur(10px)'
                            }}>
                                <div style={{ fontSize: '20px', marginBottom: '5px' }}>📅</div>
                                <div style={{ fontSize: '14px', opacity: '0.8' }}>Next Run</div>
                                <div style={{ fontWeight: '600', fontSize: '13px' }}>11:59 PM on {schedulerStatus.lastDayOfCurrentMonth}</div>
                            </div>
                            <div className="stat-card" style={{
                                background: 'rgba(255, 255, 255, 0.15)',
                                padding: '15px',
                                borderRadius: '10px',
                                textAlign: 'center',
                                backdropFilter: 'blur(10px)'
                            }}>
                                <div style={{ fontSize: '20px', marginBottom: '5px' }}>⚡</div>
                                <div style={{ fontSize: '14px', opacity: '0.8' }}>Cron Expression</div>
                                <div style={{ fontWeight: '600', fontSize: '13px', fontFamily: 'monospace' }}>{schedulerStatus.cronExpression}</div>
                            </div>
                            <div className="stat-card" style={{
                                background: 'rgba(255, 255, 255, 0.15)',
                                padding: '15px',
                                borderRadius: '10px',
                                textAlign: 'center',
                                backdropFilter: 'blur(10px)'
                            }}>
                                <div style={{ fontSize: '20px', marginBottom: '5px' }}>📊</div>
                                <div style={{ fontSize: '14px', opacity: '0.8' }}>Current Date</div>
                                <div style={{ fontWeight: '600', fontSize: '13px' }}>{schedulerStatus.currentDate}</div>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="scheduler-actions" style={{
                        display: 'flex',
                        gap: '15px',
                        flexWrap: 'wrap'
                    }}>
                        <button
                            className="scheduler-btn primary"
                            onClick={() => setShowCurrentMonthModal(true)}
                            disabled={manualGenerationLoading}
                            style={{
                                background: manualGenerationLoading ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 152, 0, 0.9)',
                                color: 'white',
                                border: 'none',
                                padding: '14px 24px',
                                borderRadius: '10px',
                                cursor: manualGenerationLoading ? 'not-allowed' : 'pointer',
                                fontSize: '15px',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                transition: 'all 0.3s ease',
                                boxShadow: manualGenerationLoading ? 'none' : '0 4px 15px rgba(255, 152, 0, 0.4)',
                                transform: manualGenerationLoading ? 'scale(0.95)' : 'scale(1)',
                                backdropFilter: 'blur(10px)'
                            }}
                            onMouseEnter={(e) => {
                                if (!manualGenerationLoading) {
                                    e.target.style.transform = 'scale(1.05)';
                                    e.target.style.boxShadow = '0 6px 20px rgba(255, 152, 0, 0.6)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!manualGenerationLoading) {
                                    e.target.style.transform = 'scale(1)';
                                    e.target.style.boxShadow = '0 4px 15px rgba(255, 152, 0, 0.4)';
                                }
                            }}
                        >
                            {manualGenerationLoading ? (
                                <>
                                    <div style={{ 
                                        width: '16px', 
                                        height: '16px',
                                        border: '2px solid rgba(255,255,255,0.3)',
                                        borderTop: '2px solid white',
                                        borderRadius: '50%',
                                        animation: 'spin 1s linear infinite'
                                    }}></div>
                                    Generating...
                                </>
                            ) : (
                                <>
                                    🚀 Generate Current Month
                                </>
                            )}
                        </button>

                        <button
                            className="scheduler-btn secondary"
                            onClick={() => setShowSpecificMonthModal(true)}
                            disabled={manualGenerationLoading}
                            style={{
                                background: manualGenerationLoading ? 'rgba(255, 255, 255, 0.3)' : 'rgba(156, 39, 176, 0.9)',
                                color: 'white',
                                border: 'none',
                                padding: '14px 24px',
                                borderRadius: '10px',
                                cursor: manualGenerationLoading ? 'not-allowed' : 'pointer',
                                fontSize: '15px',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                transition: 'all 0.3s ease',
                                boxShadow: manualGenerationLoading ? 'none' : '0 4px 15px rgba(156, 39, 176, 0.4)',
                                transform: manualGenerationLoading ? 'scale(0.95)' : 'scale(1)',
                                backdropFilter: 'blur(10px)'
                            }}
                            onMouseEnter={(e) => {
                                if (!manualGenerationLoading) {
                                    e.target.style.transform = 'scale(1.05)';
                                    e.target.style.boxShadow = '0 6px 20px rgba(156, 39, 176, 0.6)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!manualGenerationLoading) {
                                    e.target.style.transform = 'scale(1)';
                                    e.target.style.boxShadow = '0 4px 15px rgba(156, 39, 176, 0.4)';
                                }
                            }}
                        >
                            📅 Generate Specific Month
                        </button>

                        <button
                            className="scheduler-btn info"
                            onClick={() => {
                                fetchSchedulerStatus();
                                setShowStatusModal(true);
                            }}
                            style={{
                                background: 'rgba(96, 125, 139, 0.9)',
                                color: 'white',
                                border: 'none',
                                padding: '14px 24px',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                fontSize: '15px',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 4px 15px rgba(96, 125, 139, 0.4)',
                                backdropFilter: 'blur(10px)'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.transform = 'scale(1.05)';
                                e.target.style.boxShadow = '0 6px 20px rgba(96, 125, 139, 0.6)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.transform = 'scale(1)';
                                e.target.style.boxShadow = '0 4px 15px rgba(96, 125, 139, 0.4)';
                            }}
                        >
                            🔍 View Scheduler Details
                        </button>
                    </div>

                    {/* Loading Overlay */}
                    {loading && (
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(102, 126, 234, 0.8)',
                            borderRadius: '15px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backdropFilter: 'blur(5px)'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                color: 'white',
                                fontSize: '16px',
                                fontWeight: '600'
                            }}>
                                <div style={{ 
                                    width: '20px', 
                                    height: '20px',
                                    border: '3px solid rgba(255,255,255,0.3)',
                                    borderTop: '3px solid white',
                                    borderRadius: '50%',
                                    animation: 'spin 1s linear infinite'
                                }}></div>
                                Updating Status...
                            </div>
                        </div>
                    )}
                </div>

                {/* Add keyframes for animations */}
                <style jsx>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                    @keyframes pulse {
                        0% { opacity: 1; }
                        50% { opacity: 0.5; }
                        100% { opacity: 1; }
                    }
                `}</style>

            {message.text && (
                <div className={`message ${message.type}`}>
                    {message.text}
                </div>
            )}

            <div className="payroll-content">
                {/* Action Buttons */}
                <div className="action-buttons">
                    <button
                        className="btn-primary"
                        onClick={() => setShowModal(true)}
                        style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            border: 'none',
                            color: 'white',
                            padding: '12px 24px',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
                        }}
                    >
                        👤 Generate Individual Payslip
                    </button>
                </div>

                {/* Enhanced Payslips Table with Filters and Pagination */}
                <div className="payslips-section">
                    <h3 style={{ 
                        textAlign: 'center',
                        margin: '0 0 25px 0',
                        fontSize: '28px',
                        fontWeight: '700',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        textShadow: '0 2px 10px rgba(102, 126, 234, 0.3)'
                    }}>
                        📊 Recent Payslips
                    </h3>

                    {/* Filters Section */}
                    <div className="payslips-filters" style={{
                        background: 'linear-gradient(135deg, #f8f9ff 0%, #e3f2fd 100%)',
                        padding: '25px',
                        borderRadius: '16px',
                        marginBottom: '25px',
                        border: '2px solid rgba(102, 126, 234, 0.2)',
                        boxShadow: '0 8px 25px rgba(102, 126, 234, 0.15)'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '20px'
                        }}>
                            <h4 style={{ 
                                margin: 0, 
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                                fontSize: '18px',
                                fontWeight: '700'
                            }}>
                                🔍 Filter Payslips
                            </h4>
                            <button
                                onClick={clearFilters}
                                style={{
                                    background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    boxShadow: '0 4px 12px rgba(255, 107, 107, 0.3)',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.transform = 'translateY(-2px)';
                                    e.target.style.boxShadow = '0 6px 16px rgba(255, 107, 107, 0.4)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = '0 4px 12px rgba(255, 107, 107, 0.3)';
                                }}
                            >
                                ✨ Clear Filters
                            </button>
                        </div>
                        
                        <div className="filter-controls" style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '15px'
                        }}>
                            <div className="filter-group">
                                <label style={{ 
                                    display: 'block', 
                                    marginBottom: '8px', 
                                    fontWeight: '600',
                                    color: '#495057',
                                    fontSize: '14px'
                                }}>
                                    Filter by Employee
                                </label>
                                <select
                                    value={filterEmployee}
                                    onChange={(e) => setFilterEmployee(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: '2px solid #dee2e6',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        backgroundColor: 'white',
                                        color: '#495057'
                                    }}
                                >
                                    <option value="">All Employees</option>
                                    {getUniqueEmployees().map(employee => (
                                        <option key={employee.id} value={employee.name}>
                                            {employee.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="filter-group">
                                <label style={{ 
                                    display: 'block', 
                                    marginBottom: '8px', 
                                    fontWeight: '600',
                                    color: '#495057',
                                    fontSize: '14px'
                                }}>
                                    Filter by Month
                                </label>
                                <select
                                    value={filterMonth}
                                    onChange={(e) => setFilterMonth(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: '2px solid #dee2e6',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        backgroundColor: 'white',
                                        color: '#495057'
                                    }}
                                >
                                    <option value="">All Months</option>
                                    {getUniqueMonths().map(month => (
                                        <option key={month} value={month}>
                                            {month}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="filter-group">
                                <label style={{ 
                                    display: 'block', 
                                    marginBottom: '8px', 
                                    fontWeight: '600',
                                    color: '#495057',
                                    fontSize: '14px'
                                }}>
                                    Items per Page
                                </label>
                                <select
                                    value={itemsPerPage}
                                    onChange={handleItemsPerPageChange}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: '2px solid #dee2e6',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        backgroundColor: 'white',
                                        color: '#495057'
                                    }}
                                >
                                    <option value={5}>5 per page</option>
                                    <option value={10}>10 per page</option>
                                    <option value={20}>20 per page</option>
                                    <option value={50}>50 per page</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Payslips Table */}
                    {currentPayslips.length > 0 ? (
                        <>
                            <div className="payslips-table" style={{
                                background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)',
                                borderRadius: '16px',
                                overflow: 'hidden',
                                boxShadow: '0 10px 30px rgba(102, 126, 234, 0.15)',
                                border: '2px solid rgba(102, 126, 234, 0.2)'
                            }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ 
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            color: 'white'
                                        }}>
                                            <th style={{ padding: '18px', textAlign: 'left', fontWeight: '700', fontSize: '14px', letterSpacing: '0.5px' }}>EMPLOYEE</th>
                                            <th style={{ padding: '18px', textAlign: 'left', fontWeight: '700', fontSize: '14px', letterSpacing: '0.5px' }}>MONTH/YEAR</th>
                                            <th style={{ padding: '18px', textAlign: 'right', fontWeight: '700', fontSize: '14px', letterSpacing: '0.5px' }}>GROSS SALARY</th>
                                            <th style={{ padding: '18px', textAlign: 'right', fontWeight: '700', fontSize: '14px', letterSpacing: '0.5px' }}>DEDUCTIONS</th>
                                            <th style={{ padding: '18px', textAlign: 'right', fontWeight: '700', fontSize: '14px', letterSpacing: '0.5px' }}>NET PAY</th>
                                            <th style={{ padding: '18px', textAlign: 'center', fontWeight: '700', fontSize: '14px', letterSpacing: '0.5px' }}>STATUS</th>
                                            <th style={{ padding: '18px', textAlign: 'center', fontWeight: '700', fontSize: '14px', letterSpacing: '0.5px' }}>ACTIONS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentPayslips.map((payslip, index) => (
                                            <tr key={payslip.payslipId} style={{
                                                borderBottom: '1px solid rgba(102, 126, 234, 0.1)',
                                                backgroundColor: index % 2 === 0 ? 'rgba(255, 255, 255, 0.8)' : 'rgba(102, 126, 234, 0.05)',
                                                transition: 'all 0.3s ease'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = 'rgba(102, 126, 234, 0.1)';
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.2)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'rgba(255, 255, 255, 0.8)' : 'rgba(102, 126, 234, 0.05)';
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = 'none';
                                            }}
                                            >
                                                <td style={{ padding: '15px' }}>
                                                    <div className="employee-info">
                                                        <div className="employee-name" style={{ fontWeight: 'bold', color: '#333', marginBottom: '4px' }}>
                                                            {getEmployeeName(payslip.employeeId)}
                                                        </div>
                                                        <div className="employee-id" style={{ fontSize: '0.9em', color: '#666' }}>
                                                            ID: {payslip.employeeId}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '15px', color: '#495057' }}>
                                                    {payslip.month || payslip.payrollMonth} {payslip.year || payslip.payrollYear}
                                                </td>
                                                <td style={{ padding: '15px', textAlign: 'right', color: '#495057', fontWeight: '600' }}>
                                                    {formatCurrency(payslip.grossSalary)}
                                                </td>
                                                <td style={{ padding: '15px', textAlign: 'right', color: '#dc3545', fontWeight: '600' }}>
                                                    {formatCurrency(payslip.totalDeductions)}
                                                </td>
                                                <td style={{ padding: '15px', textAlign: 'right', color: '#28a745', fontWeight: '700', fontSize: '15px' }}>
                                                    {formatCurrency(payslip.netPay)}
                                                </td>
                                                <td style={{ padding: '15px', textAlign: 'center' }}>
                                                    <span 
                                                        className="status"
                                                        style={{ 
                                                            backgroundColor: getStatusColor(payslip.status),
                                                            color: 'white',
                                                            padding: '6px 12px',
                                                            borderRadius: '20px',
                                                            fontSize: '12px',
                                                            fontWeight: '600'
                                                        }}
                                                    >
                                                        {payslip.status}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '15px', textAlign: 'center' }}>
                                                    <div className="action-buttons-small" style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                        <button
                                                            className="btn-view"
                                                            onClick={() => viewPayslip(payslip)}
                                                            style={{
                                                                background: '#17a2b8',
                                                                color: 'white',
                                                                border: 'none',
                                                                padding: '8px 12px',
                                                                borderRadius: '6px',
                                                                fontSize: '12px',
                                                                cursor: 'pointer',
                                                                fontWeight: '600'
                                                            }}
                                                        >
                                                            👁️ View
                                                        </button>
                                                        <button
                                                            className="btn-download"
                                                            onClick={() => downloadPayslip(payslip.payslipId)}
                                                            style={{
                                                                background: '#28a745',
                                                                color: 'white',
                                                                border: 'none',
                                                                padding: '8px 12px',
                                                                borderRadius: '6px',
                                                                fontSize: '12px',
                                                                cursor: 'pointer',
                                                                fontWeight: '600'
                                                            }}
                                                        >
                                                            📥 Download
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="pagination-controls" style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    gap: '16px',
                                    marginTop: '24px'
                                }}>
                                    <button 
                                        className="pagination-btn"
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        style={{
                                            padding: '8px 16px',
                                            border: 'none',
                                            borderRadius: '8px',
                                            background: currentPage === 1 ? '#e9ecef' : 'linear-gradient(145deg, #6366f1, #8b5cf6)',
                                            color: currentPage === 1 ? '#6c757d' : 'white',
                                            fontWeight: '600',
                                            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                            fontSize: '14px',
                                            transition: 'all 0.3s ease',
                                            opacity: currentPage === 1 ? '0.5' : '1'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (currentPage !== 1) {
                                                e.target.style.transform = 'translateY(-2px)';
                                                e.target.style.boxShadow = '0 6px 20px rgba(99, 102, 241, 0.4)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (currentPage !== 1) {
                                                e.target.style.transform = 'translateY(0)';
                                                e.target.style.boxShadow = 'none';
                                            }
                                        }}
                                    >
                                        Previous
                                    </button>
                                    
                                    <span className="pagination-info" style={{
                                        fontSize: '14px',
                                        color: '#6b7280',
                                        fontWeight: '600'
                                    }}>
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    
                                    <button 
                                        className="pagination-btn"
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        style={{
                                            padding: '8px 16px',
                                            border: 'none',
                                            borderRadius: '8px',
                                            background: currentPage === totalPages ? '#e9ecef' : 'linear-gradient(145deg, #6366f1, #8b5cf6)',
                                            color: currentPage === totalPages ? '#6c757d' : 'white',
                                            fontWeight: '600',
                                            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                            fontSize: '14px',
                                            transition: 'all 0.3s ease',
                                            opacity: currentPage === totalPages ? '0.5' : '1'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (currentPage !== totalPages) {
                                                e.target.style.transform = 'translateY(-2px)';
                                                e.target.style.boxShadow = '0 6px 20px rgba(99, 102, 241, 0.4)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (currentPage !== totalPages) {
                                                e.target.style.transform = 'translateY(0)';
                                                e.target.style.boxShadow = 'none';
                                            }
                                        }}
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="no-data" style={{
                            textAlign: 'center',
                            padding: '60px 20px',
                            background: '#f8f9fa',
                            borderRadius: '12px',
                            border: '2px dashed #dee2e6'
                        }}>
                            <div style={{ fontSize: '48px', marginBottom: '20px', opacity: '0.5' }}>📄</div>
                            <h4 style={{ margin: '0 0 10px 0', color: '#6c757d' }}>
                                {filteredPayslips.length === 0 && payslips.length > 0 
                                    ? 'No payslips match your current filters' 
                                    : 'No payslips generated yet'
                                }
                            </h4>
                            {filteredPayslips.length === 0 && payslips.length > 0 && (
                                <button
                                    onClick={clearFilters}
                                    style={{
                                        background: '#007bff',
                                        color: 'white',
                                        border: 'none',
                                        padding: '10px 20px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '600'
                                    }}
                                >
                                    Clear Filters to Show All
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Individual Payslip Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3>Generate Individual Payslip</h3>
                            <button className="close-btn" onClick={resetForm}>×</button>
                        </div>

                        <div className="payslip-form">
                            {/* Selection Section */}
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Employee</label>
                                    <select
                                        value={selectedEmployee}
                                        onChange={(e) => handleEmployeeSelect(e.target.value)}
                                        required
                                    >
                                        <option value="">Select Employee</option>
                                        {employees.map(emp => (
                                            <option key={emp.id} value={emp.id}>
                                                {emp.fullName} - {emp.email}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Payroll Month</label>
                                    <select
                                        name="payrollMonth"
                                        value={payslipData.payrollMonth}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="">Select Month</option>
                                        {months.map((month, index) => (
                                            <option key={index} value={month}>{month}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Payroll Year</label>
                                    <input
                                        type="number"
                                        name="payrollYear"
                                        value={payslipData.payrollYear}
                                        onChange={handleInputChange}
                                        min="2020"
                                        max="2030"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Automatic Calculation Display */}
                            {autoCalculating && (
                                <div className="calculation-loading">
                                    <p>Calculating payslip...</p>
                                </div>
                            )}

                            {calculatedPayslip && !autoCalculating && (
                                <div className="calculated-payslip">
                                    <h4>Calculated Payslip Details</h4>
                                    
                                    <div className="payslip-summary">
                                        <div className="summary-row">
                                            <span>Employee:</span>
                                            <span>{calculatedPayslip.employeeName}</span>
                                        </div>
                                        <div className="summary-row">
                                            <span>Position:</span>
                                            <span>{calculatedPayslip.employeePosition}</span>
                                        </div>
                                        <div className="summary-row">
                                            <span>Period:</span>
                                            <span>{months[calculatedPayslip.month - 1]} {calculatedPayslip.year}</span>
                                        </div>
                                    </div>

                                    <div className="working-days-info">
                                        <h5>Working Days Information</h5>
                                        <div className="info-grid">
                                            <div className="info-item">
                                                <span>Total Working Days:</span>
                                                <span className="value">{calculatedPayslip.totalWorkingDays}</span>
                                            </div>
                                            <div className="info-item">
                                                <span>Unpaid Leave Days:</span>
                                                <span className="value highlight-red">{calculatedPayslip.unpaidLeaveDays}</span>
                                            </div>
                                            <div className="info-item">
                                                <span>Effective Working Days:</span>
                                                <span className="value">{calculatedPayslip.effectiveWorkingDays}</span>
                                            </div>
                                            <div className="info-item">
                                                <span>Daily Rate:</span>
                                                <span className="value">₹{calculatedPayslip.dailyRate?.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="salary-breakdown">
                                        <div className="earnings-section">
                                            <h5>Earnings</h5>
                                            <div className="breakdown-item">
                                                <span>Basic Salary:</span>
                                                <span>₹{calculatedPayslip.basicSalary?.toFixed(2) || '0.00'}</span>
                                            </div>
                                            <div className="breakdown-item">
                                                <span>HRA:</span>
                                                <span>₹{calculatedPayslip.hra?.toFixed(2) || '0.00'}</span>
                                            </div>
                                            <div className="breakdown-item">
                                                <span>Medical Allowance:</span>
                                                <span>₹{calculatedPayslip.medicalAllowance?.toFixed(2) || '0.00'}</span>
                                            </div>
                                            <div className="breakdown-item">
                                                <span>Conveyance Allowance:</span>
                                                <span>₹{calculatedPayslip.conveyanceAllowance?.toFixed(2) || '0.00'}</span>
                                            </div>
                                            <div className="breakdown-item">
                                                <span>Special Allowance:</span>
                                                <span>₹{calculatedPayslip.specialAllowance?.toFixed(2) || '0.00'}</span>
                                            </div>
                                            <div className="breakdown-item">
                                                <span>Performance Bonus:</span>
                                                <span>₹{calculatedPayslip.performanceBonus?.toFixed(2) || '0.00'}</span>
                                            </div>
                                            <div className="breakdown-total">
                                                <span><strong>Gross Monthly Salary:</strong></span>
                                                <span><strong>₹{calculatedPayslip.monthlyNetSalary?.toFixed(2)}</strong></span>
                                            </div>
                                        </div>

                                        <div className="deductions-section">
                                            <h5>Deductions</h5>
                                            <div className="breakdown-item">
                                                <span>Provident Fund:</span>
                                                <span>₹{calculatedPayslip.providentFund?.toFixed(2) || '0.00'}</span>
                                            </div>
                                            <div className="breakdown-item">
                                                <span>Professional Tax:</span>
                                                <span>₹{calculatedPayslip.professionalTax?.toFixed(2) || '0.00'}</span>
                                            </div>
                                            <div className="breakdown-item">
                                                <span>Income Tax:</span>
                                                <span>₹{calculatedPayslip.incomeTax?.toFixed(2) || '0.00'}</span>
                                            </div>
                                            <div className="breakdown-item">
                                                <span>Insurance Premium:</span>
                                                <span>₹{calculatedPayslip.insurancePremium?.toFixed(2) || '0.00'}</span>
                                            </div>
                                            <div className="breakdown-item highlight-red">
                                                <span>Unpaid Leave Deduction:</span>
                                                <span>₹{calculatedPayslip.unpaidLeaveDeduction?.toFixed(2) || '0.00'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="final-salary">
                                        <div className="final-amount">
                                            <span><strong>Final Net Salary:</strong></span>
                                            <span className="amount"><strong>₹{calculatedPayslip.finalNetSalary?.toFixed(2)}</strong></span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="form-actions">
                                <button type="button" className="btn-cancel" onClick={resetForm}>
                                    Cancel
                                </button>
                                {calculatedPayslip && (
                                    <button 
                                        type="button" 
                                        className="btn-primary" 
                                        onClick={generateAndSavePayslip}
                                        disabled={loading}
                                    >
                                        {loading ? 'Generating...' : 'Generate'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Current Month Generation Modal */}
            {showCurrentMonthModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                🚀 Generate Current Month Payroll
                            </h3>
                            <button className="close-btn" onClick={() => setShowCurrentMonthModal(false)}>×</button>
                        </div>

                        <div className="modal-body" style={{ padding: '25px' }}>
                            <div className="confirmation-content">
                                <div className="current-month-info" style={{
                                    background: '#e3f2fd',
                                    padding: '20px',
                                    borderRadius: '12px',
                                    marginBottom: '20px',
                                    border: '2px solid #bbdefb',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '48px', marginBottom: '15px' }}>📊</div>
                                    <h4 style={{ margin: '0 0 10px 0', color: '#1976d2', fontSize: '20px' }}>
                                        Generate Payroll for {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                    </h4>
                                    <p style={{ margin: 0, color: '#555', fontSize: '14px', lineHeight: '1.5' }}>
                                        This will automatically generate payslips for all eligible employees based on their current CTC structure
                                    </p>
                                </div>

                                <div className="process-details" style={{
                                    background: '#f8f9fa',
                                    padding: '20px',
                                    borderRadius: '10px',
                                    marginBottom: '20px',
                                    border: '1px solid #e9ecef'
                                }}>
                                    <h4 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '16px' }}>
                                        📋 What will be processed:
                                    </h4>
                                    <ul style={{ margin: 0, paddingLeft: '20px', color: '#555', lineHeight: '1.6' }}>
                                        <li>All employees with active CTC configurations</li>
                                        <li>Automatic calculation of salary components</li>
                                        <li>Include unpaid leave deductions from attendance</li>
                                        <li>Skip employees who already have payslips for this month</li>
                                        <li>Generate downloadable PDF payslips</li>
                                        <li>Update payroll records in the system</li>
                                    </ul>
                                </div>

                                <div className="warning-section" style={{
                                    background: '#fff3e0',
                                    padding: '15px',
                                    borderRadius: '8px',
                                    border: '2px solid #ffcc02',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px'
                                }}>
                                    <div style={{ fontSize: '24px' }}>⚠️</div>
                                    <div>
                                        <p style={{ margin: '0 0 5px 0', color: '#f57f17', fontWeight: '600', fontSize: '14px' }}>
                                            Important Notice
                                        </p>
                                        <p style={{ margin: 0, color: '#f57f17', fontSize: '13px' }}>
                                            This action will generate official payslips and cannot be undone. Please ensure all employee data and CTC structures are up to date.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="form-actions" style={{ 
                                marginTop: '25px', 
                                display: 'flex', 
                                gap: '15px',
                                justifyContent: 'flex-end'
                            }}>
                                <button 
                                    type="button" 
                                    className="btn-cancel"
                                    onClick={() => setShowCurrentMonthModal(false)}
                                    style={{
                                        padding: '12px 24px',
                                        border: '2px solid #ccc',
                                        background: 'transparent',
                                        color: '#666',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '600'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="button" 
                                    className="btn-primary"
                                    onClick={generateCurrentMonthPayroll}
                                    disabled={manualGenerationLoading}
                                    style={{
                                        padding: '12px 24px',
                                        border: 'none',
                                        background: manualGenerationLoading ? '#ccc' : 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
                                        color: 'white',
                                        borderRadius: '8px',
                                        cursor: manualGenerationLoading ? 'not-allowed' : 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        boxShadow: manualGenerationLoading ? 'none' : '0 4px 15px rgba(255, 152, 0, 0.4)'
                                    }}
                                >
                                    {manualGenerationLoading ? (
                                        <>
                                            <div style={{ 
                                                width: '16px', 
                                                height: '16px',
                                                border: '2px solid rgba(255,255,255,0.3)',
                                                borderTop: '2px solid white',
                                                borderRadius: '50%',
                                                animation: 'spin 1s linear infinite'
                                            }}></div>
                                            Generating Payroll...
                                        </>
                                    ) : (
                                        <>
                                            🚀 Confirm & Generate
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Specific Month Generation Modal */}
            {showSpecificMonthModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                📅 Generate Specific Month Payroll
                            </h3>
                            <button className="close-btn" onClick={() => setShowSpecificMonthModal(false)}>×</button>
                        </div>

                        <div className="modal-body" style={{ padding: '20px' }}>
                            <div className="specific-month-form">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>
                                            Select Month
                                        </label>
                                        <select
                                            name="month"
                                            value={specificMonthData.month}
                                            onChange={handleSpecificMonthInputChange}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                border: '2px solid #e0e0e0',
                                                borderRadius: '8px',
                                                fontSize: '14px',
                                                backgroundColor: '#fff'
                                            }}
                                            required
                                        >
                                            <option value="">Choose Month</option>
                                            {months.map((month, index) => (
                                                <option key={index} value={month}>{month}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>
                                            Select Year
                                        </label>
                                        <input
                                            type="number"
                                            name="year"
                                            value={specificMonthData.year}
                                            onChange={handleSpecificMonthInputChange}
                                            min="2020"
                                            max="2030"
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                border: '2px solid #e0e0e0',
                                                borderRadius: '8px',
                                                fontSize: '14px',
                                                backgroundColor: '#fff'
                                            }}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="info-section" style={{
                                    background: '#f8f9ff',
                                    padding: '15px',
                                    borderRadius: '8px',
                                    marginTop: '20px',
                                    border: '1px solid #e3f2fd'
                                }}>
                                    <h4 style={{ margin: '0 0 10px 0', color: '#1976d2', fontSize: '16px' }}>
                                        ℹ️ What will happen:
                                    </h4>
                                    <ul style={{ margin: 0, paddingLeft: '20px', color: '#555' }}>
                                        <li>Generate payslips for all employees with active CTC</li>
                                        <li>Automatically calculate all salary components</li>
                                        <li>Include unpaid leave deductions if applicable</li>
                                        <li>Skip employees who already have payslips for this period</li>
                                        <li>Send email notifications to employees (if configured)</li>
                                    </ul>
                                </div>

                                <div className="confirmation-section" style={{
                                    background: '#fff3e0',
                                    padding: '15px',
                                    borderRadius: '8px',
                                    marginTop: '15px',
                                    border: '1px solid #ffcc02'
                                }}>
                                    <p style={{ margin: 0, color: '#f57f17', fontWeight: '600', fontSize: '14px' }}>
                                        ⚠️ This action cannot be undone. Make sure you have selected the correct month and year.
                                    </p>
                                </div>
                            </div>

                            <div className="form-actions" style={{ 
                                marginTop: '25px', 
                                display: 'flex', 
                                gap: '15px',
                                justifyContent: 'flex-end'
                            }}>
                                <button 
                                    type="button" 
                                    className="btn-cancel"
                                    onClick={() => setShowSpecificMonthModal(false)}
                                    style={{
                                        padding: '12px 24px',
                                        border: '2px solid #ccc',
                                        background: 'transparent',
                                        color: '#666',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '600'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="button" 
                                    className="btn-primary"
                                    onClick={generateSpecificMonthPayroll}
                                    disabled={manualGenerationLoading || !specificMonthData.month || !specificMonthData.year}
                                    style={{
                                        padding: '12px 24px',
                                        border: 'none',
                                        background: manualGenerationLoading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        color: 'white',
                                        borderRadius: '8px',
                                        cursor: manualGenerationLoading ? 'not-allowed' : 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    {manualGenerationLoading ? (
                                        <>
                                            <div style={{ 
                                                width: '16px', 
                                                height: '16px',
                                                border: '2px solid rgba(255,255,255,0.3)',
                                                borderTop: '2px solid white',
                                                borderRadius: '50%',
                                                animation: 'spin 1s linear infinite'
                                            }}></div>
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            🚀 Generate Payroll
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Scheduler Status Modal */}
            {showStatusModal && (
                <div className="modal-overlay">
                    <div className="modal" style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                🔍 Scheduler Status Details
                            </h3>
                            <button className="close-btn" onClick={() => setShowStatusModal(false)}>×</button>
                        </div>

                        <div className="modal-body" style={{ padding: '25px' }}>
                            {schedulerStatus ? (
                                <div className="status-details">
                                    <div className="status-header" style={{
                                        background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                                        color: 'white',
                                        padding: '20px',
                                        borderRadius: '12px',
                                        marginBottom: '20px',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ fontSize: '48px', marginBottom: '10px' }}>✅</div>
                                        <h4 style={{ margin: '0 0 8px 0', fontSize: '20px' }}>Scheduler is Active</h4>
                                        <p style={{ margin: 0, opacity: '0.9' }}>
                                            Automatic payroll generation is running successfully
                                        </p>
                                    </div>

                                    <div className="status-grid" style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: '15px',
                                        marginBottom: '20px'
                                    }}>
                                        <div className="status-card" style={{
                                            background: '#f8f9fa',
                                            padding: '18px',
                                            borderRadius: '10px',
                                            border: '2px solid #e9ecef'
                                        }}>
                                            <div style={{ fontSize: '24px', marginBottom: '8px' }}>📅</div>
                                            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>CURRENT DATE</div>
                                            <div style={{ fontWeight: '700', color: '#333', fontSize: '16px' }}>
                                                {schedulerStatus.currentDate}
                                            </div>
                                        </div>

                                        <div className="status-card" style={{
                                            background: '#f8f9fa',
                                            padding: '18px',
                                            borderRadius: '10px',
                                            border: '2px solid #e9ecef'
                                        }}>
                                            <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏰</div>
                                            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>NEXT RUN DATE</div>
                                            <div style={{ fontWeight: '700', color: '#333', fontSize: '16px' }}>
                                                {schedulerStatus.lastDayOfCurrentMonth}
                                            </div>
                                        </div>

                                        <div className="status-card" style={{
                                            background: '#f8f9fa',
                                            padding: '18px',
                                            borderRadius: '10px',
                                            border: '2px solid #e9ecef',
                                            gridColumn: '1 / -1'
                                        }}>
                                            <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚙️</div>
                                            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>CRON EXPRESSION</div>
                                            <div style={{ 
                                                fontWeight: '700', 
                                                color: '#333', 
                                                fontSize: '16px',
                                                fontFamily: 'monospace',
                                                background: '#e9ecef',
                                                padding: '8px 12px',
                                                borderRadius: '6px',
                                                marginTop: '8px'
                                            }}>
                                                {schedulerStatus.cronExpression}
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                                                Runs at 11:59 PM on the last day of every month
                                            </div>
                                        </div>
                                    </div>

                                    <div className="scheduler-features" style={{
                                        background: '#e3f2fd',
                                        padding: '20px',
                                        borderRadius: '10px',
                                        border: '2px solid #bbdefb'
                                    }}>
                                        <h4 style={{ margin: '0 0 15px 0', color: '#1976d2', fontSize: '16px' }}>
                                            🔧 Scheduler Features
                                        </h4>
                                        <ul style={{ margin: 0, paddingLeft: '20px', color: '#555', lineHeight: '1.6' }}>
                                            <li><strong>Automatic Generation:</strong> Payroll runs automatically at month-end</li>
                                            <li><strong>Recovery Mechanism:</strong> Missed runs are caught and executed at 12:05 AM</li>
                                            <li><strong>Error Handling:</strong> Comprehensive logging and error notifications</li>
                                            <li><strong>Manual Override:</strong> HR/Admin can trigger manual generation anytime</li>
                                            <li><strong>Status Monitoring:</strong> Real-time scheduler status and health checks</li>
                                        </ul>
                                    </div>
                                </div>
                            ) : (
                                <div className="status-loading" style={{
                                    textAlign: 'center',
                                    padding: '40px',
                                    color: '#666'
                                }}>
                                    <div style={{ 
                                        width: '40px', 
                                        height: '40px',
                                        border: '4px solid #e0e0e0',
                                        borderTop: '4px solid #1976d2',
                                        borderRadius: '50%',
                                        animation: 'spin 1s linear infinite',
                                        margin: '0 auto 20px auto'
                                    }}></div>
                                    <p>Loading scheduler status...</p>
                                </div>
                            )}

                            <div className="status-actions" style={{ 
                                marginTop: '25px',
                                display: 'flex', 
                                justifyContent: 'center'
                            }}>
                                <button 
                                    type="button" 
                                    className="btn-primary"
                                    onClick={() => setShowStatusModal(false)}
                                    style={{
                                        padding: '12px 30px',
                                        border: 'none',
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        color: 'white',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '600'
                                    }}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Payslip View Modal */}
            {selectedPayslip && (
                <div className="modal-overlay">
                    <div className="modal payslip-view-modal">
                        <div className="modal-header">
                            <h3>Payslip Details</h3>
                            <button className="close-btn" onClick={() => setSelectedPayslip(null)}>×</button>
                        </div>

                        <div className="payslip-view">
                            <div className="payslip-header-info">
                                <h4>Employee: {selectedPayslip.employeeName || `EMP-${selectedPayslip.employeeId}`}</h4>
                                <p>Pay Period: {selectedPayslip.payrollMonth} {selectedPayslip.payrollYear}</p>
                            </div>

                            <div className="payslip-details">
                                <div className="section">
                                    <h5>Earnings</h5>
                                    <div className="detail-row">
                                        <span>Basic Salary:</span>
                                        <span>{formatCurrency(selectedPayslip.basicSalary)}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span>HRA:</span>
                                        <span>{formatCurrency(selectedPayslip.hra)}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span>Allowances:</span>
                                        <span>{formatCurrency(selectedPayslip.allowances)}</span>
                                    </div>
                                    <div className="detail-row total">
                                        <span>Gross Salary:</span>
                                        <span>{formatCurrency(selectedPayslip.grossSalary)}</span>
                                    </div>
                                </div>

                                <div className="section">
                                    <h5>Deductions</h5>
                                    <div className="detail-row">
                                        <span>PF Contribution:</span>
                                        <span>{formatCurrency(selectedPayslip.pfDeduction)}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span>Professional Tax:</span>
                                        <span>{formatCurrency(selectedPayslip.professionalTax)}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span>Income Tax:</span>
                                        <span>{formatCurrency(selectedPayslip.incomeTax)}</span>
                                    </div>
                                    <div className="detail-row total">
                                        <span>Total Deductions:</span>
                                        <span>{formatCurrency(selectedPayslip.totalDeductions)}</span>
                                    </div>
                                </div>

                                <div className="net-pay-section">
                                    <div className="detail-row net-pay-row">
                                        <span>Net Pay:</span>
                                        <span>{formatCurrency(selectedPayslip.netPay)}</span>
                                    </div>
                                </div>

                                <div className="attendance-section">
                                    <h5>Attendance</h5>
                                    <div className="detail-row">
                                        <span>Working Days:</span>
                                        <span>{selectedPayslip.workingDays}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span>Attended Days:</span>
                                        <span>{selectedPayslip.attendedDays}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="payslip-actions">
                                <button
                                    className="btn-download"
                                    onClick={() => downloadPayslip(selectedPayslip.payslipId)}
                                >
                                    Download PDF
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            </div>
        </div>
    );
};

export default PayrollDashboard;