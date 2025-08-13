import React, { useEffect, useState } from 'react';
import './Dashboard.css';
import Sidebar from "../components/Sidebar";
import Header from "./Header";
import axios from '../utils/axios';

export default function Dashboard() {
    // State for all dynamic sections
    const [employeeCount, setEmployeeCount] = useState(0);
    const [genderStats, setGenderStats] = useState({ male: 0, female: 0 });
    const [announcements, setAnnouncements] = useState([]);
    const [onLeave, setOnLeave] = useState([]);
    const [calendarEvents, setCalendarEvents] = useState([]);
    const [onboardings, setOnboardings] = useState([]);
    const [projects, setProjects] = useState([]);
    const [payrollSummary, setPayrollSummary] = useState({ totalPaid: 0, pending: 0, cycle: '' });
    const [payrollTable, setPayrollTable] = useState([]);
    const [recentOnboardings, setRecentOnboardings] = useState([]);
    const [onboardingsLoading, setOnboardingsLoading] = useState(true);
    const [onboardingsError, setOnboardingsError] = useState(null);

    const [payrollSearch, setPayrollSearch] = useState("");

    // Payroll pagination state and logic (must be after payrollTable is declared)
    const [payrollPage, setPayrollPage] = useState(1);
    const [payrollRowsPerPage, setPayrollRowsPerPage] = useState(10);
    // Filter payrollTable by search
    const filteredPayroll = payrollTable.filter(row =>
        row.employee.toLowerCase().includes(payrollSearch.toLowerCase()) ||
        row.department.toLowerCase().includes(payrollSearch.toLowerCase())
    );
    const payrollTotalPages = Math.ceil(filteredPayroll.length / payrollRowsPerPage);
    const paginatedPayroll = filteredPayroll.slice((payrollPage - 1) * payrollRowsPerPage, payrollPage * payrollRowsPerPage);

    const handlePayrollRowsPerPageChange = (e) => {
        setPayrollRowsPerPage(Number(e.target.value));
        setPayrollPage(1);
    };

    const handlePayrollPageChange = (page) => {
        if (page >= 1 && page <= payrollTotalPages) setPayrollPage(page);
    };

    // Reset to page 1 when search changes
    useEffect(() => {
        setPayrollPage(1);
    }, [payrollSearch]);

    useEffect(() => {
        // Fetch employee count
        axios.get('/api/employee/count')
            .then(res => setEmployeeCount(res.data))
            .catch(() => setEmployeeCount(0));

        // Fetch gender stats (assuming endpoint exists)
        axios.get('/api/employee/gender-stats')
            .then(res => setGenderStats(res.data))
            .catch(() => setGenderStats({ male: 0, female: 0 }));

        // Fetch announcements
        axios.get('/api/announcements')
            .then(res => setAnnouncements(res.data))
            .catch(() => setAnnouncements([]));

        // Fetch employees on leave
        axios.get('/api/leave/today')
            .then(res => setOnLeave(res.data))
            .catch(() => setOnLeave([]));

        // Fetch calendar events
        axios.get('/api/calendar/events')
            .then(res => setCalendarEvents(res.data))
            .catch(() => setCalendarEvents([]));



        // Fetch recent onboarded employees summary
        axios.get('/api/onboarding/summary')
            .then(res => {
                if (Array.isArray(res.data)) {
                    setRecentOnboardings(res.data);
                } else {
                    console.warn('Unexpected onboarding summary format:', res.data);
                    setRecentOnboardings([]);
                    setOnboardingsError('Unexpected data format');
                }
            })
            .catch(err => {
                console.error('Failed to load onboarding summary:', err);
                setRecentOnboardings([]);
                setOnboardingsError('Failed to load onboardings');
            })
            .finally(() => setOnboardingsLoading(false));

        axios.get('/api/projects/summary')
            .then(res => {
                setProjects(Array.isArray(res.data) ? res.data : []);
            })
            .catch(() => setProjects([]));

        axios.get('/api/payroll/summary')
            .then(res => setPayrollSummary(res.data))
            .catch(() => setPayrollSummary({ totalPaid: 0, pending: 0, cycle: '' }));

        // Fetch payroll table
        axios.get('/api/payroll/table')
            .then(res => setPayrollTable(res.data))
            .catch(() => setPayrollTable([]));
    }, []);

    return (
        <div className="dashboard-layout" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e0e7ff 0%, #f8fafc 100%)', fontFamily: 'Inter, Segoe UI, Roboto, Arial, sans-serif', color: '#222' }}>
            <Sidebar />
            <main className="dashboard-main" style={{ padding: '32px 36px 36px 36px', maxWidth: 1400, margin: '0 auto' }}>
                <style>{`
                .dashboard-section {
                    animation: fadeIn 0.7s cubic-bezier(.4,0,.2,1);
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(24px); }
                    to { opacity: 1; transform: none; }
                }
                .card {
                    box-shadow: 0 4px 24px rgba(30,64,175,0.10), 0 1.5px 6px rgba(0,0,0,0.04);
                    border-radius: 16px;
                    background: rgba(255,255,255,0.85);
                    backdrop-filter: blur(2.5px);
                    border: 1.5px solid #e0e7ff;
                    transition: box-shadow 0.22s, transform 0.18s, background 0.18s;
                }
                .card:hover {
                    box-shadow: 0 8px 32px rgba(30,64,175,0.16), 0 2px 8px rgba(0,0,0,0.08);
                    transform: translateY(-2px) scale(1.025);
                    background: rgba(255,255,255,0.97);
                }
                .section-title {
                    font-size: 1.13rem;
                    font-weight: 700;
                    color: #6366f1;
                    margin-bottom: 8px;
                    letter-spacing: 0.01em;
                }
                .count {
                    font-size: 2.5rem;
                    font-weight: 800;
                    color: #22223b;
                    margin-bottom: 8px;
                }
                .stats {
                    font-size: 1rem;
                    color: #64748b;
                    display: flex;
                    gap: 18px;
                }
                .onboarding-table {
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 0;
                    background: rgba(255,255,255,0.98);
                    border-radius: 12px;
                    box-shadow: 0 2px 12px rgba(30,64,175,0.07);
                    overflow: hidden;
                    margin-top: 12px;
                }
                .onboarding-table th, .onboarding-table td {
                    padding: 12px 10px;
                    text-align: left;
                    border-bottom: 1px solid #e5e7eb;
                }
                .onboarding-table th {
                    background: #f3f4f6;
                    font-weight: 700;
                    color: #374151;
                }
                .onboarding-table tr:last-child td {
                    border-bottom: none;
                }
                .status {
                    display: inline-block;
                    padding: 4px 14px;
                    border-radius: 16px;
                    font-size: 0.98rem;
                    font-weight: 600;
                    letter-spacing: 0.01em;
                    background: #e0e7ff;
                    color: #3730a3;
                    border: 1px solid #c7d2fe;
                    transition: background 0.18s, color 0.18s;
                }
                .status.completed {
                    background: #d1fae5;
                    color: #047857;
                    border-color: #6ee7b7;
                }
                .status.pending {
                    background: #fef9c3;
                    color: #b45309;
                    border-color: #fde68a;
                }
                .status.delayed {
                    background: #fee2e2;
                    color: #b91c1c;
                    border-color: #fecaca;
                }
                .avatars {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
                .avatars img {
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    border: 2px solid #fff;
                    box-shadow: 0 1px 4px rgba(30,64,175,0.10);
                    object-fit: cover;
                }
                .avatars span {
                    font-size: 0.98rem;
                    color: #6366f1;
                    font-weight: 600;
                    margin-left: 2px;
                }
                .payroll-stats {
                    display: flex;
                    gap: 32px;
                    margin-bottom: 18px;
                }
                .payroll-item h4 {
                    font-size: 1.01rem;
                    color: #6366f1;
                    margin-bottom: 2px;
                }
                .payroll-item .amount {
                    font-size: 1.18rem;
                    font-weight: 700;
                }
                .payroll-item .text-yellow {
                    color: #eab308;
                }
                .pagination-controls {
                    display: flex;
                    gap: 6px;
                    margin-top: 12px;
                }
                .pagination-controls button {
                    background: #e0e7ff;
                    color: #3730a3;
                    border: none;
                    border-radius: 6px;
                    padding: 6px 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background 0.18s, color 0.18s;
                }
                .pagination-controls button.active, .pagination-controls button:focus {
                    background: #6366f1;
                    color: #fff;
                }
                .pagination-controls button:disabled {
                    background: #f3f4f6;
                    color: #a1a1aa;
                    cursor: not-allowed;
                }
                .dashboard-main {
                    border-top: 2.5px solid #e0e7ff;
                    margin-top: 0;
                }
                `}</style>
                {/* Section 1: Summary Cards */}
                <section className="dashboard-section">
                    <Header/>
                    <div className="card-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 28, margin: '36px 0 32px 0' }}>
                        {/* Total Employees */}
                        <div className="card" style={{ background: '#fff', borderRadius: 14, boxShadow: '0 4px 24px rgba(30,64,175,0.07), 0 1.5px 6px rgba(0,0,0,0.04)', padding: '28px 24px 22px 24px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', transition: 'box-shadow 0.2s, transform 0.18s' }}>
                            <h2 className="section-title" style={{ fontSize: '1.12rem', fontWeight: 700, color: '#6366f1', marginBottom: 8 }}>TOTAL EMPLOYEES</h2>
                            <div className="count" style={{ fontSize: '2.5rem', fontWeight: 800, color: '#22223b', marginBottom: 8 }}>{employeeCount}</div>
                            <div className="stats" style={{ fontSize: '1rem', color: '#64748b', display: 'flex', gap: 18 }}>
                                <span>Male: {genderStats.male}</span>
                                <span>Female: {genderStats.female}</span>
                            </div>
                            <div
                                className="circle-chart"
                                style={{
                                    width: 60,
                                    height: 60,
                                    borderRadius: '50%',
                                    margin: '12px auto 0',
                                    background: (() => {
                                        const total = genderStats.male + genderStats.female;
                                        const malePercent = total > 0 ? (genderStats.male / total) * 100 : 0;
                                        const femalePercent = total > 0 ? (genderStats.female / total) * 100 : 0;
                                        return `conic-gradient(#1976d2 0% ${malePercent}%, #FFD600 ${malePercent}% 100%)`;
                                    })(),
                                    border: '2px solid #eee',
                                }}
                            ></div>
                            {/* Legend for circle chart */}
                            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8 }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#1976d2', display: 'inline-block', border: '1px solid #1976d2' }}></span>
                                    <span style={{ fontSize: 13 }}>Male</span>
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#FFD600', display: 'inline-block', border: '1px solid #FFD600' }}></span>
                                    <span style={{ fontSize: 13 }}>Female</span>
                                </span>
                            </div>
                        </div>

                        {/* Column containing Announcements and Employees on Leave */}
                        <div className="card-column" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            {/* Announcements Card */}
                            <div className="card" style={{ background: '#fff', borderRadius: 14, boxShadow: '0 4px 24px rgba(30,64,175,0.07), 0 1.5px 6px rgba(0,0,0,0.04)', padding: '28px 24px 22px 24px', transition: 'box-shadow 0.2s, transform 0.18s' }}>
                                <h2 className="section-title">ANNOUNCEMENTS</h2>
                                <ul className="announcement-list">
                                    {announcements.length === 0 ? <li>No announcements</li> : announcements.map((a, i) => (
                                        <li key={i}>{a.message}</li>
                                    ))}
                                </ul>
                            </div>

                            {/* Employees on Leave Card */}
                            <div className="card" style={{ background: '#fff', borderRadius: 14, boxShadow: '0 4px 24px rgba(30,64,175,0.07), 0 1.5px 6px rgba(0,0,0,0.04)', padding: '28px 24px 22px 24px', transition: 'box-shadow 0.2s, transform 0.18s' }}>
                                <h2 className="section-title">EMPLOYEES ON LEAVE TODAY</h2>
                                {(() => {
                                    // Get today's date in YYYY-MM-DD format
                                    const today = new Date().toISOString().split('T')[0];
                                    
                                    // Count employees on leave today
                                    let employeesOnLeaveCount = 0;
                                    const employeesOnLeaveToday = [];
                                    
                                    if (onLeave && Array.isArray(onLeave)) {
                                        onLeave.forEach(leave => {
                                            // Use the correct field names from the API response
                                            let fromDate = leave.from;
                                            let toDate = leave.to;
                                            
                                            // Skip if no dates available or dates are "N/A"
                                            if (!fromDate || !toDate || fromDate === "N/A" || toDate === "N/A") return;
                                            
                                            // Convert dates to YYYY-MM-DD format for comparison
                                            try {
                                                fromDate = new Date(fromDate).toISOString().split('T')[0];
                                                toDate = new Date(toDate).toISOString().split('T')[0];
                                            } catch (e) {
                                                console.error('Date parsing error:', e);
                                                return;
                                            }
                                            
                                            // Check if leave is approved/accepted
                                            const status = (leave.status || '').toLowerCase();
                                            const isApproved = status === 'approved' || status === 'accepted';
                                            
                                            // Check if today falls within leave period
                                            const isToday = fromDate <= today && today <= toDate;
                                            
                                            if (isApproved && isToday) {
                                                const employeeName = leave.name || 'Unknown Employee';
                                                const leaveType = leave.type || 'Leave';
                                                
                                                // Check for duplicates based on name and dates
                                                const isDuplicate = employeesOnLeaveToday.some(emp => 
                                                    emp.name === employeeName && 
                                                    emp.fromDate === fromDate && 
                                                    emp.toDate === toDate
                                                );
                                                
                                                if (!isDuplicate) {
                                                    employeesOnLeaveToday.push({
                                                        name: employeeName,
                                                        type: leaveType,
                                                        fromDate: fromDate,
                                                        toDate: toDate
                                                    });
                                                }
                                            }
                                        });
                                    }
                                    
                                    employeesOnLeaveCount = employeesOnLeaveToday.length;
                                    
                                    return (
                                        <>
                                            <div style={{ marginBottom: '12px', fontSize: '2.5rem', fontWeight: '800', color: '#22223b', textAlign: 'center' }}>
                                                {employeesOnLeaveCount}
                                            </div>
                                            <ul className="leave-list">
                                                {employeesOnLeaveCount === 0 ? (
                                                    <li style={{ color: '#10b981', fontWeight: '500' }}>✅ Full attendance today</li>
                                                ) : (
                                                    employeesOnLeaveToday.map((emp, i) => (
                                                        <li key={`${emp.name}-${i}`} style={{ marginBottom: '8px', padding: '8px', background: '#fef3c7', borderRadius: '6px', border: '1px solid #fbbf24' }}>
                                                            <strong style={{ color: '#92400e' }}>{emp.name}</strong> - 
                                                            <span style={{ color: '#b45309', marginLeft: '4px' }}>{emp.type}</span>
                                                            <br />
                                                            <span style={{ fontSize: '0.9rem', color: '#78716c' }}>
                                                                ({emp.fromDate} to {emp.toDate})
                                                            </span>
                                                        </li>
                                                    ))
                                                )}
                                            </ul>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>

                        {/* Calendar */}
                        <div className="card" style={{ background: '#fff', borderRadius: 14, boxShadow: '0 4px 24px rgba(30,64,175,0.07), 0 1.5px 6px rgba(0,0,0,0.04)', padding: '28px 24px 22px 24px', transition: 'box-shadow 0.2s, transform 0.18s' }}>
                            <h2 className="section-title">CALENDAR</h2>
                            <ul className="calendar-list">
                                {calendarEvents.length === 0 ? <li>No events</li> : calendarEvents.map((e, i) => (
                                    <li key={i} className={`event ${e.color}`}>{e.time} – {e.title}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </section>

                <section className="dashboard-section">
                    <div className="card">
                        <h2 className="section-title">RECENT ONBOARDINGS</h2>
                        <table className="onboarding-table">
                            <thead>
                            <tr>
                                <th>Full Name</th>
                                <th>Department</th>
                                <th>Role</th>
                                <th>Joining Date</th>
                                {/*<th>Manager</th>*/}
                                <th>Status</th>
                            </tr>
                            </thead>
                            <tbody>
                            {onboardingsLoading ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center' }}>Loading...</td>
                                </tr>
                            ) : onboardingsError ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', color: 'red' }}>
                                        {onboardingsError}
                                    </td>
                                </tr>
                            ) : recentOnboardings.length === 0 ? (
                                <tr>
                                    <td colSpan="6">No recent onboardings</td>
                                </tr>
                            ) : (
                                recentOnboardings.map((o, i) => (
                                    <tr key={`${o.fullName || 'unknown'}-${i}`}>
                                        <td>{o.fullName || '-'}</td>
                                        <td>{o.department || '-'}</td>
                                        <td>{o.role || '-'}</td>
                                        <td>{o.joiningDate || '-'}</td>
                                        {/*<td>{o.managerName || '-'}</td>*/}
                                        <td>
                <span className={`status ${(o.status || '').toLowerCase()}`}>
                  {o.status || 'Unknown'}
                </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="dashboard-section">
                    <div className="card" style={{ background: '#fff', borderRadius: 14, boxShadow: '0 4px 24px rgba(30,64,175,0.07), 0 1.5px 6px rgba(0,0,0,0.04)', padding: '28px 24px 22px 24px', transition: 'box-shadow 0.2s, transform 0.18s' }}>
                        <h2 className="section-title">PAYROLL SUMMARY</h2>
                        <div className="payroll-stats">
                            <div className="payroll-item">
                                <h4>Total Salary Paid</h4>
                                <p className="amount">₹{payrollSummary.totalPaid.toLocaleString()}</p>
                            </div>
                            <div className="payroll-item">
                                <h4>Pending Payments</h4>
                                <p className="amount text-yellow">₹{payrollSummary.pending.toLocaleString()}</p>
                            </div>
                            <div className="payroll-item">
                                <h4>Salary Cycle</h4>
                                <p>{payrollSummary.cycle}</p>
                            </div>
                        </div>

                        {/* Search bar and rows-per-page select for Employees table */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 18, marginBottom: 16, marginTop: 8, background: 'rgba(243,244,246,0.7)', borderRadius: 10, padding: '10px 16px' }}>
                            <label htmlFor="payrollSearch" style={{ fontWeight: 600, color: '#6366f1', marginRight: 8 }}>Search:</label>
                            <input
                                id="payrollSearch"
                                type="text"
                                placeholder="Employee or department..."
                                value={payrollSearch}
                                onChange={e => setPayrollSearch(e.target.value)}
                                style={{
                                    padding: '8px 14px',
                                    borderRadius: 8,
                                    border: '1.5px solid #e0e7ff',
                                    fontSize: 15,
                                    width: 240,
                                    background: '#f8fafc',
                                    outline: 'none',
                                    boxShadow: '0 1.5px 6px rgba(30,64,175,0.04)'
                                }}
                            />
                            <div className="rows-per-page-select" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <label htmlFor="payrollRowsPerPage" style={{ fontWeight: 500, color: '#64748b' }}>Rows per page:</label>
                                <select id="payrollRowsPerPage" value={payrollRowsPerPage} onChange={handlePayrollRowsPerPageChange} style={{ borderRadius: 6, padding: '4px 10px', border: '1.5px solid #e0e7ff', background: '#fff', fontSize: 15 }}>
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                            </div>
                        </div>

                        <table className="onboarding-table mt-4">
                            <thead>
                            <tr>
                                <th>Employee</th>
                                {/*<th>Department</th>*/}
                                <th>Net Salary</th>
                                <th>Status</th>
                                <th>Payment Date</th>
                            </tr>
                            </thead>
                            <tbody>
                            {paginatedPayroll.length === 0 ? (
                                <tr><td colSpan="5">No employees found</td></tr>
                            ) : paginatedPayroll.map((row, i) => (
                                <tr key={i}>
                                    <td>{row.employee}</td>
                                    {/*<td>{row.department}</td>*/}
                                    <td>₹{row.netSalary.toLocaleString()}</td>
                                    <td><span className={`status ${row.status.toLowerCase()}`}>{row.status}</span></td>
                                    <td>{row.paymentDate}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                        {/* Pagination Controls */}
                        {payrollTotalPages > 1 && (
                            <div className="pagination-controls">
                                <button onClick={() => handlePayrollPageChange(payrollPage - 1)} disabled={payrollPage === 1}>&laquo; Prev</button>
                                {Array.from({ length: payrollTotalPages }, (_, i) => (
                                    <button
                                        key={i + 1}
                                        className={payrollPage === i + 1 ? 'active' : ''}
                                        onClick={() => handlePayrollPageChange(i + 1)}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button onClick={() => handlePayrollPageChange(payrollPage + 1)} disabled={payrollPage === payrollTotalPages}>Next &raquo;</button>
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}
