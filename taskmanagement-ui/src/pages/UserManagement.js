import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Trash2, AlertCircle, CheckCircle2, Shield, User, RefreshCw } from 'lucide-react';

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get('user');
      setUsers(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch users directory.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    setError('');
    setSuccess('');
    setUpdatingId(userId);

    try {
      await api.put(`user/${userId}/role`, { role: newRole });
      setSuccess('User role updated successfully.');
      
      // Update local state
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update user role.');
      setTimeout(() => setError(''), 4000);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (userId === currentUser?.id) {
      setError('You cannot delete your own account.');
      return;
    }

    if (!window.confirm(`Are you sure you want to permanently delete user "${username}"? This will also delete all their tasks.`)) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      await api.delete(`user/${userId}`);
      setSuccess(`User "${username}" deleted successfully.`);
      setUsers(users.filter(u => u.id !== userId));
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete user.');
      setTimeout(() => setError(''), 4000);
    }
  };

  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <h1 style={{ fontFamily: 'Outfit', fontSize: '2.2rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            User Management
          </h1>
          <p style={{ color: '#94a3b8' }}>Manage user account directories, update access permissions, and revoke roles.</p>
        </div>

        <button className="btn btn-secondary" onClick={fetchUsers} style={{ gap: '0.5rem' }}>
          <RefreshCw size={16} />
          <span>Refresh</span>
        </button>
      </header>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '2rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success" style={{ marginBottom: '2rem' }}>
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      {loading ? (
        <div className="spinner-wrapper">
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '0', overflowX: 'auto', border: '1px solid var(--border-color)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(255, 255, 255, 0.02)' }}>
                <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-muted)', fontFamily: 'Outfit', fontWeight: 600 }}>User Details</th>
                <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-muted)', fontFamily: 'Outfit', fontWeight: 600 }}>Email Address</th>
                <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-muted)', fontFamily: 'Outfit', fontWeight: 600 }}>System Role</th>
                <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-muted)', fontFamily: 'Outfit', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const isSelf = u.id === currentUser?.id;
                const userLetter = u.username ? u.username.charAt(0).toUpperCase() : 'U';

                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }} className="user-row-hover">
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div 
                          style={{ 
                            width: '36px', 
                            height: '36px', 
                            borderRadius: '50%', 
                            background: isSelf ? 'var(--primary-gradient)' : 'rgba(255,255,255,0.05)', 
                            border: '1px solid var(--border-color)',
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            fontSize: '0.9rem', 
                            fontWeight: 700, 
                            color: '#fff' 
                          }}
                        >
                          {userLetter}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>{u.username}</span>
                            {isSelf && (
                              <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', background: 'rgba(168, 85, 247, 0.2)', border: '1px solid rgba(168, 85, 247, 0.3)', color: 'var(--color-primary)', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 700 }}>
                                You
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {u.id}</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem', color: '#cbd5e1', fontSize: '0.95rem' }}>{u.email}</td>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <select
                          className="form-control"
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          disabled={updatingId === u.id}
                          style={{ 
                            width: 'auto', 
                            padding: '0.4rem 1.5rem 0.4rem 0.75rem', 
                            fontSize: '0.85rem',
                            appearance: 'none', 
                            backgroundPosition: 'calc(100% - 0.5rem) 50%', 
                            backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2394a3b8\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', 
                            backgroundRepeat: 'no-repeat', 
                            backgroundSize: '1rem',
                            borderColor: u.role === 'SuperUser' ? 'var(--color-primary)' : u.role === 'Admin' ? 'var(--color-accent)' : 'var(--border-color)',
                            background: 'var(--bg-input)'
                          }}
                        >
                          <option value="User">User</option>
                          <option value="Admin">Admin</option>
                          <option value="SuperUser">SuperUser</option>
                        </select>
                      </div>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                      <button
                        className="action-icon-btn delete-btn"
                        onClick={() => handleDeleteUser(u.id, u.username)}
                        disabled={isSelf}
                        title={isSelf ? 'Cannot delete yourself' : 'Delete user permanently'}
                        style={{ 
                          display: 'inline-flex', 
                          opacity: isSelf ? 0.3 : 1, 
                          cursor: isSelf ? 'not-allowed' : 'pointer',
                          marginLeft: 'auto'
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        .user-row-hover:hover {
          background: rgba(255, 255, 255, 0.015);
        }
      `}</style>
    </div>
  );
};

export default UserManagement;
