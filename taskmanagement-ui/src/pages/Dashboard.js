import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Hourglass, Play, CheckCircle2, ListTodo } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ pendingCount: 0, inProgressCount: 0, completedCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    try {
      const data = await api.get('task/stats');
      setStats(data);
    } catch (err) {
      setError('Failed to load dashboard metrics.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="spinner-wrapper">
        <div className="spinner"></div>
      </div>
    );
  }

  const totalTasks = stats.pendingCount + stats.inProgressCount + stats.completedCount;
  const completionRate = totalTasks > 0 ? Math.round((stats.completedCount / totalTasks) * 100) : 0;
  
  const isAdminOrSuper = user?.role === 'Admin' || user?.role === 'SuperUser';

  return (
    <div>
      <header style={{ marginBottom: '2.5rem' }}>
        <div style={{ marginBottom: '0.5rem' }}>
          <span style={{ color: '#a855f7', fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Overview
          </span>
        </div>
        <h1 style={{ fontFamily: 'Outfit', fontSize: '2.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Welcome back, {user?.username}!
        </h1>
        <p style={{ color: '#94a3b8' }}>
          {isAdminOrSuper 
            ? 'Viewing task management analytics across the entire organization.'
            : 'Here is a summary of your workspace activities and task updates.'}
        </p>
      </header>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '2rem' }}>
          <span>{error}</span>
        </div>
      )}

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="glass-card stat-card pending">
          <div className="stat-details">
            <h3>Pending</h3>
            <span className="stat-number">{stats.pendingCount}</span>
          </div>
          <div className="stat-icon">
            <Hourglass size={24} />
          </div>
        </div>

        <div className="glass-card stat-card inprogress">
          <div className="stat-details">
            <h3>In Progress</h3>
            <span className="stat-number">{stats.inProgressCount}</span>
          </div>
          <div className="stat-icon">
            <Play size={24} />
          </div>
        </div>

        <div className="glass-card stat-card completed">
          <div className="stat-details">
            <h3>Completed</h3>
            <span className="stat-number">{stats.completedCount}</span>
          </div>
          <div className="stat-icon">
            <CheckCircle2 size={24} />
          </div>
        </div>

        <div className="glass-card stat-card" style={{ borderLeftColor: '#a855f7' }}>
          <div className="stat-details">
            <h3>Total Tasks</h3>
            <span className="stat-number">{totalTasks}</span>
          </div>
          <div className="stat-icon" style={{ color: '#a855f7' }}>
            <ListTodo size={24} />
          </div>
        </div>
      </div>

      {/* Analytics Card */}
      <div className="glass-card" style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontFamily: 'Outfit', fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.5rem' }}>
          Workspace Progress
        </h2>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.95rem' }}>
            <span style={{ color: '#94a3b8' }}>Completion Rate</span>
            <span style={{ fontWeight: 700, color: '#10b981' }}>{completionRate}%</span>
          </div>
          <div style={{ height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
            <div 
              style={{ 
                height: '100%', 
                width: `${completionRate}%`, 
                background: 'linear-gradient(90deg, #14b8a6 0%, #10b981 100%)',
                borderRadius: '6px',
                transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            ></div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Open Tasks</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b' }}>
              {stats.pendingCount + stats.inProgressCount}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Closed Tasks</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>{stats.completedCount}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Efficiency</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#06b6d4' }}>
              {totalTasks > 0 ? Math.round((stats.completedCount / totalTasks) * 100) : 0}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
