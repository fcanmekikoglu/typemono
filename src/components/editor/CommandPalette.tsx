import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Search } from 'lucide-react'
import {
  filterCommands,
  groupCommands,
  type Command,
} from '../../lib/commands'
import { MOD_LABEL } from '../../hooks/useHotkey'
import { useLocale } from '../../hooks/useLocale'

interface Props {
  open: boolean
  onClose: () => void
  commands: Command[]
}

export default function CommandPalette({ open, onClose, commands }: Props) {
  const { t } = useLocale()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)

  const filtered = useMemo(() => filterCommands(query, commands), [query, commands])
  const groups = useMemo(() => groupCommands(filtered), [filtered])

  // Reset state each time the palette opens.
  useEffect(() => {
    if (!open) return
    setQuery('')
    setSelected(0)
    const id = window.setTimeout(() => inputRef.current?.focus(), 0)
    return () => window.clearTimeout(id)
  }, [open])

  // Clamp selected to filtered length when it changes.
  useEffect(() => {
    if (selected >= filtered.length) setSelected(0)
  }, [filtered.length, selected])

  // Keep the highlighted row in view.
  useEffect(() => {
    if (!open) return
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${selected}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [selected, open])

  if (!open) return null

  function runAt(idx: number) {
    const cmd = filtered[idx]
    if (!cmd) return
    onClose()
    // Defer so the close animation doesn't race with navigation/menu work.
    void Promise.resolve().then(() => cmd.run())
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
      return
    }
    if (filtered.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelected((i) => (i + 1) % filtered.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelected((i) => (i - 1 + filtered.length) % filtered.length)
    } else if (e.key === 'Home') {
      e.preventDefault()
      setSelected(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      setSelected(filtered.length - 1)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      runAt(selected)
    }
  }

  // Build a flat index map so grouped render can still use global `selected`.
  const flatIndex = new Map<string, number>()
  filtered.forEach((c, i) => flatIndex.set(c.id, i))

  return createPortal(
    <div className="palette-backdrop" onMouseDown={onClose} role="presentation">
      <div
        className="palette-card"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <div className="palette-input-wrap">
          <Search size={15} className="palette-input-icon" />
          <input
            ref={inputRef}
            type="text"
            className="palette-input"
            placeholder={t.palette.placeholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelected(0)
            }}
            autoComplete="off"
            spellCheck={false}
          />
          <span className="kbd palette-esc-hint">{t.palette.footer.esc}</span>
        </div>
        <div className="palette-results" ref={listRef}>
          {filtered.length === 0 ? (
            <p className="palette-empty">{t.palette.empty}</p>
          ) : (
            groups.map((g) => (
              <div key={g.section} className="palette-group">
                <div className="palette-section-label">{t.palette.sectionLabel[g.section]}</div>
                {g.items.map((cmd) => {
                  const idx = flatIndex.get(cmd.id)!
                  const isSelected = idx === selected
                  return (
                    <button
                      key={cmd.id}
                      type="button"
                      data-idx={idx}
                      className={`palette-item ${isSelected ? 'is-selected' : ''} ${cmd.danger ? 'is-danger' : ''}`}
                      onMouseEnter={() => setSelected(idx)}
                      onClick={() => runAt(idx)}
                    >
                      <span className="palette-item-icon">{cmd.icon}</span>
                      <span className="palette-item-body">
                        <span className="palette-item-title">{cmd.title}</span>
                        {cmd.subtitle && (
                          <span className="palette-item-subtitle">{cmd.subtitle}</span>
                        )}
                      </span>
                      {cmd.hint && <span className="palette-item-hint">{cmd.hint}</span>}
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>
        <footer className="palette-footer">
          <span className="palette-footer-group">
            <span className="kbd">↑</span>
            <span className="kbd">↓</span>
            <span>{t.palette.footer.navigate}</span>
          </span>
          <span className="palette-footer-group">
            <span className="kbd">↵</span>
            <span>{t.palette.footer.run}</span>
          </span>
          <span className="palette-footer-group">
            <span className="kbd">{MOD_LABEL}</span>
            <span className="kbd">K</span>
            <span>{t.palette.footer.toggle}</span>
          </span>
        </footer>
      </div>
    </div>,
    document.body,
  )
}
