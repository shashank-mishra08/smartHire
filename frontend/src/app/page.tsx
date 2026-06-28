"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div style={{ background: "var(--bg-primary)" }}>
      {/* ═══════════ HERO ═══════════ */}
      <section className="hero">
        {/* Floating orbs background */}
        <div
          style={{
            position: "absolute",
            top: "10%",
            right: "15%",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)",
            filter: "blur(40px)",
            pointerEvents: "none",
          }}
          className="animate-float"
        />
        <div
          style={{
            position: "absolute",
            bottom: "20%",
            left: "10%",
            width: "250px",
            height: "250px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 70%)",
            filter: "blur(40px)",
            pointerEvents: "none",
          }}
          className="animate-float"
        />

        <div className="animate-slide-up" style={{ position: "relative", zIndex: 1 }}>
          {/* Logo Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 20px",
              borderRadius: "var(--radius-full)",
              background: "rgba(99, 102, 241, 0.1)",
              border: "1px solid rgba(99, 102, 241, 0.2)",
              marginBottom: "32px",
              fontSize: "14px",
              color: "var(--primary-light)",
              fontWeight: 600,
            }}
          >
            <span style={{ fontSize: "18px" }}>🤖</span>
            Powered by AI
          </div>

          <h1 className="hero-title">
            <span className="gradient-text">SmartHire</span>
            <br />
            <span style={{ color: "var(--text-primary)" }}>
              AI Interview Agent
            </span>
          </h1>

          <p className="hero-subtitle">
            An intelligent AI agent that naturally converses with candidates,
            schedules interviews, sends notifications, and automates your entire
            hiring workflow — end to end.
          </p>

          <div
            style={{
              display: "flex",
              gap: "16px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Link href="/chat" className="hero-btn">
              <span>💬</span> Start Interview Chat
            </Link>
            <Link
              href="/dashboard"
              className="hero-btn"
              style={{
                background: "transparent",
                border: "1px solid var(--border-light)",
                boxShadow: "none",
                color: "var(--text-primary)",
              }}
            >
              <span>📊</span> Recruiter Dashboard
            </Link>
          </div>
        </div>

        {/* Live Stats Bar */}
        <div
          className="animate-fade-in"
          style={{
            marginTop: "64px",
            display: "flex",
            gap: "48px",
            flexWrap: "wrap",
            justifyContent: "center",
            position: "relative",
            zIndex: 1,
          }}
        >
          {[
            { label: "AI Conversations", value: "100%", icon: "🧠" },
            { label: "Auto Scheduling", value: "Instant", icon: "⚡" },
            { label: "Email + Calendar", value: "Automated", icon: "📧" },
            { label: "No Manual Work", value: "Zero", icon: "🚀" },
          ].map((stat, i) => (
            <div
              key={i}
              style={{
                textAlign: "center",
                animationDelay: `${i * 0.1}s`,
              }}
              className="animate-fade-in"
            >
              <div style={{ fontSize: "24px", marginBottom: "4px" }}>
                {stat.icon}
              </div>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "var(--primary-light)",
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--text-muted)",
                  marginTop: "2px",
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════ FEATURES ═══════════ */}
      <section style={{ background: "var(--bg-secondary)", padding: "80px 0" }}>
        <h2
          style={{
            textAlign: "center",
            fontSize: "36px",
            fontWeight: 800,
            marginBottom: "12px",
          }}
        >
          <span className="gradient-text">Everything Automated</span>
        </h2>
        <p
          style={{
            textAlign: "center",
            color: "var(--text-secondary)",
            fontSize: "16px",
            marginBottom: "48px",
          }}
        >
          From first conversation to calendar invite — fully AI-powered
        </p>

        <div className="features-grid">
          {[
            {
              icon: "💬",
              title: "Natural AI Conversations",
              desc: "No boring forms. Our AI talks to candidates like a real recruiter — warm, professional, and natural.",
            },
            {
              icon: "📅",
              title: "Smart Calendar Sync",
              desc: "Automatically checks recruiter availability on Google Calendar and suggests free slots.",
            },
            {
              icon: "📧",
              title: "Auto Email Notifications",
              desc: "Beautiful confirmation emails sent to both candidate and recruiter instantly.",
            },
            {
              icon: "🔗",
              title: "Google Meet Links",
              desc: "Auto-generates Google Meet video call links for every scheduled interview.",
            },
            {
              icon: "📄",
              title: "Resume Analysis",
              desc: "AI-powered resume parsing, skill extraction, and automatic summary generation.",
            },
            {
              icon: "📊",
              title: "JD Matching Score",
              desc: "Compare candidate skills with job requirements and get instant match percentage.",
            },
            {
              icon: "🔄",
              title: "Easy Reschedule/Cancel",
              desc: "Candidates can reschedule or cancel through natural conversation. Everything updates automatically.",
            },
            {
              icon: "📋",
              title: "Google Sheets Logging",
              desc: "Every interview is automatically logged in Google Sheets for easy tracking.",
            },
            {
              icon: "🎯",
              title: "Recruiter Dashboard",
              desc: "Real-time analytics, interview management, and candidate overview in one beautiful dashboard.",
            },
          ].map((feature, i) => (
            <div key={i} className="feature-card animate-fade-in">
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-desc">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════ WORKFLOW ═══════════ */}
      <section style={{ padding: "80px 40px", maxWidth: "900px", margin: "0 auto" }}>
        <h2
          style={{
            textAlign: "center",
            fontSize: "36px",
            fontWeight: 800,
            marginBottom: "48px",
          }}
        >
          <span className="gradient-text">How It Works</span>
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
          {[
            {
              step: "01",
              title: "Candidate Opens Chat",
              desc: "AI greets the candidate and starts a natural conversation",
              icon: "👋",
            },
            {
              step: "02",
              title: "Collects Information",
              desc: "Name, email, phone, role — all through friendly dialogue",
              icon: "📝",
            },
            {
              step: "03",
              title: "Checks Availability",
              desc: "Scans recruiter's calendar for free time slots",
              icon: "🔍",
            },
            {
              step: "04",
              title: "Candidate Picks Slot",
              desc: "Shows available times, candidate confirms their preference",
              icon: "✅",
            },
            {
              step: "05",
              title: "Everything Automated",
              desc: "Calendar event, Meet link, emails, sheet update — all instant",
              icon: "🚀",
            },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: "24px",
                alignItems: "flex-start",
                padding: "24px 0",
                borderLeft: "2px solid var(--border)",
                paddingLeft: "32px",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: "-14px",
                  width: "26px",
                  height: "26px",
                  borderRadius: "50%",
                  background: "var(--gradient-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "white",
                }}
              >
                {item.step}
              </div>
              <div style={{ fontSize: "28px" }}>{item.icon}</div>
              <div>
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: 700,
                    marginBottom: "4px",
                  }}
                >
                  {item.title}
                </h3>
                <p
                  style={{
                    fontSize: "14px",
                    color: "var(--text-secondary)",
                  }}
                >
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════ CTA ═══════════ */}
      <section
        style={{
          padding: "80px 40px",
          textAlign: "center",
          background: "var(--bg-secondary)",
        }}
      >
        <h2
          style={{
            fontSize: "32px",
            fontWeight: 800,
            marginBottom: "16px",
          }}
        >
          Ready to{" "}
          <span className="gradient-text">Transform</span> Your Hiring?
        </h2>
        <p
          style={{
            color: "var(--text-secondary)",
            marginBottom: "32px",
            fontSize: "16px",
          }}
        >
          Start scheduling interviews with AI — no manual work needed.
        </p>
        <Link href="/chat" className="hero-btn">
          <span>🚀</span> Try SmartHire Now
        </Link>
      </section>

      {/* Footer */}
      <footer
        style={{
          padding: "24px",
          textAlign: "center",
          borderTop: "1px solid var(--border)",
          color: "var(--text-muted)",
          fontSize: "13px",
        }}
      >
        Built with 🤖 AI • SmartHire © 2026
      </footer>
    </div>
  );
}
