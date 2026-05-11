const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  const data = await res.json()
  if (!res.ok) throw { status: res.status, ...data }
  return data
}

// Agent ID actif (à remplacer par un contexte/store si multi-agent)
export const AGENT_ID = 'es_001'

export const api = {
  agent: {
    get: () => request(`/agents/${AGENT_ID}`),
    services: () => request(`/agents/${AGENT_ID}/services`),
  },
  transactions: {
    list: () => request(`/transactions/agent/${AGENT_ID}`),
    create: (body) => request('/transactions', { method: 'POST', body: JSON.stringify(body) }),
  },
  services: {
    list: () => request('/services?active=true'),
    activate: (serviceId) =>
      request(`/services/${serviceId}/activate`, {
        method: 'POST',
        body: JSON.stringify({ agentId: AGENT_ID }),
      }),
  },
  academy: {
    list: () => request(`/academy/agent/${AGENT_ID}`),
    module: (moduleId) => request(`/academy/modules/${moduleId}`),
    markWatched: (moduleId) =>
      request(`/academy/modules/${moduleId}/progress`, {
        method: 'POST',
        body: JSON.stringify({ agentId: AGENT_ID }),
      }),
    submitQcm: (moduleId, answers) =>
      request(`/academy/modules/${moduleId}/qcm`, {
        method: 'POST',
        body: JSON.stringify({ agentId: AGENT_ID, answers }),
      }),
  },
  notifications: {
    list: () => request(`/notifications/${AGENT_ID}`),
    markRead: (id) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
    markAllRead: () => request(`/notifications/agent/${AGENT_ID}/read-all`, { method: 'PATCH' }),
  },
  analytics: {
    crosssell: () => request(`/analytics/crosssell/${AGENT_ID}`),
  },
  objectives: {
    list: () => request(`/objectives/agent/${AGENT_ID}`),
    create: (body) => request(`/objectives/agent/${AGENT_ID}`, { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => request(`/objectives/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id) => request(`/objectives/${id}`, { method: 'DELETE' }),
  },
  config: {
    get: () => request('/config'),
  },
}
