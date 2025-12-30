const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

interface Agent {
  id: string
  name: string
  description?: string
  tool_count?: number
  execution_count?: number
}

interface AgentsListResponse {
  agents: Agent[]
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }

    return response.json()
  }

  agents = {
    list: async (): Promise<AgentsListResponse> => {
      return this.request<AgentsListResponse>('/agents')
    },

    get: async (id: string): Promise<Agent> => {
      return this.request<Agent>(`/agents/${id}`)
    },

    create: async (data: Partial<Agent>): Promise<Agent> => {
      return this.request<Agent>('/agents', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    },

    update: async (id: string, data: Partial<Agent>): Promise<Agent> => {
      return this.request<Agent>(`/agents/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
    },

    delete: async (id: string): Promise<void> => {
      return this.request<void>(`/agents/${id}`, {
        method: 'DELETE',
      })
    },
  }
}

export const api = new ApiClient(API_BASE_URL)
