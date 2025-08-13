import React, { useEffect, useState } from "react";
import axios from "axios";
import EmployeeSidebar from "../components/EmployeeSidebar";
import "./UpcomingHolidays.css";

export default function UpcomingHolidays() {
  const [holidays, setHolidays] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  useEffect(() => {
    axios
      .get(
        "https://www.googleapis.com/calendar/v3/calendars/en.indian%23holiday%40group.v.calendar.google.com/events?key=AIzaSyBg2vIsbKXDUcVzPJyRIWtCE3lEiy1-Qvo"
      )
      .then((res) => {
        const today = new Date();
        const upcoming = res.data.items.filter((holiday) => {
          const holidayDate = new Date(holiday.start.date);
          return holidayDate >= today;
        });
        setHolidays(upcoming);
      })
      .catch((err) => console.error(err));
  }, []);

  // Pagination calculations
  const indexOfLastHoliday = currentPage * rowsPerPage;
  const indexOfFirstHoliday = indexOfLastHoliday - rowsPerPage;
  const currentHolidays = holidays.slice(
    indexOfFirstHoliday,
    indexOfLastHoliday
  );
  const totalPages = Math.ceil(holidays.length / rowsPerPage);

  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  return (
    <div style={{ display: "flex" }}>
      <EmployeeSidebar />
      <div className="content-area">
        <h2>Upcoming Public Holidays in India</h2>

        <label style={{ marginLeft: "1000px" }}>
          Rows per page:{" "}
          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setCurrentPage(1); // Reset page to 1 when rows per page changes
            }}
            
          >
            {[5, 10, 20, 50].map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
        </label>

        <table className="holidays-table">
          <thead>
            <tr>
              <th>Holiday</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {currentHolidays.map((holiday, index) => (
              <tr key={index}>
                <td>{holiday.summary}</td>
                <td>{holiday.start.date}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="pagination-controls">
          <button onClick={handlePrev} disabled={currentPage === 1}>
            Prev
          </button>
          <span style={{ margin: "0 10px" }}>
            Page {currentPage} of {totalPages}
          </span>
          <button onClick={handleNext} disabled={currentPage === totalPages}>
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
