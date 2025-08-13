import React, { useEffect, useState } from "react";
import axios from "axios";
import EmployeeSidebar from "../components/EmployeeSidebar";
import "./LeaveHistory.css";

function LeaveHistory() {
    const [leaveHistory, setLeaveHistory] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    useEffect(() => {
        const employeeId = localStorage.getItem("employeeId");

        if (employeeId) {
            axios
                .get(`http://localhost:8080/api/employee/leaves/${employeeId}`)
                .then((res) => {
                    const updatedHistory = res.data.map((leave) => {
                        const fromDate = new Date(leave.fromDate);
                        const toDate = new Date(leave.toDate);
                        const days =
                            Math.floor(
                                (toDate - fromDate) / (1000 * 60 * 60 * 24)
                            ) + 1;
                        return { ...leave, days };
                    });
                    setLeaveHistory(updatedHistory);
                })
                .catch((err) => console.error("Error fetching leave history:", err));
        }
    }, []);

    // Pagination calculations
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentRows = leaveHistory.slice(indexOfFirstRow, indexOfLastRow);
    const totalPages = Math.ceil(leaveHistory.length / rowsPerPage);

    const handleRowsPerPageChange = (e) => {
        setRowsPerPage(parseInt(e.target.value));
        setCurrentPage(1); // Reset to first page
    };

    return (
        <div style={{ display: "flex" }}>
            <EmployeeSidebar />
            <div className="leave-history-container">
                <h2 className="leave-history-title">Leave History</h2>

                {/* Rows per page selector */}
                <div className="pagination-controls">
                    <label>
                        Rows per page:{" "}
                        <select value={rowsPerPage} onChange={handleRowsPerPageChange}>
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={15}>15</option>
                        </select>
                    </label>
                </div>

                {/* Table */}
                <table className="leave-history-table">
                    <thead>
                        <tr>
                            <th>Leave Type</th>
                            <th>From Date</th>
                            <th>To Date</th>
                            <th>Reason</th>
                            <th>Status</th>
                            <th>Number of Days</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentRows.map((leave, index) => (
                            <tr key={index}>
                                <td>{leave.type}</td>
                                <td>{leave.fromDate}</td>
                                <td>{leave.toDate}</td>
                                <td>{leave.reason}</td>
                                <td className={`status-${leave.status.toLowerCase()}`} >{leave.status}</td>
                                <td>{leave.days}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Pagination buttons */}
                <div className="pagination-buttons">
                    <button
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </button>
                    <span>
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}

export default LeaveHistory;
