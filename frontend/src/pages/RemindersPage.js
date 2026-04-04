import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getReminders, createReminder, deleteReminder, getMeetings } from '../services/api';

function RemindersPage() {
  const [reminders, setReminders] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    meeting_id: '',
    title: '',
    remind_at: '',
    reminder_type: 'email',
  });

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [remRes, meetRes] = await Promise.all([
          getReminders(user.id).catch(() => null),
          getMeetings(user.id).catch(() => null),
        ]);
        const remList = remRes?.data || [];
        setReminders(Array.isArray(remList) ? remList : []);
        const meetList = meetRes?.data || [];
        setMeetings(Array.isArray(meetList) ? meetList : []);
      } catch {
        toast.error('Failed to load reminders');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user.id]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.remind_at) {
      toast.error('Please fill in title and date/time');
      return;
    }
    try {
      const payload = { ...formData, user_id: user.id };
      const res = await createReminder(payload);
      const newReminder = res.data;
      setReminders((prev) => [newReminder, ...prev]);
      setFormData({ meeting_id: '', title: '', remind_at: '', reminder_type: 'email' });
      setShowForm(false);
      toast.success('Reminder created');
    } catch {
      toast.error('Failed to create reminder');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteReminder(id);
      setReminders((prev) => prev.filter((r) => r.id !== id));
      toast.success('Reminder deleted');
    } catch {
      toast.error('Failed to delete reminder');
    }
  };

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayReminders = reminders.filter((r) => {
    const d = new Date(r.remind_at);
    return d >= today && d < tomorrow && d >= now;
  });

  const upcoming = reminders.filter((r) => {
    const d = new Date(r.remind_at);
    return d >= tomorrow;
  }).sort((a, b) => new Date(a.remind_at) - new Date(b.remind_at));

  const completed = reminders.filter((r) => {
    const d = new Date(r.remind_at);
    return d < now;
  }).sort((a, b) => new Date(b.remind_at) - new Date(a.remind_at));

  const formatTime = (dateStr) => {
    if (!dateStr) return { value: '--', period: '' };
    const d = new Date(dateStr);
    let hours = d.getHours();
    const period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const mins = String(d.getMinutes()).padStart(2, '0');
    return { value: `${hours}:${mins}`, period };
  };

  const formatReminderDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  const getMeetingTitle = (meetingId) => {
    const m = meetings.find((mt) => mt.id === meetingId);
    return m ? m.title : null;
  };

  const renderReminderCard = (r, isPast) => {
    const time = formatTime(r.remind_at);
    const meetingTitle = getMeetingTitle(r.meeting_id);
    return (
      <div className="reminder-card-full" key={r.id}>
        <div className="reminder-card-time">
          <div className="reminder-card-time-value">{time.value}</div>
          <div className="reminder-card-time-period">{time.period}</div>
        </div>
        <div className="reminder-card-content">
          <div className="reminder-card-title" style={isPast ? { textDecoration: 'line-through' } : undefined}>
            {r.title || 'Untitled'}
          </div>
          <div className="reminder-card-meta">
            {meetingTitle && <span>From: {meetingTitle}</span>}
            {meetingTitle && <span>&bull;</span>}
            <span>{r.reminder_type || r.type || 'In-app'}</span>
            {isPast && !meetingTitle && <span>{formatReminderDate(r.remind_at)} &mdash; Completed</span>}
          </div>
        </div>
        {!isPast && (
          <div className="reminder-card-actions">
            <button className="btn btn-secondary btn-sm" onClick={() => handleDelete(r.id)}>Mark Done</button>
            <button className="btn btn-ghost btn-sm" onClick={() => toast.info('Snooze coming soon')}>Snooze</button>
          </div>
        )}
      </div>
    );
  };

  const todayLabel = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="page active" data-page="reminders">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="text-h1">Reminders</h1>
          <p className="page-subtitle">Stay on top of follow-ups and deadlines from your meetings.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
            {showForm ? 'Cancel' : 'Add Reminder'}
          </button>
        </div>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 'var(--space-xl)', padding: 'var(--space-xl)' }}>
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
              <div className="input-group">
                <label className="input-label">Title</label>
                <div className="input-with-icon">
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Reminder title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Meeting (optional)</label>
                <select
                  className="input-field"
                  style={{ padding: '0.625rem 1rem' }}
                  value={formData.meeting_id}
                  onChange={(e) => setFormData({ ...formData, meeting_id: e.target.value })}
                >
                  <option value="">Select a meeting...</option>
                  {meetings.map((m) => (
                    <option key={m.id} value={m.id}>{m.title || 'Untitled'}</option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Remind At</label>
                <div className="input-with-icon">
                  <input
                    type="datetime-local"
                    className="input-field"
                    value={formData.remind_at}
                    onChange={(e) => setFormData({ ...formData, remind_at: e.target.value })}
                  />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Type</label>
                <select
                  className="input-field"
                  style={{ padding: '0.625rem 1rem' }}
                  value={formData.reminder_type}
                  onChange={(e) => setFormData({ ...formData, reminder_type: e.target.value })}
                >
                  <option value="email">Email</option>
                  <option value="in-app">In-app</option>
                  <option value="both">Both</option>
                </select>
              </div>
            </div>
            <div style={{ marginTop: 'var(--space-md)' }}>
              <button type="submit" className="btn btn-primary">Create Reminder</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ padding: 'var(--space-3xl)', textAlign: 'center', color: 'var(--text-muted)' }}>Loading reminders...</div>
      ) : (
        <div className="reminders-sections">
          {/* Today */}
          {todayReminders.length > 0 && (
            <div>
              <h2 className="text-h3 mb-lg">Today &mdash; {todayLabel}</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                {todayReminders.map((r) => renderReminderCard(r, false))}
              </div>
            </div>
          )}

          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div>
              <h2 className="text-h3 mb-lg">Upcoming</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                {upcoming.map((r) => (
                  <div className="reminder-card-full" key={r.id}>
                    <div className="reminder-card-time">
                      <div className="reminder-card-time-value">{formatTime(r.remind_at).value}</div>
                      <div className="reminder-card-time-period">{formatTime(r.remind_at).period}</div>
                    </div>
                    <div className="reminder-card-content">
                      <div className="reminder-card-title">{r.title || 'Untitled'}</div>
                      <div className="reminder-card-meta">
                        <span>{formatReminderDate(r.remind_at)}</span>
                        <span>&bull;</span>
                        <span>{r.reminder_type || r.type || 'In-app'}</span>
                      </div>
                    </div>
                    <div className="reminder-card-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => toast.info('Edit coming soon')}>Edit</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(r.id)}>Cancel</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed */}
          {completed.length > 0 && (
            <div>
              <h2 className="text-h3 mb-lg" style={{ color: 'var(--text-muted)' }}>Completed</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', opacity: 0.5 }}>
                {completed.map((r) => renderReminderCard(r, true))}
              </div>
            </div>
          )}

          {todayReminders.length === 0 && upcoming.length === 0 && completed.length === 0 && (
            <div style={{ padding: 'var(--space-3xl)', textAlign: 'center', color: 'var(--text-muted)' }}>
              No reminders yet. Create a reminder to stay on track with your meetings.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default RemindersPage;
