// import React, { useState } from 'react';
// import axios from 'axios';
// import { useNavigate } from 'react-router-dom';

// import './Login.css';
// const EmployeeLogin = () => {
//     const [employeeId, setEmployeeId] = useState('');
//     const [password, setPassword] = useState('');
//     const [error, setError] = useState('');
//     const navigate = useNavigate();

//     const handleLogin = async (e) => {
//         e.preventDefault();

//         // Default password check
//         if (password === 'employee@123') {
//             alert("Login Successful with default password");
//             localStorage.setItem('employeeToken', 'dummy-token');
//             return;
//         }

//         try {
//             const res = await axios.post('http://localhost:8080/api/employees/login', {
//                 employeeId,
//                 password
//             });
//             alert("Login Successful");
//             localStorage.setItem('employeeToken', res.data.token);
//         } catch (err) {
//             setError('Invalid credentials. Please try again.');
//         }
//     };

//     return (
//         <div className="login-container">
//             <h2>Employee Login</h2>
//             <form onSubmit={handleLogin}>
//                 <input
//                     type="text"
//                     placeholder="Employee ID"
//                     value={employeeId}
//                     onChange={(e) => setEmployeeId(e.target.value)}
//                     required
//                 />
//                 <input
//                     type="password"
//                     placeholder="Password"
//                     value={password}
//                     onChange={(e) => setPassword(e.target.value)}
//                     required
//                 />
//                 {error && <p className="error" style={{ color: 'red' }}>{error}</p>}
//                 <button type="submit">Login</button>
//             </form>
//         </div>
//     );
// };

// export default EmployeeLogin;

import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const EmployeeLogin = () => {
    const [employeeId, setEmployeeId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();

        if (password === 'employee@123') {
            alert("Login Successful with default password");
            localStorage.setItem('employeeToken', 'dummy-token');
            localStorage.setItem('role', 'EMPLOYEE');
            navigate('/reset-password');
            return;
        }

        try {
            const res = await axios.post('http://localhost:8080/api/employees/login', {
                employeeId,
                password
            });

            localStorage.setItem('employeeToken', res.data.token);
            localStorage.setItem('role', 'EMPLOYEE');
            alert("Login Successful");
            navigate('/employee-dashboard');
        } catch (err) {
            setError('Invalid credentials. Please try again.');
        }
    };

    return (
        <div className="login-container">
            <h2>Employee Login</h2>
            <form onSubmit={handleLogin}>
                <input
                    type="text"
                    placeholder="Employee ID"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                {error && <p className="error" style={{ color: 'red' }}>{error}</p>}
                <button type="submit">Login</button>
            </form>
        </div>
    );
};

export default EmployeeLogin;
