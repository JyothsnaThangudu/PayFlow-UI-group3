// SchedulePayrollForm.jsx
import React, { useEffect, useState } from 'react';
import axios from '../utils/axios';
import './SchedulePayrollForm.css';
import SidebarManager from '../components/SidebarManager';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';


function SchedulePayrollForm() {
    const managerId = localStorage.getItem('managerId');
    const [employees, setEmployees] = useState([]);
    const [employeeId, setEmployeeId] = useState('');
    const [baseSalary, setBaseSalary] = useState('');
    const [cycle, setCycle] = useState('');
    const [status, setStatus] = useState('Scheduled');
    const [message, setMessage] = useState('');
    const [paymentDate, setPaymentDate] = useState('');
    const navigate = useNavigate();
    // useEffect(() => {
    //     if (!managerId) {
    //         localStorage.setItem("managerId", "17");
    //         window.location.reload();
    //     }
    // }, []);


    useEffect(() => {

        const fetchEmployees = async () => {
            try {
                const res = await axios.get(`/api/manager/${managerId}/team`);
                console.log("fetched employees:", res.data);
                setEmployees(res.data);
            } catch (err) {
                console.error('Error fetching employees:', err);
            }
        };
        fetchEmployees();
    }, [managerId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/payrolls/schedule', {
                employeeId: Number(employeeId),
                baseSalary: parseFloat(baseSalary),
                cycle,
                paymentDate,
                status
            });
            Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Payroll scheduled successfully!',
                timer: 2000,
                showConfirmButton: false
            }).then(() => {
                navigate('/manager/payroll-dashboard'); // ✅ Step 3: Redirect after success
            });

            // setMessage('Payroll scheduled successfully!');
            setEmployeeId('');
            setBaseSalary('');
            setCycle('');
        } catch (error) {
            console.error('Error scheduling payroll:', error);
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Something went wrong while scheduling payroll!',
            });

            // setMessage('Failed to schedule payroll.');
        }
    };

    return (
        <div className="manager-dashboard-layout">
            <SidebarManager />
        <div className="schedule-payroll-form-container">
            <h2>Schedule Payroll</h2>
            {message && <div className="form-message">{message}</div>}
            <form onSubmit={handleSubmit} className="schedule-payroll-form">
                <label>Employee:</label>
                <select value={employeeId} onChange={e => setEmployeeId(e.target.value)} required>
                    <option value="">Select Employee</option>
                    {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.fullName}</option>
                    ))}
                </select>

                <label>Base Salary:</label>
                <input
                    type="number"
                    value={baseSalary}
                    onChange={e => setBaseSalary(e.target.value)}
                    placeholder="Enter base salary"
                    required
                />

                <label>Cycle (Month & Year):</label>
                <input
                    type="month"
                    value={cycle}
                    onChange={e => setCycle(e.target.value)}
                    required
                />

                <label>Payment Date:</label>
                <input
                    type="date"
                    value={paymentDate}
                    onChange={e => setPaymentDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                />


                {/*<label>Choose Payment Date:</label>*/}
                {/*<input*/}
                {/*    type="date"*/}
                {/*    value={cycle}*/}
                {/*    onChange={e => setCycle(e.target.value)}*/}
                {/*    min={new Date().toISOString().split('T')[0]}*/}
                {/*    required*/}
                {/*/>*/}



                <button type="submit">Submit</button>
            </form>
        </div>
        </div>
    );
}

export default SchedulePayrollForm;