import { render, screen, waitFor } from '@testing-library/react'
import { useUser } from '@clerk/nextjs'
import DashboardPage from '../page'
import { api } from '@/lib/api'

// Mock the Clerk useUser hook
jest.mock('@clerk/nextjs', () => ({
  useUser: jest.fn(),
}))

// Mock the api module
jest.mock('@/lib/api', () => ({
  api: {
    agents: {
      list: jest.fn(),
    },
  },
}))

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>
  }
})

describe('DashboardPage', () => {
  const mockUseUser = useUser as jest.MockedFunction<typeof useUser>
  const mockApiAgentsList = api.agents.list as jest.MockedFunction<typeof api.agents.list>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should show loading state when Clerk is not loaded', () => {
    mockUseUser.mockReturnValue({
      isLoaded: false,
      user: null,
      isSignedIn: false,
    } as any)

    render(<DashboardPage />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('should show loading state while fetching agents', () => {
    mockUseUser.mockReturnValue({
      isLoaded: true,
      user: { id: '123', emailAddresses: [{ emailAddress: 'test@example.com' }] },
      isSignedIn: true,
    } as any)

    mockApiAgentsList.mockReturnValue(new Promise(() => {})) // Never resolves

    render(<DashboardPage />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('should redirect to sign in when user is not authenticated', async () => {
    mockUseUser.mockReturnValue({
      isLoaded: true,
      user: null,
      isSignedIn: false,
    } as any)

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Please sign in')).toBeInTheDocument()
      expect(screen.getByText('Go to Home')).toBeInTheDocument()
    })
  })

  it('should load and display agents successfully', async () => {
    const mockAgents = [
      {
        id: '1',
        name: 'Test Agent 1',
        description: 'A test agent',
        tool_count: 5,
        execution_count: 10,
      },
      {
        id: '2',
        name: 'Test Agent 2',
        description: 'Another test agent',
        tool_count: 3,
        execution_count: 7,
      },
    ]

    mockUseUser.mockReturnValue({
      isLoaded: true,
      user: { id: '123', emailAddresses: [{ emailAddress: 'test@example.com' }] },
      isSignedIn: true,
    } as any)

    mockApiAgentsList.mockResolvedValue({ agents: mockAgents })

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Test Agent 1')).toBeInTheDocument()
      expect(screen.getByText('Test Agent 2')).toBeInTheDocument()
      expect(screen.getByText('A test agent')).toBeInTheDocument()
      expect(screen.getByText('Another test agent')).toBeInTheDocument()
      expect(screen.getByText('5 tools')).toBeInTheDocument()
      expect(screen.getByText('10 executions')).toBeInTheDocument()
    })
  })

  it('should show empty state when no agents exist', async () => {
    mockUseUser.mockReturnValue({
      isLoaded: true,
      user: { id: '123', emailAddresses: [{ emailAddress: 'test@example.com' }] },
      isSignedIn: true,
    } as any)

    mockApiAgentsList.mockResolvedValue({ agents: [] })

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText("You haven't created any agents yet.")).toBeInTheDocument()
      expect(screen.getByText('Create Your First Agent')).toBeInTheDocument()
    })
  })

  it('should handle API errors gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    mockUseUser.mockReturnValue({
      isLoaded: true,
      user: { id: '123', emailAddresses: [{ emailAddress: 'test@example.com' }] },
      isSignedIn: true,
    } as any)

    const error = new Error('Failed to fetch agents')
    mockApiAgentsList.mockRejectedValue(error)

    render(<DashboardPage />)

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load agents:', error)
      // Should show empty state after error
      expect(screen.getByText("You haven't created any agents yet.")).toBeInTheDocument()
    })

    consoleErrorSpy.mockRestore()
  })

  it('should only call loadAgents when user is loaded and authenticated', async () => {
    // Start with user not loaded
    mockUseUser.mockReturnValue({
      isLoaded: false,
      user: null,
      isSignedIn: false,
    } as any)

    const { rerender } = render(<DashboardPage />)
    expect(mockApiAgentsList).not.toHaveBeenCalled()

    // Update to loaded but no user
    mockUseUser.mockReturnValue({
      isLoaded: true,
      user: null,
      isSignedIn: false,
    } as any)

    rerender(<DashboardPage />)
    expect(mockApiAgentsList).not.toHaveBeenCalled()

    // Update to loaded with user
    mockUseUser.mockReturnValue({
      isLoaded: true,
      user: { id: '123', emailAddresses: [{ emailAddress: 'test@example.com' }] },
      isSignedIn: true,
    } as any)

    mockApiAgentsList.mockResolvedValue({ agents: [] })

    rerender(<DashboardPage />)

    await waitFor(() => {
      expect(mockApiAgentsList).toHaveBeenCalledTimes(1)
    })
  })

  it('should display correct number of agents in grid', async () => {
    const mockAgents = Array.from({ length: 6 }, (_, i) => ({
      id: `${i + 1}`,
      name: `Agent ${i + 1}`,
      description: `Description ${i + 1}`,
      tool_count: i,
      execution_count: i * 2,
    }))

    mockUseUser.mockReturnValue({
      isLoaded: true,
      user: { id: '123', emailAddresses: [{ emailAddress: 'test@example.com' }] },
      isSignedIn: true,
    } as any)

    mockApiAgentsList.mockResolvedValue({ agents: mockAgents })

    render(<DashboardPage />)

    await waitFor(() => {
      mockAgents.forEach((agent) => {
        expect(screen.getByText(agent.name)).toBeInTheDocument()
      })
    })
  })

  it('should render dashboard header with correct title', async () => {
    mockUseUser.mockReturnValue({
      isLoaded: true,
      user: { id: '123', emailAddresses: [{ emailAddress: 'test@example.com' }] },
      isSignedIn: true,
    } as any)

    mockApiAgentsList.mockResolvedValue({ agents: [] })

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Your Agents')).toBeInTheDocument()
    })
  })

  it('should render navigation buttons in header', async () => {
    mockUseUser.mockReturnValue({
      isLoaded: true,
      user: { id: '123', emailAddresses: [{ emailAddress: 'test@example.com' }] },
      isSignedIn: true,
    } as any)

    mockApiAgentsList.mockResolvedValue({ agents: [] })

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Create Agent')).toBeInTheDocument()
      expect(screen.getByText('Marketplace')).toBeInTheDocument()
    })
  })
})
