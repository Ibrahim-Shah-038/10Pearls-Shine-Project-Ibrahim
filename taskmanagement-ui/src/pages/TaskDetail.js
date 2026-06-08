import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { ArrowLeft, Calendar, User, Edit, Trash2, AlertCircle } from 'lucide-react';

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const data = await api.get(`task/${id}`);
        setTask(data);
      } catch (err) {
        setError(err.message || 'Failed to load task details.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTask();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.delete(`task/${id}`);
      navigate('/tasks');
    } catch (err) {
      setError(err.message || 'Failed to delete task.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadgeClass = (statusVal) => {
    const s = statusVal?.toLowerCase().replace(/\s+/g, '') || '';
    if (s === 'completed') return 'badge-completed';
    if (s === 'inprogress' || s === 'in progress') return 'badge-inprogress';
    return 'badge-pending';
  };

  const getPriorityBadgeClass = (priorityVal) => {
    const p = priorityVal?.toLowerCase() || '';
    if (p === 'high') return 'badge-high';
    if (p === 'medium') return 'badge-medium';
    return 'badge-low';
  };

  if (loading) {
    return (
      <div className="spinner-wrapper">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        <Link to="/tasks" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', textDecoration: 'none', marginBottom: '1.5rem' }}>
          <ArrowLeft size={16} />
          <span>Back to workspace</span>
        </Link>
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 2rem', color: '#ef4444' }}>
          <AlertCircle size={48} style={{ margin: '0 auto 1rem', display: 'block' }} />
          <h3>Error Loading Task</h3>
          <p style={{ marginTop: '0.5rem', color: '#94a3b8' }}>{error || 'Task not found or you are not authorized to view it.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <Link to="/tasks" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', textDecoration: 'none', marginBottom: '1rem', transition: 'color 0.2s' }}>
          <ArrowLeft size={16} />
          <span>Back to workspace</span>
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <h1 style={{ fontFamily: 'Outfit', fontSize: '2.2rem', fontWeight: 800, wordBreak: 'break-word' }}>
            {task.title}
          </h1>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to={`/tasks/edit/${task.id}`} className="btn btn-secondary" style={{ gap: '0.5rem' }}>
              <Edit size={16} />
              <span>Edit</span>
            </Link>
            <button className="btn btn-danger" onClick={handleDelete} style={{ gap: '0.5rem' }}>
              <Trash2 size={16} />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </header>

      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Task Metadata Row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
          <div>
            <span style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.35rem', fontWeight: 600 }}>
              Status
            </span>
            <span className={`badge ${getStatusBadgeClass(task.status)}`} style={{ fontSize: '0.85rem', padding: '0.35rem 0.8rem' }}>
              {task.status}
            </span>
          </div>

          <div>
            <span style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.35rem', fontWeight: 600 }}>
              Priority
            </span>
            <span className={`badge ${getPriorityBadgeClass(task.priority)}`} style={{ fontSize: '0.85rem', padding: '0.35rem 0.8rem' }}>
              {task.priority} Priority
            </span>
          </div>

          <div>
            <span style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.35rem', fontWeight: 600 }}>
              Due Date
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
              <Calendar size={16} style={{ color: '#a855f7' }} />
              <span style={{ fontWeight: 600 }}>{formatDate(task.dueDate)}</span>
            </div>
          </div>

          <div>
            <span style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.35rem', fontWeight: 600 }}>
              Assignee
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
              <User size={16} style={{ color: '#06b6d4' }} />
              <span style={{ fontWeight: 600 }}>{task.assigneeUsername}</span>
            </div>
          </div>
        </div>

        {/* Task Details Section */}
        <div>
          <h3 style={{ fontFamily: 'Outfit', fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', color: '#f8fafc' }}>
            Description
          </h3>
          <p style={{ color: '#cbd5e1', lineHeight: '1.7', fontSize: '1rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {task.description}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;
