'use client'

import React, { useCallback, useState } from 'react'
import { Upload, File, Folder, X, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatBytes } from '@/utils/utils'
import type { ProjectFile } from '@/types/deployment'

interface FileUploadProps {
  onFilesSelected: (files: ProjectFile[]) => void
  maxSize?: number // in bytes
}

export function FileUpload({ onFilesSelected, maxSize = 100 * 1024 * 1024 }: FileUploadProps) {
  const [files, setFiles] = useState<ProjectFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const processFiles = useCallback(async (fileList: FileList | File[]) => {
    setIsProcessing(true)
    setError(null)

    const fileArray = Array.from(fileList)
    const newFiles: ProjectFile[] = []

    let totalSize = files.reduce((acc, f) => acc + f.size, 0)

    for (const file of fileArray) {
      // Skip hidden files and common ignored directories
      if (file.name.startsWith('.') && file.name !== '.env' && !file.name.startsWith('.env.')) {
        continue
      }

      const relativePath = (file as unknown as { webkitRelativePath?: string }).webkitRelativePath || file.name

      // Skip node_modules and other common directories
      if (relativePath.includes('node_modules/') ||
          relativePath.includes('.git/') ||
          relativePath.includes('.next/') ||
          relativePath.includes('dist/') ||
          relativePath.includes('build/')) {
        continue
      }

      totalSize += file.size
      if (totalSize > maxSize) {
        setError(`Total file size exceeds ${formatBytes(maxSize)} limit`)
        break
      }

      // Read file content for text files
      let content: string | undefined
      const textExtensions = ['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.txt', '.css', '.scss', '.html', '.env', '.yaml', '.yml', '.toml']
      const isTextFile = textExtensions.some(ext => file.name.endsWith(ext)) || file.name.startsWith('.env')

      if (isTextFile && file.size < 1024 * 1024) { // Only read files < 1MB
        try {
          content = await file.text()
        } catch {
          // Ignore read errors
        }
      }

      newFiles.push({
        id: `file-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        name: file.name,
        path: relativePath,
        size: file.size,
        type: file.type || 'application/octet-stream',
        content,
      })
    }

    const updatedFiles = [...files, ...newFiles]
    setFiles(updatedFiles)
    onFilesSelected(updatedFiles)
    setIsProcessing(false)
  }, [files, maxSize, onFilesSelected])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const items = e.dataTransfer.items
    const fileList: File[] = []

    // Handle dropped items
    for (const item of items) {
      if (item.kind === 'file') {
        const file = item.getAsFile()
        if (file) {
          fileList.push(file)
        }
      }
    }

    if (fileList.length > 0) {
      processFiles(fileList)
    }
  }, [processFiles])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files)
    }
  }, [processFiles])

  const removeFile = useCallback((id: string) => {
    const updatedFiles = files.filter(f => f.id !== id)
    setFiles(updatedFiles)
    onFilesSelected(updatedFiles)
  }, [files, onFilesSelected])

  const clearAll = useCallback(() => {
    setFiles([])
    onFilesSelected([])
    setError(null)
  }, [onFilesSelected])

  const totalSize = files.reduce((acc, f) => acc + f.size, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Project Files
        </CardTitle>
        <CardDescription>
          Drag and drop your project files or folders, or click to browse
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {isProcessing ? (
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              <p className="text-sm text-muted-foreground">Processing files...</p>
            </div>
          ) : (
            <>
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">Drop files or folders here</p>
              <p className="text-sm text-muted-foreground mb-4">
                or use the buttons below to select files
              </p>
              <div className="flex gap-2 justify-center">
                <label>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileInput}
                  />
                  <Button type="button" variant="outline" asChild>
                    <span className="cursor-pointer">
                      <File className="h-4 w-4 mr-2" />
                      Select Files
                    </span>
                  </Button>
                </label>
                <label>
                  <input
                    type="file"
                    // @ts-expect-error webkitdirectory is not in the type definition
                    webkitdirectory="true"
                    directory="true"
                    className="hidden"
                    onChange={handleFileInput}
                  />
                  <Button type="button" variant="outline" asChild>
                    <span className="cursor-pointer">
                      <Folder className="h-4 w-4 mr-2" />
                      Select Folder
                    </span>
                  </Button>
                </label>
              </div>
            </>
          )}
        </div>

        {files.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                {files.length} file{files.length !== 1 ? 's' : ''} ({formatBytes(totalSize)})
              </p>
              <Button variant="ghost" size="sm" onClick={clearAll}>
                Clear All
              </Button>
            </div>

            <ScrollArea maxHeight="200px" className="border rounded-lg">
              <div className="p-2 space-y-1">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-2 rounded hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <File className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      <span className="text-sm truncate" title={file.path}>
                        {file.path}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatBytes(file.size)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeFile(file.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
