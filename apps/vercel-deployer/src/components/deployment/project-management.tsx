'use client'

import React, { useMemo } from 'react'
import { FolderOpen, Github, Trash2, Rocket, Clock, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useDeploymentStore } from '@/store/deployment-store'
import { formatDate } from '@/utils/utils'
import type { Project, Deployment } from '@/types/deployment'

interface ProjectManagementProps {
  onSelectProject: (project: Project) => void
  onNewProject: () => void
}

export function ProjectManagement({ onSelectProject, onNewProject }: ProjectManagementProps) {
  const { projects, deployments, deleteProject } = useDeploymentStore()

  const projectsWithDeployments = useMemo(() => {
    return projects.map((project) => ({
      project,
      latestDeployment: deployments
        .filter((d) => d.projectId === project.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0],
    }))
  }, [projects, deployments])

  const handleDelete = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      deleteProject(projectId)
    }
  }

  const getStatusBadge = (deployment?: Deployment) => {
    if (!deployment) {
      return <Badge variant="secondary">Not Deployed</Badge>
    }

    switch (deployment.status) {
      case 'ready':
        return <Badge variant="success">Live</Badge>
      case 'building':
      case 'deploying':
        return <Badge variant="default">Deploying</Badge>
      case 'error':
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">{deployment.status}</Badge>
    }
  }

  if (projects.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Projects Yet</h3>
          <p className="text-muted-foreground mb-4">
            Upload files or import from GitHub to create your first project
          </p>
          <Button onClick={onNewProject}>Create New Project</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Your Projects</h2>
        <Button onClick={onNewProject}>New Project</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projectsWithDeployments.map(({ project, latestDeployment }) => (
          <Card
            key={project.id}
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => onSelectProject(project)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {project.source === 'github' ? (
                    <Github className="h-4 w-4" />
                  ) : (
                    <FolderOpen className="h-4 w-4" />
                  )}
                  <CardTitle className="text-lg truncate">{project.name}</CardTitle>
                </div>
                {getStatusBadge(latestDeployment)}
              </div>
              <CardDescription className="truncate">
                {project.source === 'github' ? project.githubUrl : `${project.files.length} files`}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Created {formatDate(project.createdAt)}</span>
              </div>

              {latestDeployment?.url && (
                <a
                  href={latestDeployment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-primary hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-3 w-3" />
                  {latestDeployment.url.replace('https://', '')}
                </a>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelectProject(project)
                  }}
                >
                  <Rocket className="h-3 w-3 mr-1" />
                  Redeploy
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={(e) => handleDelete(project.id, e)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
