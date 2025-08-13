import React from 'react';
import './Home.css'; // New CSS file just for Home

const Home = () => {
    return (
        <div className="home-container">
            <div className="home-content">
                <h1>Welcome to <span>PayFlow AI</span></h1>
                <p>
                    PayFlow AI is an intelligent platform for seamless employee onboarding and management.
                    From secure logins to role-based access for Admin, HR, Managers, and Employees — we help organizations
                    digitize and streamline their workflows with efficiency and security.
                </p>
                <p className="tagline">
                    Empowering HR. Accelerating Onboarding. Simplifying Workflows.
                </p>
            </div>
        </div>
    );
};

export default Home;
