// EmployeeProfile.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    FaUserCircle, FaEnvelope, FaPhone, FaBuilding, FaBriefcase,
    FaCalendarAlt, FaGraduationCap, FaStar, FaGlobe
} from 'react-icons/fa';
import EmployeeSidebar from "../components/EmployeeSidebar";
import EmployeeNavbar from "../components/Navbar";
import './EmployeeProfile.css';

const EmployeeProfile = () => {
    const [employee, setEmployee] = useState(null);
    const email = localStorage.getItem('userEmail');

    useEffect(() => {
        if (email) {
            axios.get(`http://localhost:8080/api/employee?email=${email}`)
                .then(res => {
                    if (Array.isArray(res.data) && res.data.length > 0) {
                        setEmployee(res.data[0]);
                    } else if (res.data) {
                        setEmployee(res.data);
                    }
                })
                .catch(err => console.error('Failed to fetch employee details', err));
        }
    }, [email]);

    return (
        <div className="employee-dashboard-layout">
            <EmployeeSidebar />
            <div className="employee-profile-main">
                {/*<EmployeeNavbar />*/}
                <div className="profile-card-container">
                    <div className="profile-card">
                        <h3><FaUserCircle className="icon" /> My Profile</h3>
                        {employee ? (
                            <ul className="profile-list">
                                <li><FaEnvelope /> <span><b>Email:</b> {employee.email}</span></li>
                                <li><FaPhone /> <span><b>Phone:</b> {employee.phone}</span></li>
                                <li><FaBuilding /> <span><b>Department:</b> {employee.department}</span></li>
                                <li><FaBriefcase /> <span><b>Role:</b> {employee.role}</span></li>
                                <li><FaCalendarAlt /> <span><b>Joining Date:</b> {employee.joiningDate}</span></li>
                                <li><FaGraduationCap /> <span><b>Qualification:</b> {employee.qualification}</span></li>
                                <li><FaStar /> <span><b>Specialization:</b> {employee.specialization}</span></li>
                                <li><FaBriefcase /> <span><b>Experience:</b> {employee.hasExperience === 'Yes' ? `${employee.experienceYears} years` : 'Fresher'}</span></li>
                                <li><FaBuilding /> <span><b>Previous Company:</b> {employee.previousCompany}</span></li>
                                <li><FaStar /> <span><b>Certifications:</b> {employee.certifications}</span></li>
                                <li><FaStar /> <span><b>Skills:</b> {employee.skills}</span></li>
                                <li><FaGlobe /> <span><b>Languages:</b> {employee.languages}</span></li>
                            </ul>
                        ) : (
                            <p>Loading profile...</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeProfile;
