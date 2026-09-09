'use client'

import { cn } from '@/lib/utils'
import { MetadataReport } from '@/lib/types'
import { CheckCircle, XCircle, MinusCircle, HelpCircle } from 'lucide-react'

interface MetadataViewerProps {
  before: MetadataReport
  after?: MetadataReport
  title?: string
  compact?: boolean
}

const METADATA_ROWS: Array<{
  key: keyof MetadataReport
  label: string
  icon: React.ReactNode
  trueLabel: string
  falseLabel: string
  unknownLabel: string
}> = [
  {
    key: 'exif',
    label: 'EXIF',
    icon: <CheckCircle className="w-4 h-4" aria-hidden="true" />,
    trueLabel: 'Found',
    falseLabel: 'Removed',
    unknownLabel: 'Not detected',
  },
  {
    key: 'xmp',
    label: 'XMP',
    icon: <CheckCircle className="w-4 h-4" aria-hidden="true" />,
    trueLabel: 'Found',
    falseLabel: 'Removed',
    unknownLabel: 'Not detected',
  },
  {
    key: 'c2pa',
    label: 'C2PA / JUMBF',
    icon: <CheckCircle className="w-4 h-4" aria-hidden="true" />,
    trueLabel: 'Found',
    falseLabel: 'Removed',
    unknownLabel: 'Not detected',
  },
  {
    key: 'gps',
    label: 'GPS Location',
    icon: <CheckCircle className="w-4 h-4" aria-hidden="true" />,
    trueLabel: 'Found',
    falseLabel: 'Removed',
    unknownLabel: 'Not detected',
  },
  {
    key: 'camera',
    label: 'Camera Info',
    icon: <CheckCircle className="w-4 h-4" aria-hidden="true" />,
    trueLabel: 'Found',
    falseLabel: 'Removed',
    unknownLabel: 'Not detected',
  },
  {
    key: 'software',
    label: 'Software',
    icon: <CheckCircle className="w-4 h-4" aria-hidden="true" />,
    trueLabel: 'Found',
    falseLabel: 'Removed',
    unknownLabel: 'Not detected',
  },
  {
    key: 'createdAt',
    label: 'Creation Date',
    icon: <CheckCircle className="w-4 h-4" aria-hidden="true" />,
    trueLabel: 'Found',
    falseLabel: 'Removed',
    unknownLabel: 'Not detected',
  },
]

function getStatus(value: boolean | string | undefined, hasAfter: boolean): 'found' | 'removed' | 'unknown' {
  if (value === true || (typeof value === 'string' && value.length > 0)) {
    return hasAfter ? 'removed' : 'found'
  }
  return 'unknown'
}

function StatusBadge({ status, compact }: { status: 'found' | 'removed' | 'unknown'; compact?: boolean }) {
  const configs = {
    found: {
      icon: <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" />,
      label: 'Found',
      className: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    },
    removed: {
      icon: <XCircle className="w-3.5 h-3.5" aria-hidden="true" />,
      label: 'Removed',
      className: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
    },
    unknown: {
      icon: <MinusCircle className="w-3.5 h-3.5" aria-hidden="true" />,
      label: 'Not detected',
      className: 'bg-muted text-muted-foreground border-border',
    },
  }

  const config = configs[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
        compact && 'px-2 py-0.5',
        config.className
      )}
    >
      {config.icon}
      <span>{config.label}</span>
    </span>
  )
}

export function MetadataViewer({ before, after, title, compact = false }: MetadataViewerProps) {
  const hasAfter = !!after

  return (
    <div className={cn('space-y-3', compact && 'space-y-2')}>
      {title && (
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      )}
      <div className={cn('rounded-lg border border-border/50 overflow-hidden', compact && 'p-3', 'p-4')}>
        <div className="grid grid-cols-[auto_1fr_auto] gap-3 items-center" role="table" aria-label="Metadata comparison">
          <div className="font-medium text-muted-foreground px-2" aria-hidden="true">Metadata</div>
          <div className="font-medium text-muted-foreground text-center" aria-hidden="true">Before</div>
          <div className="font-medium text-muted-foreground text-center" aria-hidden="true">After</div>

          {METADATA_ROWS.map((row) => {
            const beforeValue = before[row.key]
            const afterValue = after?.[row.key]
            const beforeStatus = getStatus(beforeValue, hasAfter)
            const afterStatus = hasAfter ? getStatus(afterValue, false) : 'unknown'

            const isStringValue = typeof beforeValue === 'string' && beforeValue.length > 0
            const displayValue = isStringValue ? beforeValue : undefined

            return (
              <div
                key={row.key}
                className="grid grid-cols-[auto_1fr_auto] gap-3 items-center py-2 px-2 border-t border-border/30 first:border-0"
              >
                <div className="flex items-center gap-2 text-sm text-foreground">
                  {row.icon}
                  <span>{row.label}</span>
                  {displayValue && !compact && (
                    <span className="text-xs text-muted-foreground px-2 py-0.5 rounded bg-muted">
                      {displayValue.length > 30 ? displayValue.slice(0, 30) + '…' : displayValue}
                    </span>
                  )}
                </div>
                <div className="flex justify-center">
                  <StatusBadge status={beforeStatus} compact={compact} />
                </div>
                <div className="flex justify-center">
                  {hasAfter ? (
                    <StatusBadge status={afterStatus} compact={compact} />
                  ) : (
                    <HelpCircle className="w-4 h-4 text-muted-foreground" aria-label="Will be scanned after processing" />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {!hasAfter && !compact && (
        <p className="text-xs text-muted-foreground text-center">
          After metadata will appear here once processing is complete.
        </p>
      )}
    </div>
  )
}