export interface WebpChunk {
  type: string
  data: Uint8Array
  offset: number
  length: number
}

const METADATA_CHUNK_TYPES = ['EXIF', 'XMP ', 'ICCP', 'VP8X'] as const

export function parseWebpChunks(data: Uint8Array): WebpChunk[] {
  const chunks: WebpChunk[] = []
  let offset = 0

  if (data.length < 12) {
    throw new Error('Invalid WebP: file too small')
  }

  const riff = new TextDecoder().decode(data.slice(0, 4))
  if (riff !== 'RIFF') {
    throw new Error('Invalid WebP: not a RIFF container')
  }

  const webp = new TextDecoder().decode(data.slice(8, 12))
  if (webp !== 'WEBP') {
    throw new Error('Invalid WebP: not a WebP file')
  }

  offset = 12

  while (offset < data.length - 8) {
    if (offset + 8 > data.length) break

    const type = new TextDecoder().decode(data.slice(offset, offset + 4))
    let chunkSize = (data[offset + 4] |
      (data[offset + 5] << 8) |
      (data[offset + 6] << 16) |
      (data[offset + 7] << 24)) >>> 0

    if (offset + 8 + chunkSize > data.length) {
      chunkSize = data.length - offset - 8
    }

    const chunkData = data.slice(offset + 8, offset + 8 + chunkSize)

    chunks.push({
      type,
      data: chunkData,
      offset,
      length: 8 + chunkSize + (chunkSize % 2),
    })

    offset += 8 + chunkSize + (chunkSize % 2)

    if (type === 'VP8 ' || type === 'VP8L' || type === 'VP8X') {
      break
    }
  }

  return chunks
}

export function identifyWebpMetadata(chunks: WebpChunk[]): {
  exif: boolean
  xmp: boolean
  c2pa: boolean
  gps: boolean
  camera?: string
  software?: string
  createdAt?: string
  width?: number
  height?: number
  colorSpace?: string
  hasAlpha?: boolean
  isLossless?: boolean
} {
  const report = {
    exif: false,
    xmp: false,
    c2pa: false,
    gps: false,
    camera: undefined as string | undefined,
    software: undefined as string | undefined,
    createdAt: undefined as string | undefined,
    width: undefined as number | undefined,
    height: undefined as number | undefined,
    colorSpace: undefined as string | undefined,
    hasAlpha: undefined as boolean | undefined,
    isLossless: undefined as boolean | undefined,
  }

  for (const chunk of chunks) {
    if (chunk.type === 'VP8X' && chunk.data.length >= 10) {
      report.hasAlpha = (chunk.data[0] & 0x01) !== 0
      const width = chunk.data[4] | (chunk.data[5] << 8) | (chunk.data[6] << 16)
      const height = chunk.data[7] | (chunk.data[8] << 8) | (chunk.data[9] << 16)
      report.width = width + 1
      report.height = height + 1
    } else if (chunk.type === 'VP8L' && chunk.data.length >= 5) {
      report.isLossless = true
      const bits = chunk.data[1] | (chunk.data[2] << 8) | (chunk.data[3] << 16)
      report.width = (bits & 0x3fff) + 1
      report.height = ((bits >> 14) & 0x3fff) + 1
      report.hasAlpha = (chunk.data[0] & 0x01) !== 0
    } else if (chunk.type === 'VP8 ' && chunk.data.length >= 10) {
      report.isLossless = false
      const width = chunk.data[6] | (chunk.data[7] << 8)
      const height = chunk.data[8] | (chunk.data[9] << 8)
      report.width = width & 0x3fff
      report.height = height & 0x3fff
    } else if (chunk.type === 'EXIF') {
      report.exif = true
    } else if (chunk.type === 'XMP ') {
      report.xmp = true
      try {
        const text = new TextDecoder().decode(chunk.data)
        if (text.includes('GPS') || text.includes('gps')) report.gps = true
        if (text.includes('Camera') || text.includes('Make') || text.includes('Model')) report.camera = 'Detected in XMP'
        if (text.includes('Software') || text.includes('CreatorTool')) report.software = 'Detected in XMP'
        if (text.includes('CreateDate') || text.includes('Create Date')) report.createdAt = 'Detected in XMP'
      } catch {
      }
    } else if (chunk.type === 'ICCP') {
      report.colorSpace = 'ICC Profile'
    }
  }

  return report
}

export function stripWebpMetadata(data: Uint8Array): Uint8Array {
  const chunks = parseWebpChunks(data)
  const output: number[] = []

  output.push(...data.slice(0, 12))

  for (const chunk of chunks) {
    const isMetadataChunk = METADATA_CHUNK_TYPES.includes(chunk.type as any)

    if (isMetadataChunk) {
      continue
    }

    const chunkSize = chunk.data.length
    const typeBytes = new TextEncoder().encode(chunk.type)
    output.push(...typeBytes)
    output.push(
      chunkSize & 0xff,
      (chunkSize >> 8) & 0xff,
      (chunkSize >> 16) & 0xff,
      (chunkSize >> 24) & 0xff
    )
    output.push(...chunk.data)

    if (chunkSize % 2 === 1) {
      output.push(0)
    }
  }

  const totalSize = output.length - 8
  output[4] = totalSize & 0xff
  output[5] = (totalSize >> 8) & 0xff
  output[6] = (totalSize >> 16) & 0xff
  output[7] = (totalSize >> 24) & 0xff

  return new Uint8Array(output)
}

export async function processWebp(file: File): Promise<{ blob: Blob; reencoded: boolean; metadata: any }> {
  const arrayBuffer = await file.arrayBuffer()
  const data = new Uint8Array(arrayBuffer)

  const originalMetadata = identifyWebpMetadata(parseWebpChunks(data))
  const strippedData = stripWebpMetadata(data)

  const hasMetadata = originalMetadata.exif || originalMetadata.xmp

  if (!hasMetadata) {
    return {
      blob: file,
      reencoded: false,
      metadata: originalMetadata,
    }
  }

  try {
    const cleanedBlob = new Blob([strippedData], { type: 'image/webp' })
    const testImg = await loadImage(cleanedBlob)
    if (testImg.width !== originalMetadata.width || testImg.height !== originalMetadata.height) {
      throw new Error('Dimension mismatch after stripping')
    }
    return {
      blob: cleanedBlob,
      reencoded: false,
      metadata: originalMetadata,
    }
  } catch {
    return await reencodeWebp(file, originalMetadata)
  }
}

async function reencodeWebp(
  file: File,
  originalMetadata: any
): Promise<{ blob: Blob; reencoded: boolean; metadata: any }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }
      ctx.drawImage(img, 0, 0)
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob'))
            return
          }
          resolve({
            blob,
            reencoded: true,
            metadata: originalMetadata,
          })
        },
        'image/webp',
        1.0
      )
    }
    img.onerror = () => reject(new Error('Failed to load image for re-encoding'))
    img.src = URL.createObjectURL(file)
  })
}

function loadImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(blob)
  })
}