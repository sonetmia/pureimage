import { processJpeg } from './jpegProcessor'
import { processPng } from './pngProcessor'
import { processWebp } from './webpProcessor'
import { MetadataReport, ProcessingResult } from '../types'

export async function stripMetadata(
  file: File,
  options: { jpegQuality?: number } = {}
): Promise<ProcessingResult> {
  const jpegQuality = options.jpegQuality ?? 1.0

  let result: { blob: Blob; reencoded: boolean; metadata: MetadataReport }

  switch (file.type) {
    case 'image/jpeg':
      result = await processJpeg(file, jpegQuality)
      break
    case 'image/png':
      result = await processPng(file)
      break
    case 'image/webp':
      result = await processWebp(file)
      break
    default:
      throw new Error(`Unsupported file type: ${file.type}`)
  }

  const originalDimensions = await getImageDimensions(file)
  const cleanedDimensions = await getImageDimensions(result.blob)

  return {
    success: true,
    originalBlob: file,
    cleanedBlob: result.blob,
    originalSize: file.size,
    cleanedSize: result.blob.size,
    originalDimensions,
    cleanedDimensions,
    format: file.type,
    metadataBefore: result.metadata,
    metadataAfter: {
      exif: false,
      xmp: false,
      c2pa: false,
      gps: false,
    },
    reencoded: result.reencoded,
  }
}

async function getImageDimensions(blob: Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.width, height: img.height })
      URL.revokeObjectURL(img.src)
    }
    img.onerror = () => {
      reject(new Error('Failed to load image for dimension check'))
      URL.revokeObjectURL(img.src)
    }
    img.src = URL.createObjectURL(blob)
  })
}

export async function scanMetadata(file: File): Promise<MetadataReport> {
  const arrayBuffer = await file.arrayBuffer()
  const data = new Uint8Array(arrayBuffer)

  switch (file.type) {
    case 'image/jpeg': {
      const { parseJpegSegments, identifyMetadataSegments } = await import('./jpegProcessor')
      const segments = parseJpegSegments(data)
      return identifyMetadataSegments(segments)
    }
    case 'image/png': {
      const { parsePngChunks, identifyPngMetadata } = await import('./pngProcessor')
      const chunks = parsePngChunks(data)
      return identifyPngMetadata(chunks)
    }
    case 'image/webp': {
      const { parseWebpChunks, identifyWebpMetadata } = await import('./webpProcessor')
      const chunks = parseWebpChunks(data)
      return identifyWebpMetadata(chunks)
    }
    default:
      return {
        exif: false,
        xmp: false,
        c2pa: false,
        gps: false,
      }
  }
}