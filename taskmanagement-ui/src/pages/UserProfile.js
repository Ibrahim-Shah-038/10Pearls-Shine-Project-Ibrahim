import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Shield, LogOut } from 'lucide-react';

const UserProfile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const avatarLetter = user.username ? user.username.charAt(0).toUpperCase() : 'U';

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontFamily: 'Outfit', fontSize: '2.2rem', fontWeight: 800, marginBottom: '0.25rem' }}>
          User Profile
        </h1>
        <p style={{ color: '#94a3b8' }}>View and manage your account details.</p>
      </header>

      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '3rem 2rem', gap: '2rem' }}>
        <div 
          style={{ 
            width: '100px', 
            height: '100px', 
            borderRadius: '50%', 
            background: 'var(--primary-gradient)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            fontSize: '3rem', 
            fontWeight: 800, 
            fontFamily: 'Outfit', 
            color: '#fff',
            boxShadow: '0 0 25px rgba(168, 85, 247, 0.4)',
            border: '2px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          {avatarLetter}
        </div>

        {/* User Info */}
        <div style={{ width: '100%' }}>
          <h2 style={{ fontFamily: 'Outfit', fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.25rem' }}>
            {user.username}
          </h2>
          <span 
            className="badge" 
            style={{ 
              background: 'rgba(168, 85, 247, 0.15)', 
              color: 'var(--color-primary)', 
              border: '1px solid rgba(168, 85, 247, 0.25)',
              fontSize: '0.8rem',
              padding: '0.35rem 0.75rem',
              marginBottom: '2rem'
            }}
          >
            {user.role}
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', textAlign: 'left', background: 'rgba(0,0,0,0.15)', borderRadius: '12px', padding: '1.5rem', border: '1px solid var(--border-color)', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <User size={18} style={{ color: '#a855f7' }} />
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8' }}>User ID</span>
                <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>{user.id}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Mail size={18} style={{ color: '#06b6d4' }} />
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8' }}>Email Address</span>
                <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>{user.email}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Shield size={18} style={{ color: '#10b981' }} />
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8' }}>System Role</span>
                <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>{user.role}</span>
              </div>
            </div>
          </div>

          <button className="btn btn-danger" style={{ width: '100%', gap: '0.5rem' }} onClick={handleLogout}>
            <LogOut size={18} />
            <span>Sign Out / Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
