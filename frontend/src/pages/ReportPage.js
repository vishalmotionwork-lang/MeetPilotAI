import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getReport, updateReport, sendReport } from '../services/api';

function ReportPage() {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const editRef = useRef(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await getReport(meetingId);
        setReport(res.data);
      } catch {
        toast.error('Failed to load report');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [meetingId]);

  const handleSave = async () => {
    if (!editRef.current) return;
    const content = editRef.current.innerHTML;
    try {
      await updateReport(meetingId, { content_html: content });
      setReport((prev) => ({ ...prev, content_html: content }));
      setEditing(false);
      toast.success('Report saved');
    } catch {
      toast.error('Failed to save report');
    }
  };

  const handleSend = async () => {
    const emails = emailInput.split(',').map((e) => e.trim()).filter(Boolean);
    if (emails.length === 0) {
      toast.error('Please enter at least one email');
      return;
    }
    try {
      await sendReport(meetingId, emails);
      toast.success(`Report sent to ${emails.length} recipient(s)`);
      setShowEmailModal(false);
      setEmailInput('');
    } catch {
      toast.error('Failed to send report');
    }
  };

  if (loading) {
    return (
      <div className="page active">
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-3xl)' }}>
          <p>Loading report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page active">
      <button className="detail-back" onClick={() => navigate(-1)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        Back
      </button>

      <div className="flex flex-end gap-sm mb-xl">
        {editing ? (
          <>
            <button className="btn btn-primary btn-sm" onClick={handleSave}>
              Save Changes
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </>
        ) : (
          <>
            <button className="btn btn-outline btn-sm" onClick={() => setEditing(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Edit
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => setShowEmailModal(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              Send via Email
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => toast.info('Download coming soon')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
              Download PDF
            </button>
          </>
        )}
      </div>

      {report?.content_html ? (
        <div className="report-document">
          {editing ? (
            <div
              ref={editRef}
              contentEditable
              suppressContentEditableWarning
              dangerouslySetInnerHTML={{ __html: report.content_html }}
              style={{ outline: 'none', minHeight: 200, border: '2px dashed var(--primary-200)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)' }}
            />
          ) : (
            <div dangerouslySetInnerHTML={{ __html: report.content_html }} />
          )}
        </div>
      ) : (
        <div className="report-document" style={{ textAlign: 'center', padding: 'var(--space-3xl)' }}>
          <p style={{ color: 'var(--text-muted)' }}>No report content available. The report will appear here after the meeting is processed.</p>
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div className="card" style={{ width: 480, padding: 'var(--space-xl)' }}>
            <h3 className="text-h3 mb-lg">Send Report via Email</h3>
            <div className="input-group">
              <label className="input-label">Email addresses (comma separated)</label>
              <div className="input-with-icon">
                <input
                  type="text"
                  className="input-field"
                  placeholder="john@example.com, jane@example.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-sm" style={{ marginTop: 'var(--space-lg)' }}>
              <button className="btn btn-primary" onClick={handleSend}>Send</button>
              <button className="btn btn-ghost" onClick={() => setShowEmailModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportPage;
