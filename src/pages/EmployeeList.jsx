import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './EmployeeList.css';
import Sidebar from '../components/Sidebar';
import PopupMessage from '../components/PopupMessage';
import { FaEdit, FaHistory } from 'react-icons/fa';

const EmployeeList = () => {
    const [employees, setEmployees] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [search, setSearch] = useState("");
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [positionHistory, setPositionHistory] = useState([]);
    const [updateForm, setUpdateForm] = useState({
        department: '',
        role: '',
        position: '',
        reason: ''
    });
    const [popup, setPopup] = useState({ show: false, message: '', type: 'success' });

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = () => {
        axios.get('http://localhost:8080/api/employee')
            .then(response => {
                // Set default position for employees without position
                const employeesWithPosition = response.data.map(emp => ({
                    ...emp,
                    position: emp.position || 'JUNIOR'
                }));
                setEmployees(employeesWithPosition);
            })
            .catch(error => console.error('Error fetching employees:', error));
    };

    // Filter employees by search
    const filteredEmployees = employees.filter(emp =>
        emp.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        emp.email?.toLowerCase().includes(search.toLowerCase()) ||
        emp.department?.toLowerCase().includes(search.toLowerCase()) ||
        emp.role?.toLowerCase().includes(search.toLowerCase()) ||
        emp.position?.toLowerCase().includes(search.toLowerCase())
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

    const handleUpdateClick = (employee) => {
        console.log('Selected employee for update:', employee); // Debug log
        setSelectedEmployee(employee);
        setUpdateForm({
            department: employee.department || '',
            role: employee.role || '',
            position: employee.position || 'JUNIOR',
            reason: ''
        });
        console.log('Update form initialized with:', { // Debug log
            department: employee.department || '',
            role: employee.role || '',
            position: employee.position || 'JUNIOR'
        });
        setShowUpdateModal(true);
    };

    const handleHistoryClick = async (employee) => {
        setSelectedEmployee(employee);
        try {
            const response = await axios.get(`http://localhost:8080/api/employee/${employee.id}/position-history`);
            setPositionHistory(response.data);
            setShowHistoryModal(true);
        } catch (error) {
            console.error('Error fetching position history:', error);
            setPositionHistory([]);
            setShowHistoryModal(true);
        }
    };

    const handleUpdateSubmit = async (e) => {
        e.preventDefault();

        try {
            const hrUser = localStorage.getItem('userEmail') || 'HR Admin';
            const updateData = {
                employeeId: selectedEmployee.id,
                department: updateForm.department,
                role: updateForm.role,
                position: updateForm.position,
                reason: updateForm.reason,
                changedBy: hrUser
            };

            await axios.put('http://localhost:8080/api/employee/update-position', updateData);
            setPopup({ show: true, title: 'Update Successful', message: 'Employee position updated successfully!', type: 'success' });
            setShowUpdateModal(false);
            fetchEmployees(); // Refresh the employee list
        } catch (error) {
            console.error('Error updating employee position:', error);
            setPopup({ show: true, title: 'Update Failed', message: 'Failed to update employee position', type: 'error' });
        }
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
                            <th>Position</th>
                            <th>Phone</th>
                            <th>Joining Date</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {paginatedEmployees.length === 0 ? (
                            <tr><td colSpan="9">No employees found</td></tr>
                        ) : paginatedEmployees.map(emp => (
                            <tr key={emp.id}>
                                <td>{emp.id}</td>
                                <td>{emp.fullName}</td>
                                <td>{emp.email}</td>
                                <td>{emp.role}</td>
                                <td>{emp.department}</td>
                                <td>
                                    <span style={{
                                        padding: '4px 8px',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        backgroundColor: emp.position === 'SENIOR' ? '#dcfce7' : '#e0e7ff',
                                        color: emp.position === 'SENIOR' ? '#166534' : '#3730a3'
                                    }}>
                                        {emp.position || 'JUNIOR'}
                                    </span>
                                </td>
                                <td>{emp.phone}</td>
                                <td>{emp.joiningDate}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={() => handleUpdateClick(emp)}
                                            style={{
                                                background: '#3b82f6',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                padding: '4px 8px',
                                                cursor: 'pointer',
                                                fontSize: '12px'
                                            }}
                                            title="Update Position"
                                        >
                                            <FaEdit />
                                        </button>
                                        <button
                                            onClick={() => handleHistoryClick(emp)}
                                            style={{
                                                background: '#10b981',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                padding: '4px 8px',
                                                cursor: 'pointer',
                                                fontSize: '12px'
                                            }}
                                            title="View History"
                                        >
                                            <FaHistory />
                                        </button>
                                    </div>
                                </td>
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

            {/* Update Position Modal */}
            {showUpdateModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '24px',
                        borderRadius: '12px',
                        width: '500px',
                        maxHeight: '80vh',
                        overflow: 'auto'
                    }}>
                        <h3>Update Employee Position</h3>
                        {selectedEmployee && (
                            <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                                <p><strong>Name:</strong> {selectedEmployee.fullName}</p>
                                <p><strong>ID:</strong> {selectedEmployee.id}</p>
                                <p><strong>Email:</strong> {selectedEmployee.email}</p>
                                <hr style={{ margin: '12px 0', border: '1px solid #dee2e6' }} />
                                <p><strong>Current Department:</strong> {selectedEmployee.department || 'Not Set'}</p>
                                <p><strong>Current Role:</strong> {selectedEmployee.role || 'Not Set'}</p>
                                <p><strong>Current Position:</strong> {selectedEmployee.position || 'JUNIOR'}</p>
                            </div>
                        )}
                        <form onSubmit={handleUpdateSubmit}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Department:</label>
                                <select
                                    value={updateForm.department}
                                    onChange={(e) => setUpdateForm(prev => ({ ...prev, department: e.target.value }))}
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                                    required
                                >
                                    <option value="">Select Department</option>
                                    <option value="HR">HR</option>
                                    <option value="Finance">Finance</option>
                                    <option value="IT">IT</option>
                                    <option value="Operations">Operations</option>
                                    <option value="Sales">Sales</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Role:</label>
                                <select
                                    value={updateForm.role}
                                    onChange={(e) => setUpdateForm(prev => ({ ...prev, role: e.target.value }))}
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                                    required
                                >
                                    <option value="">Select Role</option>
                                    <option value="SDE">SDE</option>
                                    <option value="Software Engineer">Software Engineer</option>
                                    <option value="Senior Software Engineer">Senior Software Engineer</option>
                                    <option value="Developer">Developer</option>
                                    <option value="Frontend Developer">Frontend Developer</option>
                                    <option value="Backend Developer">Backend Developer</option>
                                    <option value="Full Stack Developer">Full Stack Developer</option>
                                    <option value="DevOps">DevOps</option>
                                    <option value="DevOps Engineer">DevOps Engineer</option>
                                    <option value="QA">QA</option>
                                    <option value="QA Engineer">QA Engineer</option>
                                    <option value="Testing">Testing</option>
                                    <option value="Test Engineer">Test Engineer</option>
                                    <option value="Lead">Lead</option>
                                    <option value="Team Lead">Team Lead</option>
                                    <option value="Tech Lead">Tech Lead</option>
                                    <option value="Project Manager">Project Manager</option>
                                    <option value="Product Manager">Product Manager</option>
                                    <option value="Business Analyst">Business Analyst</option>
                                    <option value="Data Analyst">Data Analyst</option>
                                    <option value="Data Scientist">Data Scientist</option>
                                    <option value="UI/UX Designer">UI/UX Designer</option>
                                    <option value="System Administrator">System Administrator</option>
                                    <option value="Database Administrator">Database Administrator</option>
                                    <option value="Intern">Intern</option>
                                    <option value="HR">HR</option>
                                    <option value="HR Executive">HR Executive</option>
                                    <option value="Finance">Finance</option>
                                    <option value="Finance Executive">Finance Executive</option>
                                    <option value="Sales Executive">Sales Executive</option>
                                    <option value="Marketing Executive">Marketing Executive</option>
                                    <option value="Operations Executive">Operations Executive</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Position Level:</label>
                                <select
                                    value={updateForm.position}
                                    onChange={(e) => setUpdateForm(prev => ({ ...prev, position: e.target.value }))}
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                                    required
                                >
                                    <option value="JUNIOR">Junior Employee (Entry Level)</option>
                                    <option value="SENIOR">Senior Employee</option>
                                </select>
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Reason for Change (Optional):</label>
                                <textarea
                                    value={updateForm.reason}
                                    onChange={(e) => setUpdateForm(prev => ({ ...prev, reason: e.target.value }))}
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', minHeight: '80px' }}
                                    placeholder="Optionally provide a reason for this position change..."
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowUpdateModal(false)}
                                    style={{
                                        padding: '8px 16px',
                                        border: '1px solid #ccc',
                                        borderRadius: '4px',
                                        backgroundColor: 'white',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    style={{
                                        padding: '8px 16px',
                                        border: 'none',
                                        borderRadius: '4px',
                                        backgroundColor: '#3b82f6',
                                        color: 'white',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Update Position
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Position History Modal */}
            {showHistoryModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '24px',
                        borderRadius: '12px',
                        width: '800px',
                        maxHeight: '80vh',
                        overflow: 'auto'
                    }}>
                        <h3>Position History</h3>
                        {selectedEmployee && (
                            <div style={{ marginBottom: '20px' }}>
                                <p><strong>Employee:</strong> {selectedEmployee.fullName} (ID: {selectedEmployee.id})</p>
                            </div>
                        )}
                        {positionHistory.length === 0 ? (
                            <p>No position history found for this employee.</p>
                        ) : (
                            <div style={{ maxHeight: '400px', overflow: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#f8f9fa' }}>
                                            <th style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'left' }}>Date</th>
                                            <th style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'left' }}>Department</th>
                                            <th style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'left' }}>Role</th>
                                            <th style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'left' }}>Position</th>
                                            <th style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'left' }}>Changed By</th>
                                            <th style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'left' }}>Reason</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {positionHistory.map((history, index) => (
                                            <tr key={history.id || index}>
                                                <td style={{ padding: '8px', border: '1px solid #dee2e6' }}>
                                                    {new Date(history.changeDate).toLocaleDateString()}
                                                </td>
                                                <td style={{ padding: '8px', border: '1px solid #dee2e6' }}>
                                                    {history.previousDepartment} → {history.newDepartment}
                                                </td>
                                                <td style={{ padding: '8px', border: '1px solid #dee2e6' }}>
                                                    {history.previousRole} → {history.newRole}
                                                </td>
                                                <td style={{ padding: '8px', border: '1px solid #dee2e6' }}>
                                                    {history.previousPosition} → {history.newPosition}
                                                </td>
                                                <td style={{ padding: '8px', border: '1px solid #dee2e6' }}>
                                                    {history.changedBy}
                                                </td>
                                                <td style={{ padding: '8px', border: '1px solid #dee2e6' }}>
                                                    {history.reason}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                            <button
                                onClick={() => setShowHistoryModal(false)}
                                style={{
                                    padding: '8px 16px',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px',
                                    backgroundColor: 'white',
                                    cursor: 'pointer'
                                }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {popup.show && (
                <PopupMessage 
                    title={popup.title} 
                    message={popup.message} 
                    type={popup.type} 
                    onClose={() => setPopup({ ...popup, show: false })} 
                />
            )}
        </div>
    );
};

export default EmployeeList;
