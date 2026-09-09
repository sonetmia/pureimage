'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Sun, Moon, Monitor } from 'lucide-react'

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null
    if (stored) {
      setTheme(stored)
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark')
    }
  }, [])

  useEffect(() => {
    if (!mounted) return
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    if (theme === 'system') {
      root.classList.add(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    } else {
      root.classList.add(theme)
    }
    localStorage.setItem('theme', theme)
  }, [theme, mounted])

  useEffect(() => {
    if (!mounted) return
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      if (theme === 'system') {
        const root = document.documentElement
        root.classList.remove('light', 'dark')
        root.classList.add(mediaQuery.matches ? 'dark' : 'light')
      }
    }
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [theme, mounted])

  if (!mounted) {
    return (
      <button className="btn-ghost h-10 w-10" aria-label="Theme toggle (loading)">
        <Monitor className="w-5 h-5" aria-hidden="true" />
      </button>
    )
  }

  const themes: Array<{ value: 'light' | 'dark' | 'system'; label: string; icon: React.ReactNode }> = [
    { value: 'light', label: 'Light', icon: <Sun className="w-5 h-5" aria-hidden="true" /> },
    { value: 'dark', label: 'Dark', icon: <Moon className="w-5 h-5" aria-hidden="true" /> },
    { value: 'system', label: 'System', icon: <Monitor className="w-5 h-5" aria-hidden="true" /> },
  ]

  return (
    <div className="relative inline-block" role="group" aria-label="Theme selection">
      <button
        className={cn(
          'btn-ghost h-10 w-10 rounded-lg transition-colors',
          theme === 'light' && 'bg-amber-100 dark:bg-amber-900/30',
          theme === 'dark' && 'bg-blue-100 dark:bg-blue-900/30',
          theme === 'system' && 'bg-muted'
        )}
        onClick={() => {
          const currentIndex = themes.findIndex((t) => t.value === theme)
          const nextIndex = (currentIndex + 1) % themes.length
          setTheme(themes[nextIndex].value)
        }}
        aria-label={`Current theme: ${theme}. Click to cycle.`}
        aria-haspopup="true"
      >
        {themes.find((t) => t.value === theme)?.icon}
      </button>
    </div>
  )
}