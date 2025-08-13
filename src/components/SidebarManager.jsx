
import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaTachometerAlt, FaUsers, FaProjectDiagram, FaEnvelopeOpenText, FaMoneyBill, FaLock, FaUserTimes } from 'react-icons/fa';
import './SidebarManager.css';

const SidebarManager = () => {
    // Get managerId from localStorage for proper routing
    const managerId = localStorage.getItem('managerId');

    return (
        <div className="sidebar">
            <h2 className="logo">MANAGER</h2>
            <ul className="nav-list">
                <li>
                    <NavLink to="/manager-dashboard" className={({ isActive }) => isActive ? 'active-link' : ''} end>
                        <FaTachometerAlt /> Dashboard
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/team-members" className={({ isActive }) => isActive ? 'active-link' : ''} end>
                        <FaUsers /> Team Members
                    </NavLink>
                </li>
                
                <li>
                    <NavLink to="/manager-onboarding" className={({ isActive }) => isActive ? 'active-link' : ''} end>
                        <FaUsers /> Onboarding
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/manager-team-payroll" className={({ isActive }) => isActive ? 'active-link' : ''} end>
                        <FaMoneyBill /> Team Payroll
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/manager/payment-holds" className={({ isActive }) => isActive ? 'active-link' : ''} end>
                        <FaLock /> Payment Holds
                    </NavLink>
                </li>
                <li>
                    <NavLink 
                        to={`/manager/${managerId}/leaves`} 
                        className={({ isActive }) => isActive ? 'active-link' : ''} 
                        end
                    >
                        <FaEnvelopeOpenText /> Leave Requests
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/manager/resignation-requests" className={({ isActive }) => isActive ? 'active-link' : ''} end>
                        <FaUserTimes /> Resignation Requests
                    </NavLink>
                </li>
            </ul>
        </div>
    );
};

export default SidebarManager;