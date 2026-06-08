import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Trash2, AlertCircle, CheckCircle2, RefreshCw, UserPlus, X } from 'lucide-react';

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  // User creation states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('User');
  const [creating, setCreating] = useState(false);

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

  const isSuperUser = currentUser?.role === 'SuperUser';
  const isAdmin = currentUser?.role === 'Admin';

  const canDeleteUser = (targetUser) => {
    if (targetUser.id === currentUser?.id) return false;
    if (isSuperUser) return true;
    if (isAdmin) {
      // Admins can only delete normal Users (cannot delete Admin/SuperUser)
      return targetUser.role === 'User';
    }
    return false;
  };

  const canChangeRole = (targetUser) => {
    if (isSuperUser) return true;
    if (isAdmin) {
      // Admins cannot change roles of Admins or SuperUsers
      return targetUser.role === 'User';
    }
    return false;
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newUsername || !newEmail || !newPassword || !newRole) {
      setError('Please fill in all fields.');
      return;
    }

    setCreating(true);
    try {
      const data = await api.post('user', {
        username: newUsername,
        email: newEmail,
        password: newPassword,
        role: newRole
      });

      setSuccess(`User "${newUsername}" created successfully.`);
      setUsers([...users, data]);

      // Reset form & close modal
      setNewUsername('');
      setNewEmail('');
      setNewPassword('');
      setNewRole('User');
      setShowCreateModal(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to create user.');
      setTimeout(() => setError(''), 4000);
    } finally {
      setCreating(false);
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

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={fetchUsers} style={{ gap: '0.5rem' }}>
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)} style={{ gap: '0.5rem' }}>
            <UserPlus size={16} />
            <span>Create User</span>
          </button>
        </div>
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
                          disabled={updatingId === u.id || !canChangeRole(u)}
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
                            background: 'var(--bg-input)',
                            cursor: canChangeRole(u) ? 'pointer' : 'not-allowed',
                            opacity: canChangeRole(u) ? 1 : 0.6
                          }}
                        >
                          <option value="User">User</option>
                          <option value="Admin">Admin</option>
                          {(isSuperUser || u.role === 'SuperUser') && <option value="SuperUser">SuperUser</option>}
                        </select>
                      </div>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                      <button
                        className="action-icon-btn delete-btn"
                        onClick={() => handleDeleteUser(u.id, u.username)}
                        disabled={!canDeleteUser(u)}
                        title={
                          isSelf
                            ? 'Cannot delete yourself'
                            : !canDeleteUser(u)
                            ? 'Insufficient permissions to delete this user'
                            : 'Delete user permanently'
                        }
                        style={{ 
                          display: 'inline-flex', 
                          opacity: canDeleteUser(u) ? 1 : 0.3, 
                          cursor: canDeleteUser(u) ? 'pointer' : 'not-allowed',
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

      {showCreateModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1.5rem'
          }}
        >
          <div 
            className="glass-card" 
            style={{ 
              width: '100%', 
              maxWidth: '480px', 
              padding: '2.25rem',
              border: '1px solid var(--border-color)',
              position: 'relative'
            }}
          >
            <button 
              onClick={() => setShowCreateModal(false)}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontFamily: 'Outfit', fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>
              Create New User
            </h3>

            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label>Username</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="e.g. johndoe"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  required 
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  className="form-control"
                  placeholder="e.g. john@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required 
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input 
                  type="password" 
                  className="form-control"
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={6}
                  required 
                />
              </div>

              <div className="form-group" style={{ marginBottom: '2.5rem' }}>
                <label>System Role</label>
                <select 
                  className="form-control"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  style={{
                    appearance: 'none', 
                    backgroundPosition: 'calc(100% - 0.75rem) 50%', 
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2394a3b8\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', 
                    backgroundRepeat: 'no-repeat', 
                    backgroundSize: '1rem',
                    background: 'var(--bg-input)'
                  }}
                >
                  <option value="User">User</option>
                  <option value="Admin">Admin</option>
                  {isSuperUser && <option value="SuperUser">SuperUser</option>}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={creating}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  {creating ? (
                    <span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></span>
                  ) : (
                    <span>Create User</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      `}</style>
    </div>
  );
};

export default UserManagement;
