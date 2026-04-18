import { useEffect, useState } from 'react'
import { AlertTriangle, Check, CircleDot, Loader2 } from 'lucide-react'
import type { SaveStatus } from '../../hooks/useDoc'
import { useLocale } from '../../hooks/useLocale'
import { wordCount } from '../../lib/markdown'

interface Props {
  content: string
  status: SaveStatus
  lastSavedAt: number | null
  linked: boolean
}

export default function StatusBar({ content, status, lastSavedAt, linked }: Props) {
  const { t, locale } = useLocale()
  const words = wordCount(content)
  const chars = content.length
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!lastSavedAt) return
    const id = window.setInterval(() => setNow(Date.now()), 10_000)
    return () => window.clearInterval(id)
  }, [lastSavedAt])

  let label: string = t.status.ready
  let Icon: typeof Check = CircleDot
  let tone: 'ok' | 'warn' | 'error' | 'muted' = 'muted'

  if (status === 'saving') {
    label = t.status.saving
    Icon = Loader2
    tone = 'warn'
  } else if (status === 'dirty') {
    label = t.status.editing
    Icon = CircleDot
    tone = 'warn'
  } else if (status === 'saved') {
    const ago = lastSavedAt ? Math.max(0, Math.round((now - lastSavedAt) / 1000)) : 0
    label = ago < 5 ? t.status.saved : t.status.savedAgo(ago)
    Icon = Check
    tone = 'ok'
  } else if (status === 'error') {
    label = t.status.saveFailed
    Icon = AlertTriangle
    tone = 'error'
  }

  return (
    <footer className="statusbar">
      <div className={`statusbar-status tone-${tone}`}>
        <Icon size={12} className={status === 'saving' ? 'spin' : ''} />
        <span>{label}</span>
        {linked && <span className="statusbar-linked">{t.status.syncedToDisk}</span>}
      </div>
      <div className="statusbar-meta">
        <span>{words.toLocaleString(locale)} {t.status.words}</span>
        <span>·</span>
        <span>{chars.toLocaleString(locale)} {t.status.chars}</span>
      </div>
    </footer>
  )
}
