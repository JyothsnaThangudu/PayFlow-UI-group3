// PayrollDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import SidebarManager from '../components/SidebarManager';
import './PayrollDashboard.css';
import Sidebar from "../components/Sidebar";

function PayrollDashboard() {
    const managerId = localStorage.getItem('managerId');
    const [payrolls, setPayrolls] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const role = localStorage.getItem('role')?.toUpperCase();


    useEffect(() => {
        async function fetchPayrolls() {
            try {
                const teamRes = await axios.get(`/api/manager/${managerId}/team`);
                const employeeIds = teamRes.data.map(emp => ({
                    id: emp.id,
                    name: emp.fullName,
                }));

                const allPayrolls = await Promise.all(
                    employeeIds.map(emp =>
                        axios.get(`/api/payrolls/employee/${emp.id}`).then(res =>
                            res.data.map(p => ({
                                ...p,
                                employeeName: emp.name,
                                salary: p.netSalary,
                                month: p.paymentDate,
                                number_of_leaves: p.number_of_leaves || p.numberOfLeaves || 0,
                                payslipUrl: "", // add this later
                            }))
                        )
                    )
                );

                const merged = allPayrolls.flat();
                setPayrolls(merged);
            } catch (err) {
                console.error("Error fetching payrolls:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchPayrolls();
    }, [managerId]);


    return (
        <div className="manager-dashboard-layout">
            {/*<SidebarManager />*/}
            {role === 'MANAGER' ? (
                <SidebarManager />
            ) : role === 'HR' ? (
                <Sidebar/>
            ) : null}

            <main className="manager-dashboard-main">
                <div className="payroll-header">
                    <h2>Payroll Summary</h2>
                    <div className="button-wrapper">
                        <button className="btn-primary" onClick={() => navigate('/manager/schedule')}>
                            ➕ Schedule Payroll
                        </button>
                        <button
                            className="btn-primary"
                            onClick={() => navigate('/manager/payslip-viewer')}
                        >
                            View Payslip
                        </button>

                    </div>
                </div>


                {loading ? (
                    <div className="loading">Loading payroll data...</div>
                ) : payrolls.length === 0 ? (
                    <p>No payroll data found.</p>
                ) : (
                    <div className="payroll-table">
                        <div className="table-header">
                            <div>Employee</div>
                            <div>Payment Date</div>
                            <div>Base Salary</div>
                            <div>Final Salary</div>
                            <div>Leaves</div>
                            <div>Status</div>
                            <div>Actions</div>
                        </div>
                        {payrolls.map((pay) => (
                            <div className="table-row" key={pay.id}>
                                <div>{pay.employeeName || `Employee #${pay.employeeId}`}</div>
                                <div>{pay.month}</div>
                                <div>₹{pay.baseSalary || '—'}</div>
                                <div>₹{pay.salary || '—'}</div>
                                <div>{pay.number_of_leaves || 0}</div>
                                <div className={`status-badge ${pay.status?.toLowerCase()}`}>{pay.status}</div>
                                <div className="action-buttons">
                                    <button title="Track">🔍</button>
                                    <button title="Retry">🔁</button>
                                    <button title="Cancel">✖️</button>
                                    <button title="Hold">⏸</button>
                                </div>
                            </div>
                        ))}
                    </div>

                    // <div className="payroll-table">
                    //     <div className="table-header">
                    //         <div>Employee</div>
                    //         <div>Month</div>
                    //         <div>Salary</div>
                    //         <div>Status</div>
                    //         <div>Action</div>
                    //     </div>
                    //     {payrolls.map((pay) => (
                    //         <div className="table-row" key={pay.id}>
                    //             <div>{pay.employeeName || `Employee #${pay.employeeId}`}</div>
                    //             <div>{pay.month}</div>
                    //             <div>₹{pay.salary}</div>
                    //             <div className={`status-badge ${pay.status?.toLowerCase()}`}>{pay.status}</div>
                    //             <div>
                    //                 {pay.payslipUrl ? (
                    //                     <a href={pay.payslipUrl} target="_blank" rel="noreferrer">Download</a>
                    //                 ) : (
                    //                     <span>Not available</span>
                    //                 )}
                    //             </div>
                    //         </div>
                    //     ))}
                    // </div>
                )}
            </main>
        </div>
    );
}

export default PayrollDashboard;