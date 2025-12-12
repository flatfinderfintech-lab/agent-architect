'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Rocket, ExternalLink, Copy, Check, AlertCircle, RefreshCw, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  getVercelToken,
  setVercelToken as saveVercelToken,
  validateToken,
  pollDeploymentStatus,
  addCustomDomain,
  verifyCustomDomain,
} from '@/utils/vercel-api'
import type { Deployment, DeploymentStatus, DnsRecord } from '@/types/deployment'

interface DeploymentDashboardProps {
  deployment: Deployment | null
  projectName: string
  onDeploy: (token: string) => Promise<{ deploymentId: string }>
  onNewProject?: () => void
}

const STATUS_CONFIG: Record<DeploymentStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'Pending', color: 'bg-yellow-500', icon: <RefreshCw className="h-4 w-4 animate-spin" /> },
  building: { label: 'Building', color: 'bg-blue-500', icon: <RefreshCw className="h-4 w-4 animate-spin" /> },
  deploying: { label: 'Deploying', color: 'bg-purple-500', icon: <RefreshCw className="h-4 w-4 animate-spin" /> },
  ready: { label: 'Ready', color: 'bg-green-500', icon: <Check className="h-4 w-4" /> },
  error: { label: 'Error', color: 'bg-red-500', icon: <AlertCircle className="h-4 w-4" /> },
  canceled: { label: 'Canceled', color: 'bg-gray-500', icon: <AlertCircle className="h-4 w-4" /> },
}

