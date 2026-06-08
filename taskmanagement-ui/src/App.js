import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import * as signalR from '@microsoft/signalr';
import { AuthProvider, useAuth } from './context/AuthContext';
import { getBaseUrl } from './services/api';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import TaskList from './pages/TaskList';
import TaskForm from './pages/TaskForm';
import TaskDetail from './pages/TaskDetail';
import UserProfile from './pages/UserProfile';
import UserManagement from './pages/UserManagement';
import { Sparkles, X } from 'lucide-react';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="spinner-wrapper">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Public Route Component (Redirects to dashboard if already authenticated)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="spinner-wrapper">
        <div className="spinner"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Main layout wrapper that holds navbar and content
const MainLayout = ({ children }) => {
  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

const AppContent = () => {
  const { user } = useAuth();
  const [notification, setNotification] = useState(null);

  // SignalR Hook
  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${getBaseUrl()}/taskhub`, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build();

    connection.start()
      .then(() => console.log('Connected to SignalR Hub.'))
      .catch(err => console.error('SignalR Hub Connection Error: ', err));

    const triggerNotification = (message) => {
      setNotification(message);
      // Auto-hide after 5 seconds
      setTimeout(() => {
        setNotification(null);
      }, 5000);
    };

    connection.on('TaskCreated', (task) => {
      triggerNotification(`🆕 Task "${task.title}" has been created (Assigned to: ${task.assigneeUsername})`);
    });

    connection.on('TaskUpdated', (task) => {
      triggerNotification(`🔄 Task "${task.title}" was updated (Status: ${task.status})`);
    });

    connection.on('TaskDeleted', (id) => {
      triggerNotification(`🗑️ A task (ID: ${id}) was deleted from the workspace.`);
    });

    return () => {
      connection.stop();
    };
  }, [user]);

  return (
    <>
      <Routes>
        {/* Auth Routes */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        <Route 
          path="/signup" 
          element={
            <PublicRoute>
              <Signup />
            </PublicRoute>
          } 
        />

        {/* Dashboard and Core App routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/tasks" 
          element={
            <ProtectedRoute>
              <MainLayout>
                <TaskList />
              </MainLayout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/tasks/new" 
          element={
            <ProtectedRoute>
              <MainLayout>
                <TaskForm />
              </MainLayout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/tasks/edit/:id" 
          element={
            <ProtectedRoute>
              <MainLayout>
                <TaskForm />
              </MainLayout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/tasks/:id" 
          element={
            <ProtectedRoute>
              <MainLayout>
                <TaskDetail />
              </MainLayout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <MainLayout>
                <UserProfile />
              </MainLayout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/users" 
          element={
            <ProtectedRoute>
              <MainLayout>
                <UserManagement />
              </MainLayout>
            </ProtectedRoute>
          } 
        />

        {/* Fallback routing */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>

      {/* Real-time Notification Toast */}
      {notification && (
        <div 
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: 'var(--bg-card)',
            backdropFilter: 'blur(20px)',
            webkitBackdropFilter: 'blur(20px)',
            border: '1px solid var(--color-primary)',
            boxShadow: '0 10px 30px rgba(168, 85, 247, 0.25)',
            borderRadius: '12px',
            padding: '1.25rem 1.5rem',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            maxWidth: '380px',
            animation: 'slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(168, 85, 247, 0.1)', padding: '0.5rem', borderRadius: '8px', color: '#a855f7' }}>
            <Sparkles size={18} />
          </div>
          <div style={{ flex: 1, fontSize: '0.9rem', color: '#f8fafc', fontWeight: 500, lineHeight: 1.4 }}>
            {notification}
          </div>
          <button 
            onClick={() => setNotification(null)}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.25rem', borderRadius: '4px' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Add sliding keyframe styles programmatically */}
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateY(20px) scale(0.95);
            opacity: 0;
          }
          to {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
