import React from 'react';
import { Pie, Bar } from 'react-chartjs-2';
import { Chart, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';

Chart.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function TeamAnalyticsChart({ team, leaves }) {
  // Pie chart: department distribution
  const departmentCounts = team.reduce((acc, m) => {
    acc[m.department] = (acc[m.department] || 0) + 1;
    return acc;
  }, {});
  const pieData = {
    labels: Object.keys(departmentCounts),
    datasets: [
      {
        data: Object.values(departmentCounts),
        backgroundColor: [
          '#3a3ad6', '#2196f3', '#ff9800', '#4caf50', '#f44336', '#673ab7', '#00bcd4', '#e91e63'
        ],
        borderWidth: 2,
      },
    ],
  };

  // Bar chart: leaves per employee
  const leavesPerEmployee = team.map(member => {
    return leaves.filter(l => l.employeeId === member.id).length;
  });
  const barData = {
    labels: team.map(m => m.fullName || m.firstName || m.name || 'Emp'),
    datasets: [
      {
        label: 'Leaves',
        data: leavesPerEmployee,
        backgroundColor: '#3a3ad6',
        borderRadius: 6,
      },
    ],
  };

  const barOptions = {
    plugins: { legend: { display: false } },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          precision: 0,
          callback: function(value) { return Number.isInteger(value) ? value : null; }
        }
      }
    }
  };

  return (
    <div style={{display:'flex',flexDirection:'column',gap:'2.5rem',alignItems:'center',marginTop:'1.5rem'}}>
      <div style={{width:'100%',maxWidth:'340px'}}>
        <h4 style={{textAlign:'center',color:'#3a3ad6',marginBottom:'0.7rem'}}>Department Distribution</h4>
        <Pie data={pieData} options={{plugins:{legend:{position:'bottom'}}}} />
      </div>
      <div style={{width:'100%',maxWidth:'420px'}}>
        <h4 style={{textAlign:'center',color:'#3a3ad6',marginBottom:'0.7rem'}}>Leaves Per Employee</h4>
        <Bar data={barData} options={barOptions} />
      </div>
    </div>
  );
}
