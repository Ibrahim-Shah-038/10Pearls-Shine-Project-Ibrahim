import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Save, ArrowLeft, AlertCircle } from 'lucide-react';

const TaskForm = () => {
  const { user } = useAuth();
  const { id } = useParams(); // exists if editing
  const isEdit = !!id;
  const navigate = useNavigate();

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('Pending');
  const [priority, setPriority] = useState('Medium');
  const [assignedUserId, setAssignedUserId] = useState('');

  // Page Logic States
  const [users, setUsers] = useState([]); // populated for admin
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');

  const isAdminOrSuper = user?.role === 'Admin' || user?.role === 'SuperUser';

  useEffect(() => {
    // 1. Fetch users list if current user is Admin/SuperUser (to populate dropdown selection)
    const fetchUsers = async () => {
      try {
        const usersList = await api.get('user');
        setUsers(usersList);
      } catch (err) {
        console.error('Failed to load users list:', err);
      }
    };

    if (isAdminOrSuper) {
      fetchUsers();
    }

    // 2. Fetch task details if editing
    const fetchTaskDetails = async () => {
      setFetching(true);
      try {
        const task = await api.get(`task/${id}`);
        setTitle(task.title);
        setDescription(task.description);
        setStatus(task.status);
        setPriority(task.priority);
        setAssignedUserId(task.userId);
        
        // Format date to YYYY-MM-DD for input[type="date"]
        if (task.dueDate) {
          const date = new Date(task.dueDate);
          const formattedDate = date.toISOString().slice(0, 10);
          setDueDate(formattedDate);
        }
      } catch (err) {
        setError('Failed to load task details.');
        console.error(err);
      } finally {
        setFetching(false);
      }
    };

    if (isEdit) {
      fetchTaskDetails();
    } else {
      // Default due date to 7 days from now
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 7);
      setDueDate(defaultDate.toISOString().slice(0, 10));
      
      // Default assignedUserId to current user
      if (user) {
        setAssignedUserId(user.id);
      }
    }
  }, [id, isEdit, user, isAdminOrSuper]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title || !description || !dueDate) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);

    try {
      if (isEdit) {
        const updatePayload = {
          title,
          description,
          status,
          priority,
          dueDate: new Date(dueDate).toISOString(),
          userId: Number(assignedUserId)
        };
        await api.put(`task/${id}`, updatePayload);
      } else {
        const createPayload = {
          title,
          description,
          status,
          priority,
          dueDate: new Date(dueDate).toISOString(),
          userId: assignedUserId ? Number(assignedUserId) : null
        };
        await api.post('task', createPayload);
      }
      navigate('/tasks');
    } catch (err) {
      setError(err.message || 'Failed to save task.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="spinner-wrapper">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2.5rem' }}>
        <Link to="/tasks" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', textDecoration: 'none', marginBottom: '1rem', transition: 'color 0.2s' }}>
          <ArrowLeft size={16} />
          <span>Back to workspace</span>
        </Link>
        <h1 style={{ fontFamily: 'Outfit', fontSize: '2.2rem', fontWeight: 800 }}>
          {isEdit ? 'Modify Task' : 'Create New Task'}
        </h1>
        <p style={{ color: '#94a3b8' }}>
          {isEdit ? 'Edit details and save progress updates.' : 'Add details to create a new task in your workspace.'}
        </p>
      </header>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '2rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass-card">
        <div className="form-group">
          <label htmlFor="title">Task Title *</label>
          <input
            id="title"
            type="text"
            className="form-control"
            placeholder="e.g. Set up API database"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            className="form-control"
            rows="5"
            placeholder="Detailed description of what needs to be accomplished..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ resize: 'vertical' }}
            required
          ></textarea>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label htmlFor="dueDate">Due Date *</label>
            <input
              id="dueDate"
              type="date"
              className="form-control"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="priority">Priority *</label>
            <select
              id="priority"
              className="form-control"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isAdminOrSuper ? '1fr 1fr' : '1fr', gap: '1rem' }}>
          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              className="form-control"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="Pending">Pending</option>
              <option value="InProgress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          {isAdminOrSuper && (
            <div className="form-group">
              <label htmlFor="assignee">Assign To *</label>
              <select
                id="assignee"
                className="form-control"
                value={assignedUserId}
                onChange={(e) => setAssignedUserId(e.target.value)}
                required
              >
                <option value="">Select Assignee</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.username} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
          <Link to="/tasks" className="btn btn-secondary">
            Cancel
          </Link>
          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ gap: '0.5rem', minWidth: '140px' }}
            disabled={loading}
          >
            {loading ? (
              <span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }}></span>
            ) : (
              <>
                <Save size={16} />
                <span>{isEdit ? 'Save Changes' : 'Create Task'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaskForm;
