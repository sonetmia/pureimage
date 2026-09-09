'use client'

import { cn } from '@/lib/utils'
import { Slider } from '@/components/ui/slider'
import { AlertCircle, Info } from 'lucide-react'

interface QualitySliderProps {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
}

export function QualitySlider({ value, onChange, disabled = false }: QualitySliderProps) {
  const formattedValue = Math.round(value * 100)

  return (
    <div className="card glass p-4 md:p-6 animate-in">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="font-medium text-foreground">JPEG Fallback Quality</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Used only when JPEG re-encoding is required.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm font-mono text-primary bg-primary/10 px-3 py-1.5 rounded-lg">
          {formattedValue}%
        </div>
      </div>

      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={0.7}
        max={1}
        step={0.01}
        disabled={disabled}
        className="w-full"
        aria-label="JPEG fallback quality"
        aria-valuemin={70}
        aria-valuemax={100}
        aria-valuenow={formattedValue}
      />

      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>70% (smaller file)</span>
        <span>100% (highest quality)</span>
      </div>

      <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border/50">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-muted-foreground" aria-hidden="true" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">How this works:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Pure Image first attempts <strong>lossless metadata stripping</strong> (no quality slider effect)</li>
              <li>If stripping would corrupt the image, it falls back to <strong>canvas re-encoding</strong></li>
              <li>This slider <strong>only affects the fallback re-encoding</strong></li>
              <li>PNG and WebP images are <strong>never affected</strong> by this slider</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}