import React, { useState, useEffect } from 'react';
import './Header.css';
import { FaBell, FaEnvelope } from 'react-icons/fa';

export default function Header() {
    const [hrName, setHrName] = useState("");

    useEffect(() => {
        const storedName = localStorage.getItem("name");
        if (storedName) {
            setHrName(storedName.toUpperCase());
        }
    }, []);

    return (
        <div className="header-container">
            <input
                type="text"
                placeholder="Search for employee, candidate or project"
                className="search-bar"
            />
            <div className="header-right">
                <FaBell className="icon" />
                <FaEnvelope className="icon" />
                <img
                    src="https://i.pravatar.cc/40"
                    alt="avatar"
                    className="avatar"
                />
                {/* ✅ Correct variable name */}
                <span className="user-name">{hrName}</span>
            </div>
        </div>
    );
}
