
import React, { useState } from 'react';
import PopupMessage from '../components/PopupMessage';
import Sidebar from '../components/SidebarAdmin';
import './AddUser.css';

const AddUser = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'HR',
        password: '',
    });
    const [popup, setPopup] = useState({ show: false, message: '', type: 'success' });

    const generateDefaultPassword = (name, role) => {
        const base = name.trim().split(' ')[0].toLowerCase();
        return `${base}@123`;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Auto-generate password on name or role change
        if (name === 'name' || name === 'role') {
            const updated = {
                ...formData,
                [name]: value,
            };
            updated.password = generateDefaultPassword(updated.name, updated.role);
            setFormData(updated);
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const res = await fetch('http://localhost:8080/api/admin/add-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (res.ok) {
                setPopup({ show: true, title: 'User Added', message: data.message || 'User has been added successfully.', type: 'success' });
                setFormData({ name: '', email: '', role: 'HR', password: '' });
            } else {
                setPopup({ show: true, title: 'Add User Failed', message: data.message || 'Failed to add user.', type: 'error' });
            }
        } catch (err) {
            setPopup({ show: true, title: 'Server Error', message: 'Server error while adding user.', type: 'error' });
        }
    };

    return (
        <div className="admin-dashboard-layout" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e0e7ff 0%, #f8fafc 100%)', fontFamily: 'Segoe UI, Roboto, Arial, sans-serif', color: '#222' }}>
            <Sidebar />
            <main className="add-user-main">
                {popup.show && (
                    <PopupMessage title={popup.title} message={popup.message} type={popup.type} onClose={() => setPopup({ ...popup, show: false })} />
                )}
                <div className="add-user-card">
                    <h2 className="add-user-title">Add User</h2>
                    <form onSubmit={handleSubmit} className="add-user-form">
                        <input
                            type="text"
                            name="name"
                            placeholder="Full Name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                        <input
                            type="email"
                            name="email"
                            placeholder="Email Address"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            required
                        >
                            <option value="HR">HR</option>
                            <option value="Manager">Manager</option>
                            {/*<option value="Employee">Employee</option>*/}
                        </select>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            readOnly
                            placeholder="Auto-generated password"
                        />
                        <button type="submit">Add User</button>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default AddUser;




