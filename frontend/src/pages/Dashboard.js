import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getDashboard,
  getActionItems,
  getReminders,
  updateActionItem,
} from "../services/api";

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentMeetings, setRecentMeetings] = useState([]);
  const [actionItems, setActionItems] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, actionRes, remRes] = await Promise.all([
          getDashboard(user.id).catch(() => null),
          getActionItems(user.id).catch(() => null),
          getReminders(user.id).catch(() => null),
        ]);

        if (dashRes?.data) {
          setStats(dashRes.data);
          const meetings = dashRes.data.recent_meetings || [];
          setRecentMeetings(
            Array.isArray(meetings) ? meetings.slice(0, 4) : [],
          );
        }

        const actionList = actionRes?.data || [];
        const pending = Array.isArray(actionList)
          ? actionList.filter((a) => a.status !== "completed").slice(0, 4)
          : [];
        setActionItems(pending);

        const remList = remRes?.data || [];
        const upcoming = Array.isArray(remList)
          ? remList
              .filter((r) => new Date(r.remind_at) >= new Date())
              .slice(0, 3)
          : [];
        setReminders(upcoming);
      } catch {
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user.id]);

  const handleToggleAction = async (item) => {
    const newStatus = item.status === "completed" ? "pending" : "completed";
    try {
      await updateActionItem(item.id, { status: newStatus });
      setActionItems((prev) =>
        prev
          .map((i) => (i.id === item.id ? { ...i, status: newStatus } : i))
          .filter((i) => i.status !== "completed"),
      );
      toast.success("Action item updated");
    } catch {
      toast.error("Failed to update action item");
    }
  };

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const totalMeetings = stats?.total_meetings ?? 0;
  const openActions =
    stats?.pending_action_items ??
    (stats?.total_action_items
      ? stats.total_action_items - (stats.completed_action_items || 0)
      : 0);
  const completedActions = stats?.completed_action_items ?? 0;
  const upcomingReminders = stats?.upcoming_reminders ?? reminders.length;

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "";
    const mins = Math.round(seconds / 60);
    if (mins >= 60) {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return `${h}h ${m}m`;
    }
    return `${mins} min`;
  };

  const getStatusChipClass = (status) => {
    if (status === "completed") return "chip chip-success";
    if (status === "processing") return "chip chip-warning";
    return "chip chip-info";
  };

  const getPriorityChipClass = (priority) => {
    if (priority === "high" || priority === "urgent") return "chip chip-danger";
    if (priority === "medium") return "chip chip-warning";
    return "chip chip-info";
  };

  const formatReminderTime = (dateStr) => {
    if (!dateStr) return { value: "--", period: "" };
    const d = new Date(dateStr);
    let hours = d.getHours();
    const period = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    const mins = String(d.getMinutes()).padStart(2, "0");
    return { value: `${hours}:${mins}`, period };
  };

  if (loading) {
    return (
      <div className="page active" data-page="home">
        <div className="home-greeting">
          <h1 className="text-h1">Welcome back, {user.name || "there"}</h1>
          <p className="date text-body-sm">{today}</p>
        </div>
        <div className="kpi-grid">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="kpi-card"
              style={{ minHeight: 100, opacity: 0.5 }}
            >
              <div className="kpi-label">Loading...</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page active" data-page="home">
      {/* Greeting */}
      <div className="home-greeting">
        <h1 className="text-h1">Welcome back, {user.name || "there"}</h1>
        <p className="date text-body-sm">{today}</p>
      </div>

      {/* Hero Actions */}
      <div className="hero-actions">
        <button
          className="hero-action-card"
          onClick={() => navigate("/record")}
          type="button"
        >
          <div className="hero-action-icon record">
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
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
          </div>
          <div className="hero-action-text">
            <h3>Record Meeting</h3>
            <p>
              Start a live recording and let AI capture everything in real-time.
            </p>
          </div>
        </button>
        <button
          className="hero-action-card"
          onClick={() => navigate("/record")}
          type="button"
        >
          <div className="hero-action-icon upload">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" x2="12" y1="3" y2="15" />
            </svg>
          </div>
          <div className="hero-action-text">
            <h3>Upload Recording</h3>
            <p>
              Upload an audio or video file to extract insights automatically.
            </p>
          </div>
        </button>
      </div>

      {/* Secondary action */}
      <div className="flex flex-end mb-xl">
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => navigate("/meetings")}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            width="16"
            height="16"
          >
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
            <line x1="16" x2="16" y1="2" y2="6" />
            <line x1="8" x2="8" y1="2" y2="6" />
            <line x1="3" x2="21" y1="10" y2="10" />
          </svg>
          View All Meetings &rarr;
        </button>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Total Meetings</div>
          <div className="kpi-value">{totalMeetings}</div>
          <div className="kpi-change up">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              width="12"
              height="12"
            >
              <polyline points="18 15 12 9 6 15" />
            </svg>
            All time
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Open Action Items</div>
          <div className="kpi-value">{openActions}</div>
          <div className="kpi-change down">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              width="12"
              height="12"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
            Needs attention
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Completed This Week</div>
          <div className="kpi-value">{completedActions}</div>
          <div className="kpi-change up">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              width="12"
              height="12"
            >
              <polyline points="18 15 12 9 6 15" />
            </svg>
            Great progress
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Upcoming Reminders</div>
          <div className="kpi-value">{upcomingReminders}</div>
          <div className="kpi-change">Stay on track</div>
        </div>
      </div>

      {/* Recent Meetings + Action Items + Reminders */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "var(--space-xl)",
          marginTop: "var(--space-lg)",
        }}
      >
        {/* Recent Meetings */}
        <div className="card">
          <div className="section-header">
            <h2>Recent Meetings</h2>
            <button className="see-all" onClick={() => navigate("/meetings")}>
              See all
            </button>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-xs)",
            }}
          >
            {recentMeetings.length > 0 ? (
              recentMeetings.map((m) => (
                <div
                  className="meeting-row"
                  key={m.id}
                  onClick={() => navigate(`/meeting/${m.id}`)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="meeting-row-icon">
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
                  </div>
                  <div className="meeting-row-info">
                    <div className="meeting-row-title">
                      {m.title || "Untitled Meeting"}
                    </div>
                    <div className="meeting-row-meta">
                      <span>{formatDate(m.created_at)}</span>
                      {m.duration_seconds && (
                        <>
                          <span>&bull;</span>
                          <span>{formatDuration(m.duration_seconds)}</span>
                        </>
                      )}
                      <span
                        className={getStatusChipClass(m.status)}
                        style={{ padding: "2px 8px", fontSize: "0.6875rem" }}
                      >
                        {m.status === "completed"
                          ? "Completed"
                          : m.status === "processing"
                            ? "Processing"
                            : m.status || "New"}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div
                style={{
                  padding: "var(--space-xl)",
                  textAlign: "center",
                  color: "var(--text-muted)",
                }}
              >
                No meetings yet. Record your first meeting to get started!
              </div>
            )}
          </div>
        </div>

        {/* Right column: Action Items + Reminders */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-xl)",
          }}
        >
          {/* Pending Action Items */}
          <div className="card">
            <div className="section-header">
              <h2>Pending Action Items</h2>
              <button
                className="see-all"
                onClick={() => navigate("/action-items")}
              >
                See all
              </button>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-xs)",
              }}
            >
              {actionItems.length > 0 ? (
                actionItems.map((item) => (
                  <div className="action-item-row" key={item.id}>
                    <div
                      className={`action-checkbox${item.status === "completed" ? " checked" : ""}`}
                      onClick={() => handleToggleAction(item)}
                    ></div>
                    <div className="action-item-content">
                      <div
                        className={`action-item-title${item.status === "completed" ? " completed" : ""}`}
                      >
                        {item.task || item.title || "Untitled"}
                      </div>
                      <div className="action-item-meta">
                        <span
                          className={getPriorityChipClass(item.priority)}
                          style={{ padding: "1px 6px", fontSize: "0.625rem" }}
                        >
                          {item.priority
                            ? item.priority.charAt(0).toUpperCase() +
                              item.priority.slice(1)
                            : "Medium"}
                        </span>
                        {item.due_date && (
                          <span>
                            Due{" "}
                            {new Date(item.due_date).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric" },
                            )}
                          </span>
                        )}
                        {item.assignee && (
                          <>
                            <span>&bull;</span>
                            <span>{item.assignee}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div
                  style={{
                    padding: "var(--space-lg)",
                    textAlign: "center",
                    color: "var(--text-muted)",
                  }}
                >
                  All caught up! No pending action items.
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Reminders */}
          <div className="card">
            <div className="section-header">
              <h2>Upcoming Reminders</h2>
              <button
                className="see-all"
                onClick={() => navigate("/reminders")}
              >
                See all
              </button>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-sm)",
              }}
            >
              {reminders.length > 0 ? (
                reminders.map((r) => {
                  const time = formatReminderTime(r.remind_at);
                  return (
                    <div className="reminder-row" key={r.id}>
                      <div className="reminder-time">
                        <div className="reminder-time-value">{time.value}</div>
                        <div className="reminder-time-period">
                          {time.period}
                        </div>
                      </div>
                      <div className="reminder-info">
                        <div className="reminder-title">
                          {r.title || "Untitled"}
                        </div>
                        <div className="reminder-detail">
                          {new Date(r.remind_at).toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "short",
                            day: "numeric",
                          })}
                          {r.reminder_type && ` \u2022 ${r.reminder_type}`}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div
                  style={{
                    padding: "var(--space-lg)",
                    textAlign: "center",
                    color: "var(--text-muted)",
                  }}
                >
                  No upcoming reminders.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent AI Insights */}
      {recentMeetings.length > 0 && (
        <div className="card mt-xl">
          <div className="section-header">
            <h2>Recent AI Insights</h2>
          </div>
          <div className="grid-3">
            {recentMeetings.slice(0, 3).map((m, i) => (
              <div
                key={m.id}
                className={`card card-flat ${i === 0 ? "card-accent-tertiary" : "card-accent"}`}
                style={{ padding: "var(--space-lg)" }}
              >
                <div className="text-caption mb-sm">
                  From: {m.title || "Untitled Meeting"}
                </div>
                <p
                  className="text-body-sm"
                  style={{ color: "var(--text-primary)", fontWeight: 500 }}
                >
                  {m.summary_text ||
                    m.insight ||
                    "AI insights will appear here after processing."}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
