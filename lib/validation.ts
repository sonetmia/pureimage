export const MAX_BATCH_SIZE = 10
export const MAX_FILE_SIZE = 15 * 1024 * 1024

export const SUPPORTED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const

export const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'] as const

export type SupportedMimeType = (typeof SUPPORTED_MIME_TYPES)[number]
export type SupportedExtension = (typeof SUPPORTED_EXTENSIONS)[number]

export const FILE_SIGNATURES: Record<SupportedMimeType, number[][]> = {
  'image/jpeg': [[0xff, 0xd8, 0xff]],
  'image/png': [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]],
}

export interface ValidationResult {
  valid: boolean
  error?: string
}

export function validateFileType(file: File): ValidationResult {
  if (!SUPPORTED_MIME_TYPES.includes(file.type as SupportedMimeType)) {
    return { valid: false, error: `Unsupported file type: ${file.type}. Supported types: JPEG, PNG, WebP.` }
  }
  return { valid: true }
}

export function validateFileSize(file: File): ValidationResult {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File too large: ${file.size} bytes. Maximum size: ${MAX_FILE_SIZE} bytes (15 MB).` }
  }
  return { valid: true }
}

export function validateFileSignature(file: File): Promise<ValidationResult> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer
      if (!arrayBuffer) {
        resolve({ valid: false, error: 'Failed to read file signature' })
        return
      }
      const bytes = new Uint8Array(arrayBuffer, 0, 12)
      const expectedSignatures = FILE_SIGNATURES[file.type as SupportedMimeType]
      if (!expectedSignatures) {
        resolve({ valid: false, error: 'Unknown file type for signature validation' })
        return
      }
      const matches = expectedSignatures.some((sig) =>
        sig.every((byte, index) => bytes[index] === byte)
      )
      if (!matches) {
        resolve({ valid: false, error: 'File signature does not match declared type. File may be corrupted or mislabeled.' })
        return
      }
      resolve({ valid: true })
    }
    reader.onerror = () => {
      resolve({ valid: false, error: 'Failed to read file for signature validation' })
    }
    reader.readAsArrayBuffer(file.slice(0, 12))
  })
}

export async function validateFile(file: File): Promise<ValidationResult> {
  const typeResult = validateFileType(file)
  if (!typeResult.valid) return typeResult
  const sizeResult = validateFileSize(file)
  if (!sizeResult.valid) return sizeResult
  const signatureResult = await validateFileSignature(file)
  if (!signatureResult.valid) return signatureResult
  return { valid: true }
}

export function validateBatch(files: File[]): ValidationResult {
  if (files.length > MAX_BATCH_SIZE) {
    return { valid: false, error: `Too many files: ${files.length}. Maximum batch size: ${MAX_BATCH_SIZE}.` }
  }
  return { valid: true }
}