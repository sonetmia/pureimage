export interface PngChunk {
  type: string
  data: Uint8Array
  offset: number
  length: number
  crc: number
}

const METADATA_CHUNK_TYPES = [
  'iTXt',
  'tEXt',
  'zTXt',
  'eXIf',
  'iCCP',
  'sRGB',
  'cHRM',
  'gAMA',
  'pHYs',
  'tIME',
] as const

export function parsePngChunks(data: Uint8Array): PngChunk[] {
  const chunks: PngChunk[] = []
  let offset = 0

  if (data.length < 8) {
    throw new Error('Invalid PNG: file too small')
  }

  const signature = new TextDecoder().decode(data.slice(0, 8))
  if (signature !== '\x89PNG\r\n\x1a\n') {
    throw new Error('Invalid PNG: bad signature')
  }

  offset = 8

  while (offset < data.length) {
    if (offset + 8 > data.length) {
      throw new Error('Invalid PNG: truncated chunk header')
    }

    const length = (data[offset] << 24) | (data[offset + 1] << 16) | (data[offset + 2] << 8) | data[offset + 3]
    const type = new TextDecoder().decode(data.slice(offset + 4, offset + 8))

    if (offset + 8 + length > data.length) {
      throw new Error('Invalid PNG: chunk data extends beyond file')
    }

    const chunkData = data.slice(offset + 8, offset + 8 + length)
    const crc = (data[offset + 8 + length] << 24) |
      (data[offset + 9 + length] << 16) |
      (data[offset + 10 + length] << 8) |
      data[offset + 11 + length]

    chunks.push({
      type,
      data: chunkData,
      offset,
      length: 12 + length,
      crc,
    })

    offset += 12 + length

    if (type === 'IEND') break
  }

  return chunks
}

export function identifyPngMetadata(chunks: PngChunk[]): {
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
  }

  for (const chunk of chunks) {
    if (chunk.type === 'IHDR' && chunk.data.length >= 8) {
      report.width = (chunk.data[0] << 24) | (chunk.data[1] << 16) | (chunk.data[2] << 8) | chunk.data[3]
      report.height = (chunk.data[4] << 24) | (chunk.data[5] << 16) | (chunk.data[6] << 8) | chunk.data[7]
    } else if (chunk.type === 'eXIf') {
      report.exif = true
    } else if (chunk.type === 'iTXt' || chunk.type === 'tEXt' || chunk.type === 'zTXt') {
      try {
        const text = new TextDecoder().decode(chunk.data)
        if (text.includes('XML') || text.includes('xmp') || text.includes('XMP')) {
          report.xmp = true
        }
        if (text.includes('GPS') || text.includes('gps')) {
          report.gps = true
        }
        if (text.includes('Camera') || text.includes('camera') || text.includes('Make') || text.includes('Model')) {
          report.camera = 'Detected in text chunk'
        }
        if (text.includes('Software') || text.includes('software') || text.includes('Creator')) {
          report.software = 'Detected in text chunk'
        }
        if (text.includes('Create') || text.includes('create') || text.includes('Date')) {
          report.createdAt = 'Detected in text chunk'
        }
      } catch {
      }
    } else if (chunk.type === 'iCCP') {
      report.colorSpace = 'ICC Profile'
    } else if (chunk.type === 'sRGB') {
      report.colorSpace = 'sRGB'
    }
  }

  return report
}

export function stripPngMetadata(data: Uint8Array): Uint8Array {
  const chunks = parsePngChunks(data)
  const output: number[] = []

  const signature = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  output.push(...signature)

  for (const chunk of chunks) {
    const isMetadataChunk = METADATA_CHUNK_TYPES.includes(chunk.type as any)

    if (isMetadataChunk) {
      continue
    }

    const length = chunk.data.length
    output.push(
      (length >> 24) & 0xff,
      (length >> 16) & 0xff,
      (length >> 8) & 0xff,
      length & 0xff
    )

    const typeBytes = new TextEncoder().encode(chunk.type)
    output.push(...typeBytes)

    output.push(...chunk.data)

    output.push(
      (chunk.crc >> 24) & 0xff,
      (chunk.crc >> 16) & 0xff,
      (chunk.crc >> 8) & 0xff,
      chunk.crc & 0xff
    )
  }

  return new Uint8Array(output)
}

export async function processPng(file: File): Promise<{ blob: Blob; reencoded: boolean; metadata: any }> {
  const arrayBuffer = await file.arrayBuffer()
  const data = new Uint8Array(arrayBuffer)

  const originalMetadata = identifyPngMetadata(parsePngChunks(data))
  const strippedData = stripPngMetadata(data)

  const hasMetadata = originalMetadata.exif || originalMetadata.xmp || originalMetadata.gps

  if (!hasMetadata) {
    return {
      blob: file,
      reencoded: false,
      metadata: originalMetadata,
    }
  }

  try {
    const cleanedBlob = new Blob([strippedData], { type: 'image/png' })
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
    return await reencodePng(file, originalMetadata)
  }
}

async function reencodePng(
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
        'image/png'
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