export interface MetadataReport {
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
}

export interface ProcessingResult {
  success: boolean
  originalBlob: Blob
  cleanedBlob: Blob
  originalSize: number
  cleanedSize: number
  originalDimensions: { width: number; height: number }
  cleanedDimensions: { width: number; height: number }
  format: string
  metadataBefore: MetadataReport
  metadataAfter: MetadataReport
  reencoded: boolean
  error?: string
}

export type ProcessingStatus = 'waiting' | 'scanning' | 'processing' | 'completed' | 'error'

export interface QueueItem {
  id: string
  file: File
  previewUrl: string
  status: ProcessingStatus
  progress: number
  result?: ProcessingResult
  error?: string
  originalMetadata?: MetadataReport
}

export interface ProcessingOptions {
  jpegQuality: number
}