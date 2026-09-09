export interface JpegSegment {
  marker: number
  data: Uint8Array
  offset: number
  length: number
}

const JPEG_MARKERS = {
  SOI: 0xd8,
  EOI: 0xd9,
  APP0: 0xe0,
  APP1: 0xe1,
  APP2: 0xe2,
  APP3: 0xe3,
  APP4: 0xe4,
  APP5: 0xe5,
  APP6: 0xe6,
  APP7: 0xe7,
  APP8: 0xe8,
  APP9: 0xe9,
  APP10: 0xea,
  APP11: 0xeb,
  APP12: 0xec,
  APP13: 0xed,
  APP14: 0xee,
  APP15: 0xef,
  DQT: 0xdb,
  DHT: 0xc4,
  SOF0: 0xc0,
  SOF1: 0xc1,
  SOF2: 0xc2,
  SOF3: 0xc3,
  SOF5: 0xc5,
  SOF6: 0xc6,
  SOF7: 0xc7,
  SOF9: 0xc9,
  SOF10: 0xca,
  SOF11: 0xcb,
  SOF13: 0xcd,
  SOF14: 0xce,
  SOF15: 0xcf,
  SOS: 0xda,
  DRI: 0xdd,
  COM: 0xfe,
} as const

const METADATA_MARKERS = [
  JPEG_MARKERS.APP1,
  JPEG_MARKERS.APP2,
  JPEG_MARKERS.APP3,
  JPEG_MARKERS.APP4,
  JPEG_MARKERS.APP5,
  JPEG_MARKERS.APP6,
  JPEG_MARKERS.APP7,
  JPEG_MARKERS.APP8,
  JPEG_MARKERS.APP9,
  JPEG_MARKERS.APP10,
  JPEG_MARKERS.APP11,
  JPEG_MARKERS.APP12,
  JPEG_MARKERS.APP13,
  JPEG_MARKERS.APP14,
  JPEG_MARKERS.APP15,
  JPEG_MARKERS.COM,
] as const

export function parseJpegSegments(data: Uint8Array): JpegSegment[] {
  const segments: JpegSegment[] = []
  let offset = 0

  if (data.length < 2 || data[0] !== 0xff || data[1] !== JPEG_MARKERS.SOI) {
    throw new Error('Invalid JPEG: missing SOI marker')
  }

  segments.push({
    marker: JPEG_MARKERS.SOI,
    data: new Uint8Array(0),
    offset: 0,
    length: 2,
  })
  offset = 2

  while (offset < data.length - 1) {
    if (data[offset] !== 0xff) {
      throw new Error(`Invalid JPEG: expected 0xFF at offset ${offset}`)
    }

    const marker = data[offset + 1]

    if (marker === 0x00) {
      offset += 2
      continue
    }

    if (marker === JPEG_MARKERS.EOI) {
      segments.push({
        marker: JPEG_MARKERS.EOI,
        data: new Uint8Array(0),
        offset,
        length: 2,
      })
      break
    }

    if (marker === JPEG_MARKERS.SOS) {
      segments.push({
        marker: JPEG_MARKERS.SOS,
        data: new Uint8Array(0),
        offset,
        length: 2,
      })
      offset += 2
      while (offset < data.length - 1) {
        if (data[offset] === 0xff && data[offset + 1] !== 0x00) {
          break
        }
        offset++
      }
      continue
    }

    if (offset + 3 >= data.length) {
      throw new Error('Invalid JPEG: truncated segment header')
    }

    const length = (data[offset + 2] << 8) | data[offset + 3]
    if (offset + 2 + length > data.length) {
      throw new Error('Invalid JPEG: segment extends beyond file')
    }

    const segmentData = data.slice(offset + 4, offset + 2 + length)
    segments.push({
      marker,
      data: segmentData,
      offset,
      length: 2 + length,
    })

    offset += 2 + length
  }

  return segments
}

export function identifyMetadataSegments(segments: JpegSegment[]): {
  exif: boolean
  xmp: boolean
  c2pa: boolean
  gps: boolean
  camera?: string
  software?: string
  createdAt?: string
  orientation?: number
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
    orientation: undefined as number | undefined,
    width: undefined as number | undefined,
    height: undefined as number | undefined,
    colorSpace: undefined as string | undefined,
  }

  for (const segment of segments) {
    if (segment.marker === JPEG_MARKERS.APP1) {
      if (segment.data.length >= 6) {
        const identifier = new TextDecoder().decode(segment.data.slice(0, 6))
        if (identifier === 'Exif\x00\x00') {
          report.exif = true
          parseExifData(segment.data.slice(6), report)
        } else if (identifier.startsWith('http://ns.adobe.com/xap/')) {
          report.xmp = true
          parseXmpData(segment.data, report)
        }
      }
    } else if (segment.marker === JPEG_MARKERS.APP11) {
      if (segment.data.length >= 8) {
        const identifier = new TextDecoder().decode(segment.data.slice(0, 8))
        if (identifier.includes('jumbf') || identifier.includes('c2pa')) {
          report.c2pa = true
        }
      }
    } else if (segment.marker === JPEG_MARKERS.APP2) {
      if (segment.data.length >= 14) {
        const identifier = new TextDecoder().decode(segment.data.slice(0, 14))
        if (identifier.includes('ICC_PROFILE')) {
          report.colorSpace = 'ICC Profile'
        }
      }
    }
  }

  return report
}

