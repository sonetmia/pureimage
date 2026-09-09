import { parseJpegSegments, stripJpegMetadata, identifyMetadataSegments } from '../lib/processors/jpegProcessor'
import { parsePngChunks, stripPngMetadata, identifyPngMetadata } from '../lib/processors/pngProcessor'
import { parseWebpChunks, stripWebpMetadata, identifyWebpMetadata } from '../lib/processors/webpProcessor'

type WorkerMessage =
  | { type: 'SCAN'; fileData: ArrayBuffer; mimeType: string; id: string }
  | { type: 'STRIP'; fileData: ArrayBuffer; mimeType: string; id: string; quality: number }

type WorkerResponse =
  | { type: 'SCAN_RESULT'; id: string; metadata: any }
  | { type: 'STRIP_RESULT'; id: string; data: Uint8Array; reencoded: boolean; metadata: any }
  | { type: 'ERROR'; id: string; error: string }

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const msg = event.data

  try {
    if (msg.type === 'SCAN') {
      const metadata = await scanInWorker(msg.fileData, msg.mimeType)
      self.postMessage({ type: 'SCAN_RESULT', id: msg.id, metadata } as WorkerResponse)
    } else if (msg.type === 'STRIP') {
      const result = await stripInWorker(msg.fileData, msg.mimeType, msg.quality)
      self.postMessage({ type: 'STRIP_RESULT', id: msg.id, ...result } as WorkerResponse)
    }
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      id: msg.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    } as WorkerResponse)
  }
}

async function scanInWorker(fileData: ArrayBuffer, mimeType: string): Promise<any> {
  const data = new Uint8Array(fileData)

  switch (mimeType) {
    case 'image/jpeg': {
      const segments = parseJpegSegments(data)
      return identifyMetadataSegments(segments)
    }
    case 'image/png': {
      const chunks = parsePngChunks(data)
      return identifyPngMetadata(chunks)
    }
    case 'image/webp': {
      const chunks = parseWebpChunks(data)
      return identifyWebpMetadata(chunks)
    }
    default:
      return { exif: false, xmp: false, c2pa: false, gps: false }
  }
}

async function stripInWorker(
  fileData: ArrayBuffer,
  mimeType: string,
  quality: number
): Promise<{ data: Uint8Array; reencoded: boolean; metadata: any }> {
  const data = new Uint8Array(fileData)

  switch (mimeType) {
    case 'image/jpeg': {
      const segments = parseJpegSegments(data)
      const metadata = identifyMetadataSegments(segments)
      const hasMetadata = metadata.exif || metadata.xmp || metadata.c2pa || metadata.gps

      if (!hasMetadata) {
        return { data, reencoded: false, metadata }
      }

      const strippedData = stripJpegMetadata(data)

      try {
        const blob = new Blob([strippedData], { type: 'image/jpeg' })
        const img = await createImageBitmap(blob)
        if (img.width !== metadata.width || img.height !== metadata.height) {
          throw new Error('Dimension mismatch')
        }
        img.close()
        return { data: strippedData, reencoded: false, metadata }
      } catch {
        return await reencodeJpegInWorker(fileData, quality, metadata)
      }
    }
    case 'image/png': {
      const chunks = parsePngChunks(data)
      const metadata = identifyPngMetadata(chunks)
      const hasMetadata = metadata.exif || metadata.xmp || metadata.gps

      if (!hasMetadata) {
        return { data, reencoded: false, metadata }
      }

      const strippedData = stripPngMetadata(data)

      try {
        const blob = new Blob([strippedData], { type: 'image/png' })
        const img = await createImageBitmap(blob)
        if (img.width !== metadata.width || img.height !== metadata.height) {
          throw new Error('Dimension mismatch')
        }
        img.close()
        return { data: strippedData, reencoded: false, metadata }
      } catch {
        return await reencodePngInWorker(fileData, metadata)
      }
    }
    case 'image/webp': {
      const chunks = parseWebpChunks(data)
      const metadata = identifyWebpMetadata(chunks)
      const hasMetadata = metadata.exif || metadata.xmp

      if (!hasMetadata) {
        return { data, reencoded: false, metadata }
      }

      const strippedData = stripWebpMetadata(data)

      try {
        const blob = new Blob([strippedData], { type: 'image/webp' })
        const img = await createImageBitmap(blob)
        if (img.width !== metadata.width || img.height !== metadata.height) {
          throw new Error('Dimension mismatch')
        }
        img.close()
        return { data: strippedData, reencoded: false, metadata }
      } catch {
        return await reencodeWebpInWorker(fileData, metadata)
      }
    }
    default:
      throw new Error(`Unsupported mime type: ${mimeType}`)
  }
}

async function reencodeJpegInWorker(
  fileData: ArrayBuffer,
  quality: number,
  metadata: any
): Promise<{ data: Uint8Array; reencoded: boolean; metadata: any }> {
  const blob = new Blob([fileData], { type: 'image/jpeg' })
  const bitmap = await createImageBitmap(blob)

  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to get OffscreenCanvas context')

  ctx.drawImage(bitmap, 0, 0)
  bitmap.close()

  const reencodedBlob = await canvas.convertToBlob({ type: 'image/jpeg', quality })
  const reencodedData = new Uint8Array(await reencodedBlob.arrayBuffer())

  return { data: reencodedData, reencoded: true, metadata }
}

async function reencodePngInWorker(
  fileData: ArrayBuffer,
  metadata: any
): Promise<{ data: Uint8Array; reencoded: boolean; metadata: any }> {
  const blob = new Blob([fileData], { type: 'image/png' })
  const bitmap = await createImageBitmap(blob)

  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to get OffscreenCanvas context')

  ctx.drawImage(bitmap, 0, 0)
  bitmap.close()

  const reencodedBlob = await canvas.convertToBlob({ type: 'image/png' })
  const reencodedData = new Uint8Array(await reencodedBlob.arrayBuffer())

  return { data: reencodedData, reencoded: true, metadata }
}

async function reencodeWebpInWorker(
  fileData: ArrayBuffer,
  metadata: any
): Promise<{ data: Uint8Array; reencoded: boolean; metadata: any }> {
  const blob = new Blob([fileData], { type: 'image/webp' })
  const bitmap = await createImageBitmap(blob)

  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to get OffscreenCanvas context')

  ctx.drawImage(bitmap, 0, 0)
  bitmap.close()

  const reencodedBlob = await canvas.convertToBlob({ type: 'image/webp', quality: 1.0 })
  const reencodedData = new Uint8Array(await reencodedBlob.arrayBuffer())

  return { data: reencodedData, reencoded: true, metadata }
}