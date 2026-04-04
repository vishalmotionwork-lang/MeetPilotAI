import React, { useState, useEffect } from 'react';
import { getDashboard } from '../services/api';

function ProfilePage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await getDashboard(user.id);
        setStats(res.data);
      } catch {
        // Stats are optional
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user.id]);

  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  const totalActions = stats?.total_action_items || 0;
  const completedActions = stats?.completed_action_items || 0;
  const completionRate = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

  return (
    <div className="page active">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="text-h1">Profile</h1>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center', padding: 'var(--space-2xl)' }}>
        <div className="nav-avatar" style={{ width: 72, height: 72, fontSize: '1.5rem', margin: '0 auto var(--space-lg)' }}>
          {getInitials(user.name)}
        </div>
        <h2 className="text-h2" style={{ marginBottom: 'var(--space-xs)' }}>{user.name || 'User'}</h2>
        <p className="text-body-sm" style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-xl)' }}>{user.email || ''}</p>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-md)' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="card card-flat" style={{ padding: 'var(--space-lg)', opacity: 0.5 }}>
                <div className="kpi-label">Loading...</div>
              </div>
            ))}
          </div>
        ) : stats ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-md)' }}>
            <div className="card card-flat" style={{ padding: 'var(--space-lg)' }}>
              <div className="kpi-value" style={{ fontSize: '1.5rem' }}>{stats.total_meetings || 0}</div>
              <div className="kpi-label">Meetings</div>
            </div>
            <div className="card card-flat" style={{ padding: 'var(--space-lg)' }}>
              <div className="kpi-value" style={{ fontSize: '1.5rem' }}>{totalActions}</div>
              <div className="kpi-label">Action Items</div>
            </div>
            <div className="card card-flat" style={{ padding: 'var(--space-lg)' }}>
              <div className="kpi-value" style={{ fontSize: '1.5rem' }}>{completionRate}%</div>
              <div className="kpi-label">Completion</div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default ProfilePage;
