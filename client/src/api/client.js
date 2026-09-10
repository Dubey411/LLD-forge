const API_BASE = '/api';

export const apiClient = {
  async getProblems() {
    const res = await fetch(`${API_BASE}/problems`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch problems');
    return data;
  },

  async getProblem(slug) {
    const res = await fetch(`${API_BASE}/problems/${slug}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch problem detail');
    return data;
  },

  async startAttempt(slug, userId = 'demo-user') {
    const res = await fetch(`${API_BASE}/problems/${slug}/attempts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId
      },
      body: JSON.stringify({ userId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to start attempt');
    return data.data;
  },

  async submitAttempt(attemptId, content, userId = 'demo-user') {
    const res = await fetch(`${API_BASE}/attempts/${attemptId}/submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId
      },
      body: JSON.stringify({ content, userId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit attempt');
    return data.data;
  },

  async getSubmission(submissionId) {
    const res = await fetch(`${API_BASE}/submissions/${submissionId}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch submission status');
    return data.data;
  },

  async getAttemptHistory(slug, userId = 'demo-user') {
    const res = await fetch(`${API_BASE}/problems/${slug}/attempts?userId=${encodeURIComponent(userId)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch attempt history');
    return data.data;
  }
};
