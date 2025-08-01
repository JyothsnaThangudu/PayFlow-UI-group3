import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './EmployeeList.css';
import Sidebar from '../components/Sidebar';

const EmployeeList = () => {
    const [employees, setEmployees] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [search, setSearch] = useState("");

    useEffect(() => {
        axios.get('http://localhost:8080/api/employee')
            .then(response => setEmployees(response.data))
            .catch(error => console.error('Error fetching employees:', error));
    }, []);

    // Filter employees by search
    const filteredEmployees = employees.filter(emp =>
        emp.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        emp.email?.toLowerCase().includes(search.toLowerCase()) ||
        emp.department?.toLowerCase().includes(search.toLowerCase()) ||
        emp.role?.toLowerCase().includes(search.toLowerCase())
    );
    // Pagination logic
    const totalPages = Math.ceil(filteredEmployees.length / rowsPerPage);
    const paginatedEmployees = filteredEmployees.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    const handleRowsPerPageChange = (e) => {
        setRowsPerPage(Number(e.target.value));
        setCurrentPage(1);
    };

    // Reset to page 1 when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };

    return (
        <div className="employee-page-layout" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e0e7ff 0%, #f8fafc 100%)', fontFamily: 'Inter, Segoe UI, Roboto, Arial, sans-serif', color: '#222' }}>
            <Sidebar />
            <div className="employee-list-container" style={{ maxWidth: 1200, margin: '0 auto', padding: '36px 24px 36px 24px' }}>
                <style>{`
                .employee-list-card {
                    box-shadow: 0 8px 32px rgba(99,102,241,0.13), 0 2px 8px rgba(0,0,0,0.07);
                    border-radius: 22px;
                    background: linear-gradient(120deg, #f8fafc 60%, #e0e7ff 100%);
                    border: 1.5px solid #c7d2fe;
                    padding: 38px 32px 32px 32px;
                    margin-top: 24px;
                    margin-bottom: 32px;
                    transition: box-shadow 0.22s, transform 0.18s, background 0.18s;
                    position: relative;
                }
                .employee-list-card:hover {
                    box-shadow: 0 12px 40px rgba(99,102,241,0.18), 0 4px 16px rgba(0,0,0,0.10);
                    transform: translateY(-3px) scale(1.018);
                    background: linear-gradient(120deg, #f1f5ff 60%, #e0e7ff 100%);
                }
                .employee-table {
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 0;
                    background: rgba(255,255,255,0.98);
                    border-radius: 12px;
                    box-shadow: 0 2px 12px rgba(30,64,175,0.07);
                    overflow: hidden;
                    margin-top: 12px;
                }
                .employee-table th, .employee-table td {
                    padding: 13px 12px;
                    text-align: left;
                    border-bottom: 1px solid #e5e7eb;
                }
                .employee-table th {
                    background: linear-gradient(90deg, #e0e7ff 60%, #f3f4f6 100%);
                    font-weight: 800;
                    color: #3730a3;
                    font-size: 1.13rem;
                    letter-spacing: 0.01em;
                    border-bottom: 2.5px solid #c7d2fe;
                }
                .employee-table tr:last-child td {
                    border-bottom: none;
                }
                .employee-table tr:hover td {
                    background: #e0e7ff44;
                    transition: background 0.18s;
                }
                .pagination-controls button.active, .pagination-controls button:focus {
                    background: #6366f1 !important;
                    color: #fff !important;
                    box-shadow: 0 2px 8px #6366f133;
                }
                .pagination-controls button:disabled {
                    background: #f3f4f6 !important;
                    color: #a1a1aa !important;
                    cursor: not-allowed !important;
                }
                .employee-list-title {
                    font-size: 2.25rem;
                    font-weight: 900;
                    color: #4f46e5;
                    margin-bottom: 22px;
                    letter-spacing: 0.01em;
                    text-shadow: 0 2px 8px rgba(99,102,241,0.08);
                }
                .employee-search-bar {
                    display: flex;
                    flex-wrap: wrap;
                    align-items: center;
                    gap: 18px;
                    margin-bottom: 22px;
                    margin-top: -38px;
                    background: linear-gradient(90deg, #e0e7ff 60%, #f3f4f6 100%);
                    border-radius: 16px;
                    padding: 16px 22px;
                    box-shadow: 0 4px 18px rgba(99,102,241,0.10);
                    position: absolute;
                    top: -38px;
                    left: 32px;
                    right: 32px;
                    z-index: 2;
                }
                .employee-search-bar input {
                    padding: 11px 18px;
                    border-radius: 10px;
                    border: 1.5px solid #a5b4fc;
                    font-size: 17px;
                    width: 270px;
                    background: #f8fafc;
                    outline: none;
                    box-shadow: 0 2px 8px rgba(99,102,241,0.07);
                    transition: border 0.18s, box-shadow 0.18s;
                }
                .employee-search-bar input:focus {
                    border: 1.5px solid #6366f1;
                    box-shadow: 0 2px 12px #6366f133;
                }
                .rows-per-page-select label {
                    font-weight: 500;
                    color: #64748b;
                }
                .rows-per-page-select select {
                    border-radius: 6px;
                    padding: 4px 10px;
                    border: 1.5px solid #e0e7ff;
                    background: #fff;
                    font-size: 15px;
                }
                `}</style>
                <div className="employee-list-card">
                    <div className="employee-list-title">All Employees</div>
                    <div className="employee-search-bar">
                        <label htmlFor="employeeSearch">Search:</label>
                        <input
                            id="employeeSearch"
                            type="text"
                            placeholder="Name, email, department, or role..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        <div className="rows-per-page-select" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <label htmlFor="rowsPerPage">Rows per page:</label>
                            <select id="rowsPerPage" value={rowsPerPage} onChange={handleRowsPerPageChange}>
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>
                    </div>
                    <table className="employee-table">
                        <thead>
                        <tr>
                            <th>ID</th>
                            <th>Full Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Department</th>
                            <th>Phone</th>
                            <th>Joining Date</th>
                        </tr>
                        </thead>
                        <tbody>
                        {paginatedEmployees.length === 0 ? (
                            <tr><td colSpan="7">No employees found</td></tr>
                        ) : paginatedEmployees.map(emp => (
                            <tr key={emp.id}>
                                <td>{emp.id}</td>
                                <td>{emp.fullName}</td>
                                <td>{emp.email}</td>
                                <td>{emp.role}</td>
                                <td>{emp.department}</td>
                                <td>{emp.phone}</td>
                                <td>{emp.joiningDate}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="pagination-controls" style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                            <button
                                style={{
                                    background: currentPage === 1 ? '#f3f4f6' : '#e0e7ff',
                                    color: currentPage === 1 ? '#a1a1aa' : '#3730a3',
                                    border: 'none',
                                    borderRadius: 6,
                                    padding: '6px 14px',
                                    fontWeight: 600,
                                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                    transition: 'background 0.18s, color 0.18s'
                                }}
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                            >&laquo; Prev</button>
                            {Array.from({ length: totalPages }, (_, i) => (
                                <button
                                    key={i + 1}
                                    style={{
                                        background: currentPage === i + 1 ? '#6366f1' : '#e0e7ff',
                                        color: currentPage === i + 1 ? '#fff' : '#3730a3',
                                        border: 'none',
                                        borderRadius: 6,
                                        padding: '6px 14px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'background 0.18s, color 0.18s'
                                    }}
                                    className={currentPage === i + 1 ? 'active' : ''}
                                    onClick={() => handlePageChange(i + 1)}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            <button
                                style={{
                                    background: currentPage === totalPages ? '#f3f4f6' : '#e0e7ff',
                                    color: currentPage === totalPages ? '#a1a1aa' : '#3730a3',
                                    border: 'none',
                                    borderRadius: 6,
                                    padding: '6px 14px',
                                    fontWeight: 600,
                                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                    transition: 'background 0.18s, color 0.18s'
                                }}
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                            >Next &raquo;</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EmployeeList;
