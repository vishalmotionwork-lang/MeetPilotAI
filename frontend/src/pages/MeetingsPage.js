import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getMeetings } from '../services/api';

function MeetingsPage() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sort, setSort] = useState('newest');
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const res = await getMeetings(user.id);
        const list = res.data || [];
        setMeetings(Array.isArray(list) ? list : []);
      } catch {
        toast.error('Failed to load meetings');
      } finally {
        setLoading(false);
      }
    };
    fetchMeetings();
  }, [user.id]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ' \u2022 ' +
      d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '--';
    const mins = Math.round(seconds / 60);
    if (mins >= 60) {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return `${h}h ${m}m`;
    }
    return `${mins} min`;
  };

  const getStatusChipClass = (status) => {
    if (status === 'completed') return 'chip chip-success';
    if (status === 'processing') return 'chip chip-warning';
    return 'chip chip-info';
  };

  const getStatusLabel = (status) => {
    if (status === 'completed') return 'Completed';
    if (status === 'processing') return 'Processing';
    return status || 'New';
  };

  const filtered = meetings
    .filter((m) => {
      const matchesSearch = !search || (m.title || '').toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'All' ||
        (statusFilter === 'Processing' && m.status === 'processing') ||
        (statusFilter === 'Completed' && m.status === 'completed') ||
        (statusFilter === 'Needs Review' && m.status !== 'completed' && m.status !== 'processing');
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sort === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
      if (sort === 'longest') return (b.duration_seconds || 0) - (a.duration_seconds || 0);
      return new Date(b.created_at) - new Date(a.created_at);
    });

  const filters = ['All', 'Processing', 'Completed', 'Needs Review'];

  return (
    <div className="page active" data-page="meetings">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="text-h1">Meetings</h1>
          <p className="page-subtitle">All your recorded and uploaded meetings in one place.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => navigate('/record')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
            New Meeting
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="meetings-filters">
        <div className="search-bar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input
            placeholder="Search meetings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-chips">
          {filters.map((f) => (
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
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="longest">Longest</option>
        </select>
      </div>

      {/* Meeting List */}
      <div className="meetings-list">
        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="meeting-card" style={{ opacity: 0.5, minHeight: 80 }}>
              <div className="meeting-card-info">
                <div className="meeting-card-title">Loading...</div>
              </div>
            </div>
          ))
        ) : filtered.length > 0 ? (
          filtered.map((m) => {
            const isProcessing = m.status === 'processing';
            return (
              <div
                key={m.id}
                className={`meeting-card${isProcessing ? ' processing-state' : ''}`}
                onClick={isProcessing ? undefined : () => navigate(`/meeting/${m.id}`)}
                style={isProcessing ? undefined : { cursor: 'pointer' }}
              >
                <div className={`meeting-card-icon${isProcessing ? ' processing' : ''}`}>
                  {m.source_type === 'upload' ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                  ) : isProcessing ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>
                  )}
                </div>
                <div className="meeting-card-info">
                  <div className="meeting-card-title">{m.title || 'Untitled Meeting'}</div>
                  <div className="meeting-card-meta">
                    {formatDate(m.created_at)}
                    {m.source_type && ` \u2022 ${m.source_type === 'upload' ? 'Uploaded file' : 'Live recording'}`}
                  </div>
                </div>
                <div className="meeting-card-detail">
                  <div className="meeting-card-detail-label">Duration</div>
                  <div className="meeting-card-detail-value">{formatDuration(m.duration_seconds)}</div>
                </div>
                <div className="meeting-card-detail">
                  <div className="meeting-card-detail-label">Status</div>
                  <div><span className={getStatusChipClass(m.status)}>{getStatusLabel(m.status)}</span></div>
                </div>
                <div className="meeting-card-detail">
                  <div className="meeting-card-detail-label">Tasks</div>
                  <div className="meeting-card-detail-value">{m.action_item_count ?? m.task_count ?? '\u2014'}</div>
                </div>
                <div className="meeting-card-actions">
                  <button
                    className={`btn ${isProcessing ? 'btn-ghost' : 'btn-secondary'} btn-sm`}
                    disabled={isProcessing}
                    onClick={(e) => { e.stopPropagation(); if (!isProcessing) navigate(`/meeting/${m.id}`); }}
                  >
                    Open
                  </button>
                  {!isProcessing && (
                    <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); toast.info('Export coming soon'); }}>
                      Export
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ padding: 'var(--space-3xl)', textAlign: 'center', color: 'var(--text-muted)' }}>
            {search || statusFilter !== 'All'
              ? 'No meetings match your filters. Try adjusting your search.'
              : 'No meetings yet. Record or upload your first meeting!'}
          </div>
        )}
      </div>
    </div>
  );
}

export default MeetingsPage;
