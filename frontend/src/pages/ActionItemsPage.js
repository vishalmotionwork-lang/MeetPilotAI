import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getActionItems, updateActionItem } from '../services/api';

const STATUS_FILTERS = ['All', 'Pending', 'In Progress', 'Completed'];

function ActionItemsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sort, setSort] = useState('due');

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await getActionItems(user.id);
        const list = res.data || [];
        setItems(Array.isArray(list) ? list : []);
      } catch {
        toast.error('Failed to load action items');
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [user.id]);

  const handleToggle = async (item) => {
    const newStatus = item.status === 'completed' ? 'pending' : 'completed';
    try {
      await updateActionItem(item.id, { status: newStatus });
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: newStatus } : i))
      );
      toast.success('Updated');
    } catch {
      toast.error('Failed to update');
    }
  };

  const counts = {
    pending: items.filter((i) => i.status === 'pending').length,
    in_progress: items.filter((i) => i.status === 'in_progress').length,
    completed: items.filter((i) => i.status === 'completed').length,
  };

  const mapFilterToStatus = (f) => {
    if (f === 'Pending') return 'pending';
    if (f === 'In Progress') return 'in_progress';
    if (f === 'Completed') return 'completed';
    return null;
  };

  const filtered = items
    .filter((item) => {
      const matchesSearch = !search || (item.task || item.title || '').toLowerCase().includes(search.toLowerCase());
      const targetStatus = mapFilterToStatus(statusFilter);
      const matchesStatus = !targetStatus || item.status === targetStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sort === 'priority') {
        const order = { urgent: 0, high: 1, medium: 2, low: 3 };
        return (order[a.priority] ?? 2) - (order[b.priority] ?? 2);
      }
      if (sort === 'meeting') return (a.meeting_title || '').localeCompare(b.meeting_title || '');
      // Default: due date
      return new Date(a.due_date || '9999') - new Date(b.due_date || '9999');
    });

  const getPriorityChipClass = (p) => {
    if (p === 'high' || p === 'urgent') return 'chip chip-danger';
    if (p === 'medium') return 'chip chip-warning';
    if (p === 'done' || p === 'completed') return 'chip chip-success';
    return 'chip chip-info';
  };

  const getStatusChipClass = (s) => {
    if (s === 'completed') return 'chip chip-success';
    if (s === 'in_progress') return 'chip chip-info';
    return 'chip chip-warning';
  };

  const getStatusLabel = (s) => {
    if (s === 'completed') return 'Completed';
    if (s === 'in_progress') return 'In Progress';
    return 'Pending';
  };

  const formatDueDate = (d) => {
    if (!d) return '--';
    const date = new Date(d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(date);
    due.setHours(0, 0, 0, 0);
    if (due.getTime() === today.getTime()) return 'Today';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isDueToday = (d) => {
    if (!d) return false;
    const date = new Date(d);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <div className="page active" data-page="action-items">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="text-h1">Action Items</h1>
          <p className="page-subtitle">Track tasks across all your meetings in one place.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary btn-sm" onClick={() => toast.info('Export coming soon')}>Export</button>
        </div>
      </div>

      {/* Counts */}
      <div className="action-counts">
        <div className="action-count-chip">
          <div className="status-dot" style={{ background: 'var(--warning)' }}></div>
          Pending <span className="count">{counts.pending}</span>
        </div>
        <div className="action-count-chip">
          <div className="status-dot processing"></div>
          In Progress <span className="count">{counts.in_progress}</span>
        </div>
        <div className="action-count-chip">
          <div className="status-dot success"></div>
          Completed <span className="count">{counts.completed}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="meetings-filters">
        <div className="search-bar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input
            placeholder="Search action items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-chips">
          {STATUS_FILTERS.map((f) => (
            <span
              key={f}
              className={`chip chip-default${statusFilter === f ? ' active' : ''}`}
              onClick={() => setStatusFilter(f)}
            >
              {f}
            </span>
          ))}
        </div>
        <select className="sort-select" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="due">Due date</option>
          <option value="priority">Priority</option>
          <option value="meeting">Meeting</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="action-table">
          {[1, 2, 3].map((i) => (
            <div key={i} className="action-table-row" style={{ opacity: 0.5, minHeight: 60 }}>
              <div></div>
              <div className="action-table-task"><div className="action-table-task-title">Loading...</div></div>
            </div>
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="action-table">
          <div className="action-table-header">
            <div></div>
            <div>Task</div>
            <div>Assignee</div>
            <div>Due Date</div>
            <div>Priority</div>
            <div>Status</div>
            <div></div>
          </div>

          {filtered.map((item) => {
            const isCompleted = item.status === 'completed';
            return (
              <div key={item.id} className="action-table-row" style={isCompleted ? { opacity: 0.5 } : undefined}>
                <div
                  className={`action-checkbox${isCompleted ? ' checked' : ''}`}
                  onClick={() => handleToggle(item)}
                ></div>
                <div className="action-table-task">
                  <div
                    className="action-table-task-title"
                    style={isCompleted ? { textDecoration: 'line-through' } : undefined}
                  >
                    {item.task || item.title || 'Untitled'}
                  </div>
                  <div className="action-table-task-meeting">{item.meeting_title || ''}</div>
                </div>
                <div className="action-table-cell">{item.assignee || '--'}</div>
                <div className="action-table-cell" style={isDueToday(item.due_date) ? { color: 'var(--danger)' } : undefined}>
                  {formatDueDate(item.due_date)}
                </div>
                <div>
                  <span className={getPriorityChipClass(isCompleted ? 'done' : item.priority)} style={{ fontSize: '0.6875rem' }}>
                    {isCompleted ? 'Done' : item.priority ? item.priority.charAt(0).toUpperCase() + item.priority.slice(1) : 'Medium'}
                  </span>
                </div>
                <div>
                  <span className={getStatusChipClass(item.status)} style={{ fontSize: '0.6875rem' }}>
                    {getStatusLabel(item.status)}
                  </span>
                </div>
                <div>
                  <button className="btn btn-ghost btn-icon sm">&#8943;</button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ padding: 'var(--space-3xl)', textAlign: 'center', color: 'var(--text-muted)' }}>
          {search || statusFilter !== 'All'
            ? 'No action items match your filters. Try adjusting your search.'
            : 'No action items yet. Action items from your meetings will appear here.'}
        </div>
      )}
    </div>
  );
}

export default ActionItemsPage;
