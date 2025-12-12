'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { api } from '@/utils/api'
import Link from 'next/link'

export default function DashboardPage() {
  const { user, isLoaded } = useUser()
  const [agents, setAgents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isLoaded && user) {
      loadAgents()
    }
  }, [isLoaded, user])

  const loadAgents = async () => {
    try {
      const data = await api.agents.list()
      setAgents(data.agents || [])
    } catch (error) {
      console.error('Failed to load agents:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in</h1>
          <Link href="/">
            <Button>Go to Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <div className="flex gap-4">
              <Link href="/deploy">
                <Button>Deploy Project</Button>
              </Link>
              <Link href="/agents/new">
                <Button variant="outline">Create Agent</Button>
              </Link>
              <Link href="/marketplace">
                <Button variant="outline">Marketplace</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Your Agents</h2>

          {agents.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-600 mb-4">You haven't created any agents yet.</p>
              <Link href="/agents/new">
                <Button>Create Your First Agent</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agents.map((agent) => (
                <div key={agent.id} className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-xl font-semibold mb-2">{agent.name}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {agent.description || 'No description'}
                  </p>
                  <div className="flex gap-2 text-sm text-gray-500 mb-4">
                    <span>{agent.tool_count || 0} tools</span>
                    <span>•</span>
                    <span>{agent.execution_count || 0} executions</span>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/agents/${agent.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        View
                      </Button>
                    </Link>
                    <Link href={`/agents/${agent.id}/edit`} className="flex-1">
                      <Button className="w-full">Edit</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
