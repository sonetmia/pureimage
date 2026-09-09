'use client'

import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { cn, formatFileSize, formatDimensions, generateCleanedFilename } from '@/lib/utils'
import { downloadBlob, downloadAllBlobs } from '@/lib/download'
import { ProcessingCard } from './ProcessingCard'
import { MetadataViewer } from './MetadataViewer'
import { ResultsCard } from './ResultsCard'
import { MAX_BATCH_SIZE, MAX_FILE_SIZE } from '@/lib/validation'
import { QueueItem, ProcessingStatus, ProcessingResult } from '@/lib/types'
import {
  FileImage,
  X,
  Download,
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader2,
  Clock,
  Eye,
  Image as ImageIcon,
} from 'lucide-react'

interface BatchQueueProps {
  items: QueueItem[]
  onRemove: (id: string) => void
  onProcess: (id: string) => void
  onProcessAll: () => void
  onClearAll: () => void
  onDownload: (item: QueueItem) => void
  onDownloadAll: () => void
  isProcessing: boolean
  processingCount: number
  jpegQuality: number
}

export function BatchQueue({
  items,
  onRemove,
  onProcess,
  onProcessAll,
  onClearAll,
  onDownload,
  onDownloadAll,
  isProcessing,
  processingCount,
  jpegQuality,
}: BatchQueueProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const statusIcon = useCallback((status: ProcessingStatus) => {
    switch (status) {
      case 'waiting':
        return <Clock className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
      case 'scanning':
      case 'processing':
        return <Loader2 className="w-4 h-4 text-primary animate-spin" aria-hidden="true" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" aria-hidden="true" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-destructive" aria-hidden="true" />
    }
  }, [])

  const statusLabel = useCallback((status: ProcessingStatus) => {
    switch (status) {
      case 'waiting':
        return 'Waiting'
      case 'scanning':
        return 'Scanning...'
      case 'processing':
        return 'Processing...'
      case 'completed':
        return 'Completed'
      case 'error':
        return 'Error'
    }
  }, [])

  const statusColor = useCallback((status: ProcessingStatus) => {
    switch (status) {
      case 'waiting':
        return 'text-muted-foreground'
      case 'scanning':
      case 'processing':
        return 'text-primary'
      case 'completed':
        return 'text-green-600 dark:text-green-400'
      case 'error':
        return 'text-destructive'
    }
  }, [])

  const waitingItems = useMemo(() => items.filter((i) => i.status === 'waiting'), [items])
  const processingItems = useMemo(() => items.filter((i) => i.status === 'scanning' || i.status === 'processing'), [items])
  const completedItems = useMemo(() => items.filter((i) => i.status === 'completed'), [items])
  const errorItems = useMemo(() => items.filter((i) => i.status === 'error'), [items])

  const allCompleted = items.length > 0 && items.every((i) => i.status === 'completed')
  const hasErrors = errorItems.length > 0
  const canProcessAll = waitingItems.length > 0 && !isProcessing

  if (items.length === 0) {
    return (
      <div className="card glass p-8 md:p-12 text-center animate-in">
        <FileImage className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" aria-hidden="true" />
        <h3 className="text-lg font-medium text-foreground mb-2">No images added yet</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Drag and drop images above or click to browse. You can add up to {MAX_BATCH_SIZE} images.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{items.length} / {MAX_BATCH_SIZE} files</span>
          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
            {waitingItems.length} waiting
          </span>
          {processingItems.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium animate-pulse">
              {processingItems.length} processing
            </span>
          )}
          {completedItems.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-medium">
              {completedItems.length} done
            </span>
          )}
          {errorItems.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-xs font-medium">
              {errorItems.length} error
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onProcessAll}
            disabled={!canProcessAll || isProcessing}
            className="btn-primary text-sm"
            aria-label="Process all waiting images"
          >
            <Loader2 className="w-4 h-4" aria-hidden="true" />
            Process All ({waitingItems.length})
          </button>

          {completedItems.length > 0 && (
            <button
              onClick={onDownloadAll}
              disabled={isProcessing}
              className="btn-secondary text-sm"
              aria-label="Download all cleaned images"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              Download All ({completedItems.length})
            </button>
          )}

          <button
            onClick={onClearAll}
            disabled={isProcessing || items.length === 0}
            className="btn-ghost text-sm text-destructive hover:text-destructive"
            aria-label="Clear all images from queue"
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
            Clear All
          </button>
        </div>
      </div>

      <div className="space-y-3" role="list" aria-label="Image processing queue">
        {items.map((item, index) => (
          <QueueItemCard
            key={item.id}
            item={item}
            index={index}
            jpegQuality={jpegQuality}
            isExpanded={expandedId === item.id}
            onToggleExpand={() => setExpandedId(expandedId === item.id ? null : item.id)}
            onRemove={() => onRemove(item.id)}
            onProcess={() => onProcess(item.id)}
            onDownload={() => onDownload(item)}
            statusIcon={statusIcon(item.status)}
            statusLabel={statusLabel(item.status)}
            statusColor={statusColor(item.status)}
          />
        ))}
      </div>

      {allCompleted && (
        <div className="card glass p-4 animate-in stagger-1" role="status">
          <div className="flex items-center gap-3 text-green-600 dark:text-green-400">
            <CheckCircle className="w-6 h-6 flex-shrink-0" aria-hidden="true" />
            <div>
              <p className="font-medium">All images processed successfully!</p>
              <p className="text-sm text-muted-foreground">
                {completedItems.length} image{completedItems.length !== 1 ? 's' : ''} cleaned and ready to download.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface QueueItemCardProps {
  item: QueueItem
  index: number
  jpegQuality: number
  isExpanded: boolean
  onToggleExpand: () => void
  onRemove: () => void
  onProcess: () => void
  onDownload: () => void
  statusIcon: ReactNode
  statusLabel: string
  statusColor: string
}

function QueueItemCard({
  item,
  index,
  jpegQuality,
  isExpanded,
  onToggleExpand,
  onRemove,
  onProcess,
  onDownload,
  statusIcon,
  statusLabel,
  statusColor,
}: QueueItemCardProps) {
  const canProcess = item.status === 'waiting'
  const canDownload = item.status === 'completed' && item.result

  return (
    <article
      className={cn(
        'card glass overflow-hidden transition-all duration-300',
        'relative',
        item.status === 'error' && 'border-destructive/30 bg-destructive/5',
        item.status === 'completed' && 'border-green-200 dark:border-green-800/30'
      )}
      style={{ '--delay': `${index * 50}ms` }}
    >
      <div className="p-4">
        <div className="flex items-start gap-4">
          <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
            {item.previewUrl && (
              <img
                src={item.previewUrl}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
                aria-hidden="true"
              />
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              {statusIcon}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h4 className="font-medium text-foreground truncate pr-2" title={item.file.name}>
                  {item.file.name}
                </h4>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span>{formatFileSize(item.file.size)}</span>
                  {item.originalMetadata?.width && item.originalMetadata?.height && (
                    <span>{formatDimensions(item.originalMetadata.width, item.originalMetadata.height)}</span>
                  )}
                  <span>{item.file.type}</span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={onToggleExpand}
                  className="btn-ghost p-1.5 rounded-lg h-8 w-8"
                  aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                  aria-expanded={isExpanded}
                >
                  <Eye className={cn('w-4 h-4 transition-transform', isExpanded && 'rotate-180')} aria-hidden="true" />
                </button>
                <button
                  onClick={onRemove}
                  className="btn-ghost p-1.5 rounded-lg h-8 w-8 text-destructive hover:text-destructive"
                  aria-label={`Remove ${item.file.name}`}
                  disabled={item.status === 'processing' || item.status === 'scanning'}
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-4">
              <span className={cn('text-sm font-medium', statusColor)}>{statusLabel}</span>
              {item.status === 'scanning' || item.status === 'processing' ? (
                <div className="flex-1 max-w-xs h-1.5 bg-muted rounded-full overflow-hidden" role="progressbar" aria-valuenow={item.progress} aria-valuemin={0} aria-valuemax={100}>
                  <div className="h-full bg-primary transition-all duration-300" style={{ width: `${item.progress}%` }} />
                </div>
              ) : item.error ? (
                <span className="text-sm text-destructive flex-1 truncate" role="alert">{item.error}</span>
              ) : (
                <div className="flex items-center gap-2 ml-auto">
                  {canProcess && !item.result && (
                    <button
                      onClick={onProcess}
                      className="btn-primary text-sm px-3 py-1.5"
                      aria-label={`Process ${item.file.name}`}
                    >
                      Process
                    </button>
                  )}
                  {canDownload && (
                    <button
                      onClick={onDownload}
                      className="btn-secondary text-sm px-3 py-1.5"
                      aria-label={`Download cleaned ${item.file.name}`}
                    >
                      <Download className="w-3.5 h-3.5" aria-hidden="true" />
                      Download
                    </button>
                  )}
                  {item.result && item.result.reencoded && (
                    <span className="text-xs text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-900/20" title="Image was re-encoded">
                      Re-encoded
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-border/50 animate-in stagger-1">
            {item.originalMetadata && (
              <MetadataViewer
                before={item.originalMetadata}
                after={item.result?.metadataAfter}
                title={`${item.file.name} - Metadata`}
              />
            )}
            {item.result && (
              <ResultsCard
                result={item.result}
                originalName={item.file.name}
                jpegQuality={jpegQuality}
                onDownload={onDownload}
              />
            )}
          </div>
        )}
      </div>

      {item.status === 'processing' && (
        <div className="absolute inset-x-0 bottom-0 h-1 bg-primary/20 overflow-hidden" aria-hidden="true">
          <div
            className="h-full bg-primary animate-pulse"
            style={{ width: `${item.progress}%` }}
          />
        </div>
      )}
    </article>
  )
}