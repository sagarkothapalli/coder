import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line } from 'recharts';

const Dashboard = ({ subjects, onBack }) => {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await fetch('/api/history', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setHistory(data);
            }
        } catch (err) {
            console.error("Failed to fetch history", err);
        }
    };
    fetchHistory();
  }, []);

  // --- Aggregate Stats ---
  const totalAttended = subjects.reduce((acc, sub) => acc + sub.attendedClasses, 0);
  const totalEffectiveClasses = subjects.reduce((acc, sub) => acc + (sub.totalClasses - sub.canceledClasses), 0);
  const overallPercentage = totalEffectiveClasses > 0 ? ((totalAttended / totalEffectiveClasses) * 100).toFixed(1) : 0;

  const pieData = [
    { name: 'Attended', value: totalAttended },
    { name: 'Missed', value: totalEffectiveClasses - totalAttended },
  ];
  const COLORS = ['#34c759', '#ff3b30'];

  // Subject-wise Attendance Data (for Bar Chart)
  const barData = subjects.map(sub => {
    const effectiveTotal = sub.totalClasses - sub.canceledClasses;
    const percentage = effectiveTotal > 0 ? ((sub.attendedClasses / effectiveTotal) * 100).toFixed(1) : 0;
    return {
      name: sub.name,
      percentage: parseFloat(percentage),
    };
  });

  // --- Trend Calculation ---
  const trendData = useMemo(() => {
    if (!history.length || !subjects.length) return [];

    // Sort history by timestamp ascending
    const sortedLogs = [...history].sort((a, b) => Number(a.timestamp) - Number(b.timestamp));
    
    // Simplification for Web Dashboard: Show cumulative impact of the last 50 actions.
    
    // Let's just group logs by date and show activity count.
    const groupedByDate = sortedLogs.reduce((acc, log) => {
        const date = new Date(Number(log.timestamp)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (!acc[date]) acc[date] = { date, count: 0, present: 0 };
        acc[date].count += 1;
        if (log.type === 'PRESENT') acc[date].present += 1;
        return acc;
    }, {});

    return Object.values(groupedByDate).slice(-10); // Last 10 days of activity
  }, [history, subjects]);

  return (
    <div className="attendance-container">
      <header style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ margin: 0 }}>Mission Intelligence</h1>
            <button className="btn-glass" onClick={onBack}>Back to Cockpit</button>
          </div>
          <p className="welcome-text">Real-time performance analytics and trends.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
        {/* Overall Score Card */}
        <div className="glass-panel" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-muted)' }}>Overall Readiness</h3>
            <div style={{ fontSize: '4rem', fontWeight: '900', color: parseFloat(overallPercentage) >= 75 ? 'var(--success-glow)' : 'var(--danger-glow)' }}>
                {overallPercentage}%
            </div>
            <div style={{ marginTop: '10px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                {totalAttended} / {totalEffectiveClasses} classes accounted
            </div>
        </div>

        {/* Pie Chart */}
        <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ margin: '0 0 20px 20px', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-muted)' }}>Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {pieData.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--glass-bg)', borderRadius: '12px', border: '1px solid var(--glass-border)', color: 'var(--text-main)' }} />
                </PieChart>
            </ResponsiveContainer>
        </div>
      </div>

      <div style={{ marginTop: '30px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100%, 1fr))', gap: '30px' }}>
        {/* Trend Line Chart */}
        <div className="glass-panel" style={{ padding: '30px' }}>
            <h3 style={{ margin: '0 0 30px 0', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-muted)' }}>Activity Trend (Last 10 Active Days)</h3>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                    <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: 'var(--glass-bg)', borderRadius: '12px', border: '1px solid var(--glass-border)', color: 'var(--text-main)' }} />
                    <Line type="monotone" dataKey="present" name="Classes Attended" stroke="var(--success-glow)" strokeWidth={4} dot={{ r: 6, fill: 'var(--success-glow)' }} activeDot={{ r: 8, strokeWidth: 0 }} />
                </LineChart>
            </ResponsiveContainer>
        </div>

        {/* Subject Bar Chart */}
        <div className="glass-panel" style={{ padding: '30px' }}>
            <h3 style={{ margin: '0 0 30px 0', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-muted)' }}>Subject Breakdown (%)</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: 'var(--glass-bg)', borderRadius: '12px', border: '1px solid var(--glass-border)', color: 'var(--text-main)' }} />
                    <Bar dataKey="percentage" name="Attendance %" radius={[10, 10, 0, 0]}>
                        {barData.map((entry, index) => (
                            <Cell key={index} fill={entry.percentage >= 75 ? 'var(--success-glow)' : entry.percentage >= 65 ? 'var(--warning-glow)' : 'var(--danger-glow)'} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