export function DeploymentDashboard({
  deployment: initialDeployment,
  projectName,
  onDeploy,
  onNewProject,
}: DeploymentDashboardProps) {
  const [deployment, setDeployment] = useState<Deployment | null>(initialDeployment)
  const [vercelToken, setVercelToken] = useState<string>(getVercelToken() || '')
  const [isValidatingToken, setIsValidatingToken] = useState(false)
  const [tokenError, setTokenError] = useState<string | null>(null)
  const [isDeploying, setIsDeploying] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [copied, setCopied] = useState(false)
  const [showTokenInput, setShowTokenInput] = useState(!getVercelToken())

  // Custom domain state
  const [customDomain, setCustomDomain] = useState('')
  const [domainStatus, setDomainStatus] = useState<'idle' | 'adding' | 'verifying' | 'verified' | 'error'>('idle')
  const [dnsRecords, setDnsRecords] = useState<DnsRecord[]>([])
  const [domainError, setDomainError] = useState<string | null>(null)

  useEffect(() => {
    setDeployment(initialDeployment)
  }, [initialDeployment])

  const handleValidateToken = useCallback(async () => {
    if (!vercelToken) {
      setTokenError('Please enter your Vercel token')
      return
    }

    setIsValidatingToken(true)
    setTokenError(null)

    const result = await validateToken(vercelToken)
    if (result.valid) {
      saveVercelToken(vercelToken)
      setShowTokenInput(false)
    } else {
      setTokenError(result.error || 'Invalid token')
    }

    setIsValidatingToken(false)
  }, [vercelToken])

  const handleDeploy = useCallback(async () => {
    const token = getVercelToken()
    if (!token) {
      setShowTokenInput(true)
      return
    }

    setIsDeploying(true)
    setLogs([])

    try {
      const { deploymentId } = await onDeploy(token)

      // Start polling for status
      await pollDeploymentStatus(
        deploymentId,
        { token },
        (status, newLogs) => {
          setDeployment((prev) =>
            prev ? { ...prev, status, buildLogs: newLogs } : null
          )
          setLogs(newLogs)
        }
      )
    } catch (error) {
      setDeployment((prev) =>
        prev
          ? { ...prev, status: 'error', error: error instanceof Error ? error.message : 'Deployment failed' }
          : null
      )
    } finally {
      setIsDeploying(false)
    }
  }, [onDeploy])

  const handleAddDomain = useCallback(async () => {
    if (!customDomain || !deployment?.vercelProjectId) return

    const token = getVercelToken()
    if (!token) {
      setDomainError('Vercel token not configured')
      return
    }

    setDomainStatus('adding')
    setDomainError(null)

    try {
      const result = await addCustomDomain(deployment.vercelProjectId, customDomain, { token })
      setDnsRecords(result.dnsRecords)

      if (result.verified) {
        setDomainStatus('verified')
      } else {
        setDomainStatus('verifying')
      }
    } catch (error) {
      setDomainError(error instanceof Error ? error.message : 'Failed to add domain')
      setDomainStatus('error')
    }
  }, [customDomain, deployment])

  const handleVerifyDomain = useCallback(async () => {
    if (!customDomain || !deployment?.vercelProjectId) return

    const token = getVercelToken()
    if (!token) return

    setDomainStatus('verifying')

    const result = await verifyCustomDomain(deployment.vercelProjectId, customDomain, { token })

    if (result.verified) {
      setDomainStatus('verified')
    } else {
      setDomainError(result.error || 'Domain verification failed')
      setDomainStatus('error')
    }
  }, [customDomain, deployment])

  const copyUrl = useCallback(() => {
    if (deployment?.url) {
      navigator.clipboard.writeText(deployment.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [deployment])

  const status = deployment?.status || 'pending'
  const statusConfig = STATUS_CONFIG[status]

  return (
    <div className="space-y-6">
      {/* Token Configuration */}
      {showTokenInput && (
        <Card>
          <CardHeader>
            <CardTitle>Configure Vercel Token</CardTitle>
            <CardDescription>
              Enter your Vercel API token to deploy your project.
              <a
                href="https://vercel.com/account/tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline ml-1"
              >
                Get your token here <ExternalLink className="h-3 w-3 inline" />
              </a>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="Enter your Vercel token"
                value={vercelToken}
                onChange={(e) => setVercelToken(e.target.value)}
              />
              <Button onClick={handleValidateToken} disabled={isValidatingToken}>
                {isValidatingToken ? 'Validating...' : 'Save Token'}
              </Button>
            </div>
            {tokenError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{tokenError}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Deployment Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5" />
                Deployment Dashboard
              </CardTitle>
              <CardDescription>{projectName}</CardDescription>
            </div>
            <Badge className={`${statusConfig.color} text-white flex items-center gap-1`}>
              {statusConfig.icon}
              {statusConfig.label}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress */}
          {(status === 'building' || status === 'deploying' || status === 'pending') && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {status === 'pending' && 'Waiting to start...'}
                {status === 'building' && 'Building your project...'}
                {status === 'deploying' && 'Deploying to Vercel...'}
              </p>
              <Progress value={status === 'pending' ? 10 : status === 'building' ? 50 : 80} />
            </div>
          )}

          {/* Success */}
          {status === 'ready' && deployment?.url && (
            <Alert variant="success">
              <Check className="h-4 w-4" />
              <AlertTitle>Deployment Successful!</AlertTitle>
              <AlertDescription className="mt-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm">{deployment.url}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyUrl}>
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                  <a
                    href={deployment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto"
                  >
                    <Button size="sm">
                      Visit Site <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </a>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Error */}
          {status === 'error' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Deployment Failed</AlertTitle>
              <AlertDescription>{deployment?.error || 'An error occurred during deployment'}</AlertDescription>
            </Alert>
          )}

          {/* Build Logs */}
          {logs.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Build Logs</h4>
              <ScrollArea maxHeight="200px" className="border rounded-lg bg-black text-green-400 p-4">
                <pre className="text-xs font-mono whitespace-pre-wrap">
                  {logs.join('\n')}
                </pre>
              </ScrollArea>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          {onNewProject && (
            <Button variant="outline" onClick={onNewProject}>
              New Project
            </Button>
          )}
          {!deployment && (
            <Button onClick={handleDeploy} disabled={isDeploying || showTokenInput}>
              {isDeploying ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Deploying...
                </>
              ) : (
                <>
                  <Rocket className="h-4 w-4 mr-2" />
                  Deploy to Vercel
                </>
              )}
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Custom Domain Configuration */}
      {status === 'ready' && deployment?.vercelProjectId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Custom Domain
            </CardTitle>
            <CardDescription>
              Add a custom domain to your deployed project
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="example.com"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                disabled={domainStatus === 'verified'}
              />
              {domainStatus === 'idle' || domainStatus === 'error' ? (
                <Button onClick={handleAddDomain} disabled={!customDomain}>
                  Add Domain
                </Button>
              ) : domainStatus === 'verifying' || domainStatus === 'adding' ? (
                <Button onClick={handleVerifyDomain}>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Verify
                </Button>
              ) : (
                <Badge variant="success">Verified</Badge>
              )}
            </div>

            {domainError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{domainError}</AlertDescription>
              </Alert>
            )}

            {dnsRecords.length > 0 && domainStatus !== 'verified' && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Configure these DNS records with your domain provider:</p>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-2">Type</th>
                        <th className="text-left p-2">Name</th>
                        <th className="text-left p-2">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dnsRecords.map((record, i) => (
                        <tr key={i} className="border-t">
                          <td className="p-2 font-mono">{record.type}</td>
                          <td className="p-2 font-mono">{record.name}</td>
                          <td className="p-2 font-mono text-xs">{record.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground">
                  DNS changes may take up to 48 hours to propagate. Click &quot;Verify&quot; once configured.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
