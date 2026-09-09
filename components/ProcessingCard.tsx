'use client'

import { cn } from '@/lib/utils'
import { Loader2, CheckCircle, AlertCircle, Image as ImageIcon } from 'lucide-react'
import { ProcessingResult } from '@/lib/types'

interface ProcessingCardProps {
  result: ProcessingResult
  originalName: string
  onDownload: () => void
  onProcessAnother: () => void
}

export function ProcessingCard({ result, originalName, onDownload, onProcessAnother }: ProcessingCardProps) {
  const sizeDiff = result.cleanedSize - result.originalSize
  const sizeDiffPercent = ((sizeDiff / result.originalSize) * 100).toFixed(1)
  const savedSpace = sizeDiff < 0

  return (
    <div className="card glass p-6 md:p-8 animate-in" role="status" aria-live="polite">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-900/30 mb-4">
          <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" aria-hidden="true" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Image cleaned successfully</h2>
        <p className="text-muted-foreground mt-1">{originalName}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Original Size"
          value={formatFileSize(result.originalSize)}
          icon={<ImageIcon className="w-4 h-4" aria-hidden="true" />}
        />
        <StatCard
          label="Cleaned Size"
          value={formatFileSize(result.cleanedSize)}
          icon={<ImageIcon className="w-4 h-4" aria-hidden="true" />}
          highlight={savedSpace}
        />
        <StatCard
          label="Dimensions"
          value={`${result.cleanedDimensions.width} × ${result.cleanedDimensions.height}`}
          icon={<ImageIcon className="w-4 h-4" aria-hidden="true" />}
        />
        <StatCard
          label="Format"
          value={result.format.split('/')[1]?.toUpperCase() || 'Unknown'}
          icon={<ImageIcon className="w-4 h-4" aria-hidden="true" />}
        />
      </div>

      <div className="mb-6 p-4 rounded-lg bg-muted/30 border border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={cn('px-2 py-1 rounded-full text-xs font-medium', savedSpace ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300')}>
              {savedSpace ? 'Space saved' : 'Size increased'}
            </span>
            {result.reencoded && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                Re-encoded
              </span>
            )}
          </div>
          <span className="text-sm font-mono text-foreground">
            {savedSpace ? '−' : '+'}{Math.abs(sizeDiffPercent)}%
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onDownload}
          className="btn-primary flex-1 justify-center py-3 text-base"
          aria-label={`Download cleaned ${originalName}`}
        >
          <CheckCircle className="w-4 h-4" aria-hidden="true" />
          Download Cleaned Image
        </button>
        <button
          onClick={onProcessAnother}
          className="btn-outline flex-1 justify-center py-3 text-base"
        >
          <Loader2 className="w-4 h-4" aria-hidden="true" />
          Process Another
        </button>
      </div>

      <p className="mt-4 text-xs text-muted-foreground text-center">
        Your files never left your device. All processing happened locally in your browser.
      </p>
    </div>
  )
}

function StatCard({ label, value, icon, highlight }: { label: string; value: string; icon: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={cn('p-4 rounded-xl bg-background/50 border border-border/50 text-center', highlight && 'border-green-200 dark:border-green-800/30 bg-green-50 dark:bg-green-900/10')}>
      <div className="text-muted-foreground mb-1">{icon}</div>
      <div className={cn('font-mono font-semibold text-foreground', highlight && 'text-green-600 dark:text-green-400')}>
        {value}
      </div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  )
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}