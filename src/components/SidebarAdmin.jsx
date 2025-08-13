import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FaTachometerAlt, FaUserTie, FaUsers, FaCogs, FaUserPlus, FaSignOutAlt, FaChevronLeft, FaChevronRight, FaMoneyBillWave, FaFileInvoiceDollar, FaCalculator, FaLock } from 'react-icons/fa';
import './SidebarAdmin.css';

const SidebarAdmin = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
    };

    return (
        <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
                <div className="logo-section">
                    <div className="logo-icon">👑</div>
                    {!isCollapsed && (
                        <div className="logo-text">
                            <h2 className="logo-title">ADMIN</h2>
                            <span className="logo-subtitle">Control Panel</span>
                        </div>
                    )}
                </div>
                <button className="toggle-btn" onClick={toggleSidebar}>
                    {isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
                </button>
            </div>

            <div className="sidebar-content">
                <nav className="nav-section">
                    <div className="nav-header">
                        {!isCollapsed && <span>NAVIGATION</span>}
                    </div>
                    <ul className="nav-list">
                        <li>
                            <NavLink 
                                to="/admin-dashboard" 
                                className={({ isActive }) => `nav-link ${isActive ? 'active-link' : ''}`}
                                title={isCollapsed ? 'Dashboard' : ''}
                                end
                            >
                                <FaTachometerAlt className="nav-icon" />
                                {!isCollapsed && <span className="nav-text">Dashboard</span>}
                                {!isCollapsed && <div className="nav-indicator"></div>}
                            </NavLink>
                        </li>
                        <li>
                            <NavLink 
                                to="/employee-overview" 
                                className={({ isActive }) => `nav-link ${isActive ? 'active-link' : ''}`}
                                title={isCollapsed ? 'Employee Overview' : ''}
                                end
                            >
                                <FaUsers className="nav-icon" />
                                {!isCollapsed && <span className="nav-text">Employee Overview</span>}
                                {!isCollapsed && <div className="nav-indicator"></div>}
                            </NavLink>
                        </li>
                        <li>
                            <NavLink 
                                to="/create-user" 
                                className={({ isActive }) => `nav-link ${isActive ? 'active-link' : ''}`}
                                title={isCollapsed ? 'Add User' : ''}
                                end
                            >
                                <FaUserPlus className="nav-icon" />
                                {!isCollapsed && <span className="nav-text">Add User</span>}
                                {!isCollapsed && <div className="nav-indicator"></div>}
                            </NavLink>
                        </li>
                        <li>
                            <NavLink 
                                to="/ctc-management" 
                                className={({ isActive }) => `nav-link ${isActive ? 'active-link' : ''}`}
                                title={isCollapsed ? 'CTC Management (Manual)' : ''}
                                end
                            >
                                <FaMoneyBillWave className="nav-icon" />
                                {!isCollapsed && <span className="nav-text">CTC Structures</span>}
                                {!isCollapsed && <div className="nav-indicator"></div>}
                            </NavLink>
                        </li>
                        <li>
                            <NavLink 
                                to="/ctc-management-new" 
                                className={({ isActive }) => `nav-link ${isActive ? 'active-link' : ''}`}
                                title={isCollapsed ? 'CTC Auto-Calculator' : ''}
                                end
                            >
                                <FaCalculator className="nav-icon" />
                                {!isCollapsed && <span className="nav-text">CTC Management</span>}
                                {!isCollapsed && <div className="nav-indicator"></div>}
                            </NavLink>
                        </li>
                        <li>
                            <NavLink 
                                to="/payroll-dashboard" 
                                className={({ isActive }) => `nav-link ${isActive ? 'active-link' : ''}`}
                                title={isCollapsed ? 'Payroll Dashboard' : ''}
                                end
                            >
                                <FaFileInvoiceDollar className="nav-icon" />
                                {!isCollapsed && <span className="nav-text">Payrolls</span>}
                                {!isCollapsed && <div className="nav-indicator"></div>}
                            </NavLink>
                        </li>
                        <li>
                            <NavLink 
                                to="/admin/payment-holds" 
                                className={({ isActive }) => `nav-link ${isActive ? 'active-link' : ''}`}
                                title={isCollapsed ? 'Payment Hold Management' : ''}
                                end
                            >
                                <FaLock className="nav-icon" />
                                {!isCollapsed && <span className="nav-text">Payment Holds</span>}
                                {!isCollapsed && <div className="nav-indicator"></div>}
                            </NavLink>
                        </li>
                        <li>
                            <div 
                                className="nav-link nav-placeholder"
                                title={isCollapsed ? 'Settings' : ''}
                            >
                                <FaCogs className="nav-icon" />
                                {!isCollapsed && <span className="nav-text">Settings</span>}
                            </div>
                        </li>
                    </ul>
                </nav>

                <div className="sidebar-footer">
                    <button 
                        className="logout-btn" 
                        onClick={handleLogout}
                        title={isCollapsed ? 'Logout' : ''}
                    >
                        <FaSignOutAlt className="logout-icon" />
                        {!isCollapsed && <span className="logout-text">Logout</span>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SidebarAdmin;