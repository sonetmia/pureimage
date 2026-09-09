'use client'

import { useCallback, useMemo, useState } from 'react'
import { ShieldCheck, Sparkles, Zap, Lock, ArrowDownToLine } from 'lucide-react'
import { UploadZone } from '@/components/UploadZone'
import { BatchQueue } from '@/components/BatchQueue'
import { FeatureGrid } from '@/components/FeatureGrid'
import { HowItWorks } from '@/components/HowItWorks'
import { FAQ } from '@/components/FAQ'
import { ThemeToggle } from '@/components/ThemeToggle'
import { QualitySlider } from '@/components/QualitySlider'
import { stripMetadata, scanMetadata } from '@/lib/imageProcessor'
import { downloadBlob } from '@/lib/download'
import { generateCleanedFilename } from '@/lib/utils'
import { validateFile } from '@/lib/validation'
import type { MetadataReport, ProcessingResult, QueueItem } from '@/lib/types'

const INITIAL_QUALITY = 1

export default function HomePage() {
  const [items, setItems] = useState<QueueItem[]>([])
  const [jpegQuality, setJpegQuality] = useState(INITIAL_QUALITY)
  const [isProcessing, setIsProcessing] = useState(false)

  const processingCount = useMemo(
    () => items.filter((item) => item.status === 'scanning' || item.status === 'processing').length,
    [items]
  )

  const addFiles = useCallback(async (files: File[]) => {
    const accepted: QueueItem[] = []

    for (const file of files) {
      const validation = await validateFile(file)
      if (!validation.valid) continue

      const previewUrl = URL.createObjectURL(file)
      accepted.push({
        id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
        file,
        previewUrl,
        status: 'waiting',
        progress: 0,
      })
    }

    if (accepted.length) {
      setItems((current) => [...current, ...accepted])
    }
  }, [])

  const updateItem = useCallback((id: string, patch: Partial<QueueItem>) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }, [])

  const processOne = useCallback(async (id: string) => {
    const item = items.find((candidate) => candidate.id === id)
    if (!item || item.status === 'processing' || item.status === 'scanning') return

    setIsProcessing(true)
    updateItem(id, { status: 'scanning', progress: 10, error: undefined })

    try {
      const metadataBefore = await scanMetadata(item.file)
      updateItem(id, { originalMetadata: metadataBefore, status: 'processing', progress: 30 })

      const blob = await stripMetadata(item.file, { jpegQuality })
      updateItem(id, { progress: 80 })

      const metadataAfter = await scanMetadata(blob)
      const dimensions = await getImageDimensions(blob)
      const originalDimensions = await getImageDimensions(item.file)

      const result: ProcessingResult = {
        success: true,
        originalBlob: item.file,
        cleanedBlob: blob,
        originalSize: item.file.size,
        cleanedSize: blob.size,
        originalDimensions,
        cleanedDimensions: dimensions,
        format: blob.type || item.file.type,
        metadataBefore,
        metadataAfter,
        reencoded: false,
      }

      updateItem(id, { status: 'completed', progress: 100, result, originalMetadata: metadataBefore })
    } catch (error) {
      updateItem(id, {
        status: 'error',
        progress: 0,
        error: error instanceof Error ? error.message : 'Unable to process this image.',
      })
    } finally {
      setIsProcessing(false)
    }
  }, [items, jpegQuality, updateItem])

  const processAll = useCallback(async () => {
    if (isProcessing) return
    const waitingIds = items.filter((item) => item.status === 'waiting').map((item) => item.id)
    for (const id of waitingIds) {
      await processOne(id)
    }
  }, [isProcessing, items, processOne])

  const removeItem = useCallback((id: string) => {
    setItems((current) => {
      const item = current.find((candidate) => candidate.id === id)
      if (item) URL.revokeObjectURL(item.previewUrl)
      return current.filter((candidate) => candidate.id !== id)
    })
  }, [])

  const clearAll = useCallback(() => {
    if (isProcessing) return
    items.forEach((item) => URL.revokeObjectURL(item.previewUrl))
    setItems([])
  }, [isProcessing, items])

  const downloadItem = useCallback((item: QueueItem) => {
    if (!item.result) return
    downloadBlob(item.result.cleanedBlob, generateCleanedFilename(item.file.name))
  }, [])

  const downloadAll = useCallback(() => {
    items.forEach((item, index) => {
      if (!item.result) return
      window.setTimeout(() => downloadItem(item), index * 150)
    })
  }, [downloadItem, items])

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container-padding mx-auto max-w-6xl h-16 flex items-center justify-between">
          <a href="#top" className="flex items-center gap-2 font-semibold" aria-label="Pure Image home">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-lg tracking-tight">Pure Image</span>
          </a>
          <div className="flex items-center gap-2">
            <a href="#how-it-works" className="hidden sm:inline-flex btn-ghost text-sm">How it works</a>
            <a href="#faq" className="hidden sm:inline-flex btn-ghost text-sm">FAQ</a>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <section id="top" className="relative overflow-hidden py-20 md:py-28">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,theme(colors.primary/0.10),transparent_45%)]" />
        <div className="container-padding relative mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            100% Local Processing
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Clean Your Image. Keep Your Privacy.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            Remove EXIF, XMP and supported embedded provenance metadata directly in your browser. Your files never leave your device.
          </p>

          <div className="mx-auto mt-10 max-w-4xl rounded-3xl border border-border/60 bg-card/60 p-3 shadow-2xl shadow-primary/5 backdrop-blur-xl sm:p-5">
            <UploadZone
              onFilesSelect={addFiles}
              maxFiles={10}
              maxFileSize={15 * 1024 * 1024}
              acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
              currentFileCount={items.length}
              disabled={isProcessing}
            />
          </div>

          <div className="mx-auto mt-5 flex max-w-xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" /> No uploads</span>
            <span className="inline-flex items-center gap-1.5"><Zap className="h-4 w-4" /> Fast browser processing</span>
            <span className="inline-flex items-center gap-1.5"><Lock className="h-4 w-4" /> No account</span>
          </div>
        </div>
      </section>

      {items.length > 0 && (
        <section className="container-padding mx-auto max-w-6xl pb-16">
          <div className="mb-4 flex flex-col gap-4 rounded-2xl border border-border/50 bg-card/50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold">Processing settings</h2>
              <p className="text-sm text-muted-foreground">Lossless cleaning is preferred. The JPEG setting is used only if fallback re-encoding is required.</p>
            </div>
            <QualitySlider value={jpegQuality} onChange={setJpegQuality} />
          </div>
          <BatchQueue
            items={items}
            onRemove={removeItem}
            onProcess={processOne}
            onProcessAll={processAll}
            onClearAll={clearAll}
            onDownload={downloadItem}
            onDownloadAll={downloadAll}
            isProcessing={isProcessing}
            processingCount={processingCount}
            jpegQuality={jpegQuality}
          />
        </section>
      )}

      <HowItWorks />
      <FeatureGrid />

      <section className="container-padding mx-auto max-w-6xl py-16 md:py-24">
        <div className="card glass-strong mx-auto max-w-4xl p-8 text-center md:p-12">
          <ArrowDownToLine className="mx-auto mb-4 h-8 w-8 text-primary" aria-hidden="true" />
          <h2 className="text-2xl font-bold md:text-3xl">Private image cleaning, right in your browser</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Pure Image is designed to keep your files local. Metadata cleaning happens on your device instead of on a remote image-processing service.
          </p>
        </div>
      </section>

      <div id="faq"><FAQ /></div>

      <footer className="border-t border-border/50 py-10">
        <div className="container-padding mx-auto flex max-w-6xl flex-col gap-3 text-center text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <p>© {new Date().getFullYear()} Pure Image. Built for privacy.</p>
          <p>Embedded metadata cleaning does not control third-party platform labeling.</p>
        </div>
      </footer>
    </main>
  )
}

async function getImageDimensions(blob: Blob): Promise<{ width: number; height: number }> {
  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(blob)
    const dimensions = { width: bitmap.width, height: bitmap.height }
    bitmap.close()
    return dimensions
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      const dimensions = { width: img.naturalWidth, height: img.naturalHeight }
      URL.revokeObjectURL(url)
      resolve(dimensions)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to read image dimensions.'))
    }
    img.src = url
  })
}
