'use client'

import { cn, formatFileSize, generateCleanedFilename } from '@/lib/utils'
import { downloadBlob } from '@/lib/download'
import { CheckCircle, XCircle, MinusCircle, Download, AlertCircle, Info } from 'lucide-react'
import { MetadataReport, ProcessingResult } from '@/lib/types'

interface ResultsCardProps {
  result: ProcessingResult
  originalName: string
  jpegQuality: number
  onDownload: () => void
  compact?: boolean
}

const METADATA_ROWS = [
  { key: 'exif' as const, label: 'EXIF' },
  { key: 'xmp' as const, label: 'XMP' },
  { key: 'c2pa' as const, label: 'C2PA / JUMBF' },
  { key: 'gps' as const, label: 'GPS Location' },
]

function StatusIcon({ present, removed }: { present: boolean; removed: boolean }) {
  if (removed) return <XCircle className="w-4 h-4 text-green-600 dark:text-green-400" aria-hidden="true" />
  if (present) return <CheckCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
  return <MinusCircle className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
}

function StatusText({ present, removed }: { present: boolean; removed: boolean }) {
  if (removed) return <span className="text-green-600 dark:text-green-400 font-medium">Removed</span>
  if (present) return <span className="text-amber-600 dark:text-amber-400 font-medium">Found</span>
  return <span className="text-muted-foreground">Not detected</span>
}

export function ResultsCard({ result, originalName, jpegQuality, onDownload, compact = false }: ResultsCardProps) {
  const cleanedName = generateCleanedFilename(originalName)
  const sizeDiff = result.cleanedSize - result.originalSize
  const savedSpace = sizeDiff < 0
  const sizeDiffPercent = Math.abs(((sizeDiff / result.originalSize) * 100).toFixed(1))

  if (compact) {
    return (
      <div className="card glass p-4 animate-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" aria-hidden="true" />
            </div>
            <div>
              <p className="font-medium text-foreground">Cleaned successfully</p>
              <p className="text-sm text-muted-foreground">{originalName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono text-muted-foreground">
              {formatFileSize(result.originalSize)} → {formatFileSize(result.cleanedSize)}
              {' '}
              <span className={cn(savedSpace ? 'text-green-600' : 'text-amber-600')}>
                ({savedSpace ? '−' : '+'}{sizeDiffPercent}%)
              </span>
            </span>
            <button
              onClick={onDownload}
              className="btn-primary px-3 py-1.5 text-sm"
              aria-label={`Download ${cleanedName}`}
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              Download
            </button>
          </div>
        </div>

        {result.reencoded && (
          <div className="mt-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <p className="font-medium">Image was re-encoded</p>
                <p>Lossless stripping was not possible. JPEG quality used: {Math.round(jpegQuality * 100)}%.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="card glass p-6 animate-in">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Image cleaned successfully</h3>
            <p className="text-sm text-muted-foreground">{originalName}</p>
          </div>
        </div>
        <button
          onClick={onDownload}
          className="btn-primary flex items-center gap-2 px-4 py-2"
          aria-label={`Download ${cleanedName}`}
        >
          <Download className="w-4 h-4" aria-hidden="true" />
          Download
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatItem label="Original Size" value={formatFileSize(result.originalSize)} />
        <StatItem
          label="Cleaned Size"
          value={formatFileSize(result.cleanedSize)}
          highlight={savedSpace}
          subtext={savedSpace ? `−${sizeDiffPercent}%` : `+${sizeDiffPercent}%`}
        />
        <StatItem label="Dimensions" value={`${result.cleanedDimensions.width} × ${result.cleanedDimensions.height}`} />
        <StatItem label="Format" value={result.format.split('/')[1]?.toUpperCase() || 'Unknown'} />
      </div>

      <div className="mb-6">
        <h4 className="text-sm font-medium text-foreground mb-3">Metadata Removal Summary</h4>
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <div className="grid grid-cols-[auto_1fr_auto_auto] gap-3 p-3 bg-muted/30 border-b border-border/50 text-xs font-medium text-muted-foreground">
            <div>Metadata</div>
            <div className="text-center">Before</div>
            <div className="text-center">After</div>
          </div>
          {METADATA_ROWS.map((row) => {
            const beforePresent = result.metadataBefore[row.key]
            const afterPresent = result.metadataAfter[row.key]
            const wasRemoved = beforePresent && !afterPresent

            return (
              <div
                key={row.key}
                className="grid grid-cols-[auto_1fr_auto_auto] gap-3 p-3 border-t border-border/30 items-center"
              >
                <div className="font-medium text-foreground">{row.label}</div>
                <div className="flex items-center justify-center gap-2">
                  <StatusIcon present={beforePresent} removed={false} />
                  <StatusText present={beforePresent} removed={false} />
                </div>
                <div className="flex items-center justify-center gap-2">
                  <StatusIcon present={afterPresent} removed={wasRemoved} />
                  <StatusText present={afterPresent} removed={wasRemoved} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {(result.reencoded || !savedSpace) && (
        <div className="p-4 rounded-lg border bg-muted/30">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            <div className="text-sm text-foreground">
              {result.reencoded ? (
                <>
                  <p className="font-medium">Image was re-encoded</p>
                  <p className="mt-1 text-muted-foreground">
                    Lossless metadata stripping was not possible for this image. The image was re-encoded using canvas
                    at JPEG quality {Math.round(jpegQuality * 100)}%. This may result in minor quality loss.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-medium">File size increased</p>
                  <p className="mt-1 text-muted-foreground">
                    The cleaned file is larger than the original. This can happen when metadata is removed from
                    already-optimized images or when re-encoding adds overhead.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatItem({ label, value, highlight, subtext }: { label: string; value: string; highlight?: boolean; subtext?: string }) {
  return (
    <div className={cn('p-4 rounded-xl bg-background/50 border border-border/50 text-center', highlight && 'border-green-200 dark:border-green-800/30 bg-green-50 dark:bg-green-900/10')}>
      <div className="font-mono font-semibold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
      {subtext && <div className={cn('text-xs font-mono mt-1', highlight ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400')}>{subtext}</div>}
    </div>
  )
}