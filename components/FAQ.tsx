'use client'

import { useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface FAQItem {
  question: string
  answer: ReactNode
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: 'What is EXIF metadata?',
    answer: (
      <p className="text-muted-foreground">
        EXIF (Exchangeable Image File Format) is a standard that specifies formats for images, sound, and ancillary tags
        used by digital cameras and smartphones. It includes information like camera model, aperture, shutter speed, ISO,
        focal length, date/time, GPS coordinates, and orientation. Pure Image removes supported EXIF data from your images.
      </p>
    ),
  },
  {
    question: 'What is XMP metadata?',
    answer: (
      <p className="text-muted-foreground">
        XMP (Extensible Metadata Platform) is an ISO standard for creating, processing, and interchanging standardized
        and custom metadata for digital documents. It's often embedded by Adobe applications and can contain editing
        history, copyright info, ratings, keywords, and rights management data. Pure Image strips supported XMP packets.
      </p>
    ),
  },
  {
    question: 'What is C2PA?',
    answer: (
      <div className="space-y-2 text-muted-foreground">
        <p>
          C2PA (Coalition for Content Provenance and Authenticity) is an open technical standard for certifying the
          source and history of media content. It uses JUMBF (JPEG Universal Metadata Box Format) containers to embed
          provenance information like creation tools, editing actions, and digital signatures.
        </p>
        <p>
          Pure Image removes <strong>supported embedded C2PA/JUMBF containers</strong> where they can be safely detected
          and removed without corrupting the image. Not all C2PA implementations may be removable.
        </p>
      </div>
    ),
  },
  {
    question: 'Are my images uploaded?',
    answer: (
      <p className="text-muted-foreground font-medium">
        No. Pure Image processes images entirely in your browser using Web Workers and Canvas APIs.
        Your files never leave your device. There is no server-side image processing, no cloud storage, and no uploads.
      </p>
    ),
  },
  {
    question: 'Does Pure Image reduce image quality?',
    answer: (
      <div className="space-y-2 text-muted-foreground">
        <p>
          Pure Image prioritizes <strong>lossless metadata stripping</strong> — removing metadata without re-encoding
          pixels. Your image dimensions, format, and visual quality are preserved whenever technically possible.
        </p>
        <p>
          Only when lossless stripping would corrupt the image (rare edge cases) does it fall back to canvas re-encoding.
          In that case, a JPEG quality slider (70–100%) controls the fallback. PNG and WebP are never affected by this slider.
        </p>
      </div>
    ),
  },
  {
    question: 'Can I process multiple images at once?',
    answer: (
      <p className="text-muted-foreground">
        Yes. You can add up to 10 images per batch (15 MB each). Each image is processed sequentially to manage memory,
        with individual progress tracking. You can download cleaned images individually or all at once.
      </p>
    ),
  },
  {
    question: 'What metadata can Pure Image remove?',
    answer: (
      <div className="space-y-2 text-muted-foreground">
        <p>Pure Image targets the following embedded metadata types:</p>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>EXIF:</strong> Camera settings, timestamps, GPS, orientation, thumbnails</li>
          <li><strong>XMP:</strong> Adobe metadata, editing history, rights, custom properties</li>
          <li><strong>C2PA/JUMBF:</strong> Supported provenance containers and content credentials</li>
          <li><strong>PNG chunks:</strong> iTXt, tEXt, zTXt, eXIf, iCCP, sRGB, cHRM, gAMA, pHYs, tIME</li>
          <li><strong>WebP chunks:</strong> EXIF, XMP, ICCP</li>
        </ul>
        <p className="mt-2">
          Metadata that cannot be confidently identified is reported as <strong>Not detected</strong> rather than
          falsely claiming removal.
        </p>
      </div>
    ),
  },
  {
    question: 'Does removing metadata guarantee removal of social-media AI labels?',
    answer: (
      <div className="space-y-2 text-muted-foreground">
        <p className="font-medium">
          <strong>No.</strong> Metadata cleaning removes supported embedded metadata, but social platforms may use
          additional signals independent of embedded metadata.
        </p>
        <p>
          Platforms like Instagram and Facebook may analyze pixel content, use perceptual hashing, check upload patterns,
          or apply server-side watermarking. Pure Image only removes <em>embedded metadata</em> and cannot control
          how third-party platforms label or classify your content.
        </p>
      </div>
    ),
  },
] as const

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section aria-labelledby="faq-heading" className="py-16 md:py-24 bg-muted/30">
      <div className="container-padding mx-auto max-w-3xl">
        <header className="text-center mb-12 animate-in">
          <h2 id="faq-heading" className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to know about Pure Image.
          </p>
        </header>

        <dl className="space-y-4" role="list">
          {FAQ_ITEMS.map((item, index) => (
            <FAQItemComponent
              key={index}
              index={index}
              question={item.question}
              answer={item.answer}
              isOpen={openIndex === index}
              onToggle={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </dl>
      </div>
    </section>
  )
}

function FAQItemComponent({
  index,
  question,
  answer,
  isOpen,
  onToggle,
}: {
  index: number
  question: string
  answer: ReactNode
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <div className="card glass overflow-hidden animate-in" style={{ animationDelay: `${index * 50}ms` }}>
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between gap-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-expanded={isOpen}
        aria-controls={`faq-answer-${index}`}
      >
        <span className="font-medium text-foreground pr-4">{question}</span>
        <div className="flex-shrink-0">
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
          )}
        </div>
      </button>
      <div
        id={`faq-answer-${index}`}
        role="region"
        className={cn('px-6 pb-4 transition-all duration-300 overflow-hidden', isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0')}
        aria-hidden={!isOpen}
      >
        <div className="prose prose-sm dark:prose-invert max-w-none">{answer}</div>
      </div>
    </div>
  )
}