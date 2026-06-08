import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  ListTodo, 
  PlusCircle, 
  User, 
  LogOut, 
  CheckSquare,
  Users
} from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  // Get initial for avatar
  const avatarLetter = user.username ? user.username.charAt(0).toUpperCase() : 'U';

  return (
    <nav className="sidebar">
      <div className="logo-section">
        <CheckSquare size={26} className="logo-icon" style={{ color: '#a855f7' }} />
        <span className="logo-text">TaskSphere</span>
      </div>

      <div className="nav-links">
        <NavLink 
          to="/dashboard" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink 
          to="/tasks" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          end
        >
          <ListTodo size={20} />
          <span>Tasks</span>
        </NavLink>

        <NavLink 
          to="/tasks/new" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <PlusCircle size={20} />
          <span>New Task</span>
        </NavLink>

        {(user.role === 'Admin' || user.role === 'SuperUser') && (
          <NavLink 
            to="/users" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Users size={20} />
            <span>Users</span>
          </NavLink>
        )}

        <NavLink 
          to="/profile" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <User size={20} />
          <span>Profile</span>
        </NavLink>
      </div>

      <div className="sidebar-footer">
        <div className="user-snippet">
          <div className="user-avatar">{avatarLetter}</div>
          <div className="user-info">
            <span className="user-name">{user.username}</span>
            <span className="user-role">{user.role}</span>
          </div>
        </div>
        
        <button className="btn btn-secondary" style={{ width: '100%' }} onClick={handleLogout}>
          <LogOut size={16} />
          <span>Log Out</span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
