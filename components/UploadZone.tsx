'use client'

import { forwardRef, useCallback, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Upload, X, FileImage, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

interface UploadZoneProps {
  onFilesSelect: (files: File[]) => void
  maxFiles: number
  maxFileSize: number
  acceptedTypes: string[]
  currentFileCount: number
  disabled?: boolean
}

export const UploadZone = forwardRef<HTMLDivElement, UploadZoneProps>(
  (
    {
      onFilesSelect,
      maxFiles,
      maxFileSize,
      acceptedTypes,
      currentFileCount,
      disabled = false,
      className,
      children,
    },
    ref
  ) => {
    const [isDragActive, setIsDragActive] = useState(false)
    const [dragDepth, setDragDepth] = useState(0)
    const inputRef = useRef<HTMLInputElement>(null)
    const [errors, setErrors] = useState<string[]>([])

    const formatSize = (bytes: number) => {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
    }

    const validateAndAddFiles = useCallback(
      (files: FileList | File[]) => {
        const fileArray = Array.from(files)
        const newErrors: string[] = []
        const validFiles: File[] = []

        for (const file of fileArray) {
          if (!acceptedTypes.includes(file.type)) {
            newErrors.push(`${file.name}: Unsupported file type. Use JPEG, PNG, or WebP.`)
            continue
          }
          if (file.size > maxFileSize) {
            newErrors.push(`${file.name}: File too large (max ${formatSize(maxFileSize)}).`)
            continue
          }
          if (currentFileCount + validFiles.length >= maxFiles) {
            newErrors.push(`Batch limit reached (max ${maxFiles} files).`)
            break
          }
          validFiles.push(file)
        }

        if (newErrors.length > 0) {
          setErrors((prev) => [...prev, ...newErrors])
        }

        if (validFiles.length > 0) {
          onFilesSelect(validFiles)
        }
      },
      [onFilesSelect, acceptedTypes, maxFileSize, maxFiles, currentFileCount]
    )

    const handleDragEnter = useCallback((e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragDepth((d) => d + 1)
      setIsDragActive(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragDepth((d) => d - 1)
      if (dragDepth <= 1) setIsDragActive(false)
    }, [dragDepth])

    const handleDragOver = useCallback((e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      e.dataTransfer.dropEffect = 'copy'
    }, [])

    const handleDrop = useCallback(
      (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragActive(false)
        setDragDepth(0)
        if (e.dataTransfer.files.length > 0) {
          validateAndAddFiles(e.dataTransfer.files)
        }
      },
      [validateAndAddFiles]
    )

    const handleFileSelect = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
          validateAndAddFiles(e.target.files)
          e.target.value = ''
        }
      },
      [validateAndAddFiles]
    )

    const handleClick = useCallback(() => {
      if (!disabled) {
        inputRef.current?.click()
      }
    }, [disabled])

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
          e.preventDefault()
          handleClick()
        }
      },
      [disabled, handleClick]
    )

    const slotsRemaining = maxFiles - currentFileCount

    return (
      <div
        ref={ref}
        className={cn(
          'relative rounded-2xl border-2 transition-all duration-300',
          'flex flex-col items-center justify-center p-8 md:p-12',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          isDragActive
            ? 'border-primary bg-primary/5 scale-[1.01] shadow-lg shadow-primary/10'
            : 'border-border/50 hover:border-primary/50 hover:bg-accent/30',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Upload zone. Drag and drop images or click to browse."
        aria-describedby="upload-hint"
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={disabled}
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col items-center text-center animate-in">
          <div
            className={cn(
              'rounded-full p-4 transition-all duration-300',
              isDragActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            )}
          >
            <Upload className="w-10 h-10" aria-hidden="true" />
          </div>

          <h3 className="mt-4 text-xl font-semibold text-foreground">
            {isDragActive ? 'Drop images here' : 'Drag & drop images here'}
          </h3>

          <p id="upload-hint" className="mt-2 text-sm text-muted-foreground max-w-xs">
            {children || (
              <>
                Click or drag {maxFiles - currentFileCount > 0 ? `${maxFiles - currentFileCount} more ` : ''}
                image{slotsRemaining !== 1 ? 's' : ''} (JPG, PNG, WebP)
                <br />
                Max {formatSize(maxFileSize)} each
              </>
            )}
          </p>

          {currentFileCount > 0 && (
            <div className="mt-4 flex items-center gap-3 text-sm text-muted-foreground animate-in stagger-1">
              <FileImage className="w-4 h-4" aria-hidden="true" />
              <span>
                {currentFileCount} / {maxFiles} file{currentFileCount !== 1 ? 's' : ''} selected
              </span>
            </div>
          )}

          {errors.length > 0 && (
            <div className="mt-4 w-full max-w-md animate-in stagger-2" role="alert">
              {errors.slice(-3).map((error, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-xs border border-destructive/20"
                >
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
                  <span>{error}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="absolute inset-0 rounded-2xl border-2 border-primary/20 bg-primary/5 opacity-0 pointer-events-none transition-opacity duration-300" aria-hidden="true" />
      </div>
    )
  }
)

UploadZone.displayName = 'UploadZone'