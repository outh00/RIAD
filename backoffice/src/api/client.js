const BASE_URL = 'http://localhost:3001/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  const data = await res.json()
  if (!res.ok) throw { status: res.status, ...data }
  return data
}

export const api = {
  agents: {
    list: () => request('/agents'),
    get: (id) => request(`/agents/${id}`),
    update: (id, body) => request(`/agents/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    services: (id) => request(`/agents/${id}/services`),
    academy: (id) => request(`/academy/agent/${id}`),
  },
  transactions: {
    list: (params = {}) => {
      const q = new URLSearchParams(params).toString()
      return request(`/transactions${q ? '?' + q : ''}`)
    },
    stats: () => request('/transactions/stats/global'),
  },
  services: {
    list: () => request('/services'),
    create: (body) => request('/services', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => request(`/services/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id) => request(`/services/${id}`, { method: 'DELETE' }),
  },
  academy: {
    list: () => request('/academy'),
    module: (id) => request(`/academy/modules/${id}`),
    update: (id, body) => request(`/academy/modules/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  },
  notifications: {
    send: (body) => request('/notifications', { method: 'POST', body: JSON.stringify(body) }),
    delete: (id) => request(`/notifications/${id}`, { method: 'DELETE' }),
    list: (agentId) => request(`/notifications/${agentId}`),
  },
  objectives: {
    all: () => request('/objectives'),
    createBO: (body) => request('/objectives/bo', { method: 'POST', body: JSON.stringify(body) }),
    delete: (id) => request(`/objectives/${id}`, { method: 'DELETE' }),
  },
}
