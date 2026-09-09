'use client'

import { cn } from '@/lib/utils'
import {
  Shield,
  FileImage,
  Layers,
  Users,
  Eye,
  Lock,
  CheckCircle,
} from 'lucide-react'

const FEATURES = [
  {
    icon: Shield,
    title: 'EXIF Cleaning',
    description: 'Remove supported embedded EXIF metadata including camera settings, timestamps, and orientation data.',
  },
  {
    icon: FileImage,
    title: 'XMP Cleaning',
    description: 'Strip Adobe XMP metadata packets containing editing history, rights management, and custom properties.',
  },
  {
    icon: Layers,
    title: 'C2PA / JUMBF Cleaning',
    description: 'Remove supported embedded provenance containers and content credentials where safely detected.',
  },
  {
    icon: Users,
    title: 'Bulk Processing',
    description: 'Process up to 10 images in a single session with individual status tracking and batch downloads.',
  },
  {
    icon: Eye,
    title: 'Quality Preservation',
    description: 'Lossless metadata stripping first. Canvas re-encoding only as fallback. Dimensions and format preserved.',
  },
  {
    icon: Lock,
    title: 'Private by Design',
    description: '100% local processing. Your images never leave your device. No uploads, no cloud, no account needed.',
  },
] as const

export function FeatureGrid() {
  return (
    <section aria-labelledby="features-heading" className="py-16 md:py-24">
      <div className="container-padding mx-auto max-w-6xl">
        <header className="text-center max-w-2xl mx-auto mb-12 animate-in">
          <h2 id="features-heading" className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Built for privacy and quality
          </h2>
          <p className="text-lg text-muted-foreground">
            Pure Image combines powerful metadata cleaning with a privacy-first architecture.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, index) => (
            <article
              key={feature.title}
              className={cn(
                'card glass-strong p-6 md:p-8 transition-all duration-300 hover:shadow-xl hover:border-border/60',
                'animate-in'
              )}
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-primary" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </article>
          ))}
        </div>

        <div className="mt-12 animate-in stagger-1">
          <div className="card glass p-6 md:p-8">
            <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" aria-hidden="true" />
              Technical Guarantees
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <GuaranteeItem label="Width & height preserved" />
              <GuaranteeItem label="Aspect ratio maintained" />
              <GuaranteeItem label="Original format kept (when possible)" />
              <GuaranteeItem label="PNG transparency preserved" />
              <GuaranteeItem label="WebP transparency preserved" />
              <GuaranteeItem label="No PNG → JPEG conversion" />
              <GuaranteeItem label="No WebP → JPEG conversion" />
              <GuaranteeItem label="Lossless stripping prioritized" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function GuaranteeItem({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}

import { CheckCircle } from 'lucide-react'