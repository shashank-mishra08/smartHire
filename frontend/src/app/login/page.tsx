"use client";

import Link from "next/link";

export default function LoginPage() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background glow effects */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          right: "20%",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)",
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "20%",
          left: "15%",
          width: "350px",
          height: "350px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 70%)",
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />

      <div
        className="animate-slide-up"
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: "440px",
          padding: "0 24px",
        }}
      >
        {/* Card */}
        <div
          className="glass-card"
          style={{
            padding: "48px 40px",
            textAlign: "center",
          }}
        >
          {/* Logo */}
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "var(--radius-lg)",
              background: "var(--gradient-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "32px",
              margin: "0 auto 24px",
              boxShadow: "0 8px 32px rgba(99,102,241,0.3)",
            }}
          >
            🤖
          </div>

          <h1
            style={{
              fontSize: "28px",
              fontWeight: 800,
              marginBottom: "8px",
            }}
          >
            <span className="gradient-text">SmartHire</span>
          </h1>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "15px",
              marginBottom: "40px",
              lineHeight: 1.6,
            }}
          >
            Recruiter Portal — Sign in to manage interviews, candidates, and scheduling.
          </p>

          {/* Google Sign-In Button */}
          <a
            href={`${apiBase}/auth/google`}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              width: "100%",
              padding: "14px 24px",
              borderRadius: "var(--radius-md)",
              background: "#ffffff",
              color: "#1f2937",
              fontSize: "15px",
              fontWeight: 600,
              textDecoration: "none",
              transition: "all 0.2s ease",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              border: "1px solid #e5e7eb",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.2)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {/* Google Logo SVG */}
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
            Sign in with Google
          </a>

          {/* Divider */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              margin: "32px 0",
            }}
          >
            <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              SECURE LOGIN
            </span>
            <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
          </div>

          {/* Info */}
          <div
            style={{
              background: "rgba(99,102,241,0.06)",
              border: "1px solid rgba(99,102,241,0.15)",
              borderRadius: "var(--radius-md)",
              padding: "16px",
              textAlign: "left",
            }}
          >
            <p
              style={{
                fontSize: "13px",
                color: "var(--text-secondary)",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              🔒 Only authorized recruiter accounts can access the dashboard.
              Your Google account is used for calendar integration and authentication.
            </p>
          </div>
        </div>

        {/* Back to Home link */}
        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <Link
            href="/"
            style={{
              color: "var(--text-muted)",
              fontSize: "14px",
              textDecoration: "none",
              transition: "color 0.2s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = "var(--primary-light)")}
            onMouseOut={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
