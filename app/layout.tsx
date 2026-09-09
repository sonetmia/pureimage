import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Pure Image - Offline Image Metadata Cleaner',
  description: 'Clean EXIF, XMP and supported embedded provenance metadata from JPG, PNG and WebP images directly in your browser. Your files never leave your device.',
  keywords: ['metadata cleaner', 'EXIF removal', 'XMP removal', 'C2PA removal', 'image privacy', 'offline image processing', 'JPEG metadata', 'PNG metadata', 'WebP metadata'],
  authors: [{ name: 'Pure Image' }],
  creator: 'Pure Image',
  publisher: 'Pure Image',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://pureimage.app',
    title: 'Pure Image - Offline Image Metadata Cleaner',
    description: 'Clean EXIF, XMP and supported embedded provenance metadata from JPG, PNG and WebP images directly in your browser. Your files never leave your device.',
    siteName: 'Pure Image',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Pure Image - Clean Your Image. Keep Your Privacy.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pure Image - Offline Image Metadata Cleaner',
    description: 'Clean EXIF, XMP and supported embedded provenance metadata from JPG, PNG and WebP images directly in your browser.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f0f0f' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'Pure Image',
              applicationCategory: 'UtilitiesApplication',
              operatingSystem: 'Web Browser',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
                availability: 'https://schema.org/InStock',
              },
              description: 'Clean EXIF, XMP and supported embedded provenance metadata from JPG, PNG and WebP images directly in your browser. Your files never leave your device.',
              featureList: [
                'EXIF metadata removal',
                'XMP metadata removal',
                'C2PA/JUMBF provenance removal',
                'Bulk processing (up to 10 images)',
                'Lossless quality preservation',
                '100% local processing',
              ],
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'Pure Image',
              url: 'https://pureimage.app',
              potentialAction: {
                '@type': 'SearchAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate: 'https://pureimage.app?q={search_term_string}',
                },
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: [
                {
                  '@type': 'Question',
                  name: 'What is EXIF metadata?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'EXIF (Exchangeable Image File Format) is a standard that specifies formats for images, sound, and ancillary tags used by digital cameras and smartphones. It includes information like camera model, aperture, shutter speed, ISO, focal length, date/time, GPS coordinates, and orientation.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Are my images uploaded?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'No. Pure Image processes images entirely in your browser using Web Workers and Canvas APIs. Your files never leave your device. There is no server-side image processing, no cloud storage, and no uploads.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Does Pure Image reduce image quality?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Pure Image prioritizes lossless metadata stripping — removing metadata without re-encoding pixels. Your image dimensions, format, and visual quality are preserved whenever technically possible. Only when lossless stripping would corrupt the image does it fall back to canvas re-encoding.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Can I process multiple images at once?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes. You can add up to 10 images per batch (15 MB each). Each image is processed sequentially to manage memory, with individual progress tracking. You can download cleaned images individually or all at once.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Does removing metadata guarantee removal of social-media AI labels?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'No. Metadata cleaning removes supported embedded metadata, but social platforms may use additional signals independent of embedded metadata. Platforms like Instagram and Facebook may analyze pixel content, use perceptual hashing, check upload patterns, or apply server-side watermarking.',
                  },
                },
              ],
            }),
          }}
        />
      </body>
    </html>
  )
}