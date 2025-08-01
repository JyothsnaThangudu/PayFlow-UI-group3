import React, { useState, useEffect } from 'react';
import './Navbar.css';
import { useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
    const [role, setRole] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const savedRole = localStorage.getItem('role');
        setRole(savedRole);
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        setRole(null);
        navigate('/');
    };

    const handleLogin = () => {
        navigate('/login'); // your unified login route
    };
    const isHomeOrLogin = location.pathname === '/' || location.pathname === '/login';
    return (
        <nav className="navbar">
            <div className="navbar-left">PayFlow AI</div>

            <div className="navbar-right">
                {isHomeOrLogin ? (
                    <button onClick={handleLogin}>Login</button>
                ) : (
                    <button onClick={handleLogout}>Logout</button>
                )}
            </div>
        </nav>
    );
};

export default Navbar;




//
// import React, { useState, useEffect } from 'react';
// import './Navbar.css';
// import { useNavigate } from 'react-router-dom';
//
// const Navbar = () => {
//     const [dropdownOpen, setDropdownOpen] = useState(false);
//     const [role, setRole] = useState(null);
//     const navigate = useNavigate();
//
//     useEffect(() => {
//         const savedRole = localStorage.getItem('role');
//         setRole(savedRole);
//     }, []);
//
//     const handleLoginAs = (selectedRole) => {
//         navigate(`/login/${selectedRole.toLowerCase()}`);
//         setDropdownOpen(false);
//     };
//
//     const handleLogout = () => {
//         localStorage.clear();
//         setRole(null);
//         navigate('/');
//     };
//
//     return (
//         <nav className="navbar">
//             <div className="navbar-left">PayFlow AI</div>
//             <div className="navbar-right">
//                 {role ? (
//                     <button onClick={handleLogout}>Logout</button>
//                 ) : (
//                     <div className="dropdown">
//                         <button
//                             className="dropdown-toggle"
//                             onClick={() => setDropdownOpen(!dropdownOpen)}
//                         >
//                             Login As ▾
//                         </button>
//                         {dropdownOpen && (
//                             <div className="dropdown-menu">
//                                 <button onClick={() => handleLoginAs('Admin')}>Admin</button>
//                                 <button onClick={() => handleLoginAs('HR')}>HR</button>
//                                 <button onClick={() => handleLoginAs('Manager')}>Manager</button>
//                                 <button onClick={() => handleLoginAs('Employee')}>Employee</button>
//                             </div>
//                         )}
//                     </div>
//                 )}
//             </div>
//         </nav>
//     );
// };
//
// export default Navbar;
