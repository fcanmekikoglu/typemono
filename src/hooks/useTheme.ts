import { useCallback, useEffect, useState } from 'react'
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
  const allThemes: Theme[] = ['github', 'light', 'dark']
  for (const t of allThemes) root.classList.remove(t)
  root.classList.remove('light', 'dark')
  root.classList.add(theme)
  root.classList.add(def.colorScheme)
  root.setAttribute('data-theme', theme)
  root.style.colorScheme = def.colorScheme
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => readStoredTheme())

  useEffect(() => {
    applyTheme(theme)
    window.localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const setTheme = useCallback((t: Theme) => setThemeState(t), [])

  const cycle = useCallback(() => {
    setThemeState((t) => (t === 'github' ? 'light' : t === 'light' ? 'dark' : 'github'))
  }, [])

  return { theme, setTheme, cycle }
}
