import { processJpeg, parseJpegSegments, identifyMetadataSegments } from './processors/jpegProcessor'
import { processPng, parsePngChunks, identifyPngMetadata } from './processors/pngProcessor'
import { processWebp, parseWebpChunks, identifyWebpMetadata } from './processors/webpProcessor'
import type { MetadataReport, ProcessingResult } from './types'

export async function stripMetadata(
  file: File,
  options: { jpegQuality?: number } = {}
): Promise<Blob> {
  const jpegQuality = options.jpegQuality ?? 1

  switch (file.type) {
    case 'image/jpeg':
      return (await processJpeg(file, jpegQuality)).blob
    case 'image/png':
      return (await processPng(file)).blob
    case 'image/webp':
      return (await processWebp(file)).blob
    default:
      throw new Error(`Unsupported file type: ${file.type}`)
  }
}

export async function processImage(
  file: File,
  options: { jpegQuality?: number } = {}
): Promise<ProcessingResult> {
  const originalMetadata = await scanMetadata(file)
  const jpegQuality = options.jpegQuality ?? 1

  let result: { blob: Blob; reencoded: boolean }

  switch (file.type) {
    case 'image/jpeg': {
      const processed = await processJpeg(file, jpegQuality)
      result = { blob: processed.blob, reencoded: processed.reencoded }
      break
    }
    case 'image/png': {
      const processed = await processPng(file)
      result = { blob: processed.blob, reencoded: processed.reencoded }
      break
    }
    case 'image/webp': {
      const processed = await processWebp(file)
      result = { blob: processed.blob, reencoded: processed.reencoded }
      break
    }
    default:
      throw new Error(`Unsupported file type: ${file.type}`)
  }

  const originalDimensions = await getImageDimensions(file)
  const cleanedDimensions = await getImageDimensions(result.blob)
  const metadataAfter = await scanMetadata(result.blob)

  if (
    originalDimensions.width !== cleanedDimensions.width ||
    originalDimensions.height !== cleanedDimensions.height
  ) {
    throw new Error('Image dimensions changed during processing. The cleaned image was not accepted.')
  }

  return {
    success: true,
    originalBlob: file,
    cleanedBlob: result.blob,
    originalSize: file.size,
    cleanedSize: result.blob.size,
    originalDimensions,
    cleanedDimensions,
    format: result.blob.type || file.type,
    metadataBefore: originalMetadata,
    metadataAfter,
    reencoded: result.reencoded,
  }
}

export async function scanMetadata(blob: Blob): Promise<MetadataReport> {
  const arrayBuffer = await blob.arrayBuffer()
  const data = new Uint8Array(arrayBuffer)
  const type = blob.type

  switch (type) {
    case 'image/jpeg':
      return identifyMetadataSegments(parseJpegSegments(data))
    case 'image/png':
      return identifyPngMetadata(parsePngChunks(data))
    case 'image/webp':
      return identifyWebpMetadata(parseWebpChunks(data))
    default:
      return { exif: false, xmp: false, c2pa: false, gps: false }
  }
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
      reject(new Error('Failed to load image for dimension check'))
    }
    img.src = url
  })
}
