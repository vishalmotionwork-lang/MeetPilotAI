import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getMeeting,
  updateActionItem,
  updateReport,
  sendReport,
} from "../services/api";

function MeetingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("summary");
  const [editing, setEditing] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const editRef = useRef(null);

  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        const res = await getMeeting(id);
        setMeeting(res.data);
      } catch {
        toast.error("Failed to load meeting");
        navigate("/meetings");
      } finally {
        setLoading(false);
      }
    };
    fetchMeeting();
  }, [id, navigate]);

  const handleToggleAction = async (item) => {
    const newStatus = item.status === "completed" ? "pending" : "completed";
    try {
      await updateActionItem(item.id, { status: newStatus });
      setMeeting((prev) => ({
        ...prev,
        action_items: (prev.action_items || []).map((i) =>
          i.id === item.id ? { ...i, status: newStatus } : i,
        ),
      }));
      toast.success("Action item updated");
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleSaveReport = async () => {
    if (!editRef.current) return;
    const content = editRef.current.innerHTML;
    try {
      await updateReport(id, { content_html: content });
      setMeeting((prev) => ({
        ...prev,
        report: { ...prev.report, content_html: content },
      }));
      setEditing(false);
      toast.success("Report saved");
    } catch {
      toast.error("Failed to save report");
    }
  };

  const handleSendEmail = async () => {
    const emails = emailInput
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);
    if (emails.length === 0) {
      toast.error("Please enter at least one email");
      return;
    }
    try {
      await sendReport(id, emails);
      toast.success(`Report sent to ${emails.length} recipient(s)`);
      setShowEmailModal(false);
      setEmailInput("");
    } catch {
      toast.error("Failed to send report");
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return (
      d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }) +
      " \u2014 " +
      d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    );
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "";
    const mins = Math.round(seconds / 60);
    return `${mins} minutes`;
  };

  if (loading) {
    return (
      <div className="page active" data-page="meeting-detail">
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "var(--space-3xl)",
          }}
        >
          <p>Loading meeting...</p>
        </div>
      </div>
    );
  }

  if (!meeting) return null;

  const meetingData = meeting.meeting || meeting;
  const summary = meeting.summary || {};
  const keyPoints = summary.key_points || summary.keyPoints || [];
  const decisions = summary.decisions || [];
  const nextSteps = summary.next_steps || summary.nextSteps || [];
  const risks = summary.risks || summary.open_questions || [];
  const actionItems = meeting.action_items || [];
  const report = meeting.report || {};
  const transcript = meetingData.transcript || "";

  const getPriorityChipClass = (p) => {
    if (p === "high" || p === "urgent") return "chip chip-danger";
    if (p === "medium") return "chip chip-warning";
    if (p === "done" || p === "completed") return "chip chip-success";
    return "chip chip-info";
  };

  const tabs = [
    { id: "summary", label: "Summary" },
    { id: "transcript", label: "Transcript" },
    { id: "detail-actions", label: "Action Items" },
    { id: "report", label: "Report" },
  ];

  const openCount = actionItems.filter((i) => i.status !== "completed").length;
  const doneCount = actionItems.filter((i) => i.status === "completed").length;

  return (
    <div className="page active" data-page="meeting-detail">
      <button className="detail-back" onClick={() => navigate("/meetings")}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to Meetings
      </button>

      <div className="detail-header">
        <div>
          <div className="detail-title-row">
            <h1 className="detail-title">
              {meetingData.title || "Untitled Meeting"}
            </h1>
            <span
              className={
                meetingData.status === "completed"
                  ? "chip chip-success"
                  : "chip chip-warning"
              }
            >
              {meetingData.status === "completed"
                ? "Completed"
                : meetingData.status || "Processing"}
            </span>
          </div>
          <div className="detail-meta">
            <span className="detail-meta-item">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                <line x1="16" x2="16" y1="2" y2="6" />
                <line x1="8" x2="8" y1="2" y2="6" />
                <line x1="3" x2="21" y1="10" y2="10" />
              </svg>
              {formatDate(meetingData.created_at)}
            </span>
            {meetingData.duration_seconds && (
              <span className="detail-meta-item">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {formatDuration(meetingData.duration_seconds)}
              </span>
            )}
            <span className="detail-meta-item">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              </svg>
              {meetingData.source_type === "upload"
                ? "Uploaded file"
                : "Live recording"}
            </span>
          </div>
        </div>
        {activeTab === "report" && (
          <div className="detail-actions">
            <button
              className="btn btn-outline btn-sm"
              onClick={() => window.print()}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                width="14"
                height="14"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" x2="12" y1="15" y2="3" />
              </svg>
              Export PDF
            </button>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setShowEmailModal(true)}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                width="14"
                height="14"
              >
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              Send via Email
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setEditing(true)}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                width="14"
                height="14"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="detail-tabs">
        <div className="tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-btn${activeTab === tab.id ? " active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* SUMMARY TAB */}
      {activeTab === "summary" && (
        <div className="tab-content active">
          <div className="summary-grid">
            {(summary.overview || summary.text || summary.insight) && (
              <div className="summary-card full-width">
                <div className="summary-card-header">
                  <div className="summary-card-icon purple">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="21" x2="3" y1="6" y2="6" />
                      <line x1="17" x2="7" y1="12" y2="12" />
                      <line x1="19" x2="5" y1="18" y2="18" />
                    </svg>
                  </div>
                  <span className="summary-card-title">Overview</span>
                </div>
                <p className="summary-text">
                  {summary.overview || summary.text || summary.insight}
                </p>
              </div>
            )}

            {keyPoints.length > 0 && (
              <div className="summary-card">
                <div className="summary-card-header">
                  <div className="summary-card-icon blue">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                    </svg>
                  </div>
                  <span className="summary-card-title">Key Points</span>
                </div>
                <ul className="summary-list">
                  {keyPoints.map((point, i) => (
                    <li key={i}>
                      {typeof point === "string"
                        ? point
                        : point.text || point.description}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {decisions.length > 0 && (
              <div className="summary-card">
                <div className="summary-card-header">
                  <div className="summary-card-icon green">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </div>
                  <span className="summary-card-title">Decisions Made</span>
                </div>
                <ul className="summary-list">
                  {decisions.map((d, i) => (
                    <li key={i}>
                      {typeof d === "string" ? d : d.text || d.description}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {risks.length > 0 && (
              <div className="summary-card">
                <div className="summary-card-header">
                  <div className="summary-card-icon amber">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                      <line x1="12" x2="12" y1="9" y2="13" />
                      <line x1="12" x2="12.01" y1="17" y2="17" />
                    </svg>
                  </div>
                  <span className="summary-card-title">
                    Risks &amp; Open Questions
                  </span>
                </div>
                <ul className="summary-list">
                  {risks.map((r, i) => (
                    <li key={i}>
                      {typeof r === "string" ? r : r.text || r.description}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {nextSteps.length > 0 && (
              <div className="summary-card full-width">
                <div className="summary-card-header">
                  <div className="summary-card-icon purple">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </div>
                  <span className="summary-card-title">Next Steps</span>
                </div>
                <ul className="summary-list">
                  {nextSteps.map((s, i) => (
                    <li key={i}>
                      {typeof s === "string" ? s : s.text || s.description}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {!summary.overview &&
              !summary.text &&
              !summary.insight &&
              keyPoints.length === 0 && (
                <div
                  className="summary-card full-width"
                  style={{ textAlign: "center", padding: "var(--space-3xl)" }}
                >
                  <p style={{ color: "var(--text-muted)" }}>
                    No summary available yet. The AI summary will appear here
                    after processing.
                  </p>
                </div>
              )}
          </div>
        </div>
      )}

      {/* TRANSCRIPT TAB */}
      {activeTab === "transcript" && (
        <div className="tab-content active">
          {transcript ? (
            <div className="transcript-layout">
              <div>
                <div className="transcript-container">
                  {typeof transcript === "string" ? (
                    <div className="transcript-entry">
                      <div className="transcript-entry-content">
                        <p
                          className="transcript-text"
                          style={{ whiteSpace: "pre-wrap" }}
                        >
                          {transcript}
                        </p>
                      </div>
                    </div>
                  ) : Array.isArray(transcript) ? (
                    transcript.map((entry, i) => (
                      <div className="transcript-entry" key={i}>
                        <div
                          className="transcript-avatar"
                          style={{ background: "var(--primary)" }}
                        >
                          {(entry.speaker || "S").substring(0, 2).toUpperCase()}
                        </div>
                        <div className="transcript-entry-content">
                          <div className="transcript-speaker-row">
                            <span className="transcript-speaker">
                              {entry.speaker || "Speaker"}
                            </span>
                            {entry.timestamp && (
                              <span className="transcript-time">
                                {entry.timestamp}
                              </span>
                            )}
                          </div>
                          <p className="transcript-text">{entry.text}</p>
                        </div>
                      </div>
                    ))
                  ) : null}
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                padding: "var(--space-3xl)",
                textAlign: "center",
                color: "var(--text-muted)",
              }}
            >
              No transcript available.
            </div>
          )}
        </div>
      )}

      {/* ACTION ITEMS TAB */}
      {activeTab === "detail-actions" && (
        <div className="tab-content active">
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div
              style={{
                padding: "var(--space-xl)",
                borderBottom: "1px solid var(--border-subtle)",
              }}
            >
              <div className="flex flex-between flex-center">
                <div>
                  <h3 className="text-h3">Action Items from this meeting</h3>
                  <p className="text-body-sm mt-xs">
                    {actionItems.length} items extracted &bull; {doneCount}{" "}
                    completed
                  </p>
                </div>
                <div className="flex gap-sm">
                  <span className="chip chip-primary">{openCount} Open</span>
                  <span className="chip chip-success">{doneCount} Done</span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              {actionItems.length > 0 ? (
                actionItems.map((item) => {
                  const isCompleted = item.status === "completed";
                  return (
                    <div
                      key={item.id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "40px 1fr 140px 100px 100px",
                        gap: "var(--space-md)",
                        padding: "var(--space-md) var(--space-xl)",
                        alignItems: "center",
                        borderTop: "1px solid var(--border-subtle)",
                        opacity: isCompleted ? 0.5 : 1,
                      }}
                    >
                      <div
                        className={`action-checkbox${isCompleted ? " checked" : ""}`}
                        onClick={() => handleToggleAction(item)}
                      ></div>
                      <div>
                        <div
                          className="action-table-task-title"
                          style={
                            isCompleted
                              ? { textDecoration: "line-through" }
                              : undefined
                          }
                        >
                          {item.task || item.title || "Untitled"}
                        </div>
                        {item.context && (
                          <div
                            className="action-table-task-meeting"
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--text-muted)",
                            }}
                          >
                            {item.context}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-center gap-sm">
                        <span className="text-body-sm">
                          {item.assignee || "--"}
                        </span>
                      </div>
                      <div>
                        <span
                          className={getPriorityChipClass(
                            isCompleted ? "done" : item.priority,
                          )}
                          style={{ fontSize: "0.6875rem" }}
                        >
                          {isCompleted
                            ? "Done"
                            : item.priority
                              ? item.priority.charAt(0).toUpperCase() +
                                item.priority.slice(1)
                              : "Medium"}
                        </span>
                      </div>
                      <div className="text-body-sm">
                        {item.due_date
                          ? new Date(item.due_date).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric" },
                            )
                          : "--"}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div
                  style={{
                    padding: "var(--space-xl)",
                    textAlign: "center",
                    color: "var(--text-muted)",
                  }}
                >
                  No action items extracted from this meeting.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* REPORT TAB */}
      {activeTab === "report" && (
        <div className="tab-content active">
          {editing && (
            <div className="flex flex-end gap-sm mb-xl">
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSaveReport}
              >
                Save Changes
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
            </div>
          )}

          <div className="report-document">
            {editing ? (
              <div
                ref={editRef}
                contentEditable
                suppressContentEditableWarning
                dangerouslySetInnerHTML={{
                  __html:
                    report.content_html ||
                    `<h1>${meetingData.title || "Meeting Report"}</h1><p>Edit your report here...</p>`,
                }}
                style={{
                  outline: "none",
                  minHeight: 300,
                  border: "2px dashed var(--primary-200)",
                  borderRadius: "var(--radius-lg)",
                  padding: "var(--space-xl)",
                }}
              />
            ) : report.content_html ? (
              <div dangerouslySetInnerHTML={{ __html: report.content_html }} />
            ) : (
              <>
                <div className="report-header">
                  <div
                    className="text-caption mb-sm"
                    style={{ color: "var(--primary)" }}
                  >
                    MEETING REPORT
                  </div>
                  <h1 className="report-title">
                    {meetingData.title || "Untitled Meeting"}
                  </h1>
                  <div className="report-meta">
                    {formatDate(meetingData.created_at)}
                  </div>
                </div>
                {(summary.insight || summary.overview) && (
                  <div className="report-section">
                    <h2 className="report-section-title">Executive Summary</h2>
                    <p className="report-text">
                      {summary.insight || summary.overview}
                    </p>
                  </div>
                )}
                {keyPoints.length > 0 && (
                  <div className="report-section">
                    <h2 className="report-section-title">
                      Key Discussion Points
                    </h2>
                    <ul className="report-list">
                      {keyPoints.map((p, i) => (
                        <li key={i}>{typeof p === "string" ? p : p.text}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {decisions.length > 0 && (
                  <div className="report-section">
                    <h2 className="report-section-title">Decisions</h2>
                    <ul className="report-list">
                      {decisions.map((d, i) => (
                        <li key={i}>{typeof d === "string" ? d : d.text}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {actionItems.length > 0 && (
                  <div className="report-section">
                    <h2 className="report-section-title">Action Items</h2>
                    <ul className="report-list">
                      {actionItems.map((item, i) => (
                        <li key={i}>
                          {item.assignee && <strong>{item.assignee}</strong>}
                          {item.assignee && " \u2014 "}
                          {item.task || item.title}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div
                  style={{
                    textAlign: "center",
                    paddingTop: "var(--space-2xl)",
                    borderTop: "1px solid var(--border-subtle)",
                  }}
                >
                  <p
                    className="text-caption"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Generated by MeetPilotAI
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Email Modal */}
          {showEmailModal && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
              }}
              onClick={() => setShowEmailModal(false)}
            >
              <div
                className="card"
                style={{ width: 480, padding: "var(--space-xl)" }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-h3 mb-lg">Send Report via Email</h3>
                <p
                  className="text-body-sm mb-md"
                  style={{ color: "var(--text-muted)" }}
                >
                  Note: Free tier only supports sending to the account owner's
                  verified email.
                </p>
                <div className="input-group">
                  <label className="input-label">
                    Email addresses (comma separated)
                  </label>
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
                <div
                  className="flex gap-sm"
                  style={{ marginTop: "var(--space-lg)" }}
                >
                  <button className="btn btn-primary" onClick={handleSendEmail}>
                    Send
                  </button>
                  <button
                    className="btn btn-ghost"
                    onClick={() => setShowEmailModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MeetingDetailPage;
