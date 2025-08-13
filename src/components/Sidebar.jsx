import React from 'react';
import './Sidebar.css';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    FaTachometerAlt,
    FaUsers,
    FaUserPlus,
    FaTasks,
    FaMoneyBill,
    FaChartBar,
    FaCog,
    FaCalculator,
    FaTable,
    FaLock,
    FaUserTimes,
    FaEnvelopeOpenText
} from 'react-icons/fa';

export default function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const isActive = (path) => location.pathname === path;

    return (
        <aside className="sidebar">
            <h1 className="sidebar-title">
                <span className="logo">HR</span> system
            </h1>
            <div className="sidebar-menu">
                <button className={"sidebar-btn" + (isActive('/hr-dashboard') ? ' active' : '')} onClick={() => navigate('/hr-dashboard')}>
                    <FaTachometerAlt /> Dashboard
                </button>
                <button className={"sidebar-btn" + (isActive('/employee') ? ' active' : '')} onClick={() => navigate('/employee')}>
                    <FaUsers /> Employees
                </button>
                <button className={"sidebar-btn" + (isActive('/onboarding') ? ' active' : '')} onClick={() => navigate('/onboarding')}>
                    <FaUserPlus /> Onboardings
                </button>
                {/* <button className={"sidebar-btn" + (isActive('/projects') ? ' active' : '')} onClick={() => navigate('/projects')}>
                    <FaTasks /> Projects
                </button> */}
                
                <button className={"sidebar-btn" + (isActive('/hr-ctc-structures') ? ' active' : '')} onClick={() => navigate('/hr-ctc-structures')}>
                    <FaTable /> CTC Structures
                </button>
                <button className={"sidebar-btn" + (isActive('/hr-ctc-auto-calculator') ? ' active' : '')} onClick={() => navigate('/hr-ctc-auto-calculator')}>
                    <FaCalculator /> CTC Management
                </button>
                <button className={"sidebar-btn" + (isActive('/manager/payroll-dashboard') ? ' active' : '')} onClick={() => navigate('/manager/payroll-dashboard')}>
                    <FaMoneyBill /> Payrolls
                </button>
                <button className={"sidebar-btn" + (isActive('/hr/payment-holds') ? ' active' : '')} onClick={() => navigate('/hr/payment-holds')}>
                    <FaLock /> Payment Holds
                </button>
                <button className={"sidebar-btn" + (isActive('/hr/leave-requests') ? ' active' : '')} onClick={() => navigate('/hr/leave-requests')}>
                    <FaEnvelopeOpenText /> Leave Requests
                </button>
                <button className={"sidebar-btn" + (isActive('/hr/resignation-requests') ? ' active' : '')} onClick={() => navigate('/hr/resignation-requests')}>
                    <FaUserTimes /> Resignation Requests
                </button>
                
                {/* <button className={"sidebar-btn" + (isActive('/reports') ? ' active' : '')} onClick={() => navigate('/reports')}>
                    <FaChartBar /> Reports
                </button>
                <button className={"sidebar-btn" + (isActive('/settings') ? ' active' : '')} onClick={() => navigate('/settings')}>
                    <FaCog /> Settings
                </button> */}
            </div>
        </aside>
    );
}




// import React from 'react';
// import './Sidebar.css';
// import { FaTachometerAlt, FaUsers, FaUserPlus, FaTasks, FaMoneyBill, FaChartBar, FaCog } from 'react-icons/fa';
// import { useNavigate } from 'react-router-dom';
//
// export default function Sidebar() {
//     const navigate = useNavigate();
//
//     return (
//         <aside className="sidebar">
//             <h1 className="sidebar-title">
//                 <span className="logo">HR</span> system
//             </h1>
//             <div className="sidebar-menu">
//                 <button className="sidebar-btn active" onClick={() => navigate('/')}>
//                     <FaTachometerAlt /> Dashboard
//                 </button>
//                 <button className="sidebar-btn"><FaUsers /> Employees</button>
//                 <button className="sidebar-btn" onClick={() => navigate('/onboarding')}>
//                     <FaUserPlus /> Onboardings
//                 </button>
//                 <button className="sidebar-btn"><FaTasks /> Projects</button>
//                 <button className="sidebar-btn"><FaMoneyBill /> Payrolls</button>
//                 <button className="sidebar-btn"><FaChartBar /> Reports</button>
//                 <button className="sidebar-btn"><FaCog /> Settings</button>
//             </div>
//         </aside>
//     );
// }
