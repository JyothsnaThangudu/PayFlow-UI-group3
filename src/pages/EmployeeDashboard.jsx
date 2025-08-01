// import React, { useEffect, useState, useMemo } from 'react';
// import EmployeeSidebar from '../components/EmployeeSidebar';
// import './EmployeeDashboard.css';
// import axios from 'axios';
// import { FaUserCircle, FaBuilding, FaBriefcase, FaCalendarAlt, FaEnvelope, FaPhone, FaMoneyBill, FaClipboardList, FaBell } from 'react-icons/fa';

// const EmployeeDashboard = () => {
//     const [employee, setEmployee] = useState(null);
//     // TODO: Replace with actual logged-in user context or JWT
//     const email = localStorage.getItem('userEmail'); // or get from auth context

//     // Leave state
//     const [leaveHistory, setLeaveHistory] = useState([]);
//     const totalLeaves = 12;
//     // Calculate used leaves: count all ACCEPTED leaves
//     const usedLeaves = useMemo(() => {
//         return leaveHistory.filter(l => l.status === 'ACCEPTED').length;
//     }, [leaveHistory]);
//     const remainingLeaves = totalLeaves - usedLeaves;

//     useEffect(() => {
//         if (email) {
//             // Fetch employee details
//             axios.get(`http://localhost:8080/api/employee?email=${email}`)
//                 .then(res => {
//                     if (Array.isArray(res.data) && res.data.length > 0) {
//                         setEmployee(res.data[0]);
//                     } else if (res.data) {
//                         setEmployee(res.data);
//                     }
//                 })
//                 .catch(err => console.error('Failed to fetch employee details', err));

//             // Fetch leave history (use the same endpoint as EmployeeLeave page for consistency)
//             axios.get(`http://localhost:8080/api/employee/leave/history?email=${email}`)
//                 .then(res => {
//                     setLeaveHistory(res.data || []);
//                 })
//                 .catch(() => {
//                     setLeaveHistory([]);
//                 });
//         }
//     }, [email]);


//     return (
//         <div className="employee-dashboard-layout">
//             <EmployeeSidebar />
//             <div className="employee-dashboard-content">
//                 <div className="profile-header">
//                     <div className="profile-avatar">
//                         <FaUserCircle size={72} color="#6366f1" />
//                     </div>
//                     <div className="profile-header-info">
//                         <h2>Welcome{employee ? `, ${employee.fullName}` : ''}!</h2>
//                         {employee && (
//                             <div className="profile-header-meta">
//                                 <span><FaBuilding /> {employee.department}</span>
//                                 <span><FaBriefcase /> {employee.role}</span>
//                                 <span><FaCalendarAlt /> Joined: {employee.joiningDate}</span>
//                             </div>
//                         )}
//                     </div>
//                 </div>
//                 <div className="dashboard-cards">
//                     <div className="dashboard-card profile-card">
//                         <h3><FaUserCircle /> Profile</h3>
//                         {employee ? (
//                             <ul className="profile-list">
//                                 <li><FaEnvelope /> <b>Email:</b> {employee.email}</li>
//                                 <li><FaPhone /> <b>Phone:</b> {employee.phone}</li>
//                                 <li><FaBuilding /> <b>Department:</b> {employee.department}</li>
//                                 <li><FaBriefcase /> <b>Role:</b> {employee.role}</li>
//                                 <li><FaCalendarAlt /> <b>Joining Date:</b> {employee.joiningDate}</li>
//                                 <li><b>Qualification:</b> {employee.qualification}</li>
//                                 <li><b>Specialization:</b> {employee.specialization}</li>
//                                 <li><b>Experience:</b> {employee.hasExperience === 'Yes' ? `${employee.experienceYears} years` : 'Fresher'}</li>
//                                 <li><b>Previous Company:</b> {employee.previousCompany}</li>
//                                 <li><b>Certifications:</b> {employee.certifications}</li>
//                                 <li><b>Skills:</b> {employee.skills}</li>
//                                 <li><b>Languages:</b> {employee.languages}</li>
//                             </ul>
//                         ) : (
//                             <p>Loading profile...</p>
//                         )}
//                 </div>
//                     <div className="dashboard-card notifications-card">
//                         <h3><FaBell /> Notifications</h3>
//                         <ul className="notifications-list">
//                             <li>No new notifications.</li>
//                         </ul>
//                     </div>
                    
