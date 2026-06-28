"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

interface Stats {
  total: number;
  scheduled: number;
  completed: number;
  cancelled: number;
  candidates: number;
  completionRate: number;
}

interface Interview {
  _id: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  role: string;
  date: string;
  time: string;
  status: string;
  meetLink: string;
  createdAt: string;
}

type TabType = "overview" | "interviews" | "candidates";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [stats, setStats] = useState<Stats>({
    total: 0,
    scheduled: 0,
    completed: 0,
    cancelled: 0,
    candidates: 0,
    completionRate: 0,
  });
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [calendarConnected, setCalendarConnected] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    loadInterviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [statsData, interviewsData, calendarData] = await Promise.all([
        api.getDashboardStats(),
        api.getRecentInterviews(),
        api.checkCalendarStatus().catch(() => ({ connected: false })),
      ]);
      setStats(statsData);
      setInterviews(Array.isArray(interviewsData) ? interviewsData : []);
      setCalendarConnected(calendarData.connected);
    } catch (err) {
      console.error("Dashboard load error:", err);
    }
    setIsLoading(false);
  };

  const loadInterviews = async () => {
    try {
      const data = await api.getInterviews(statusFilter);
      setInterviews(data.interviews || []);
    } catch (err) {
      console.error("Interviews load error:", err);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.updateInterviewStatus(id, status);
      loadDashboardData();
    } catch (err) {
      console.error("Status update error:", err);
    }
  };

  const getStatusBadge = (status: string) => {
    const cls =
      status === "scheduled"
        ? "badge-scheduled"
        : status === "completed"
          ? "badge-completed"
          : "badge-cancelled";
    return <span className={`badge ${cls}`}>{status}</span>;
  };

  const sidebarLinks = [
    { id: "overview" as TabType, icon: "📊", label: "Overview" },
    { id: "interviews" as TabType, icon: "📅", label: "Interviews" },
    { id: "candidates" as TabType, icon: "👥", label: "Candidates" },
  ];

  return (
    <div className="dashboard-layout">
      {/* ═══════════ SIDEBAR ═══════════ */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "var(--radius-md)",
              background: "var(--gradient-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
            }}
          >
            🤖
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "16px" }}>SmartHire</div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              Recruiter Portal
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {sidebarLinks.map((link) => (
            <button
              key={link.id}
              className={`sidebar-link ${activeTab === link.id ? "active" : ""}`}
              onClick={() => setActiveTab(link.id)}
              style={{
                width: "100%",
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <span style={{ fontSize: "18px" }}>{link.icon}</span>
              {link.label}
            </button>
          ))}
        </nav>

        {/* Bottom Links */}
        <div style={{ padding: "0 12px", borderTop: "1px solid var(--border)", paddingTop: "16px" }}>
          <Link href="/chat" className="sidebar-link" style={{ textDecoration: "none" }}>
            <span style={{ fontSize: "18px" }}>💬</span>
            Open Chat
          </Link>
          <Link href="/" className="sidebar-link" style={{ textDecoration: "none" }}>
            <span style={{ fontSize: "18px" }}>🏠</span>
            Home
          </Link>
        </div>
      </aside>

      {/* ═══════════ MAIN CONTENT ═══════════ */}
      <main className="main-content">
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "32px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <h1 style={{ fontSize: "28px", fontWeight: 800 }}>
                {activeTab === "overview" && "Dashboard Overview"}
                {activeTab === "interviews" && "All Interviews"}
                {activeTab === "candidates" && "Candidates"}
              </h1>
              {calendarConnected ? (
                <span className="badge badge-completed" style={{ padding: "4px 8px", fontSize: "12px" }}>
                  📅 Calendar Connected
                </span>
              ) : (
                <a
                  href={`${process.env.NEXT_PUBLIC_API_URL}/auth/google`}
                  className="badge badge-cancelled"
                  style={{ padding: "6px 10px", fontSize: "12px", textDecoration: "none", cursor: "pointer", transition: "all 0.2s" }}
                  onMouseOver={(e) => (e.currentTarget.style.opacity = "0.8")}
                  onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
                >
                  ⚠️ Connect Google Calendar
                </a>
              )}
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: "4px" }}>
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={loadDashboardData}
          >
            🔄 Refresh
          </button>
        </div>

        {/* ═══════════ OVERVIEW TAB ═══════════ */}
        {activeTab === "overview" && (
          <div className="animate-fade-in">
            {/* Stats */}
            <div className="stats-grid">
              {[
                {
                  label: "Total Interviews",
                  value: stats.total,
                  icon: "📋",
                  color: "#6366f1",
                },
                {
                  label: "Scheduled",
                  value: stats.scheduled,
                  icon: "📅",
                  color: "#3b82f6",
                },
                {
                  label: "Completed",
                  value: stats.completed,
                  icon: "✅",
                  color: "#10b981",
                },
                {
                  label: "Cancelled",
                  value: stats.cancelled,
                  icon: "❌",
                  color: "#ef4444",
                },
                {
                  label: "Candidates",
                  value: stats.candidates,
                  icon: "👥",
                  color: "#8b5cf6",
                },
                {
                  label: "Completion Rate",
                  value: `${stats.completionRate}%`,
                  icon: "📊",
                  color: "#f59e0b",
                },
              ].map((stat, i) => (
                <div key={i} className="stat-card" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="stat-label">{stat.label}</span>
                    <span style={{ fontSize: "24px" }}>{stat.icon}</span>
                  </div>
                  <div className="stat-value" style={{ color: stat.color }}>
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Interviews */}
            <div style={{ marginTop: "8px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "16px" }}>
                Recent Interviews
              </h2>

              {isLoading ? (
                <div
                  style={{
                    padding: "60px",
                    textAlign: "center",
                    color: "var(--text-muted)",
                    background: "var(--bg-card)",
                    borderRadius: "var(--radius-lg)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div style={{ fontSize: "32px", marginBottom: "12px" }}>⏳</div>
                  Loading...
                </div>
              ) : interviews.length === 0 ? (
                <div
                  style={{
                    padding: "60px",
                    textAlign: "center",
                    color: "var(--text-muted)",
                    background: "var(--bg-card)",
                    borderRadius: "var(--radius-lg)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div style={{ fontSize: "48px", marginBottom: "16px" }}>📅</div>
                  <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>
                    No interviews yet
                  </h3>
                  <p style={{ fontSize: "14px", marginBottom: "24px" }}>
                    Interviews scheduled through the AI chat will appear here
                  </p>
                  <Link href="/chat" className="btn btn-primary" style={{ textDecoration: "none" }}>
                    💬 Open AI Chat
                  </Link>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Candidate</th>
                        <th>Role</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Status</th>
                        <th>Meet Link</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {interviews.map((interview) => (
                        <tr key={interview._id}>
                          <td>
                            <div>
                              <div style={{ fontWeight: 600 }}>{interview.candidateName}</div>
                              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                                {interview.candidateEmail}
                              </div>
                            </div>
                          </td>
                          <td>{interview.role}</td>
                          <td>{interview.date}</td>
                          <td>{interview.time}</td>
                          <td>{getStatusBadge(interview.status)}</td>
                          <td>
                            {interview.meetLink ? (
                              <a
                                href={interview.meetLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  color: "var(--primary-light)",
                                  textDecoration: "none",
                                  fontSize: "13px",
                                }}
                              >
                                🔗 Join
                              </a>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: "6px" }}>
                              {interview.status === "scheduled" && (
                                <>
                                  <button
                                    className="btn btn-ghost"
                                    style={{ padding: "4px 10px", fontSize: "12px" }}
                                    onClick={() => updateStatus(interview._id, "completed")}
                                  >
                                    ✅
                                  </button>
                                  <button
                                    className="btn btn-ghost"
                                    style={{ padding: "4px 10px", fontSize: "12px" }}
                                    onClick={() => updateStatus(interview._id, "cancelled")}
                                  >
                                    ❌
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════ INTERVIEWS TAB ═══════════ */}
        {activeTab === "interviews" && (
          <div className="animate-fade-in">
            {/* Filters */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "24px", flexWrap: "wrap" }}>
              {["all", "scheduled", "completed", "cancelled"].map((filter) => (
                <button
                  key={filter}
                  className={`btn ${statusFilter === filter ? "btn-primary" : "btn-ghost"}`}
                  style={{ padding: "8px 16px", fontSize: "13px", textTransform: "capitalize" }}
                  onClick={() => setStatusFilter(filter)}
                >
                  {filter === "all" ? "📋 All" : filter === "scheduled" ? "📅 Scheduled" : filter === "completed" ? "✅ Completed" : "❌ Cancelled"}
                </button>
              ))}
            </div>

            {interviews.length === 0 ? (
              <div
                style={{
                  padding: "60px",
                  textAlign: "center",
                  color: "var(--text-muted)",
                  background: "var(--bg-card)",
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--border)",
                }}
              >
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔍</div>
                <p>No interviews found with this filter</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {interviews.map((interview, i) => (
                  <div
                    key={interview._id}
                    className="glass-card"
                    style={{
                      padding: "20px 24px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "16px",
                      flexWrap: "wrap",
                      animationDelay: `${i * 0.05}s`,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: "200px" }}>
                      <div style={{ fontWeight: 700, fontSize: "16px" }}>
                        {interview.candidateName}
                      </div>
                      <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>
                        {interview.candidateEmail} • {interview.candidatePhone}
                      </div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>Role</div>
                      <div style={{ fontWeight: 600, fontSize: "14px" }}>{interview.role}</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>Date</div>
                      <div style={{ fontWeight: 600, fontSize: "14px" }}>{interview.date}</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>Time</div>
                      <div style={{ fontWeight: 600, fontSize: "14px" }}>{interview.time}</div>
                    </div>
                    <div>{getStatusBadge(interview.status)}</div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      {interview.meetLink && (
                        <a
                          href={interview.meetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-ghost"
                          style={{ padding: "6px 12px", fontSize: "12px", textDecoration: "none" }}
                        >
                          🔗 Meet
                        </a>
                      )}
                      {interview.status === "scheduled" && (
                        <button
                          className="btn btn-ghost"
                          style={{ padding: "6px 12px", fontSize: "12px" }}
                          onClick={() => updateStatus(interview._id, "completed")}
                        >
                          ✅ Complete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════════ CANDIDATES TAB ═══════════ */}
        {activeTab === "candidates" && (
          <div className="animate-fade-in">
            <div
              style={{
                padding: "60px",
                textAlign: "center",
                color: "var(--text-muted)",
                background: "var(--bg-card)",
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--border)",
              }}
            >
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>👥</div>
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  marginBottom: "8px",
                }}
              >
                Candidates
              </h3>
              <p style={{ fontSize: "14px", marginBottom: "24px" }}>
                Candidates who schedule via AI chat will appear here with their details, resume summary, and match scores.
              </p>
              <Link
                href="/chat"
                className="btn btn-primary"
                style={{ textDecoration: "none" }}
              >
                💬 Schedule First Interview
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
