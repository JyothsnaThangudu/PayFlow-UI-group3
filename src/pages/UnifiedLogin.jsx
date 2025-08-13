import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';
import PopupMessage from '../components/PopupMessage';

const UnifiedLogin = () => {
    const [emailOrId, setEmailOrId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [popup, setPopup] = useState({ show: false, title: '', message: '', type: 'success' });


    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");

        // Admin shortcut login (frontend-only)
        if (emailOrId === 'admin' && password === 'admin123') {
            localStorage.setItem('role', 'ADMIN');
            localStorage.setItem('authToken', 'static-admin-token'); // if needed
            setPopup({ show: true, title: 'Login Successful', message: 'Welcome Admin!', type: 'success' });
            setTimeout(() => {
                setPopup({ ...popup, show: false });
                navigate('/admin-dashboard');
            }, 1200);
            return;
        }

        // Optional: Map employee ID to email
        const employeeIdToEmail = {
            "E001": "john@example.com",
            "E002": "sarah@example.com"
            // add as needed
        };

        let finalEmail = emailOrId;
        if (employeeIdToEmail[emailOrId]) {
            finalEmail = employeeIdToEmail[emailOrId];
        }

        try {
            const res = await axios.post("http://localhost:8080/api/login", {
                username: finalEmail,
                password: password,
            });
            const { token, role, firstLogin, name, id, managerId } = res.data;
            localStorage.setItem("authToken", token);
            localStorage.setItem("role", role);
            localStorage.setItem("email", finalEmail);
            localStorage.setItem("name", name || "User");
            localStorage.setItem("userId", id); // Store user ID
            // Store managerId for manager dashboard/leave requests
            if (role === "MANAGER") {
                if (managerId && managerId !== "null") {
                    localStorage.setItem("managerId", managerId);
                } else if (id && id !== "null") {
                    localStorage.setItem("managerId", id);
                }
            }
            // Store userEmail for employee dashboard fetch
            if (role === "EMPLOYEE") {
                localStorage.setItem("userEmail", finalEmail);
                
                // Also fetch and store employeeId for the employee
                try {
                    const employeeRes = await axios.get(`http://localhost:8080/api/employee?email=${finalEmail}`);
                    if (employeeRes.data && employeeRes.data.id) {
                        localStorage.setItem("employeeId", employeeRes.data.id);
                        console.log('Stored employeeId:', employeeRes.data.id);
                    }
                } catch (empError) {
                    console.error('Error fetching employee details during login:', empError);
                }
            } else {
                localStorage.removeItem("userEmail");
                localStorage.removeItem("employeeId");
            }

            setPopup({ show: true, title: 'Login Successful', message: `Welcome ${res.data.name || role}!`, type: 'success' });
            setTimeout(() => {
                setPopup({ ...popup, show: false });
                if (firstLogin) {
                    navigate("/reset-password");
                } else {
                    if (role === "HR") navigate("/hr-dashboard");
                    else if (role === "MANAGER") navigate("/manager-dashboard");
                    else if (role === "EMPLOYEE") navigate("/employee-dashboard");
                    else navigate("/");
                }
            }, 1200);
        } catch (err) {
            setPopup({ show: true, title: 'Login Failed', message: 'Invalid credentials. Please try again.', type: 'error' });
        }
    };

    return (
        <div className="login-container">
            {popup.show && (
                <PopupMessage title={popup.title} message={popup.message} type={popup.type} onClose={() => setPopup({ ...popup, show: false })} />
            )}
            <h2>PayFlow AI - Login</h2>
            <form onSubmit={handleLogin}>
                <input
                    type="text"
                    placeholder="Email / Employee ID"
                    value={emailOrId}
                    onChange={(e) => setEmailOrId(e.target.value)}
                    required
                />
                <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <label>
                    <input type="checkbox" checked={showPassword} onChange={() => setShowPassword(!showPassword)} />
                    Show Password
                </label>

                {error && <p className="error" style={{ color: 'red' }}>{error}</p>}
                <button type="submit">Login</button>
            </form>
        </div>
    );
};

export default UnifiedLogin;





// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import axios from 'axios';
// import './Login.css';
// import Swal from 'sweetalert2';
//
//
// const UnifiedLogin = () => {
//     const [emailOrId, setEmailOrId] = useState('');
//     const [password, setPassword] = useState('');
//     const [error, setError] = useState('');
//     const navigate = useNavigate();
//
//     const handleLogin = async (e) => {
//         e.preventDefault();
//         setError("");
//
//         // Admin shortcut login (frontend-only)
//         if (emailOrId === 'admin@payflow.com' && password === 'admin123') {
//             localStorage.setItem('role', 'ADMIN');
//             localStorage.setItem('authToken', 'static-admin-token'); // if needed
//             Swal.fire({
//                 icon: 'success',
//                 title: 'Login Successful',
//                 text: 'Welcome Admin!',
//                 timer: 2000,
//                 showConfirmButton: false,
//             });
//
//             navigate('/admin-dashboard');
//             return;
//         }
//
//         // Optional: Map employee ID to email
//         const employeeIdToEmail = {
//             "E001": "john@example.com",
//             "E002": "sarah@example.com"
//             // add as needed
//         };
//
//         let finalEmail = emailOrId;
//         if (employeeIdToEmail[emailOrId]) {
//             finalEmail = employeeIdToEmail[emailOrId];
//         }
//
//         try {
//             const res = await axios.post("http://localhost:8080/api/login", {
//                 username: finalEmail,
//                 password: password,
//             });
//
//             const { token, role, firstLogin } = res.data;
//
//             localStorage.setItem("authToken", token);
//             localStorage.setItem("role", role);
//             localStorage.setItem("email", finalEmail);
//
//             if (firstLogin) {
//                 navigate("/reset-password");
//             } else {
//                 if (role === "HR") navigate("/hr-dashboard");
//                 else if (role === "MANAGER") navigate("/manager-dashboard");
//                 else if (role === "EMPLOYEE") navigate("/employee-dashboard");
//                 else navigate("/");
//             }
//         } catch (err) {
//             setError("Invalid credentials. Please try again.");
//         }
//     };
//
//
//
//     return (
//         <div className="login-container">
//             <h2>PayFlow AI - Login</h2>
//             <form onSubmit={handleLogin}>
//                 <input
//                     type="text"
//                     placeholder="Email / Employee ID"
//                     value={emailOrId}
//                     onChange={(e) => setEmailOrId(e.target.value)}
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
//
// export default UnifiedLogin;