//                     <div className="dashboard-card leave-card">
//                         <h3><FaClipboardList /> Leave Summary</h3>
//                         <p><b>Total Leaves:</b> <span style={{color:'#6366f1'}}>{totalLeaves} days</span></p>
//                         <p><b>Used:</b> <span style={{color:'tomato'}}>{usedLeaves} days</span></p>
//                         <p><b>Remaining:</b> <span style={{color:'#22c55e'}}>{remainingLeaves} days</span></p>
//                     </div>
//                     <div className="dashboard-card payroll-card">
//                         <h3><FaMoneyBill /> Payroll</h3>
//                         <p><b>Latest Payslip:</b> <span style={{color:'#6366f1'}}>Not Available</span></p>
//                         <p><b>Salary:</b> <span style={{color:'#6366f1'}}>Confidential</span></p>
//                         <button className="quick-link-btn" style={{marginTop:8}}>Download Payslip</button>
//                     </div>
                    
//                 </div>
//                 <div className="quick-links">
//                     <button className="quick-link-btn">Update Profile</button>
//                     <button className="quick-link-btn">Change Password</button>
//                     <button className="quick-link-btn">Contact HR</button>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default EmployeeDashboard;


import React, { useEffect, useState, useMemo } from 'react';
import EmployeeSidebar from '../components/EmployeeSidebar';
import './EmployeeDashboard.css';
import axios from 'axios';
import { FaUserCircle, FaBuilding, FaBriefcase, FaCalendarAlt, FaEnvelope, FaPhone, FaMoneyBill, FaClipboardList, FaBell } from 'react-icons/fa';

const EmployeeDashboard = () => {
    const [employee, setEmployee] = useState(null);
    const email = localStorage.getItem('userEmail');

    // Leave state
    const [leaveHistory, setLeaveHistory] = useState([]);
    const totalLeaves = 12;

    const usedLeaves = useMemo(() => {
        return leaveHistory.filter(l => l.status === 'ACCEPTED').length;
    }, [leaveHistory]);

    const remainingLeaves = totalLeaves - usedLeaves;

    useEffect(() => {
        if (email) {
            // Fetch employee details
            axios.get(`http://localhost:8080/api/employee?email=${email}`)
                .then(res => {
                    if (Array.isArray(res.data) && res.data.length > 0) {
                        setEmployee(res.data[0]);
                    } else if (res.data) {
                        setEmployee(res.data);
                    }
                })
                .catch(err => console.error('Failed to fetch employee details', err));

            // Fetch leave history
            axios.get(`http://localhost:8080/api/employee/leave/history?email=${email}`)
                .then(res => {
                    setLeaveHistory(res.data || []);
                })
                .catch(() => {
                    setLeaveHistory([]);
                });
        }
    }, [email]);

    return (
        <div className="employee-dashboard-layout">
            <EmployeeSidebar />
            <div className="employee-dashboard-content">
                <div className="profile-header">
                    <div className="profile-avatar">
                        <FaUserCircle size={72} color="#6366f1" />
                    </div>
                    <div className="profile-header-info">
                        <h2>{employee ? `Welcome ${employee.fullName}!` : 'Welcome!'}</h2>
                        {employee && (
                            <div className="profile-header-meta">
                                <span><FaBuilding /> {employee.department}</span>
                                <span><FaBriefcase /> {employee.role}</span>
                                <span><FaCalendarAlt /> Joined: {employee.joiningDate}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="dashboard-cards">
                    <div className="dashboard-card notifications-card">
                        <h3><FaBell /> Notifications</h3>
                        <ul className="notifications-list">
                            <li>No new notifications.</li>
                        </ul>
                    </div>

                    <div className="dashboard-card leave-card">
                        <h3><FaClipboardList /> Leave Summary</h3>
                        <p><b>Total Leaves:</b> <span style={{ color: '#6366f1' }}>{totalLeaves} days</span></p>
                        <p><b>Used:</b> <span style={{ color: 'tomato' }}>{usedLeaves} days</span></p>
                        <p><b>Remaining:</b> <span style={{ color: '#22c55e' }}>{remainingLeaves} days</span></p>
                    </div>

                    <div className="dashboard-card payroll-card">
                        <h3><FaMoneyBill /> Payroll</h3>
                        <p><b>Latest Payslip:</b> <span style={{ color: '#6366f1' }}>Not Available</span></p>
                        <p><b>Salary:</b> <span style={{ color: '#6366f1' }}>Confidential</span></p>
                        <button className="quick-link-btn" style={{ marginTop: 8 }}>Download Payslip</button>
                    </div>
                </div>

                <div className="quick-links">
                    <button className="quick-link-btn">Update Profile</button>
                    <button className="quick-link-btn">Change Password</button>
                    <button className="quick-link-btn">Contact HR</button>
                </div>
            </div>
        </div>
    );
};

export default EmployeeDashboard;
