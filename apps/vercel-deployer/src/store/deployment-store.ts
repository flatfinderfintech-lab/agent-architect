import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Project, Deployment, EnvVariable, DeploymentStore } from '@/types/deployment'

interface ExtendedDeploymentStore extends DeploymentStore {
  // Additional state
  vercelToken: string | null

  // Additional actions
  setVercelToken: (token: string | null) => void
  clearAll: () => void
  getProjectById: (id: string) => Project | undefined
  getDeploymentsByProject: (projectId: string) => Deployment[]
  updateEnvVars: (projectId: string, envVars: EnvVariable[]) => void
}

export const useDeploymentStore = create<ExtendedDeploymentStore>()(
  persist(
    (set, get) => ({
      // State
      projects: [],
      currentProject: null,
      deployments: [],
      isLoading: false,
      error: null,
      vercelToken: null,

      // Actions
      setCurrentProject: (project) => set({ currentProject: project }),

      addProject: (project) =>
        set((state) => ({
          projects: [...state.projects, project],
          currentProject: project,
        })),

      updateProject: (id, updates) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
          ),
          currentProject:
            state.currentProject?.id === id
              ? { ...state.currentProject, ...updates, updatedAt: new Date() }
              : state.currentProject,
        })),

      deleteProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          deployments: state.deployments.filter((d) => d.projectId !== id),
          currentProject: state.currentProject?.id === id ? null : state.currentProject,
        })),

      addDeployment: (deployment) =>
        set((state) => ({
          deployments: [...state.deployments, deployment],
        })),

      updateDeployment: (id, updates) =>
        set((state) => ({
          deployments: state.deployments.map((d) =>
            d.id === id ? { ...d, ...updates } : d
          ),
        })),

      setVercelToken: (token) => set({ vercelToken: token }),

      clearAll: () =>
        set({
          projects: [],
          currentProject: null,
          deployments: [],
          error: null,
        }),

      getProjectById: (id) => get().projects.find((p) => p.id === id),

      getDeploymentsByProject: (projectId) =>
        get().deployments.filter((d) => d.projectId === projectId),

      updateEnvVars: (projectId, envVars) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId ? { ...p, envVars, updatedAt: new Date() } : p
          ),
          currentProject:
            state.currentProject?.id === projectId
              ? { ...state.currentProject, envVars, updatedAt: new Date() }
              : state.currentProject,
        })),
    }),
    {
      name: 'deployment-storage',
      partialize: (state) => ({
        projects: state.projects,
        deployments: state.deployments,
        vercelToken: state.vercelToken,
      }),
    }
  )
)
