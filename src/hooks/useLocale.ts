import { useCallback, useEffect, useMemo, useState } from 'react'
import { DEFAULT_LOCALE, getDict, isLocale, type Dict, type Locale } from '../lib/i18n'

const STORAGE_KEY = 'locale'

export type { Locale }

function readStoredLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (isLocale(stored)) return stored
  const navLang = (navigator.language || 'en').slice(0, 2).toLowerCase()
  return isLocale(navLang) ? navLang : DEFAULT_LOCALE
}

interface LocaleApi {
  locale: Locale
  setLocale: (l: Locale) => void
  t: Dict
}

const listeners = new Set<() => void>()
let currentLocale: Locale | null = null

function ensureInit() {
  if (currentLocale !== null) return
  currentLocale = readStoredLocale()
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('lang', currentLocale)
  }
}

function broadcast() {
  for (const l of listeners) l()
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY && isLocale(e.newValue)) {
      currentLocale = e.newValue
      document.documentElement.setAttribute('lang', currentLocale)
      broadcast()
    }
  })
}

export function useLocale(): LocaleApi {
  ensureInit()
  const [locale, setLocaleState] = useState<Locale>(() => currentLocale!)

  useEffect(() => {
    const listener = () => setLocaleState(currentLocale!)
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])

  const setLocale = useCallback((l: Locale) => {
    if (l === currentLocale) return
    currentLocale = l
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, l)
      document.documentElement.setAttribute('lang', l)
    }
    broadcast()
  }, [])

  const t = useMemo(() => getDict(locale), [locale])
  return { locale, setLocale, t }
}
