const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

/**
 * API client for SmartHire backend
 * All requests include credentials for cookie-based auth
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
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || data.error || 'Failed to start chat');
    }
    return data;
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
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || data.error || 'Failed to send message');
    }
    return data;
  },

  /**
   * Get conversation history
   */
  async getConversation(sessionId: string) {
    const res = await fetch(`${API_BASE}/chat/${sessionId}`);
    return res.json();
  },

  /**
   * Upload resume
   */
  async uploadResume(sessionId: string, file: File) {
    const formData = new FormData();
    formData.append('resume', file);

    const res = await fetch(`${API_BASE}/chat/${sessionId}/resume`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || data.error || 'Failed to upload resume');
    }
    return data;
  },

  /**
   * Get dashboard stats (requires auth)
   */
  async getDashboardStats() {
    const res = await fetch(`${API_BASE}/dashboard/stats`, { credentials: 'include' });
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    return res.json();
  },

  /**
   * Get interviews list (requires auth)
   */
  async getInterviews(status?: string, page?: number) {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (page) params.set('page', String(page));
    const res = await fetch(`${API_BASE}/dashboard/interviews?${params}`, { credentials: 'include' });
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    return res.json();
  },

  /**
   * Get recent interviews (requires auth)
   */
  async getRecentInterviews() {
    const res = await fetch(`${API_BASE}/dashboard/interviews/recent`, { credentials: 'include' });
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    return res.json();
  },

  /**
   * Get candidates list (requires auth)
   */
  async getCandidates() {
    const res = await fetch(`${API_BASE}/dashboard/candidates`, { credentials: 'include' });
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    return res.json();
  },

  /**
   * Update interview status (requires auth)
   */
  async updateInterviewStatus(id: string, status: string) {
    const res = await fetch(`${API_BASE}/dashboard/interviews/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status }),
    });
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    return res.json();
  },

  /**
   * Check Calendar connection status
   */
  async checkCalendarStatus() {
    const res = await fetch(`${API_BASE}/auth/calendar/status`, { credentials: 'include' });
    return res.json();
  },

  /**
   * Get current logged-in recruiter (auth check)
   */
  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, { credentials: 'include' });
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    return res.json();
  },

  /**
   * Logout
   */
  async logout() {
    const res = await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    return res.json();
  },
};
