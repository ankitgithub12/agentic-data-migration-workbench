const API_BASE = '/api';

class ApiError extends Error {
  constructor(message, status, code, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorInfo = data.error || {};
    throw new ApiError(
      errorInfo.message || `Request failed with status ${response.status}`,
      response.status,
      errorInfo.code || 'UNKNOWN_ERROR',
      errorInfo.details
    );
  }

  return data;
}

export const api = {
  // Health
  getHealth: () => request('/health'),

  // Dashboard stats
  getDashboardStats: () => request('/dashboard/stats'),

  // Projects
  getProjects: () => request('/projects'),
  getProjectById: (id) => request(`/projects/${id}`),
  createProject: (payload) => request('/projects', { method: 'POST', body: JSON.stringify(payload) }),
  getProjectHistory: (id) => request(`/projects/${id}/history`),
  injectChaosDataset: (id) => request(`/projects/${id}/chaos-dataset`, { method: 'POST' }),

  // AI & Plans
  runAIAnalysis: (projectId) => request(`/projects/${projectId}/ai/analyze`, { method: 'POST' }),
  getPlansByProject: (projectId) => request(`/projects/${projectId}/plans`),
  getPlanById: (planId) => request(`/plans/${planId}`),
  updatePlan: (planId, payload) => request(`/plans/${planId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  approvePlan: (planId, payload) => request(`/plans/${planId}/approve`, { method: 'POST', body: JSON.stringify(payload) }),
  rejectPlan: (planId, payload) => request(`/plans/${planId}/reject`, { method: 'POST', body: JSON.stringify(payload) }),

  // Dry Run & Execution
  runDryRun: (planId, user = 'HUMAN_OPERATOR') =>
    request(`/plans/${planId}/dry-run`, { method: 'POST', body: JSON.stringify({ user }) }),
  executeMigration: (planId, user = 'HUMAN_OPERATOR') =>
    request(`/plans/${planId}/execute`, { method: 'POST', body: JSON.stringify({ user }) }),

  // Runs & Quarantine
  getRunById: (runId) => request(`/runs/${runId}`),
  getRecentRuns: () => request('/runs/recent'),
  rollbackRun: (runId, user = 'HUMAN_OPERATOR') =>
    request(`/runs/${runId}/rollback`, { method: 'POST', body: JSON.stringify({ user }) }),
  getQuarantineRecords: (runId, page = 1, limit = 50) =>
    request(`/runs/${runId}/quarantine?page=${page}&limit=${limit}`),
};
