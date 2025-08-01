import React, { useState } from 'react';
import './Login.css';
import { useNavigate } from 'react-router-dom';

const ManagerLogin = () => {
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
          username: email, // backend expects `username`
          password: password,
        }),
      });

      const data = await res.json();
      console.log('Login response data:', data); // Debug log

      if (res.ok) {
        localStorage.setItem('email', email);
        localStorage.setItem('role', data.role);
        // Store managerId for dashboard/leave requests
        if (data.id) {
          localStorage.setItem('managerId', data.id);
        }
        // Store manager name for dashboard personalization
        if (data.name) {
          localStorage.setItem('managerName', data.name);
          console.log('Stored manager name:', data.name); // Debug log
        } else {
          // Fallback to extract name from email if no name provided
          const nameFromEmail = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          localStorage.setItem('managerName', nameFromEmail);
          console.log('Using email-based name:', nameFromEmail); // Debug log
        }
        if (data.firstLogin) {
          navigate('/reset-password');
        } else {
          navigate('/manager-dashboard'); // Make sure this route exists!
        }
      } else {
        alert(data.message || 'Login failed');
      }
    } catch (error) {
      alert('Server error. Please try again.');
    }
  };

  return (
    <div className="login-container">
      <h2>Manager Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Manager Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Manager Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default ManagerLogin;
