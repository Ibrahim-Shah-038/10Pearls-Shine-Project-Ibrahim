import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { 
  Search, 
  Plus, 
  Trash2, 
  Edit, 
  Eye, 
  Download, 
  Upload, 
  Calendar, 
  User,
  AlertCircle
} from 'lucide-react';

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filter States
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');

  // Import State
  const [importing, setImporting] = useState(false);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (status) queryParams.append('status', status);
      if (priority) queryParams.append('priority', priority);

      const endpoint = `task?${queryParams.toString()}`;
      const data = await api.get(endpoint);
      setTasks(data);
    } catch (err) {
      setError('Failed to fetch tasks.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Add debounce for search filter
    const delayDebounceFn = setTimeout(() => {
      fetchTasks();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, priority]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      await api.delete(`task/${id}`);
      setSuccess('Task deleted successfully.');
      setTasks(tasks.filter(t => t.id !== id));
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete task.');
      setTimeout(() => setError(''), 4000);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await api.get('task/export');
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `tasks_export_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      setError('Export failed: ' + err.message);
      setTimeout(() => setError(''), 4000);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('task/import', formData);
      setSuccess(response.message || 'Tasks imported successfully!');
      fetchTasks();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to import CSV.');
      setTimeout(() => setError(''), 4000);
    } finally {
      setImporting(false);
      e.target.value = ''; // clear input
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
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

  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <h1 style={{ fontFamily: 'Outfit', fontSize: '2.2rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            Task Workspace
          </h1>
          <p style={{ color: '#94a3b8' }}>Manage, filter, and organize tasks.</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={handleExport} style={{ gap: '0.5rem' }}>
            <Download size={16} />
            <span>Export CSV</span>
          </button>
          
          <label className="btn btn-secondary" style={{ gap: '0.5rem', cursor: 'pointer' }}>
            <Upload size={16} />
            <span>{importing ? 'Importing...' : 'Import CSV'}</span>
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleImport} 
              style={{ display: 'none' }} 
              disabled={importing}
            />
          </label>

          <Link to="/tasks/new" className="btn btn-primary" style={{ gap: '0.5rem' }}>
            <Plus size={16} />
            <span>New Task</span>
          </Link>
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
          <span>{success}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="glass-card filter-bar">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="form-control"
            placeholder="Search by title or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ minWidth: '150px' }}>
          <select
            className="form-control"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="InProgress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <div style={{ minWidth: '150px' }}>
          <select
            className="form-control"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>
      </div>

      {/* Tasks List */}
      {loading ? (
        <div className="spinner-wrapper">
          <div className="spinner"></div>
        </div>
      ) : tasks.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem', color: '#94a3b8' }}>
          <AlertCircle size={48} style={{ margin: '0 auto 1rem', display: 'block', color: '#6366f1' }} />
          <h3>No tasks found</h3>
          <p style={{ marginTop: '0.5rem' }}>Try adjusting your search criteria or create a new task.</p>
        </div>
      ) : (
        <div className="tasks-grid">
          {tasks.map(task => (
            <div className="glass-card task-card" key={task.id}>
              <div className="task-header">
                <span className={`badge ${getStatusBadgeClass(task.status)}`}>
                  {task.status}
                </span>
                <span className={`badge ${getPriorityBadgeClass(task.priority)}`}>
                  {task.priority} Priority
                </span>
              </div>
              
              <h3 style={{ marginBottom: '0.75rem', fontFamily: 'Outfit' }}>{task.title}</h3>
              <p className="task-body">{task.description}</p>
              
              <div className="task-meta">
                <div className="task-date">
                  <Calendar size={14} style={{ color: '#a855f7' }} />
                  <span>Due: {formatDate(task.dueDate)}</span>
                </div>
                
                <div className="task-assignee">
                  <User size={14} style={{ color: '#06b6d4' }} />
                  <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {task.assigneeUsername}
                  </span>
                </div>
              </div>

              <div className="task-actions">
                <Link to={`/tasks/${task.id}`} className="action-icon-btn" title="View details">
                  <Eye size={16} />
                </Link>
                <Link to={`/tasks/edit/${task.id}`} className="action-icon-btn" title="Edit task">
                  <Edit size={16} />
                </Link>
                <button 
                  className="action-icon-btn delete-btn" 
                  onClick={() => handleDelete(task.id)}
                  title="Delete task"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskList;
