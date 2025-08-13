import React, { useEffect, useState } from 'react';
import SidebarManager from '../components/SidebarManager';
import axios from '../utils/axios';
import { 
FaUsers, 
FaSearch,
FaDownload,
FaEye,
FaEnvelope,
FaBuilding,
FaBriefcase,
FaCalendarCheck,
FaUserTie,
FaTimes,
FaChartBar,
FaUserClock,
FaUser,
FaGraduationCap,
FaStar,
FaArrowLeft,
FaArrowRight,
FaCheckCircle,
FaTimesCircle,
FaHourglassHalf,
FaPhone
} from 'react-icons/fa';
import TeamAnalyticsChart from '../components/TeamAnalyticsChart';
import './TeamMembers.css';

const TeamMembers = () => {
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [leaveHistoryMember, setLeaveHistoryMember] = useState(null);
    const [leavePage, setLeavePage] = useState(1);
    const leavesPerPage = 5;
     const [show, setShow] = useState(true);
    // eslint-disable-next-line no-unused-vars
    const [leaveStatusFilter, setLeaveStatusFilter] = useState('ALL');
    const managerId = localStorage.getItem('managerId');
    const managerName = localStorage.getItem('managerName') || 'Manager';
    
    const [team, setTeam] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDepartment, setFilterDepartment] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [selectedMember, setSelectedMember] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [memberDetails, setMemberDetails] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);

    // Scroll to top when component mounts
    useEffect(() => {
        setTimeout(() => {
            window.scrollTo(0, 0);
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
        }, 0);
    }, []);

    useEffect(() => {
        async function fetchTeamData() {
            setLoading(true);
            try {
                console.log('Fetching team data for manager:', managerId);
                const [teamRes, leavesRes] = await Promise.all([
                    axios.get(`/api/manager/${managerId}/team`),
                    axios.get(`/api/manager/${managerId}/leaves`)
                ]);
                
                console.log('Team data:', teamRes.data);
                console.log('Leaves data:', leavesRes.data);
                
                setTeam(teamRes.data);
                setLeaves(leavesRes.data);
            } catch (err) {
                console.error("Error fetching team data", err);
                
                // Fallback with sample data for design purposes
                try {
                    const teamFallback = await axios.get('/api/employee');
                    const leavesFallback = await axios.get('/api/employee/leaves/all');
                    
                    const filteredTeam = teamFallback.data.filter(emp => 
                        emp.managerId === managerId || emp.managerId === parseInt(managerId)
                    );
                    
                    setTeam(filteredTeam.length > 0 ? filteredTeam : teamFallback.data.slice(0, 12));
                    setLeaves(leavesFallback.data || []);
                } catch (fallbackErr) {
                    console.error("Fallback API calls failed:", fallbackErr);
                    // Set sample data for design demonstration
                    setTeam([
                        {
                            id: 1,
                            fullName: "John Smith",
                            email: "john.smith@company.com",
                            department: "Engineering",
                            position: "Senior Developer",
                            phoneNumber: "+1-555-0123"
                        },
                        {
                            id: 2,
                            fullName: "Sarah Johnson",
                            email: "sarah.johnson@company.com",
                            department: "Design",
                            position: "UI/UX Designer",
                            phoneNumber: "+1-555-0124"
                        },
                        {
                            id: 3,
                            fullName: "Mike Davis",
                            email: "mike.davis@company.com",
                            department: "Engineering",
                            position: "Frontend Developer",
                            phoneNumber: "+1-555-0125"
                        }
                    ]);
                    setLeaves([]);
                }
            }
            setLoading(false);
        }
        
        if (managerId) {
            fetchTeamData();
        }
    }, [managerId]);

    // Filter team members
    const filteredTeam = team.filter(member => {
        const matchesSearch = 
            member.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.position?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesDepartment = filterDepartment === '' || member.department === filterDepartment;
        
        const memberLeaves = leaves.filter(l => l.employeeId === member.id);
        const hasActiveLeave = memberLeaves.some(l => {
            const today = new Date().toISOString().slice(0, 10);
            return l.fromDate <= today && l.toDate >= today && l.status === 'ACCEPTED';
        });
        
        const matchesStatus = filterStatus === '' || 
            (filterStatus === 'active' && !hasActiveLeave) ||
            (filterStatus === 'on-leave' && hasActiveLeave);
        
        return matchesSearch && matchesDepartment && matchesStatus;
    });

    // Get statistics
    const departments = [...new Set(team.map(member => member.department).filter(Boolean))];
    const today = new Date().toISOString().slice(0, 10);
    const onLeaveToday = team.filter(member => {
        const memberLeaves = leaves.filter(l => l.employeeId === member.id);
        return memberLeaves.some(l => l.fromDate <= today && l.toDate >= today && l.status === 'ACCEPTED');
    }).length;

    const handleViewMember = async (member) => {
        setSelectedMember(member);
        setShowModal(true);
        setModalLoading(true);
        try {
            // Try to fetch full details from backend
            console.log('Fetching member details for ID:', member.id);
            const res = await axios.get(`/api/employee/${member.id}`);
            console.log('Member details response:', res.data);
            setMemberDetails(res.data);
        } catch (err) {
            console.log('Error fetching member details, using fallback:', err);
            // Fallback to summary if error
            setMemberDetails(member);
        }
        setModalLoading(false);
    };

    const exportTeamData = () => {
        const csvContent = [
            ['Name', 'Email', 'Department', 'Position', 'Phone'].join(','),
            ...filteredTeam.map(member => [
                member.fullName || '',
                member.email || '',
                member.department || '',
                member.position || '',
                member.phone || ''
            ].join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `team-members-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    const clearFilters = () => {
        setSearchTerm('');
        setFilterDepartment('');
        setFilterStatus('');
    };

    if (loading) {
        return (
            <div className="team-members-container">
                <div className="team-members-layout">
                    <SidebarManager />
                    <div className="team-content">
                        <div className="loading-state">
                            <div className="loading-spinner"></div>
                            <div className="loading-text">Loading your team...</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="team-members-container">
            <div className="team-members-layout">
                <SidebarManager />
                <div className="team-content">
                    {/* Header Section */}
                    <div className="team-header">
                        <div className="team-header-top">
                            <h1 className="team-title">
                                <div className="team-title-icon">
                                    <FaUsers />
                                </div>
                                My Team
                            </h1>
                            <div className="team-actions">
                                <button className="action-btn" onClick={exportTeamData}>
                                    <FaDownload />
                                    Export
                                </button>
                                <button className="action-btn" onClick={()=>setShowAnalytics(true)}>
                                    <FaChartBar />
                                    Analytics
                                </button>
                    {/* Analytics Modal */}
                    {showAnalytics && (
                        <div className="modal-overlay" onClick={()=>setShowAnalytics(false)}>
                            <div className="modal-content" style={{maxWidth:'540px'}} onClick={e=>e.stopPropagation()}>
                               <button onClick={()=>setShowAnalytics(false)} style={{ maxWidth: '540px',  position: 'absolute', top: '10px', right: '10px',fontSize: '24px',color: 'red',background: 'transparent',border: 'none',cursor: 'pointer', }}>
                                    <FaTimes />
                                </button>

                                {/* <button className="modal-close" onClick={()=>setShowAnalytics(false)}><FaTimes style={{ fontSize: '20px', color: 'white' }} /></button> */}
                                <div className="modal-header">
                                    <div style={{display:'flex',alignItems:'center',gap:'0.7rem',fontSize:'1.3rem',fontWeight:600}}>
                                        <FaChartBar style={{color:'#3a3ad6'}}/> Employee Analytics
                                    </div>
                                    
                                </div>
                                <div className="modal-body" style={{padding:'2rem 1.5rem', maxHeight: '70vh', overflowY: 'auto'}}>
                                    <TeamAnalyticsChart team={team} leaves={leaves} />
                                    <div style={{
                                        marginTop:'2.5rem',
                                        display:'grid',
                                        gridTemplateColumns:'1fr',
                                        gap:'1.2rem',
                                        background:'#f8f9ff',
                                        borderRadius:'14px',
                                        boxShadow:'0 2px 12px rgba(60,60,120,0.08)',
                                        padding:'1.5rem 1.2rem',
                                        maxWidth:'420px',
                                        marginLeft:'auto',
                                        marginRight:'auto'
                                    }}>
                                        <div style={{display:'flex',alignItems:'center',gap:'0.7rem',fontSize:'1.08rem'}}>
                                            <FaUsers style={{color:'#3a3ad6'}}/> <span style={{fontWeight:600}}>Total Employees:</span> <span style={{fontWeight:700,color:'#222'}}>{team.length}</span>
                                        </div>
                                        <div style={{display:'flex',alignItems:'center',gap:'0.7rem',fontSize:'1.08rem'}}>
                                            <FaBriefcase style={{color:'#3a3ad6'}}/> <span style={{fontWeight:600}}>Departments:</span> <span style={{fontWeight:700,color:'#222'}}>{[...new Set(team.map(m=>m.department).filter(Boolean))].length}</span>
                                        </div>
                                        <div style={{display:'flex',alignItems:'center',gap:'0.7rem',fontSize:'1.08rem'}}>
                                            <FaCalendarCheck style={{color:'#3a3ad6'}}/> <span style={{fontWeight:600}}>Total Leaves:</span> <span style={{fontWeight:700,color:'#222'}}>{leaves.length}</span>
                                        </div>
                                        <div style={{display:'flex',alignItems:'center',gap:'0.7rem',fontSize:'1.08rem'}}>
                                            <FaStar style={{color:'#2196f3'}}/> <span style={{fontWeight:600}}>Average Leaves per Employee:</span> <span style={{fontWeight:700,color:'#222'}}>{team.length ? (leaves.length/team.length).toFixed(2) : 0}</span>
                                        </div>
                                        {/* Removed Most Active Department stat */}
                                        <div style={{display:'flex',alignItems:'center',gap:'0.7rem',fontSize:'1.08rem'}}>
                                            <FaUserClock style={{color:'#ff9800'}}/> <span style={{fontWeight:600}}>Employees On Leave Today:</span> <span style={{fontWeight:700,color:'#222'}}>{team.filter(member => {
                                                const memberLeaves = leaves.filter(l => l.employeeId === member.id);
                                                const today = new Date().toISOString().slice(0, 10);
                                                return memberLeaves.some(l => l.fromDate <= today && l.toDate >= today && l.status === 'ACCEPTED');
                                            }).length}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                            </div>
                        </div>
                        
                        <div className="team-stats-header">
                            <div className="stat-item">
                                <span className="stat-number">{team.length}</span>
                                <span className="stat-label">Total Members</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-number">{departments.length}</span>
                                <span className="stat-label">Departments</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-number">{onLeaveToday}</span>
                                <span className="stat-label">On Leave Today</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-number">{filteredTeam.length}</span>
                                <span className="stat-label">Showing Results</span>
                            </div>
                        </div>
                    </div>

                    {/* Search and Filter Controls */}
                    <div className="team-controls">
                        <div className="controls-row">
                            <div className="search-container">
                                <FaSearch className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search team members..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="search-input"
                                />
                            </div>
                            
                            <div className="filter-group">
                                <select
                                    value={filterDepartment}
                                    onChange={(e) => setFilterDepartment(e.target.value)}
                                    className="filter-select"
                                >
                                    <option value="">All Departments</option>
                                    {departments.map(dept => (
                                        <option key={dept} value={dept}>{dept}</option>
                                    ))}
                                </select>
                                
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="filter-select"
                                >
                                    <option value="">All Status</option>
                                    <option value="active">Active</option>
                                    <option value="on-leave">On Leave</option>
                                </select>
                                
                                {(searchTerm || filterDepartment || filterStatus) && (
                                    <button className="action-btn" onClick={clearFilters}>
                                        <FaTimes />
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Team Members Table */}
                    {filteredTeam.length > 0 ? (
                        <div className="team-table-container">
                            <table className="team-table">
                                <thead>
                                    <tr>
                                        <th>Employee</th>
                                        <th>Department</th>
                                        <th>Contact</th>
                                        <th>Status</th>
                                        <th>Total Leaves</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTeam.map(member => {
                                        const memberLeaves = leaves.filter(l => l.employeeId === member.id);
                                        const currentLeave = memberLeaves.find(l => 
                                            l.fromDate <= today && l.toDate >= today && l.status === 'ACCEPTED'
                                        );
                                        const isOnLeave = !!currentLeave;

                                        return (
                                            <tr key={member.id}>
                                                <td data-label="Employee">
                                                    <div className="member-info-cell">
                                                        <div className="member-avatar">
                                                            {(member.fullName || member.firstName || 'U').charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="member-info">
                                                            <div className="member-name">
                                                                {(() => {
                                                                    const name = member.fullName || 
                                                                        (member.firstName && member.lastName ? `${member.firstName} ${member.lastName}` : '') ||
                                                                        member.name || 'Unknown';
                                                                    return name.charAt(0).toUpperCase() + name.slice(1);
                                                                })()}
                                                            </div>
                                                            <div className="member-role">{member.position || 'Employee'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td data-label="Department" className="department-cell">
                                                    {member.department || 'N/A'}
                                                </td>
                                                <td data-label="Contact" className="contact-cell">
                                                    <div>{member.email || 'N/A'}</div>
                                                    <div>{member.phone || 'N/A'}</div>

                                                </td>
                                                <td data-label="Status">
                                                    <span className={`status-badge status-${isOnLeave ? 'leave' : 'active'}`}>
                                                        {isOnLeave ? 'On Leave' : 'Active'}
                                                    </span>
                                                </td>
                                                <td data-label="Leaves" className="text-center">
                                                    <strong>{memberLeaves.length}</strong> leaves
                                                </td>
                                                <td data-label="Actions" className="actions-cell">
                                                    <button 
                                                        className="view-btn"
                                                        onClick={() => handleViewMember(member)}
                                                    >
                                                        <FaEye />
                                                        View
                                                    </button>
                                                    <button className="leaves-btn" onClick={() => {
                                                        setLeaveHistoryMember(member);
                                                        setShowLeaveModal(true);
                                                    }}>
                                                        <FaCalendarCheck />
                                                        Leaves
                                                    </button>
                    {/* Leave History Modal */}
                    {showLeaveModal && leaveHistoryMember && (
                        <div className="modal-overlay" style={{backdropFilter:'blur(6px)',background:'rgba(40,40,60,0.18)'}} onClick={() => {
                            setShowLeaveModal(false);
                            setLeaveHistoryMember(null);
                        }}>
                            <div className="modal-content" style={{maxWidth:'600px'}} onClick={e => e.stopPropagation()}>
                                <div className="modal-header">
                                    <div className="employee-name-card">
                                        <FaCalendarCheck className="section-icon" />
                                        {leaveHistoryMember.fullName || leaveHistoryMember.firstName || 'Employee'}
                                    </div>
                                    <div className="employee-details-subtitle">Leave History</div>
                                    <button className="modal-close" onClick={() => {
                                        setShowLeaveModal(false);
                                        setLeaveHistoryMember(null);
                                    }}>
                                        <FaTimes />
                                    </button>
                                </div>
                                <div className="modal-body" style={{maxHeight: '70vh', overflowY: 'auto'}}>
                                    {/* Leave Summary */}
                                    {(() => {
                                        const history = leaves.filter(l => l.employeeId === leaveHistoryMember.id);
                                        const approved = history.filter(l => l.status === 'ACCEPTED').length;
                                        const pending = history.filter(l => l.status === 'PENDING').length;
                                        const denied = history.filter(l => l.status === 'DENIED').length;
                                        // Calculate used days (sum of days for ACCEPTED or USED)
                                        const getDays = (from, to) => {
                                            const d1 = new Date(from);
                                            const d2 = new Date(to);
                                            return Math.floor((d2 - d1) / (1000*60*60*24)) + 1;
                                        };
                                        const usedDays = history.filter(l => l.status === 'ACCEPTED' || l.status === 'USED')
                                            .reduce((sum, l) => sum + getDays(l.fromDate, l.toDate), 0);
                                        const total = leaveHistoryMember.totalLeaves || 12;
                                        const remaining = Math.max(0, total - usedDays);
                                        const used = total - remaining;
                                        return (
                                            <div style={{display:'flex',gap:'2.5rem',justifyContent:'center',marginBottom:'1.2rem',flexWrap:'wrap'}}>
                                                <div style={{textAlign:'center'}}>
                                                    <div style={{fontWeight:600,color:'#3a3ad6',display:'flex',alignItems:'center',justifyContent:'center',gap:'0.4rem'}}><FaCheckCircle color="#4caf50"/> Approved</div>
                                                    <div style={{fontSize:'1.1rem',fontWeight:700,color:'#4caf50'}}>{approved}</div>
                                                </div>
                                                <div style={{textAlign:'center'}}>
                                                    <div style={{fontWeight:600,color:'#3a3ad6',display:'flex',alignItems:'center',justifyContent:'center',gap:'0.4rem'}}><FaHourglassHalf color="#ff9800"/> Pending</div>
                                                    <div style={{fontSize:'1.1rem',fontWeight:700,color:'#ff9800'}}>{pending}</div>
                                                </div>
                                                <div style={{textAlign:'center'}}>
                                                    <div style={{fontWeight:600,color:'#3a3ad6',display:'flex',alignItems:'center',justifyContent:'center',gap:'0.4rem'}}><FaStar color="#2196f3"/> Used</div>
                                                    <div style={{fontSize:'1.1rem',fontWeight:700,color:'#2196f3'}}>{used}</div>
                                                </div>
                                                <div style={{textAlign:'center'}}>
                                                    <div style={{fontWeight:600,color:'#3a3ad6',display:'flex',alignItems:'center',justifyContent:'center',gap:'0.4rem'}}><FaCalendarCheck color="#673ab7"/> Remaining</div>
                                                    <div style={{fontSize:'1.1rem',fontWeight:700,color:'#673ab7'}}>{remaining}</div>
                                                </div>
                                                <div style={{textAlign:'center'}}>
                                                    <div style={{fontWeight:600,color:'#3a3ad6',display:'flex',alignItems:'center',justifyContent:'center',gap:'0.4rem'}}><FaTimesCircle color="#f44336"/> Denied</div>
                                                    <div style={{fontSize:'1.1rem',fontWeight:700,color:'#f44336'}}>{denied}</div>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                    {/* Leave History Table with Pagination and Filter */}
                                    {(() => {
                                        let history = leaves.filter(l => l.employeeId === leaveHistoryMember.id);
                                        // Filter by status
                                        if (leaveStatusFilter !== 'ALL') {
                                            history = history.filter(l => l.status === leaveStatusFilter);
                                        }
                                        const totalPages = Math.ceil(history.length / leavesPerPage) || 1;
                                        const pagedHistory = history.slice((leavePage-1)*leavesPerPage, leavePage*leavesPerPage);
                                        return (
                                            <div style={{marginTop:'0.5rem'}}>
                                                <div style={{display:'flex',justifyContent:'flex-end',marginBottom:'0.7rem',gap:'0.5rem'}}>
                                                    <select className="leave-status-filter" value={leaveStatusFilter} onChange={e=>{setLeaveStatusFilter(e.target.value);setLeavePage(1);}} style={{padding:'0.4rem 1rem',borderRadius:'6px',border:'1px solid #d1d5db',fontWeight:600,color:'#3a3ad6',background:'#f5f6fa'}}>
                                                        <option value="ALL">All</option>
                                                        <option value="ACCEPTED">Accepted</option>
                                                        <option value="PENDING">Pending</option>
                                                        <option value="DENIED">Denied</option>
                                                    </select>
                                                </div>
                                                <table className="team-table modern-leave-table">
                                                    <thead>
                                                        <tr style={{background:'#f5f6fa'}}>
                                                            <th style={{color:'#3a3ad6'}}>Start Date</th>
                                                            <th style={{color:'#3a3ad6'}}>End Date</th>
                                                            <th style={{color:'#3a3ad6'}}>Reason</th>
                                                            <th style={{color:'#3a3ad6'}}>Status</th>
                                                            <th style={{color:'#3a3ad6'}}>Denial Reason</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
  {history.length === 0 ? (
    <tr>
      <td colSpan={5} style={{ textAlign: 'center', color: '#888' }}>
        No leave history found.
      </td>
    </tr>
  ) : (
    pagedHistory.map((leave, idx) => (
      <tr
        key={idx}
        style={{
          background:
            leave.status === 'DENIED'
              ? '#ffeaea'
              : leave.status === 'ACCEPTED'
              ? '#eaffea'
              : leave.status === 'PENDING'
              ? '#fffbe6'
              : '#f5f6fa',
        }}
      >
        <td>{formatDate(leave.fromDate)}</td>
        <td>{formatDate(leave.toDate)}</td>
        <td>{leave.reason || 'N/A'}</td>
        <td style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          {leave.status === 'ACCEPTED' && <FaCheckCircle color="#4caf50" />}
          {leave.status === 'DENIED' && <FaTimesCircle color="#f44336" />}
          {leave.status === 'PENDING' && <FaHourglassHalf color="#ff9800" />}
          {leave.status === 'USED' && <FaStar color="#2196f3" />}
          <span>{leave.status || 'N/A'}</span>
        </td>
        <td className="denial-reason-cell">
          {leave.status === 'DENIED' ? (
            leave.denialReason ? (
              <>
                <span className="denial-reason-ellipsis">
                  {leave.denialReason.length > 25 ? leave.denialReason.slice(0, 25) + '...' : leave.denialReason}
                </span>
                <span className="denial-tooltip">{leave.denialReason}</span>
              </>
            ) : 'N/A'
          ) : '-'}
        </td>
      </tr>
    ))
  )}
</tbody>

                                                </table>
                                                {/* Pagination Controls */}
                                                {history.length > leavesPerPage && (
                                                    <div style={{display:'flex',justifyContent:'center',alignItems:'center',marginTop:'1rem',gap:'1.5rem'}}>
                                                        <button className="leave-pagination-btn" onClick={()=>setLeavePage(p=>Math.max(1,p-1))} disabled={leavePage===1} style={{background:'none',border:'none',cursor:leavePage===1?'not-allowed':'pointer',fontSize:'1.5rem',color:leavePage===1?'#ccc':'#3a3ad6'}}>
                                                            <FaArrowLeft/>
                                                        </button>
                                                        <span style={{fontWeight:600,color:'#3a3ad6'}}>Page {leavePage} of {totalPages}</span>
                                                        <button className="leave-pagination-btn" onClick={()=>setLeavePage(p=>Math.min(totalPages,p+1))} disabled={leavePage===totalPages} style={{background:'none',border:'none',cursor:leavePage===totalPages?'not-allowed':'pointer',fontSize:'1.5rem',color:leavePage===totalPages?'#ccc':'#3a3ad6'}}>
                                                            <FaArrowRight/>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="empty-state">
                            <FaUsers className="empty-icon" />
                            <h3 className="empty-title">No Team Members Found</h3>
                            <p className="empty-description">
                                {searchTerm || filterDepartment || filterStatus ? 
                                    'No team members match your current search and filter criteria.' :
                                    `No team members are currently assigned to ${managerName}.`
                                }
                            </p>
                            {(searchTerm || filterDepartment || filterStatus) && (
                                <button className="empty-action" onClick={clearFilters}>
                                    Clear All Filters
                                </button>
                            )}
                        </div>
                    )}

                    {/* Member Details Modal */}
                    {showModal && selectedMember && (
                        <div className="modal-overlay" onClick={() => {
                            setShowModal(false);
                            setMemberDetails(null);
                        }}>
                            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                                <div className="modal-header">
                                    <div className="employee-name-card">
                                        <FaUser className="section-icon" />
                                        {(memberDetails?.fullName || memberDetails?.firstName || selectedMember.fullName || 'Team Member Details')}
                                    </div>
                                    <div className="employee-details-subtitle">
                                        Employee Details
                                    </div>
                                    <button 
                                        className="modal-close"
                                        onClick={() => {
                                            setShowModal(false);
                                            setMemberDetails(null);
                                        }}
                                    >
                                        <FaTimes />
                                    </button>
                                </div>
                                <div className="modal-body" style={{maxHeight: '70vh', overflowY: 'auto'}}>
                                    {modalLoading ? (
                                        <div className="modal-loading">Loading details...</div>
                                    ) : memberDetails ? (
                                        <div className="modal-cards-container">
                                            {/* Personal Info Card */}
                                            <div className="modal-card">
                                                <h4 className="card-section-header">
                                                    <FaUser className="section-icon" /> Personal Information
                                                </h4>
                                                {!(memberDetails.fullName || memberDetails.firstName || memberDetails.dob || memberDetails.gender || memberDetails.address || memberDetails.phone || memberDetails.emergencyContact) ? (
                                                    <div className="detail-item"><span className="detail-value">N/A</span></div>
                                                ) : (
                                                    <>
                                                        <div className="detail-item"><span className="detail-label">Name:</span> <span className="detail-value">{memberDetails.fullName || memberDetails.firstName || 'N/A'}</span></div>
                                                        {memberDetails.dob && <div className="detail-item"><span className="detail-label">DOB:</span> <span className="detail-value">{(() => {
                                                            const dateObj = new Date(memberDetails.dob);
                                                            if (isNaN(dateObj)) return memberDetails.dob;
                                                            const day = dateObj.getDate();
                                                            const month = dateObj.toLocaleString('default', { month: 'long' });
                                                            const year = dateObj.getFullYear();
                                                            return `${day} ${month} ${year}`;
                                                        })()}</span></div>}
                                                        {memberDetails.gender && <div className="detail-item"><span className="detail-label">Gender:</span> <span className="detail-value">{memberDetails.gender}</span></div>}
                                                        {memberDetails.address && <div className="detail-item"><span className="detail-label">Address:</span> <span className="detail-value">{memberDetails.address}</span></div>}
                                                        {memberDetails.phone && <div className="detail-item"><span className="detail-label">Phone:</span> <span className="detail-value">{memberDetails.phone}</span></div>}
                                                        {memberDetails.emergencyContact && <div className="detail-item"><span className="detail-label">Emergency Contact:</span> <span className="detail-value">{memberDetails.emergencyContact}</span></div>}
                                                    </>
                                                )}
                                            </div>
                                            
                                            {/* Education Card */}
                                            <div className="modal-card">
                                                <h4 className="card-section-header">
                                                    <FaGraduationCap className="section-icon" /> Education
                                                </h4>
                                                {!(memberDetails.qualification || memberDetails.institution || memberDetails.graduationYear || memberDetails.specialization) ? (
                                                    <div className="detail-item"><span className="detail-value">N/A</span></div>
                                                ) : (
                                                    <>
                                                        {memberDetails.qualification && <div className="detail-item"><span className="detail-label">Qualification:</span> <span className="detail-value">{memberDetails.qualification}</span></div>}
                                                        {memberDetails.institution && <div className="detail-item"><span className="detail-label">Institution:</span> <span className="detail-value">{memberDetails.institution}</span></div>}
                                                        {memberDetails.graduationYear && <div className="detail-item"><span className="detail-label">Graduation Year:</span> <span className="detail-value">{memberDetails.graduationYear}</span></div>}
                                                        {memberDetails.specialization && <div className="detail-item"><span className="detail-label">Specialization:</span> <span className="detail-value">{memberDetails.specialization}</span></div>}
                                                    </>
                                                )}
                                            </div>
                                            
                                            {/* Skills Card */}
                                            <div className="modal-card">
                                                <h4 className="card-section-header">
                                                    <FaStar className="section-icon" /> Skills & Expertise
                                                </h4>
                                                {!(memberDetails.skills || memberDetails.certifications || memberDetails.languages) ? (
                                                    <div className="detail-item"><span className="detail-value">N/A</span></div>
                                                ) : (
                                                    <>
                                                        {memberDetails.skills && <div className="detail-item"><span className="detail-label">Skills:</span> <span className="detail-value">{memberDetails.skills}</span></div>}
                                                        {memberDetails.certifications && <div className="detail-item"><span className="detail-label">Certifications:</span> <span className="detail-value">{memberDetails.certifications}</span></div>}
                                                        {memberDetails.languages && <div className="detail-item"><span className="detail-label">Languages:</span> <span className="detail-value">{memberDetails.languages}</span></div>}
                                                    </>
                                                )}
                                            </div>
                                            
                                            {/* Experience Card */}
                                            <div className="modal-card">
                                                <h4 className="card-section-header">
                                                    <FaBriefcase className="section-icon" /> Past Experience
                                                </h4>
                                                {!(memberDetails.experience || memberDetails.previousCompany || memberDetails.previousRole) ? (
                                                    <div className="detail-item"><span className="detail-value">N/A</span></div>
                                                ) : (
                                                    <>
                                                        {memberDetails.experience && <div className="detail-item"><span className="detail-label">Experience:</span> <span className="detail-value">{memberDetails.experience}</span></div>}
                                                        {memberDetails.previousCompany && <div className="detail-item"><span className="detail-label">Previous Company:</span> <span className="detail-value">{memberDetails.previousCompany}</span></div>}
                                                        {memberDetails.previousRole && <div className="detail-item"><span className="detail-label">Previous Role:</span> <span className="detail-value">{memberDetails.previousRole}</span></div>}
                                                    </>
                                                )}
                                            </div>
                                            
                                            {/* Work Info Card (existing) */}
                                            <div className="modal-card">
                                                <h4 className="card-section-header">
                                                    <FaBuilding className="section-icon" /> Job Info
                                                </h4>
                                                {!(memberDetails.email || memberDetails.department || memberDetails.role || memberDetails.position || memberDetails.employeeId || memberDetails.id || memberDetails.joiningDate || memberDetails.status) ? (
                                                    <div className="detail-item"><span className="detail-value">N/A</span></div>
                                                ) : (
                                                    <>
                                                        <div className="detail-item"><FaEnvelope className="detail-icon" /><span className="detail-label">Email:</span> <span className="detail-value">{memberDetails.email || 'N/A'}</span></div>
                                                        <div className="detail-item"><FaBuilding className="detail-icon" /><span className="detail-label">Department:</span> <span className="detail-value">{memberDetails.department || 'N/A'}</span></div>
                                                        <div className="detail-item"><FaBriefcase className="detail-icon" /><span className="detail-label">Role:</span> <span className="detail-value">{memberDetails.role || memberDetails.position || 'N/A'}</span></div>
                                                        <div className="detail-item"><FaUserTie className="detail-icon" /><span className="detail-label">Employee ID:</span> <span className="detail-value">{memberDetails.employeeId || memberDetails.id}</span></div>
                                                        {memberDetails.joiningDate && <div className="detail-item"><FaCalendarCheck className="detail-icon" /><span className="detail-label">Joining Date:</span> <span className="detail-value">{memberDetails.joiningDate}</span></div>}
                                                        {memberDetails.status && <div className="detail-item"><FaUserClock className="detail-icon" /><span className="detail-label">Status:</span> <span className="detail-value">{memberDetails.status}</span></div>}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="modal-loading">No details found.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


export default TeamMembers;

// Format date as 'DD MMM YYYY'
function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date)) return dateStr;
    return date.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}
