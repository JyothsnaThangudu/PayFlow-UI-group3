
import React, { useState } from 'react';
import PopupMessage from '../components/PopupMessage';
import { useNavigate } from 'react-router-dom';
import './ResetPassword.css';

const ResetPassword = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const navigate = useNavigate();
    const email = localStorage.getItem('email');

    const [popup, setPopup] = useState({ show: false, title: '', message: '', type: 'success' });

    const handleReset = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setPopup({ show: true, title: 'Password Mismatch', message: 'Passwords do not match.', type: 'error' });
            return;
        }

        try {
            const res = await fetch('http://localhost:8080/api/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + email, // required by backend
                },
                body: JSON.stringify({ newPassword })
            });

            if (!res.ok) {
                const errText = await res.text(); // handle HTML errors
                throw new Error(errText);
            }

            const data = await res.json();
            setPopup({ show: true, title: 'Password Updated', message: 'Password updated successfully.', type: 'success' });
            setTimeout(() => navigate('/'), 1200);
        } catch (error) {
            console.error('Reset error:', error.message);
            setPopup({ show: true, title: 'Reset Failed', message: 'Reset failed: ' + error.message, type: 'error' });
        }
    };

    return (
        <div className="reset-container">
            {popup.show && (
                <PopupMessage title={popup.title} message={popup.message} type={popup.type} onClose={() => setPopup({ ...popup, show: false })} />
            )}
            <h2>Reset Password</h2>
            <form onSubmit={handleReset}>
                <input
                    type="password"
                    placeholder="New Password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                />
                <button type="submit">Reset Password</button>
            </form>
        </div>
    );
};

export default ResetPassword;
