const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * API client for SmartHire backend
 */
export const api = {
  /**
   * Start a new chat session
   */
  async startChat(sessionId: string) {
    const res = await fetch(`${API_BASE}/chat/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });
    return res.json();
  },

  /**
   * Send a chat message
   */
  async sendMessage(sessionId: string, message: string) {
    const res = await fetch(`${API_BASE}/chat/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, message }),
    });
    return res.json();
  },

  /**
   * Get conversation history
   */
  async getConversation(sessionId: string) {
    const res = await fetch(`${API_BASE}/chat/${sessionId}`);
    return res.json();
  },

  /**
   * Get dashboard stats
   */
  async getDashboardStats() {
    const res = await fetch(`${API_BASE}/dashboard/stats`);
    return res.json();
  },

  /**
   * Get interviews list
   */
  async getInterviews(status?: string, page?: number) {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (page) params.set('page', String(page));
    const res = await fetch(`${API_BASE}/dashboard/interviews?${params}`);
    return res.json();
  },

  /**
   * Get recent interviews
   */
  async getRecentInterviews() {
    const res = await fetch(`${API_BASE}/dashboard/interviews/recent`);
    return res.json();
  },

  /**
   * Get candidates list
   */
  async getCandidates() {
    const res = await fetch(`${API_BASE}/dashboard/candidates`);
    return res.json();
  },

  /**
   * Update interview status
   */
  async updateInterviewStatus(id: string, status: string) {
    const res = await fetch(`${API_BASE}/dashboard/interviews/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return res.json();
  },

  /**
   * Check Calendar connection status
   */
  async checkCalendarStatus() {
    const res = await fetch(`${API_BASE}/auth/calendar/status`);
    return res.json();
  },
};
