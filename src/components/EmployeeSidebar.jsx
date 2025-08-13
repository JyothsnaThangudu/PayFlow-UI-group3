import React from 'react';
import './Sidebar.css';
import { FaTachometerAlt, FaUser, FaMoneyBill, FaCalendarAlt, FaEnvelope, FaFileInvoiceDollar, FaUserTimes } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';


import { NavLink } from 'react-router-dom';

export default function EmployeeSidebar() {
    return (
        <aside className="sidebar">
            <h1 className="sidebar-title">
                <span className="logo">Employee</span> Portal
            </h1>
            <div className="sidebar-menu">
                <NavLink to="/employee-dashboard" className={({ isActive }) => "sidebar-btn" + (isActive ? ' active' : '')} end>
                    <FaTachometerAlt /> Dashboard
                </NavLink>
                <NavLink to="/employee-profile" className={({ isActive }) => "sidebar-btn" + (isActive ? ' active' : '')} end>
                    <FaUser /> Profile
                </NavLink>
                <NavLink to="/employee-ctc-dashboard" className={({ isActive }) => "sidebar-btn" + (isActive ? ' active' : '')} end>
                    <FaFileInvoiceDollar /> My CTC & Payslips
                </NavLink>
                {/* <NavLink to="/employee-payroll" className={({ isActive }) => "sidebar-btn" + (isActive ? ' active' : '')} end>
                    <FaMoneyBill /> Payroll
                </NavLink> */}
                <NavLink to="/employee-leave" className={({ isActive }) => "sidebar-btn" + (isActive ? ' active' : '')} end>
                    <FaCalendarAlt /> Leave
                </NavLink>
                {/* <NavLink to="/employee-leave-history" className={({ isActive }) => "sidebar-btn" + (isActive ? ' active' : '')} end>
                    <FaCalendarAlt /> Leave History
                </NavLink> */}
                <NavLink to="/upcoming-holidays" className={({ isActive }) => "sidebar-btn" + (isActive ? ' active' : '')} end> 
                 <FaCalendarAlt />Upcoming Holidays
                </NavLink>

                <NavLink to="/employee-resignation" className={({ isActive }) => "sidebar-btn" + (isActive ? ' active' : '')} end>
                    <FaUserTimes /> Resignation
                </NavLink>
                <NavLink to="/employee-notifications" className={({ isActive }) => "sidebar-btn" + (isActive ? ' active' : '')} end>
                    <FaEnvelope /> Notifications
                </NavLink>
            </div>
        </aside>
    );
}
