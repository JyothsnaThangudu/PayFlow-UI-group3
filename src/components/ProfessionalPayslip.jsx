import React from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const ProfessionalPayslip = ({ payslipData, employee, onDownload }) => {
    const generatePDF = async () => {
        const element = document.getElementById('payslip-template');
        
        try {
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff'
            });
            
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 210;
            const pageHeight = 295;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            pdf.save(`Payslip-${employee?.fullName || 'Employee'}-${payslipData?.cycle || 'August-2025'}.pdf`);
            
            if (onDownload) {
                onDownload('success', 'Payslip downloaded successfully');
            }
        } catch (error) {
            console.error('Error generating PDF:', error);
            if (onDownload) {
                onDownload('error', 'Failed to generate PDF');
            }
        }
    };

    const payslipStyle = {
        width: '210mm',
        minHeight: '297mm',
        padding: '15mm',
        margin: '0 auto',
        backgroundColor: 'white',
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        lineHeight: '1.4',
        border: '2px solid #000',
        boxSizing: 'border-box'
    };

    const headerStyle = {
        border: '1px solid #000',
        padding: '15px',
        marginBottom: '0',
        display: 'flex',
        alignItems: 'center',
        backgroundColor: 'white'
    };

    const logoStyle = {
        width: '50px',
        height: '60px',
        backgroundColor: '#4682B4',
        marginRight: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '24px',
        fontWeight: 'bold'
    };

    const companyInfoStyle = {
        flex: 1,
        textAlign: 'center'
    };

    const tableStyle = {
        width: '100%',
        borderCollapse: 'collapse',
        marginBottom: '2px',
        fontSize: '11px'
    };

    const cellStyle = {
        border: '1px solid #000',
        padding: '8px 6px',
        textAlign: 'left'
    };

    const boldCellStyle = {
        ...cellStyle,
        fontWeight: 'bold'
    };

    const rightAlignStyle = {
        ...cellStyle,
        textAlign: 'right'
    };

    const headerCellStyle = {
        ...cellStyle,
        fontWeight: 'bold',
        textAlign: 'center',
        backgroundColor: '#f0f0f0'
    };

    return (
        <div>
            <button onClick={generatePDF} style={{ marginBottom: '20px', padding: '10px 20px', fontSize: '14px' }}>
                Download Professional Payslip
            </button>
            
            <div id="payslip-template" style={payslipStyle}>
                {/* Header Section */}
                <div style={headerStyle}>
                    <div style={logoStyle}>
                        🏢
                    </div>
                    <div style={companyInfoStyle}>
                        <h1 style={{ margin: '0 0 5px 0', fontSize: '20px', fontWeight: 'bold' }}>
                            PayFlow Solutions
                        </h1>
                        <p style={{ margin: '0 0 5px 0', fontSize: '11px' }}>
                            123 Business District, Tech City, State - 123456
                        </p>
                        <h2 style={{ margin: '10px 0 0 0', fontSize: '14px', fontWeight: 'bold' }}>
                            Pay Slip for {payslipData?.cycle || 'August 2025'}
                        </h2>
                    </div>
                </div>

                {/* Employee Details */}
                <table style={tableStyle}>
                    <tbody>
                        <tr>
                            <td style={boldCellStyle}>Employee ID</td>
                            <td style={cellStyle}>{payslipData?.employeeId || '7'}</td>
                            <td style={boldCellStyle}>UAN</td>
                            <td style={cellStyle}>-</td>
                        </tr>
                        <tr>
                            <td style={boldCellStyle}>Employee Name</td>
                            <td style={cellStyle}>{employee?.fullName || 'Hari'}</td>
                            <td style={boldCellStyle}>PF No.</td>
                            <td style={cellStyle}>-</td>
                        </tr>
                        <tr>
                            <td style={boldCellStyle}>Designation</td>
                            <td style={cellStyle}>{employee?.designation || 'SDE'}</td>
                            <td style={boldCellStyle}>ESI No.</td>
                            <td style={cellStyle}>-</td>
                        </tr>
                        <tr>
                            <td style={boldCellStyle}>Department</td>
                            <td style={cellStyle}>{employee?.department || 'IT'}</td>
                            <td style={boldCellStyle}>Bank</td>
                            <td style={cellStyle}>-</td>
                        </tr>
                        <tr>
                            <td style={boldCellStyle}>Date of Joining</td>
                            <td style={cellStyle}>{employee?.joinDate || '2025-07-30'}</td>
                            <td style={boldCellStyle}>Account No.</td>
                            <td style={cellStyle}>-</td>
                        </tr>
                    </tbody>
                </table>

                {/* Working Days */}
                <table style={tableStyle}>
                    <tbody>
                        <tr>
                            <td style={boldCellStyle}>Gross Wages</td>
                            <td style={cellStyle}>₹61,166.67</td>
                            <td style={cellStyle}></td>
                            <td style={cellStyle}></td>
                        </tr>
                        <tr>
                            <td style={boldCellStyle}>Total Working Days</td>
                            <td style={cellStyle}>22</td>
                            <td style={boldCellStyle}>Leaves</td>
                            <td style={cellStyle}>{payslipData?.numberOfLeaves || '0'}</td>
                        </tr>
                        <tr>
                            <td style={boldCellStyle}>LOP Days</td>
                            <td style={cellStyle}>0</td>
                            <td style={boldCellStyle}>Paid Days</td>
                            <td style={cellStyle}>22</td>
                        </tr>
                    </tbody>
                </table>

                {/* Earnings and Deductions Header */}
                <table style={tableStyle}>
                    <tbody>
                        <tr>
                            <td style={headerCellStyle}>Earnings</td>
                            <td style={headerCellStyle}></td>
                            <td style={headerCellStyle}>Deductions</td>
                            <td style={headerCellStyle}></td>
                        </tr>
                    </tbody>
                </table>

                {/* Earnings and Deductions Data */}
                <table style={tableStyle}>
                    <tbody>
                        <tr>
                            <td style={cellStyle}>Basic</td>
                            <td style={rightAlignStyle}>₹41,666.67</td>
                            <td style={cellStyle}>EPF</td>
                            <td style={rightAlignStyle}>₹500.00</td>
                        </tr>
                        <tr>
                            <td style={cellStyle}>HRA</td>
                            <td style={rightAlignStyle}>₹12,500.00</td>
                            <td style={cellStyle}>ESI</td>
                            <td style={rightAlignStyle}>₹0</td>
                        </tr>
                        <tr>
                            <td style={cellStyle}>Conveyance Allowance</td>
                            <td style={rightAlignStyle}>₹6,666.67</td>
                            <td style={cellStyle}>Professional Tax</td>
                            <td style={rightAlignStyle}>₹4,033.33</td>
                        </tr>
                        <tr>
                            <td style={cellStyle}>Medical Allowance</td>
                            <td style={rightAlignStyle}>₹250</td>
                            <td style={cellStyle}></td>
                            <td style={cellStyle}></td>
                        </tr>
                        <tr>
                            <td style={cellStyle}>Other Allowances</td>
                            <td style={rightAlignStyle}>₹333.33</td>
                            <td style={cellStyle}></td>
                            <td style={cellStyle}></td>
                        </tr>
                    </tbody>
                </table>

                {/* Totals */}
                <table style={tableStyle}>
                    <tbody>
                        <tr>
                            <td style={{...boldCellStyle, backgroundColor: '#f5f5f5'}}>Total Earnings</td>
                            <td style={{...rightAlignStyle, fontWeight: 'bold', backgroundColor: '#f5f5f5'}}>₹61,166.67</td>
                            <td style={{...boldCellStyle, backgroundColor: '#f5f5f5'}}>Total Deductions</td>
                            <td style={{...rightAlignStyle, fontWeight: 'bold', backgroundColor: '#f5f5f5'}}>₹4,533.33</td>
                        </tr>
                    </tbody>
                </table>

                {/* Net Salary */}
                <table style={tableStyle}>
                    <tbody>
                        <tr>
                            <td style={{...boldCellStyle, textAlign: 'right', backgroundColor: '#ebebeb', fontSize: '14px'}}>
                                Net Salary
                            </td>
                            <td style={{...rightAlignStyle, fontWeight: 'bold', backgroundColor: '#ebebeb', fontSize: '14px'}}>
                                ₹56,633.34
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ProfessionalPayslip;
