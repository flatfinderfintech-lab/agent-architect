'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { ArrowLeft, Upload, Github, Rocket } from 'lucide-react'
import { useUser, SignInButton, UserButton } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import {
  FileUpload,
  GitHubImport,
  EnvWizard,
  DeploymentDashboard,
  ProjectManagement,
} from '@/components/deployment'
import { analyzeProject, getDetectedServices } from '@/utils/env-detector'
import { deployToVercel, deployFromGitHub } from '@/utils/vercel-api'
import { useDeploymentStore } from '@/store/deployment-store'
import { generateId } from '@/utils/utils'
import type { Project, ProjectFile, EnvVariable, GitHubRepo, Deployment } from '@/types/deployment'

type Step = 'select' | 'upload' | 'github' | 'env' | 'deploy' | 'manage'

export default function HomePage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const [step, setStep] = useState<Step>('select')
  const [files, setFiles] = useState<ProjectFile[]>([])
  const [githubRepo, setGithubRepo] = useState<GitHubRepo | null>(null)
  const [envVars, setEnvVars] = useState<EnvVariable[]>([])
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [deployment, setDeployment] = useState<Deployment | null>(null)
  const [, setDeploymentProgress] = useState<string>('')

  const { addProject, updateProject, addDeployment, projects } = useDeploymentStore()

  // Detect services when files are uploaded
  const detectedServices = useMemo(() => {
    return getDetectedServices(envVars)
  }, [envVars])

  const handleFilesSelected = useCallback((selectedFiles: ProjectFile[]) => {
    setFiles(selectedFiles)

    if (selectedFiles.length > 0) {
      // Analyze project for environment variables
      const detected = analyzeProject(selectedFiles)
      setEnvVars(detected)

      // Auto-generate project name from folder or first file
      const folderPath = selectedFiles[0].path.split('/')[0]
      const projectName = folderPath || 'my-project'

      // Create project
      const project: Project = {
        id: generateId(),
        name: projectName,
        source: 'upload',
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: user?.id || '',
        files: selectedFiles,
        envVars: detected,
        deployments: [],
      }

      setCurrentProject(project)
      addProject(project)

      // Move to env wizard if variables detected, otherwise straight to deploy
      setStep(detected.length > 0 ? 'env' : 'deploy')
    }
  }, [addProject, user?.id])

  const handleRepoSelected = useCallback((repo: GitHubRepo) => {
    setGithubRepo(repo)

    // Create project for GitHub repo
    const project: Project = {
      id: generateId(),
      name: repo.name,
      source: 'github',
      githubUrl: `https://github.com/${repo.fullName}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: user?.id || '',
      files: [],
      envVars: [],
      deployments: [],
    }

    setCurrentProject(project)
    addProject(project)

    // For GitHub repos, go to env configuration
    setStep('env')
  }, [addProject, user?.id])

  const handleEnvComplete = useCallback((configuredVars: EnvVariable[]) => {
    setEnvVars(configuredVars)

    if (currentProject) {
      updateProject(currentProject.id, { envVars: configuredVars })
    }

    setStep('deploy')
  }, [currentProject, updateProject])

  const handleDeploy = useCallback(async (token: string): Promise<{ deploymentId: string }> => {
    if (!currentProject) {
      throw new Error('No project selected')
    }

    // Convert env vars to record
    const envRecord: Record<string, string> = {}
    for (const v of envVars) {
      if (v.value) {
        envRecord[v.key] = v.value
      }
    }

    let result: { deployment: Deployment; vercelId: string }

    if (currentProject.source === 'github' && githubRepo) {
      result = await deployFromGitHub(
        currentProject.githubUrl!,
        githubRepo.defaultBranch,
        envRecord,
        { token },
        setDeploymentProgress
      )
    } else {
      // Prepare files for deployment
      const deployFiles = files
        .filter((f) => f.content)
        .map((f) => ({
          file: f.path,
          data: f.content!,
        }))

      result = await deployToVercel(
        currentProject.name,
        deployFiles,
        envRecord,
        { token },
        setDeploymentProgress
      )
    }

    setDeployment(result.deployment)
    addDeployment(result.deployment)

    return { deploymentId: result.vercelId }
  }, [currentProject, files, envVars, githubRepo, addDeployment])

  const handleNewProject = useCallback(() => {
    setStep('select')
    setFiles([])
    setGithubRepo(null)
    setEnvVars([])
    setCurrentProject(null)
    setDeployment(null)
  }, [])

  const handleSelectProject = useCallback((project: Project) => {
    setCurrentProject(project)
    setEnvVars(project.envVars)
    setFiles(project.files)
    if (project.source === 'github' && project.githubUrl) {
      // Parse GitHub info from URL
      const match = project.githubUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/)
      if (match) {
        setGithubRepo({
          owner: match[1],
          name: match[2],
          fullName: `${match[1]}/${match[2]}`,
          defaultBranch: 'main',
          branches: [],
          isPrivate: false,
        })
      }
    }
    setStep('deploy')
  }, [])

  // Loading state
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Rocket className="h-12 w-12 mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Sign-in gate
  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <Rocket className="h-16 w-16 mx-auto mb-6 text-primary" />
          <h1 className="text-3xl font-bold mb-4">Vercel Deployer</h1>
          <p className="text-muted-foreground mb-8">
            Deploy your projects to Vercel with automated environment configuration.
            Sign in to get started.
          </p>
          <SignInButton mode="modal">
            <Button size="lg" className="w-full">
              Sign In to Continue
            </Button>
          </SignInButton>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {step !== 'select' && step !== 'manage' && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setStep(step === 'upload' || step === 'github' ? 'select' :
                    step === 'env' ? (currentProject?.source === 'github' ? 'github' : 'upload') :
                    step === 'deploy' ? 'env' : 'select')}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Rocket className="h-6 w-6" />
                  Vercel Deployer
                </h1>
                <p className="text-sm text-muted-foreground">
                  {step === 'select' && 'Choose how to import your project'}
                  {step === 'upload' && 'Upload your project files'}
                  {step === 'github' && 'Import from GitHub'}
                  {step === 'env' && 'Configure environment variables'}
                  {step === 'deploy' && 'Deploy your project'}
                  {step === 'manage' && 'Manage your projects'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {projects.length > 0 && step !== 'manage' && (
                <Button variant="outline" onClick={() => setStep('manage')}>
                  Manage Projects ({projects.length})
                </Button>
              )}
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Step: Select Import Method */}
        {step === 'select' && (
          <div className="grid md:grid-cols-2 gap-6">
            <div
              className="border-2 rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors bg-white"
              onClick={() => setStep('upload')}
            >
              <Upload className="h-16 w-16 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">Upload Files</h3>
              <p className="text-muted-foreground">
                Drag and drop your project files or folders to upload
              </p>
            </div>

            <div
              className="border-2 rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors bg-white"
              onClick={() => setStep('github')}
            >
              <Github className="h-16 w-16 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Import from GitHub</h3>
              <p className="text-muted-foreground">
                Connect your GitHub repository for automatic deployments
              </p>
            </div>
          </div>
        )}

        {/* Step: File Upload */}
        {step === 'upload' && (
          <FileUpload onFilesSelected={handleFilesSelected} />
        )}

        {/* Step: GitHub Import */}
        {step === 'github' && (
          <GitHubImport onRepoSelected={handleRepoSelected} />
        )}

        {/* Step: Environment Variables Wizard */}
        {step === 'env' && (
          <div className="space-y-4">
            {detectedServices.length > 0 && (
              <div className="border rounded-lg p-4 bg-blue-50">
                <h3 className="font-medium mb-2">Detected Services</h3>
                <div className="flex flex-wrap gap-2">
                  {detectedServices.map((service) => (
                    <a
                      key={service.name}
                      href={service.setupUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1 bg-white rounded-full border text-sm hover:border-primary"
                    >
                      {service.name}
                    </a>
                  ))}
                </div>
              </div>
            )}
            <EnvWizard
              envVars={envVars}
              onComplete={handleEnvComplete}
              onBack={() => setStep(currentProject?.source === 'github' ? 'github' : 'upload')}
            />
          </div>
        )}

        {/* Step: Deploy */}
        {step === 'deploy' && currentProject && (
          <DeploymentDashboard
            deployment={deployment}
            projectName={currentProject.name}
            onDeploy={handleDeploy}
            onNewProject={handleNewProject}
          />
        )}

        {/* Step: Manage Projects */}
        {step === 'manage' && (
          <ProjectManagement
            onSelectProject={handleSelectProject}
            onNewProject={handleNewProject}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="max-w-5xl mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>Vercel Deployer - Automated deployment with environment configuration</p>
        </div>
      </footer>
    </div>
  )
}
