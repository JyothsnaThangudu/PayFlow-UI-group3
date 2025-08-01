// PayslipViewer.jsx
import React, { useState, useEffect } from 'react';
import axios from '../utils/axios';
import './PayslipViewer.css';
import SidebarManager from '../components/SidebarManager';

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



    const handleDownload = () => {
        const doc = new jsPDF();

        doc.setFontSize(20);
        doc.text('PayFlow Pvt. Ltd.', 14, 20);
        doc.setFontSize(14);
        doc.text('Official Payslip Document', 14, 30);

        doc.setFontSize(12);
        doc.text(`Payslip for: ${payslip.cycle}`, 14, 42);
        // in PDF
        doc.text(`Employee Name: ${getFullName(payslip)}`, 14, 50);
        doc.text(`Employee ID: ${payslip.employeeId}`, 14, 58);

        doc.autoTable({
            startY: 85,
            head: [['Earnings / Deductions', 'Amount (Rupees)']],
            body: [
                ['Base Salary', payslip.baseSalary],
                ['Leaves Taken', payslip.numberOfLeaves],
                ['Deductions', payslip.deductionAmount],
                ['Net Salary', payslip.netSalary],
            ],
            styles: { fontSize: 12 },
            headStyles: { fillColor: [22, 160, 133], textColor: 255 }
        });

        const finalY = doc.lastAutoTable.finalY + 20;
        doc.setFontSize(11);
        doc.text('This is a computer-generated payslip.', 14, finalY);
        doc.text('Authorized by PayFlow HR Department', 14, finalY + 8);

        doc.save(`Payslip-${payslip.employeeId}-${payslip.cycle}.pdf`);
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
