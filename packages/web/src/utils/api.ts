const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
}

async function request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(error.message || 'Request failed')
  }

  return response.json()
}

export const api = {
  agents: {
    list: () => request<{ agents: unknown[] }>('/api/agents'),
    get: (id: string) => request<{ agent: unknown }>(`/api/agents/${id}`),
    create: (data: unknown) => request<{ agent: unknown }>('/api/agents', { method: 'POST', body: data }),
    update: (id: string, data: unknown) => request<{ agent: unknown }>(`/api/agents/${id}`, { method: 'PUT', body: data }),
    delete: (id: string) => request<void>(`/api/agents/${id}`, { method: 'DELETE' }),
  },

  executions: {
    execute: (agentId: string, input: string) =>
      request<unknown>('/api/executions', { method: 'POST', body: { agentId, input } }),
    get: (id: string) => request<unknown>(`/api/executions/${id}`),
    list: (agentId?: string) =>
      request<{ executions: unknown[] }>(`/api/executions${agentId ? `?agentId=${agentId}` : ''}`),
  },

  tools: {
    list: () => request<{ tools: unknown[] }>('/api/tools'),
    get: (id: string) => request<unknown>(`/api/tools/${id}`),
  },

  marketplace: {
    list: () => request<{ listings: unknown[] }>('/api/marketplace'),
    get: (id: string) => request<unknown>(`/api/marketplace/${id}`),
    subscribe: (id: string) => request<void>(`/api/marketplace/${id}/subscribe`, { method: 'POST' }),
  },
}
