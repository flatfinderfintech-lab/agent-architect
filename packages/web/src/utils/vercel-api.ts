import type { Deployment, DeploymentStatus, DnsRecord } from '@/types/deployment'

const VERCEL_API_URL = 'https://api.vercel.com'

interface VercelConfig {
  token: string
  teamId?: string
}

interface VercelDeploymentResponse {
  id: string
  url: string
  readyState: 'QUEUED' | 'BUILDING' | 'INITIALIZING' | 'READY' | 'ERROR' | 'CANCELED'
  buildingAt?: number
  ready?: number
  error?: { message: string }
  meta?: Record<string, unknown>
}

interface VercelProjectResponse {
  id: string
  name: string
  link?: {
    deployHooks: Array<{ id: string; name: string; url: string }>
  }
}

interface VercelDomainResponse {
  name: string
  apexName: string
  verified: boolean
  verification?: Array<{ type: string; domain: string; value: string; reason: string }>
  configured: boolean
  error?: { code: string; message: string }
}

// Map Vercel status to our status
function mapVercelStatus(status: VercelDeploymentResponse['readyState']): DeploymentStatus {
  switch (status) {
    case 'QUEUED':
    case 'INITIALIZING':
      return 'pending'
    case 'BUILDING':
      return 'building'
    case 'READY':
      return 'ready'
    case 'ERROR':
      return 'error'
    case 'CANCELED':
      return 'canceled'
    default:
      return 'pending'
  }
}

// Store token in localStorage
export function setVercelToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('vercel_token', token)
  }
}

export function getVercelToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('vercel_token')
  }
  return null
}

export function clearVercelToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('vercel_token')
  }
}

// API request helper
async function vercelRequest<T>(
  endpoint: string,
  config: VercelConfig,
  options: RequestInit = {}
): Promise<T> {
  const url = new URL(`${VERCEL_API_URL}${endpoint}`)
  if (config.teamId) {
    url.searchParams.set('teamId', config.teamId)
  }

  const response = await fetch(url.toString(), {
    ...options,
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Request failed' } }))
    throw new Error(error.error?.message || 'Vercel API request failed')
  }

  return response.json()
}

// Create a new Vercel project
export async function createVercelProject(
  name: string,
  config: VercelConfig
): Promise<VercelProjectResponse> {
  return vercelRequest<VercelProjectResponse>('/v9/projects', config, {
    method: 'POST',
    body: JSON.stringify({
      name,
      framework: 'nextjs',
    }),
  })
}

// Deploy files to Vercel
export async function deployToVercel(
  projectName: string,
  files: Array<{ file: string; data: string }>,
  envVars: Record<string, string>,
  config: VercelConfig,
  onProgress?: (status: string) => void
): Promise<{ deployment: Deployment; vercelId: string }> {
  onProgress?.('Creating project...')

  // Create or get project
  let project: VercelProjectResponse
  try {
    project = await createVercelProject(projectName, config)
  } catch (error) {
    // Project might already exist, try to get it
    project = await vercelRequest<VercelProjectResponse>(
      `/v9/projects/${encodeURIComponent(projectName)}`,
      config
    )
  }

  onProgress?.('Setting environment variables...')

  // Set environment variables
  for (const [key, value] of Object.entries(envVars)) {
    if (value) {
      try {
        await vercelRequest(`/v10/projects/${project.id}/env`, config, {
          method: 'POST',
          body: JSON.stringify({
            key,
            value,
            type: key.startsWith('NEXT_PUBLIC_') ? 'plain' : 'encrypted',
            target: ['production', 'preview', 'development'],
          }),
        })
      } catch {
        // Env var might already exist, update it
        await vercelRequest(`/v10/projects/${project.id}/env/${key}`, config, {
          method: 'PATCH',
          body: JSON.stringify({
            value,
            type: key.startsWith('NEXT_PUBLIC_') ? 'plain' : 'encrypted',
            target: ['production', 'preview', 'development'],
          }),
        })
      }
    }
  }

  onProgress?.('Uploading files...')

  // Create deployment
  const deploymentResponse = await vercelRequest<VercelDeploymentResponse>(
    '/v13/deployments',
    config,
    {
      method: 'POST',
      body: JSON.stringify({
        name: projectName,
        files: files.map((f) => ({
          file: f.file,
          data: Buffer.from(f.data).toString('base64'),
          encoding: 'base64',
        })),
        project: project.id,
        target: 'production',
      }),
    }
  )

  const deployment: Deployment = {
    id: deploymentResponse.id,
    projectId: project.id,
    status: mapVercelStatus(deploymentResponse.readyState),
    url: `https://${deploymentResponse.url}`,
    buildLogs: [],
    createdAt: new Date(),
    vercelProjectId: project.id,
    vercelDeploymentId: deploymentResponse.id,
  }

  return { deployment, vercelId: deploymentResponse.id }
}

// Deploy from GitHub
export async function deployFromGitHub(
  repoUrl: string,
  branch: string,
  envVars: Record<string, string>,
  config: VercelConfig,
  onProgress?: (status: string) => void
): Promise<{ deployment: Deployment; vercelId: string }> {
  onProgress?.('Parsing repository info...')

  // Parse GitHub URL
  const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/)
  if (!match) {
    throw new Error('Invalid GitHub repository URL')
  }
  const [, owner, repo] = match
  const projectName = repo.replace('.git', '')

  onProgress?.('Creating Vercel project...')

  // Create project with Git integration
  const project = await vercelRequest<VercelProjectResponse>('/v9/projects', config, {
    method: 'POST',
    body: JSON.stringify({
      name: projectName,
      gitRepository: {
        type: 'github',
        repo: `${owner}/${projectName}`,
        sourceless: true,
        productionBranch: branch,
      },
      framework: 'nextjs',
    }),
  })

  onProgress?.('Setting environment variables...')

  // Set environment variables
  for (const [key, value] of Object.entries(envVars)) {
    if (value) {
      try {
        await vercelRequest(`/v10/projects/${project.id}/env`, config, {
          method: 'POST',
          body: JSON.stringify({
            key,
            value,
            type: key.startsWith('NEXT_PUBLIC_') ? 'plain' : 'encrypted',
            target: ['production', 'preview', 'development'],
          }),
        })
      } catch {
        // Ignore if already exists
      }
    }
  }

  onProgress?.('Triggering deployment...')

  // Trigger deployment
  const deploymentResponse = await vercelRequest<VercelDeploymentResponse>(
    '/v13/deployments',
    config,
    {
      method: 'POST',
      body: JSON.stringify({
        name: projectName,
        gitSource: {
          type: 'github',
          ref: branch,
          repoId: `${owner}/${projectName}`,
        },
        project: project.id,
        target: 'production',
      }),
    }
  )

  const deployment: Deployment = {
    id: deploymentResponse.id,
    projectId: project.id,
    status: mapVercelStatus(deploymentResponse.readyState),
    url: `https://${deploymentResponse.url}`,
    buildLogs: [],
    createdAt: new Date(),
    vercelProjectId: project.id,
    vercelDeploymentId: deploymentResponse.id,
  }

  return { deployment, vercelId: deploymentResponse.id }
}

