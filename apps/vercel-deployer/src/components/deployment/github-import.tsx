'use client'

import React, { useState, useCallback } from 'react'
import { Github, GitBranch, AlertCircle, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { extractRepoInfo } from '@/utils/utils'
import type { GitHubRepo, GitHubBranch } from '@/types/deployment'

interface GitHubImportProps {
  onRepoSelected: (repo: GitHubRepo) => void
}

export function GitHubImport({ onRepoSelected }: GitHubImportProps) {
  const [repoUrl, setRepoUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [repo, setRepo] = useState<GitHubRepo | null>(null)
  const [selectedBranch, setSelectedBranch] = useState<string>('')

  const fetchRepoInfo = useCallback(async () => {
    const repoInfo = extractRepoInfo(repoUrl)
    if (!repoInfo) {
      setError('Please enter a valid GitHub repository URL (e.g., https://github.com/owner/repo)')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Fetch repository info from GitHub API
      const repoResponse = await fetch(
        `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}`
      )

      if (!repoResponse.ok) {
        if (repoResponse.status === 404) {
          throw new Error('Repository not found. Make sure the repository exists and is public.')
        }
        throw new Error('Failed to fetch repository information')
      }

      const repoData = await repoResponse.json()

      // Fetch branches
      const branchesResponse = await fetch(
        `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/branches`
      )

      let branches: GitHubBranch[] = []
      if (branchesResponse.ok) {
        const branchesData = await branchesResponse.json()
        branches = branchesData.map((b: { name: string; commit: { sha: string } }) => ({
          name: b.name,
          sha: b.commit.sha,
        }))
      }

      const fetchedRepo: GitHubRepo = {
        owner: repoInfo.owner,
        name: repoInfo.repo,
        fullName: `${repoInfo.owner}/${repoInfo.repo}`,
        defaultBranch: repoData.default_branch,
        branches,
        isPrivate: repoData.private,
      }

      setRepo(fetchedRepo)
      setSelectedBranch(repoData.default_branch)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch repository')
    } finally {
      setIsLoading(false)
    }
  }, [repoUrl])

  const handleConfirm = useCallback(() => {
    if (repo && selectedBranch) {
      onRepoSelected({
        ...repo,
        defaultBranch: selectedBranch,
      })
    }
  }, [repo, selectedBranch, onRepoSelected])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !isLoading) {
        fetchRepoInfo()
      }
    },
    [fetchRepoInfo, isLoading]
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Github className="h-5 w-5" />
          Import from GitHub
        </CardTitle>
        <CardDescription>
          Enter a GitHub repository URL to import your project
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Input
            placeholder="https://github.com/owner/repository"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          <Button onClick={fetchRepoInfo} disabled={isLoading || !repoUrl}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Import'
            )}
          </Button>
        </div>

        {repo && (
          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <span className="font-medium">{repo.fullName}</span>
              {repo.isPrivate && (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                  Private
                </span>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <GitBranch className="h-4 w-4" />
                Select Branch
              </label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
              >
                {repo.branches.map((branch) => (
                  <option key={branch.name} value={branch.name}>
                    {branch.name}
                    {branch.name === repo.defaultBranch && ' (default)'}
                  </option>
                ))}
              </select>
            </div>

            <Button onClick={handleConfirm} className="w-full">
              Use This Repository
            </Button>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <p>Supported repositories:</p>
          <ul className="list-disc list-inside mt-1">
            <li>Public GitHub repositories</li>
            <li>Private repositories (requires GitHub authentication)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
