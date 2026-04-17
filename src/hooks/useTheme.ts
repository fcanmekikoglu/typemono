import { useCallback, useEffect, useState } from 'react'

export type ThemeMode = 'light' | 'dark' | 'auto'

function readStoredMode(): ThemeMode {
  if (typeof window === 'undefined') return 'auto'
  const stored = window.localStorage.getItem('theme')
  return stored === 'light' || stored === 'dark' || stored === 'auto' ? stored : 'auto'
}

export function resolveMode(mode: ThemeMode): 'light' | 'dark' {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  return mode === 'auto' ? (prefersDark ? 'dark' : 'light') : mode
}

function applyMode(mode: ThemeMode) {
  const resolved = resolveMode(mode)
  const root = document.documentElement
  root.classList.remove('light', 'dark')
  root.classList.add(resolved)
  if (mode === 'auto') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', mode)
  root.style.colorScheme = resolved
}

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(() => readStoredMode())

  useEffect(() => {
    applyMode(mode)
    window.localStorage.setItem('theme', mode)
  }, [mode])

  useEffect(() => {
    if (mode !== 'auto') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyMode('auto')
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [mode])

  const cycle = useCallback(() => {
    setMode((m) => (m === 'light' ? 'dark' : m === 'dark' ? 'auto' : 'light'))
  }, [])

  return { mode, setMode, cycle, resolved: typeof window === 'undefined' ? 'light' : resolveMode(mode) }
}
