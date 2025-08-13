
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboard from './pages/AdminDashboard';
import AddUser from './pages/AddUser';
import ResetPassword from './pages/ResetPassword';
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import ManagerLogin from './pages/ManagerLogin';
import HRLogin from './pages/HRLogin';
import Onboarding from "./pages/Onboarding";
import ManagerOnboarding from "./pages/ManagerOnboarding";
// import EmployeeLogin from "./pages/EmployeeLogin";
import ManagerLeaveRequests from './pages/ManagerLeaveRequests';
import Home from "./pages/Home";
import Sidebar from "./components/Sidebar";
import UnifiedLogin from "./pages/UnifiedLogin";
import EmployeeList from "./pages/EmployeeList";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import EmployeeLeave from "./pages/EmployeeLeave";
import ManagerDashboard from "./pages/ManagerDashboard";
import NotificationsPage from "./pages/NotificationsPage";
import EmployeeOverview from "./pages/EmployeeOverview";
import EmployeeProfile from "./pages/EmployeeProfile";
import TeamMembers from "./pages/TeamMembers";
import PayrollDashboard from "./pages/PayrollDashboard";
import SchedulePayrollForm from "./pages/SchedulePayrollForm";
import PayslipViewer from "./pages/PayslipViewer";
import AdminCTCStructures from "./pages/AdminCTCStructures";
import AdminCTCManagement from "./pages/AdminCTCManagement";
import EmployeeCTCDashboard from "./pages/EmployeeCTCDashboard";
import ManagerTeamPayroll from "./pages/ManagerTeamPayroll";
import HRCTCManagement from "./pages/HRCTCManagement";
import HRCTCStructures from "./pages/HRCTCStructures";
import PaymentHoldManagement from "./pages/PaymentHoldManagement";
import ManagerPaymentHolds from "./pages/ManagerPaymentHolds";
import AdminPaymentHolds from "./pages/AdminPaymentHolds";
import HRPaymentHolds from "./pages/HRPaymentHolds";
import EmployeeLogin from "./pages/EmployeeLogin";
import EmployeeResignation from "./pages/EmployeeResignation";
import ManagerResignationRequests from "./pages/ManagerResignationRequests";
import HRResignationRequests from "./pages/HRResignationRequests";
import HRLeaveRequests from "./pages/HRLeaveRequests";
import LeaveHistory from "./pages/LeaveHistory";
import UpcomingHolidays from "./components/UpcomingHolidays";



function App() {
    return (
        <BrowserRouter>
            <Navbar/>
            <Routes>
                <Route path="/" element={<Home/>} />
                <Route path="/login" element={<UnifiedLogin/>}/>
                <Route path="/hr-dashboard" element={<Dashboard/>} />
                <Route path="/manager/payroll-dashboard" element={<PayrollDashboard />} />
                <Route path="/manager/payslip-viewer" element={<PayslipViewer />} />
                <Route path="/admin-dashboard" element={<AdminDashboard />} />
                <Route path="/navbar" element={<Navbar/>} />
                <Route path="/sidebar" element={<Sidebar/>}/>
                <Route path="/create-user" element={<AddUser/>} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/manager-onboarding" element={<ManagerOnboarding />} />
                <Route path="/manager/schedule" element={<SchedulePayrollForm />} />
                <Route path="/employee" element={<EmployeeList />} />
                <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
                <Route path="/manager-dashboard" element={<ManagerDashboard />} />
                <Route path="/manager/:managerId/leaves" element={<ManagerLeaveRequests />} />
                <Route path="/hr/leave-requests" element={<HRLeaveRequests />} />
                <Route path="/manager/resignation-requests" element={<ManagerResignationRequests />} />
                <Route path="/hr/resignation-requests" element={<HRResignationRequests />} />
                <Route path="/manager-notifications" element={<NotificationsPage />} />
                <Route path="/employee-leave" element={<EmployeeLeave />} />
                <Route path="/employee-resignation" element={<EmployeeResignation />} />
                <Route path="/employee-overview" element={<EmployeeOverview />} />
                <Route path="/employee-profile" element={<EmployeeProfile />} />
                <Route path="/employee-leave-history" element={<LeaveHistory />} />
                <Route path="/upcoming-holidays" element={<UpcomingHolidays />} />
                <Route path="/employee-ctc-dashboard" element={<EmployeeCTCDashboard />} />
                <Route path="/manager-team-payroll" element={<ManagerTeamPayroll />} />
                <Route path="/hr-ctc-auto-calculator" element={<HRCTCManagement />} />
                <Route path="/hr-ctc-structures" element={<HRCTCStructures />} />
                <Route path="/team-members" element={<TeamMembers />} />
                <Route path="/ctc-management" element={<AdminCTCStructures />} />
                <Route path="/ctc-management-new" element={<AdminCTCManagement />} />
                <Route path="/payroll-dashboard" element={<PayrollDashboard />} />
                <Route path="/payment-hold-management" element={<PaymentHoldManagement />} />
                <Route path="/manager/payment-holds" element={<ManagerPaymentHolds />} />
                <Route path="/admin/payment-holds" element={<AdminPaymentHolds />} />
                <Route path="/hr/payment-holds" element={<HRPaymentHolds />} />
                <Route path="/employee-login" element={<EmployeeLogin />} />

            </Routes>
        </BrowserRouter>
    );
}

export default App;