// Get deployment status
export async function getDeploymentStatus(
  deploymentId: string,
  config: VercelConfig
): Promise<{ status: DeploymentStatus; url?: string; error?: string }> {
  const response = await vercelRequest<VercelDeploymentResponse>(
    `/v13/deployments/${deploymentId}`,
    config
  )

  return {
    status: mapVercelStatus(response.readyState),
    url: response.url ? `https://${response.url}` : undefined,
    error: response.error?.message,
  }
}

// Get deployment logs
export async function getDeploymentLogs(
  deploymentId: string,
  config: VercelConfig
): Promise<string[]> {
  const response = await vercelRequest<{ logs: Array<{ text: string }> }>(
    `/v2/deployments/${deploymentId}/events`,
    config
  )

  return response.logs?.map((l) => l.text) || []
}

// Poll deployment status until complete
export async function pollDeploymentStatus(
  deploymentId: string,
  config: VercelConfig,
  onUpdate: (status: DeploymentStatus, logs: string[]) => void,
  maxAttempts = 60,
  intervalMs = 5000
): Promise<{ status: DeploymentStatus; url?: string; error?: string }> {
  let attempts = 0

  while (attempts < maxAttempts) {
    const status = await getDeploymentStatus(deploymentId, config)
    const logs = await getDeploymentLogs(deploymentId, config).catch(() => [])

    onUpdate(status.status, logs)

    if (status.status === 'ready' || status.status === 'error' || status.status === 'canceled') {
      return status
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs))
    attempts++
  }

  return { status: 'error', error: 'Deployment timed out' }
}

// Add custom domain
export async function addCustomDomain(
  projectId: string,
  domain: string,
  config: VercelConfig
): Promise<{ domain: string; verified: boolean; dnsRecords: DnsRecord[] }> {
  const response = await vercelRequest<VercelDomainResponse>(
    `/v9/projects/${projectId}/domains`,
    config,
    {
      method: 'POST',
      body: JSON.stringify({ name: domain }),
    }
  )

  const dnsRecords: DnsRecord[] = []

  if (response.verification) {
    for (const v of response.verification) {
      if (v.type === 'TXT') {
        dnsRecords.push({ type: 'TXT', name: v.domain, value: v.value })
      }
    }
  }

  // Add A record for apex domain or CNAME for subdomain
  if (domain.split('.').length === 2) {
    dnsRecords.push({ type: 'A', name: '@', value: '76.76.21.21' })
  } else {
    dnsRecords.push({ type: 'CNAME', name: domain.split('.')[0], value: 'cname.vercel-dns.com' })
  }

  return {
    domain: response.name,
    verified: response.verified,
    dnsRecords,
  }
}

// Verify custom domain
export async function verifyCustomDomain(
  projectId: string,
  domain: string,
  config: VercelConfig
): Promise<{ verified: boolean; error?: string }> {
  try {
    const response = await vercelRequest<VercelDomainResponse>(
      `/v9/projects/${projectId}/domains/${domain}/verify`,
      config,
      { method: 'POST' }
    )

    return { verified: response.verified || response.configured }
  } catch (error) {
    return { verified: false, error: error instanceof Error ? error.message : 'Verification failed' }
  }
}

// Remove custom domain
export async function removeCustomDomain(
  projectId: string,
  domain: string,
  config: VercelConfig
): Promise<void> {
  await vercelRequest(`/v9/projects/${projectId}/domains/${domain}`, config, {
    method: 'DELETE',
  })
}

// Get project domains
export async function getProjectDomains(
  projectId: string,
  config: VercelConfig
): Promise<Array<{ name: string; verified: boolean }>> {
  const response = await vercelRequest<{ domains: VercelDomainResponse[] }>(
    `/v9/projects/${projectId}/domains`,
    config
  )

  return response.domains.map((d) => ({
    name: d.name,
    verified: d.verified,
  }))
}

// Validate Vercel token
export async function validateToken(token: string): Promise<{ valid: boolean; error?: string }> {
  try {
    await vercelRequest<{ user: unknown }>('/v2/user', { token })
    return { valid: true }
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : 'Invalid token' }
  }
}
