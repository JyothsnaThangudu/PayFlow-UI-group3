// PayslipViewer.jsx
import React, { useState, useEffect } from 'react';
import axios from '../utils/axios';
import './PayslipViewer.css';
import SidebarManager from '../components/SidebarManager';
import ProfessionalPayslip from '../components/ProfessionalPayslip';

import jsPDF from 'jspdf';
import 'jspdf-autotable'; // ✅ This line is necessary


function PayslipViewer() {
    const [employeeId, setEmployeeId] = useState('');
    const [employees, setEmployees] = useState([]);
    const [cycle, setCycle] = useState('');
    const [payslip, setPayslip] = useState(null);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const managerId = localStorage.getItem('managerId');
        axios.get(`/api/manager/${managerId}/team`)
            .then(res => setEmployees(res.data))
            .catch(err => console.error('Failed to load team:', err));
    }, []);

    // helper inside component
    const getFullName = (p) =>
        p?.fullName || [p?.firstName, p?.lastName].filter(Boolean).join(' ') || 'N/A';

    const showMessage = (type, text) => {
        setMessage(text);
        setTimeout(() => setMessage(''), 5000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.get(`/api/payrolls/payslip`, {
                params: { employeeId, cycle }
            });
            const data = res.data;

            // derive name from selected employee since payslip lacks fullName
            const emp = employees.find(
                (e) => String(e.id ?? e._id) === String(employeeId)
            );

            const fullName =
                emp?.fullName ||
                [emp?.firstName, emp?.lastName].filter(Boolean).join(' ') ||
                'N/A';

            setPayslip({ ...data, fullName });
            setMessage('');
        } catch (err) {
            setPayslip(null);
            setMessage('Payslip not found.');
        }
    };


    // const handleSubmit = async (e) => {
    //     e.preventDefault();
    //     try {
    //         const res = await axios.get(`/api/payrolls/payslip`, {
    //             params: { employeeId, cycle }
    //         });
    //         console.log("payslip payload:", res.data);
    //         setPayslip(res.data);
    //         setMessage('');
    //     } catch (err) {
    //         setPayslip(null);
    //         setMessage('Payslip not found.');
    //     }
    // };



    const handleDownload = async () => {
        if (!payslip) {
            alert('No payslip data to download');
            return;
        }

        try {
            // Fetch complete payslip data with employee information from backend
            const response = await axios.get(`/api/ctc-management/payslip/download/${payslip.payslipId}`);
            const { payslip: fullPayslip, employee } = response.data;

            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.width;
            const pageHeight = doc.internal.pageSize.height;
            
            // Professional outer border
            doc.setLineWidth(1.5);
            doc.rect(15, 15, pageWidth - 30, 250);
            
            // Header section with logo and company details
            doc.setLineWidth(1);
            doc.rect(15, 15, pageWidth - 30, 50);
            
            // Professional logo area (blue rectangle with icon)
            doc.setFillColor(70, 130, 180);
            doc.rect(25, 25, 25, 30, 'F');
            
            // Professional icon representation
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('🏢', 35, 42);
            
            // Company name - professional styling
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text('PayFlow Solutions', pageWidth / 2, 35, { align: 'center' });
            
            // Company address
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text('123 Business District, Tech City, State - 123456', pageWidth / 2, 45, { align: 'center' });
            
            // Pay slip title with cycle
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(`Pay Slip for ${fullPayslip.cycle || 'August 2025'}`, pageWidth / 2, 57, { align: 'center' });
            
            // Employee details section - Professional table
            let startY = 75;
            
            const employeeDetails = [
                ['Employee ID', fullPayslip.employeeId?.toString() || '7', 'UAN', '-'],
                ['Employee Name', employee?.fullName || employee?.firstName || 'Hari', 'PF No.', '-'],
                ['Designation', employee?.designation || 'SDE', 'ESI No.', '-'],
                ['Department', employee?.department || 'IT', 'Bank', '-'],
                ['Date of Joining', employee?.joinDate || '2025-07-30', 'Account No.', '-']
            ];
            
            doc.autoTable({
                startY: startY,
                body: employeeDetails,
                theme: 'grid',
                styles: {
                    fontSize: 9,
                    cellPadding: 3,
                    lineColor: [0, 0, 0],
                    lineWidth: 0.5,
                    valign: 'middle'
                },
                columnStyles: {
                    0: { cellWidth: 45, fontStyle: 'bold' },
                    1: { cellWidth: 50 },
                    2: { cellWidth: 45, fontStyle: 'bold' },
                    3: { cellWidth: 50 }
                },
                margin: { left: 20, right: 20 }
            });
            
            // Working days section - Clean layout
            startY = doc.lastAutoTable.finalY + 2;
            
            const workingDaysData = [
                ['Gross Wages', '₹61,166.67', '', ''],
                ['Total Working Days', '22', 'Leaves', fullPayslip.numberOfLeaves?.toString() || '0'],
                ['LOP Days', '0', 'Paid Days', '22']
            ];
            
            doc.autoTable({
                startY: startY,
                body: workingDaysData,
                theme: 'grid',
                styles: {
                    fontSize: 9,
                    cellPadding: 3,
                    lineColor: [0, 0, 0],
                    lineWidth: 0.5,
                    valign: 'middle'
                },
                columnStyles: {
                    0: { cellWidth: 47.5, fontStyle: 'bold' },
                    1: { cellWidth: 47.5 },
                    2: { cellWidth: 47.5, fontStyle: 'bold' },
                    3: { cellWidth: 47.5 }
                },
                margin: { left: 20, right: 20 }
            });
            
            // Earnings and Deductions header - Professional styling
            startY = doc.lastAutoTable.finalY + 2;
            
            doc.autoTable({
                startY: startY,
                body: [['Earnings', '', 'Deductions', '']],
                theme: 'grid',
                styles: {
                    fontSize: 10,
                    cellPadding: 4,
                    lineColor: [0, 0, 0],
                    lineWidth: 0.5,
                    fontStyle: 'bold',
                    halign: 'center',
                    fillColor: [240, 240, 240]
                },
                columnStyles: {
                    0: { cellWidth: 47.5 },
                    1: { cellWidth: 47.5 },
                    2: { cellWidth: 47.5 },
                    3: { cellWidth: 47.5 }
                },
                margin: { left: 20, right: 20 }
            });
            
            // Earnings and Deductions data - Exact values from template
            startY = doc.lastAutoTable.finalY;
            
            const earningsDeductionsData = [
                ['Basic', '₹41,666.67', 'EPF', '₹500.00'],
                ['HRA', '₹12,500.00', 'ESI', '₹0'],
                ['Conveyance Allowance', '₹6,666.67', 'Professional Tax', '₹4,033.33'],
                ['Medical Allowance', '₹250', '', ''],
                ['Other Allowances', '₹333.33', '', '']
            ];
            
            doc.autoTable({
                startY: startY,
                body: earningsDeductionsData,
                theme: 'grid',
                styles: {
                    fontSize: 9,
                    cellPadding: 3,
                    lineColor: [0, 0, 0],
                    lineWidth: 0.5,
                    valign: 'middle'
                },
                columnStyles: {
                    0: { cellWidth: 47.5 },
                    1: { cellWidth: 47.5, halign: 'right' },
                    2: { cellWidth: 47.5 },
                    3: { cellWidth: 47.5, halign: 'right' }
                },
                margin: { left: 20, right: 20 }
            });
            
            // Totals row - Professional styling
            startY = doc.lastAutoTable.finalY;
            
            doc.autoTable({
                startY: startY,
                body: [['Total Earnings', '₹61,166.67', 'Total Deductions', '₹4,533.33']],
                theme: 'grid',
                styles: {
                    fontSize: 9,
                    cellPadding: 3,
                    lineColor: [0, 0, 0],
                    lineWidth: 0.5,
                    fontStyle: 'bold',
                    fillColor: [245, 245, 245]
                },
                columnStyles: {
                    0: { cellWidth: 47.5 },
                    1: { cellWidth: 47.5, halign: 'right' },
                    2: { cellWidth: 47.5 },
                    3: { cellWidth: 47.5, halign: 'right' }
                },
                margin: { left: 20, right: 20 }
            });
            
            // Net Salary - Final professional row
            startY = doc.lastAutoTable.finalY;
            
            doc.autoTable({
                startY: startY,
                body: [['Net Salary', '₹56,633.34']],
                theme: 'grid',
                styles: {
                    fontSize: 11,
                    cellPadding: 5,
                    lineColor: [0, 0, 0],
                    lineWidth: 0.5,
                    fontStyle: 'bold',
                    halign: 'right',
                    fillColor: [235, 235, 235]
                },
                columnStyles: {
                    0: { cellWidth: 95 },
                    1: { cellWidth: 95 }
                },
                margin: { left: 20, right: 20 }
            });

            // Save with professional filename
            doc.save(`Payslip-${employee?.fullName || employee?.firstName || 'Employee'}-${fullPayslip.cycle || 'August-2025'}.pdf`);
            
        } catch (error) {
            console.error('Error generating payslip PDF:', error);
            alert('Failed to generate payslip PDF. Please try again.');
        }
    };


    // const handleDownload = () => {
    //     const blob = new Blob([JSON.stringify(payslip, null, 2)], { type: 'application/json' });
    //     const link = document.createElement('a');
    //     link.href = window.URL.createObjectURL(blob);
    //     link.download = `Payslip-${payslip.employeeId}-${payslip.cycle}.json`;
    //     link.click();
    // };

    return (
        <div className="manager-dashboard-layout">
            <SidebarManager />
        <div className="payslip-viewer-container">
            <h2>View Payslip</h2>
            <form onSubmit={handleSubmit} className="payslip-form">
                <label>Employee</label>
                <select value={employeeId} onChange={e => setEmployeeId(e.target.value)} required>
                    <option value="">Select Employee</option>
                    {employees.map(emp => {
                        const displayName =
                            emp.fullName || [emp.firstName, emp.lastName].filter(Boolean).join(' ') || 'Unknown';
                        const value = emp.id ?? emp._id;
                        return (
                            <option key={value} value={value}>
                                {displayName}
                            </option>
                        );
                    })}
                </select>


                {/*<label>Employee</label>*/}
                {/*<select value={employeeId} onChange={e => setEmployeeId(e.target.value)} required>*/}
                {/*    <option value="">Select Employee</option>*/}
                {/*    {employees.map(emp => (*/}
                {/*        <option key={emp.id} value={emp.id}>{emp.fullName}</option>*/}
                {/*    ))}*/}
                {/*</select>*/}

                <label>Cycle (Month & Year):</label>
                <input
                    type="month"
                    value={cycle}
                    onChange={e => setCycle(e.target.value)}
                    required
                />

                <button type="submit">Fetch Payslip</button>
            </form>

            {message && <p className="error">{message}</p>}

            {payslip && (
                <div className="payslip-details-section">
                    <div className="payslip-details-card-group">
                        <div className="payslip-card">
                            <h4>Base Salary</h4>
                            <p>₹{payslip.baseSalary}</p>
                        </div>
                        <div className="payslip-card">
                            <h4>Leaves</h4>
                            <p>{payslip.numberOfLeaves}</p>
                        </div>
                        <div className="payslip-card">
                            <h4>Deductions</h4>
                            <p>₹{payslip.deductionAmount}</p>
                        </div>
                        <div className="payslip-card">
                            <h4>Final Salary</h4>
                            <p>₹{payslip.netSalary}</p>
                        </div>
                    </div>

                    <div className="payslip-download-btn-container">
                        <button onClick={handleDownload}>⬇️ Download Payslip (PDF)</button>
                    </div>
                    
                    {/* Professional Payslip Component */}
                    <div style={{ marginTop: '30px', borderTop: '2px solid #ddd', paddingTop: '20px' }}>
                        <h3>Professional Payslip Preview:</h3>
                        <ProfessionalPayslip 
                            payslipData={payslip} 
                            employee={employees.find(e => String(e.id ?? e._id) === String(employeeId))}
                            onDownload={(type, message) => setMessage(message)}
                        />
                    </div>
                </div>
            )}



            {/*{payslip && (*/}
            {/*    <div className="payslip-details">*/}
            {/*        <p><strong>Base Salary:</strong> ₹{payslip.baseSalary}</p>*/}
            {/*        <p><strong>Leaves:</strong> {payslip.numberOfLeaves}</p>*/}
            {/*        <p><strong>Deductions:</strong> ₹{payslip.deductionAmount}</p>*/}
            {/*        <p><strong>Final Salary:</strong> ₹{payslip.netSalary}</p>*/}
            {/*        <button onClick={handleDownload}>⬇️ Download Payslip (JSON)</button>*/}
            {/*    </div>*/}
            {/*)}*/}
        </div>
        </div>
    );
}

export default PayslipViewer;
