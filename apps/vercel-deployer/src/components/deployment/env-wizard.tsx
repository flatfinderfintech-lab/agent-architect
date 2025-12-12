'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { Settings, ChevronRight, ChevronLeft, ExternalLink, Check, AlertCircle, Eye, EyeOff, SkipForward } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { CATEGORY_INFO, groupByCategory } from '@/utils/env-detector'
import type { EnvVariable, EnvCategory } from '@/types/deployment'

interface EnvWizardProps {
  envVars: EnvVariable[]
  onComplete: (envVars: EnvVariable[]) => void
  onBack?: () => void
}

export function EnvWizard({ envVars, onComplete, onBack }: EnvWizardProps) {
  const [variables, setVariables] = useState<EnvVariable[]>(envVars)
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0)
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})

  // Group variables by category and filter out empty categories
  const groupedVars = useMemo(() => groupByCategory(variables), [variables])
  const categories = useMemo(
    () => (Object.keys(groupedVars) as EnvCategory[]).filter((cat) => groupedVars[cat].length > 0),
    [groupedVars]
  )

  const currentCategory = categories[currentCategoryIndex]
  const currentVars = currentCategory ? groupedVars[currentCategory] : []
  const categoryInfo = currentCategory ? CATEGORY_INFO[currentCategory] : null

  const progress = useMemo(() => {
    const total = variables.length
    const filled = variables.filter((v) => v.value || !v.required).length
    return total > 0 ? Math.round((filled / total) * 100) : 100
  }, [variables])

  const currentCategoryProgress = useMemo(() => {
    if (!currentVars.length) return 100
    const filled = currentVars.filter((v) => v.value || !v.required).length
    return Math.round((filled / currentVars.length) * 100)
  }, [currentVars])

  const updateVariable = useCallback((key: string, value: string) => {
    setVariables((prev) =>
      prev.map((v) => (v.key === key ? { ...v, value } : v))
    )
  }, [])

  const toggleSecret = useCallback((key: string) => {
    setShowSecrets((prev) => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const handleNext = useCallback(() => {
    if (currentCategoryIndex < categories.length - 1) {
      setCurrentCategoryIndex((prev) => prev + 1)
    } else {
      onComplete(variables)
    }
  }, [currentCategoryIndex, categories.length, variables, onComplete])

  const handleBack = useCallback(() => {
    if (currentCategoryIndex > 0) {
      setCurrentCategoryIndex((prev) => prev - 1)
    } else if (onBack) {
      onBack()
    }
  }, [currentCategoryIndex, onBack])

  const handleSkipOptional = useCallback(() => {
    // Skip to next category if all remaining vars are optional
    handleNext()
  }, [handleNext])

  const allOptionalInCategory = currentVars.every((v) => !v.required)
  const hasRequiredUnfilled = currentVars.some((v) => v.required && !v.value)
  const isLastCategory = currentCategoryIndex === categories.length - 1

  if (categories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Environment Variables Detected</CardTitle>
          <CardDescription>
            We didn&apos;t find any environment variables in your project.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Ready to Deploy</AlertTitle>
            <AlertDescription>
              Your project doesn&apos;t appear to require any environment variables.
              You can proceed to deploy.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex justify-between">
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          <Button onClick={() => onComplete([])}>
            Continue to Deploy
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configure Environment Variables
            </CardTitle>
            <CardDescription>
              Step {currentCategoryIndex + 1} of {categories.length}
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">{progress}% Complete</p>
            <Progress value={progress} className="w-32 h-2 mt-1" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Category Header */}
        {categoryInfo && (
          <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
            <span className="text-2xl">{categoryInfo.icon}</span>
            <div>
              <h3 className="font-semibold">{categoryInfo.label}</h3>
              <p className="text-sm text-muted-foreground">{categoryInfo.description}</p>
            </div>
            <Badge variant="outline" className="ml-auto">
              {currentVars.filter((v) => v.value).length}/{currentVars.length}
            </Badge>
          </div>
        )}

        {/* Category Progress */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Category progress:</span>
          <Progress value={currentCategoryProgress} className="flex-1 h-2" />
          <span className="font-medium">{currentCategoryProgress}%</span>
        </div>

        {/* Variables */}
        <div className="space-y-4">
          {currentVars.map((variable) => (
            <div key={variable.key} className="space-y-2">
              <div className="flex items-center gap-2">
                <label htmlFor={variable.key} className="font-medium text-sm">
                  {variable.key}
                </label>
                {variable.required ? (
                  <Badge variant="destructive" className="text-xs">Required</Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">Optional</Badge>
                )}
                {variable.value && (
                  <Check className="h-4 w-4 text-green-500" />
                )}
              </div>

              <p className="text-sm text-muted-foreground">{variable.description}</p>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id={variable.key}
                    type={showSecrets[variable.key] ? 'text' : 'password'}
                    placeholder={`Enter ${variable.key}`}
                    value={variable.value}
                    onChange={(e) => updateVariable(variable.key, e.target.value)}
                    className={variable.required && !variable.value ? 'border-destructive' : ''}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => toggleSecret(variable.key)}
                  >
                    {showSecrets[variable.key] ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {variable.service && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Get this from:</span>
                  <a
                    href={variable.service.signupUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    {variable.service.name}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>

        {hasRequiredUnfilled && (
          <Alert variant="warning">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Some required variables are not filled. Your deployment may fail without them.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handleBack}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="flex gap-2">
          {allOptionalInCategory && (
            <Button variant="ghost" onClick={handleSkipOptional}>
              <SkipForward className="h-4 w-4 mr-2" />
              Skip Optional
            </Button>
          )}
          <Button onClick={handleNext}>
            {isLastCategory ? 'Continue to Deploy' : 'Next'}
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
