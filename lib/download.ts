export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function downloadAllBlobs(blobs: Array<{ blob: Blob; filename: string }>): void {
  blobs.forEach(({ blob, filename }, index) => {
    setTimeout(() => {
      downloadBlob(blob, filename)
    }, index * 100)
  })
}

export async function createZipDownload(
  items: Array<{ blob: Blob; filename: string }>,
  zipFilename: string
): Promise<void> {
  try {
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()

    for (const { blob, filename } of items) {
      const arrayBuffer = await blob.arrayBuffer()
      zip.file(filename, arrayBuffer)
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' })
    downloadBlob(zipBlob, zipFilename)
  } catch {
    downloadAllBlobs(items)
  }
}