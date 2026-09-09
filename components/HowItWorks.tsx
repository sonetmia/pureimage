'use client'

import { cn } from '@/lib/utils'
import { Shield, ScanEye, Cpu, Download, CheckCircle } from 'lucide-react'

const STEPS = [
  {
    number: '01',
    icon: Shield,
    title: 'Select Images',
    description: 'Drag and drop up to 10 JPG, PNG, or WebP images (15 MB each). Files are validated locally.',
  },
  {
    number: '02',
    icon: ScanEye,
    title: 'Scan Metadata',
    description: 'Each image is scanned for EXIF, XMP, C2PA/JUMBF, GPS, and other embedded metadata.',
  },
  {
    number: '03',
    icon: Cpu,
    title: 'Process Locally',
    description: 'Metadata is stripped losslessly in your browser using Web Workers. No server involved.',
  },
  {
    number: '04',
    icon: CheckCircle,
    title: 'Verify Results',
    description: 'Output is re-scanned to confirm metadata removal. Before/after comparison shown.',
  },
  {
    number: '05',
    icon: Download,
    title: 'Download Cleaned',
    description: 'Download individual images or all at once. Original files remain untouched on your device.',
  },
] as const

export function HowItWorks() {
  return (
    <section aria-labelledby="how-it-works-heading" className="py-16 md:py-24">
      <div className="container-padding mx-auto max-w-6xl">
        <header className="text-center max-w-2xl mx-auto mb-16 animate-in">
          <h2 id="how-it-works-heading" className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            How it works
          </h2>
          <p className="text-lg text-muted-foreground">
            Five simple steps to cleaner images — all on your device.
          </p>
        </header>

        <div className="relative">
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/30 via-transparent to-transparent -translate-x-1/2" aria-hidden="true" />

          <div className="space-y-12">
            {STEPS.map((step, index) => (
              <article
                key={step.number}
                className={cn(
                  'flex flex-col md:flex-row gap-8 items-start relative',
                  'animate-in'
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex-shrink-0 w-14 md:w-20 text-center">
                  <div className="relative">
                    <span className="text-2xl md:text-3xl font-bold text-primary/20">{step.number}</span>
                    {index < STEPS.length - 1 && (
                      <div className="hidden lg:block absolute left-1/2 top-10 bottom-14 w-0.5 bg-border/50 -translate-x-1/2" aria-hidden="true" />
                    )}
                  </div>
                </div>

                <div className="flex-1 md:flex-[0_0_50%]">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 mx-auto md:mx-0">
                    <step.icon className="w-6 h-6 md:w-7 md:h-7 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-2 text-center md:text-left">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-center md:text-left">{step.description}</p>
                </div>

                {index % 2 === 1 && <div className="flex-1 md:flex-[0_0_50%]" />}
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}