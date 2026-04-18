import { useCallback, useSyncExternalStore } from 'react'
import { DEFAULT_THEME, THEMES, isTheme, type Theme } from '../lib/themes'

const STORAGE_KEY = 'theme'

export type { Theme }

function readStoredTheme(): Theme {
  if (typeof window === 'undefined') return DEFAULT_THEME
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return isTheme(stored) ? stored : DEFAULT_THEME
}

function applyTheme(theme: Theme) {
  const def = THEMES[theme]
  const root = document.documentElement
  const allThemes: Theme[] = ['light', 'dark']
  for (const t of allThemes) root.classList.remove(t)
  root.classList.add(theme)
  root.classList.add(def.colorScheme)
  root.setAttribute('data-theme', theme)
  root.style.colorScheme = def.colorScheme
}

let currentTheme = readStoredTheme()
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return currentTheme
}

function updateTheme(t: Theme) {
  if (t === currentTheme) return
  currentTheme = t
  applyTheme(t)
  window.localStorage.setItem(STORAGE_KEY, t)
  listeners.forEach((l) => l())
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY && isTheme(e.newValue)) {
      currentTheme = e.newValue
      applyTheme(currentTheme)
      listeners.forEach((l) => l())
    }
  })
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  const setTheme = useCallback((t: Theme) => updateTheme(t), [])

  const cycle = useCallback(() => {
    updateTheme(currentTheme === 'light' ? 'dark' : 'light')
  }, [])

  return { theme, setTheme, cycle }
}