function parseExifData(data: Uint8Array, report: any): void {
  if (data.length < 8) return

  const endian = data[0] === 0x49 && data[1] === 0x49 ? 'little' : 'big'
  const getUint16 = (offset: number) =>
    endian === 'little'
      ? data[offset] | (data[offset + 1] << 8)
      : (data[offset] << 8) | data[offset + 1]
  const getUint32 = (offset: number) =>
    endian === 'little'
      ? data[offset] | (data[offset + 1] << 8) | (data[offset + 2] << 16) | (data[offset + 3] << 24)
      : (data[offset] << 24) | (data[offset + 1] << 16) | (data[offset + 2] << 8) | data[offset + 3]

  const ifdOffset = getUint32(4)
  if (ifdOffset + 2 > data.length) return

  const numEntries = getUint16(ifdOffset)
  for (let i = 0; i < numEntries; i++) {
    const entryOffset = ifdOffset + 2 + i * 12
    if (entryOffset + 12 > data.length) break

    const tag = getUint16(entryOffset)
    const type = getUint16(entryOffset + 2)
    const count = getUint32(entryOffset + 4)
    const valueOffset = entryOffset + 8

    if (tag === 0x010e) {
      report.camera = readString(data, valueOffset, count, type)
    } else if (tag === 0x0131) {
      report.software = readString(data, valueOffset, count, type)
    } else if (tag === 0x9003) {
      report.createdAt = readString(data, valueOffset, count, type)
    } else if (tag === 0x0112) {
      report.orientation = getUint16(valueOffset)
    } else if (tag === 0xa001) {
      report.width = getUint32(valueOffset)
    } else if (tag === 0xa002) {
      report.height = getUint32(valueOffset)
    } else if (tag === 0x8825) {
      report.gps = true
    }
  }
}

function parseXmpData(data: Uint8Array, report: any): void {
  try {
    const text = new TextDecoder().decode(data)
    if (text.includes('GPSLatitude') || text.includes('GPSLongitude')) {
      report.gps = true
    }
    const cameraMatch = text.match(/<tiff:Model>([^<]+)<\/tiff:Model>/)
    if (cameraMatch) report.camera = cameraMatch[1]
    const softwareMatch = text.match(/<xmp:CreatorTool>([^<]+)<\/xmp:CreatorTool>/)
    if (softwareMatch) report.software = softwareMatch[1]
    const createdMatch = text.match(/<xmp:CreateDate>([^<]+)<\/xmp:CreateDate>/)
    if (createdMatch) report.createdAt = createdMatch[1]
  } catch {
  }
}

function readString(data: Uint8Array, offset: number, count: number, type: number): string {
  if (type === 2) {
    const end = offset + count
    const strData = data.slice(offset, Math.min(end, data.length))
    return new TextDecoder().decode(strData).replace(/\0/g, '')
  }
  return ''
}

export function stripJpegMetadata(data: Uint8Array): Uint8Array {
  const segments = parseJpegSegments(data)
  const output: number[] = []

  for (const segment of segments) {
    const isMetadata = METADATA_MARKERS.includes(segment.marker as any)
    if (segment.marker === JPEG_MARKERS.APP1) {
      if (segment.data.length >= 6) {
        const identifier = new TextDecoder().decode(segment.data.slice(0, 6))
        if (identifier === 'Exif\x00\x00' || identifier.startsWith('http://ns.adobe.com/xap/')) {
          continue
        }
      }
    } else if (segment.marker === JPEG_MARKERS.APP11) {
      if (segment.data.length >= 8) {
        const identifier = new TextDecoder().decode(segment.data.slice(0, 8))
        if (identifier.includes('jumbf') || identifier.includes('c2pa')) {
          continue
        }
      }
    } else if (isMetadata) {
      continue
    }

    output.push(0xff, segment.marker)
    if (segment.data.length > 0) {
      const length = segment.data.length + 2
      output.push((length >> 8) & 0xff, length & 0xff)
      output.push(...segment.data)
    }
  }

  return new Uint8Array(output)
}

export async function processJpeg(
  file: File,
  quality: number
): Promise<{ blob: Blob; reencoded: boolean; metadata: any }> {
  const arrayBuffer = await file.arrayBuffer()
  const data = new Uint8Array(arrayBuffer)

  const originalMetadata = identifyMetadataSegments(parseJpegSegments(data))
  const strippedData = stripJpegMetadata(data)

  const hasMetadata = originalMetadata.exif || originalMetadata.xmp || originalMetadata.c2pa || originalMetadata.gps

  if (!hasMetadata) {
    return {
      blob: file,
      reencoded: false,
      metadata: originalMetadata,
    }
  }

  try {
    const cleanedBlob = new Blob([strippedData], { type: 'image/jpeg' })
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
    return await reencodeJpeg(file, quality, originalMetadata)
  }
}

async function reencodeJpeg(
  file: File,
  quality: number,
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
        'image/jpeg',
        quality
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