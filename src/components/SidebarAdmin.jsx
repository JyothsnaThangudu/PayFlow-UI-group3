import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaTachometerAlt, FaUserTie, FaUsers, FaCogs } from 'react-icons/fa';
import './SidebarAdmin.css';

const SidebarAdmin = () => {
    return (
        <div className="sidebar">
            <h2 className="logo">WELCOME!</h2>
            <ul className="nav-list">
                <li>
                    <NavLink to="/admin-dashboard" className={({ isActive }) => isActive ? 'active-link' : ''} end>
                        <FaTachometerAlt /> Dashboard
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/employee-overview" className={({ isActive }) => isActive ? 'active-link' : ''} end>
                        <FaUsers /> Employee Overview
                    </NavLink>
                </li>
                <li className="nav-placeholder">
                    <FaCogs /> Settings
                </li>
            </ul>
        </div>
    );
};

export default SidebarAdmin;