// 
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminLoginPage.css';

const AdminLoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        if (username === 'admin' && password === 'admin123') {
            localStorage.setItem("role", "ADMIN");
            navigate('/admin-dashboard');
        } else {
            alert('Invalid credentials');
        }
    };

    return (
        <div className="admin-login-container">
            <form className="admin-login-form" onSubmit={handleLogin}>
                <h2>PayFlow AI - Admin Login</h2>
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit">Login</button>
            </form>
        </div>
    );
};

export default AdminLoginPage;
