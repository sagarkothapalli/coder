import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const Dashboard = ({ subjects, onBack }) => {
  // --- Data Processing for Charts ---

  // Overall Attendance Data (for Pie Chart)
  const totalAttended = subjects.reduce((acc, sub) => acc + sub.attendedClasses, 0);
  const totalEffectiveClasses = subjects.reduce((acc, sub) => acc + (sub.totalClasses - sub.canceledClasses), 0);
  const overallAttendanceData = [
    { name: 'Attended', value: totalAttended },
    { name: 'Missed', value: totalEffectiveClasses - totalAttended },
  ];
  const COLORS = ['#0088FE', '#FF8042'];

  // Subject-wise Attendance Data (for Bar Chart)
  const subjectAttendanceData = subjects.map(sub => {
    const effectiveTotal = sub.totalClasses - sub.canceledClasses;
    const percentage = effectiveTotal > 0 ? ((sub.attendedClasses / effectiveTotal) * 100).toFixed(2) : 0;
    return {
      name: sub.name,
      percentage: parseFloat(percentage),
    };
  });

  return (
    <div className="attendance-tracker">
      <header>
        <h2>Dashboard</h2>
        <button onClick={onBack}>Back to Subjects</button>
      </header>

      <div className="dashboard-charts">
        <h3>Overall Attendance</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={overallAttendanceData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {overallAttendanceData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>

        <h3>Subject-wise Attendance (%)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={subjectAttendanceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="percentage" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Dashboard;
