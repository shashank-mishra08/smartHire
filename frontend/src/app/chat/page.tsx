"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  slots?: string[];
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`);
  const [isStarted, setIsStarted] = useState(false);
  const [currentStage, setCurrentStage] = useState("greeting");
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      const container = messagesEndRef.current.parentElement;
      if (container) {
        container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
      }
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Auto-start conversation
  useEffect(() => {
    if (!isStarted) {
      startConversation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startConversation = async () => {
    setIsLoading(true);
    try {
      const response = await api.startChat(sessionId);
      if (response.message) {
        setMessages([
          {
            role: "assistant",
            content: response.message,
            timestamp: new Date().toISOString(),
          },
        ]);
        setCurrentStage(response.stage);
      }
      setIsStarted(true);
    } catch (error: any) {
      console.error("Failed to start chat:", error);
      // Fallback offline greeting
      setMessages([
        {
          role: "assistant",
          content: error?.message || "Hi there! 👋 Welcome to SmartHire!\n\nI'm your AI interview scheduling assistant. I'll help you book your interview in just a few minutes.\n\nLet's get started — what's your full name?",
          timestamp: new Date().toISOString(),
        },
      ]);
      setIsStarted(true);
    }
    setIsLoading(false);
    inputRef.current?.focus();
  };

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    // Add user message
    const userMsg: Message = {
      role: "user",
      content: trimmed,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await api.sendMessage(sessionId, trimmed);

      const aiMsg: Message = {
        role: "assistant",
        content: response.message,
        timestamp: new Date().toISOString(),
        slots: response.slots,
      };
      setMessages((prev) => [...prev, aiMsg]);
      setCurrentStage(response.stage);
    } catch (error: any) {
      console.error("Failed to send message:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: error.message || "Sorry, I'm having trouble connecting right now. Please make sure the backend server is running. 🔄",
          timestamp: new Date().toISOString(),
        },
      ]);
    }

    setIsLoading(false);
    inputRef.current?.focus();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      alert("Please upload a PDF file.");
      return;
    }

    setIsUploading(true);
    setMessages((prev) => [
      ...prev,
      { role: "user", content: `📎 Uploaded Resume: ${file.name}`, timestamp: new Date().toISOString() },
    ]);

    try {
      const response = await api.uploadResume(sessionId, file);
      const lastMsg = response.messages[response.messages.length - 1];
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: lastMsg.content, timestamp: lastMsg.timestamp },
      ]);
    } catch (error: any) {
      console.error("Failed to upload resume:", error);
      alert("Failed to upload resume.");
    }
    
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSlotClick = (slot: string) => {
    setInput(slot);
    // Auto-send after a tiny delay
    setTimeout(() => {
      const fakeInput = slot;
      setInput("");
      const userMsg: Message = {
        role: "user",
        content: fakeInput,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      api.sendMessage(sessionId, fakeInput).then((response) => {
        const aiMsg: Message = {
          role: "assistant",
          content: response.message,
          timestamp: new Date().toISOString(),
          slots: response.slots,
        };
        setMessages((prev) => [...prev, aiMsg]);
        setCurrentStage(response.stage);
        setIsLoading(false);
        inputRef.current?.focus();
      }).catch(() => {
        setIsLoading(false);
      });
    }, 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getStageLabel = () => {
    const stageMap: Record<string, string> = {
      greeting: "Getting Started",
      collecting_name: "Your Name",
      collecting_role: "Role",
      collecting_email: "Email",
      collecting_phone: "Phone",
      checking_availability: "Scheduling",
      selecting_slot: "Pick a Time",
      confirming: "Confirmation",
      scheduled: "Scheduled! ✅",
      resume_upload: "Resume",
      completed: "All Done! 🎉",
      rescheduling: "Rescheduling",
      cancelling: "Cancelling",
    };
    return stageMap[currentStage] || "Chat";
  };

  return (
    <div className="chat-container">
      {/* ═══════════ HEADER ═══════════ */}
      <div className="chat-header">
        <Link
          href="/"
          style={{
            color: "var(--text-secondary)",
            textDecoration: "none",
            fontSize: "20px",
            display: "flex",
            alignItems: "center",
          }}
        >
          ←
        </Link>

        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "var(--radius-full)",
            background: "var(--gradient-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
            boxShadow: "0 2px 8px rgba(99,102,241,0.3)",
          }}
        >
          🤖
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: "16px" }}>
            SmartHire AI
          </div>
          <div
            style={{
              fontSize: "12px",
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "var(--success)",
                display: "inline-block",
              }}
            />
            {getStageLabel()}
          </div>
        </div>

        {/* Progress Dots */}
        <div style={{ display: "flex", gap: "4px" }}>
          {[
            "collecting_name",
            "collecting_role",
            "collecting_email",
            "collecting_phone",
            "checking_availability",
            "scheduled",
          ].map((stage, i) => {
            const stages = [
              "greeting",
              "collecting_name",
              "collecting_role",
              "collecting_email",
              "collecting_phone",
              "checking_availability",
              "selecting_slot",
              "confirming",
              "scheduled",
              "completed",
            ];
            const currentIndex = stages.indexOf(currentStage);
            const stageIndex = stages.indexOf(stage);
            const isActive = stageIndex <= currentIndex;

            return (
              <div
                key={i}
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: isActive
                    ? "var(--primary)"
                    : "var(--border)",
                  transition: "all 0.3s ease",
                }}
              />
            );
          })}
        </div>
      </div>

      {/* ═══════════ MESSAGES ═══════════ */}
      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role === "assistant" ? "ai" : "user"}`}>
            <div className="message-avatar">
              {msg.role === "assistant" ? "🤖" : "👤"}
            </div>
            <div>
              <div className="message-bubble">{msg.content}</div>

              {/* Slot Cards */}
              {msg.slots && msg.slots.length > 0 && (
                <div className="slot-grid" style={{ marginTop: "12px" }}>
                  {msg.slots.map((slot, j) => (
                    <button
                      key={j}
                      className="slot-card"
                      onClick={() => handleSlotClick(slot)}
                      disabled={isLoading}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}

              <div
                style={{
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  marginTop: "6px",
                  paddingLeft: msg.role === "assistant" ? "4px" : "0",
                  textAlign: msg.role === "user" ? "right" : "left",
                }}
              >
                {new Date(msg.timestamp).toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isLoading && (
          <div className="message ai">
            <div className="message-avatar" style={{ background: "var(--gradient-primary)", boxShadow: "0 2px 8px rgba(99,102,241,0.3)" }}>
              🤖
            </div>
            <div className="typing-indicator">
              <div className="typing-dot" />
              <div className="typing-dot" />
              <div className="typing-dot" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ═══════════ INPUT ═══════════ */}
      <div className="chat-input-area">
        <div className="input-group">
          <input
            ref={inputRef}
            type="text"
            className="chat-input"
            placeholder={
              currentStage === "completed"
                ? "Interview scheduled! Type to ask questions..."
                : "Type your message..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading || isUploading}
            autoFocus
          />
          <input
            type="file"
            accept="application/pdf"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileUpload}
          />
          <button
            className="attach-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || isUploading}
            aria-label="Upload Resume"
            title="Upload Resume (PDF)"
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontSize: "18px",
              padding: "0 10px",
              color: "var(--text-muted)",
              transition: "color 0.2s"
            }}
          >
            📎
          </button>
          <button
            className="send-btn"
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            aria-label="Send message"
          >
            {isLoading ? (
              <span style={{ animation: "typing-bounce 0.6s ease-in-out infinite" }}>⏳</span>
            ) : (
              "➤"
            )}
          </button>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "8px",
            fontSize: "11px",
            color: "var(--text-muted)",
          }}
        >
          <span>Press Enter to send</span>
          <span>Powered by SmartHire AI</span>
        </div>
      </div>
    </div>
  );
}
