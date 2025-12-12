// Project Types
export interface Project {
  id: string
  name: string
  description?: string
  source: 'upload' | 'github'
  githubUrl?: string
  createdAt: Date
  updatedAt: Date
  userId: string
  files: ProjectFile[]
  envVars: EnvVariable[]
  deployments: Deployment[]
}

export interface ProjectFile {
  id: string
  name: string
  path: string
  size: number
  type: string
  content?: string
}

// Environment Variable Types
export type EnvCategory =
  | 'database'
  | 'authentication'
  | 'api_keys'
  | 'storage'
  | 'email'
  | 'analytics'
  | 'payment'
  | 'other'

export interface EnvVariable {
  id: string
  key: string
  value: string
  category: EnvCategory
  description: string
  required: boolean
  detected: boolean
  service?: ServiceInfo
}

export interface ServiceInfo {
  name: string
  icon?: string
  docUrl: string
  signupUrl: string
  description: string
}

// Service Detection
export interface DetectedService {
  name: string
  envVars: string[]
  category: EnvCategory
  setupUrl: string
  description: string
}

// Deployment Types
export type DeploymentStatus =
  | 'pending'
  | 'building'
  | 'deploying'
  | 'ready'
  | 'error'
  | 'canceled'

export interface Deployment {
  id: string
  projectId: string
  status: DeploymentStatus
  url?: string
  buildLogs: string[]
  createdAt: Date
  completedAt?: Date
  error?: string
  vercelProjectId?: string
  vercelDeploymentId?: string
  customDomain?: string
}

export interface DeploymentLog {
  timestamp: Date
  type: 'info' | 'warning' | 'error' | 'success'
  message: string
}

// Custom Domain Types
export interface CustomDomain {
  id: string
  domain: string
  projectId: string
  status: 'pending' | 'verified' | 'error'
  dnsRecords: DnsRecord[]
  createdAt: Date
  verifiedAt?: Date
}

export interface DnsRecord {
  type: 'A' | 'CNAME' | 'TXT'
  name: string
  value: string
}

// GitHub Types
export interface GitHubRepo {
  owner: string
  name: string
  fullName: string
  defaultBranch: string
  branches: GitHubBranch[]
  isPrivate: boolean
}

export interface GitHubBranch {
  name: string
  sha: string
}

// Wizard State
export interface WizardState {
  currentStep: number
  totalSteps: number
  categories: EnvCategory[]
  currentCategory: EnvCategory
  completedCategories: EnvCategory[]
}

// Store State
export interface DeploymentStore {
  projects: Project[]
  currentProject: Project | null
  deployments: Deployment[]
  isLoading: boolean
  error: string | null

  // Actions
  setCurrentProject: (project: Project | null) => void
  addProject: (project: Project) => void
  updateProject: (id: string, updates: Partial<Project>) => void
  deleteProject: (id: string) => void
  addDeployment: (deployment: Deployment) => void
  updateDeployment: (id: string, updates: Partial<Deployment>) => void
}
