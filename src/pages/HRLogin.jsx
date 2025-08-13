// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import './Login.css';

// const HRLogin = () => {
//     const [email, setEmail] = useState('');
//     const [password, setPassword] = useState('');
//     const navigate = useNavigate();

//     const handleSubmit = (e) => {
//         e.preventDefault();

//         if (email === 'hr@example.com' && password === 'hr@123') {
//             localStorage.setItem('email', email);
//             localStorage.setItem('role', 'HR');
//             navigate('/reset-password');
//             return;
//         }

//         if (email === 'hr@example.com' && password !== '') {
//             localStorage.setItem('email', email);
//             localStorage.setItem('role', 'HR');
//             navigate('/hr-dashboard');
//             return;
//         }

//         alert('Login failed. Invalid credentials.');
//     };

//     return (
//         <div className="login-container">
//             <h2>HR Login</h2>
//             <form onSubmit={handleSubmit}>
//                 <input
//                     type="email"
//                     placeholder="HR Email"
//                     value={email}
//                     onChange={(e) => setEmail(e.target.value)}
//                     required
//                 />
//                 <input
//                     type="password"
//                     placeholder="HR Password"
//                     value={password}
//                     onChange={(e) => setPassword(e.target.value)}
//                     required
//                 />
//                 <button type="submit">Login</button>
//             </form>
//         </div>
//     );
// };

// export default HRLogin;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const HRLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch('http://localhost:8080/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: email, // ✅ backend expects `username`
          password: password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('email', email);
        localStorage.setItem('role', data.role);
        if (data.firstLogin) {
          navigate('/reset-password');
        } else {
          navigate('/hr-dashboard');
        }
      } else {
        alert(data.message || 'Login failed');
      }
    } catch (err) {
      alert('Server error');
    }
  };

  return (
    <div className="login-container">
      <h2>HR Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="HR Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="HR Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default HRLogin;
