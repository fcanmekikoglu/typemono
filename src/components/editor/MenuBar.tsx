import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Check,
  FilePlus,
  FileText,
  HardDrive,
  Search as SearchIcon,
  Trash2,
} from 'lucide-react'
import type { DocRow } from '../../lib/db'
import { db } from '../../lib/db'
import { createDoc, deleteDoc, setLastOpened } from '../../lib/docs'
import { useTheme } from '../../hooks/useTheme'
import { useLocale } from '../../hooks/useLocale'
import { LOCALES, type Locale } from '../../lib/i18n'
import { MOD_LABEL } from '../../hooks/useHotkey'
import type { Command } from '../../lib/commands'

interface ConfirmFn {
  (opts: { message: string; detail?: string }): Promise<boolean>
}

interface MenuProps {
  label: ReactNode
  children: (close: () => void) => ReactNode
  align?: 'left' | 'right'
  width?: number
  autoFocusFirst?: boolean
}

const MENU_OPEN_EVENT = 'typemono:menu-open'

function Menu({ label, children, align = 'left', width, autoFocusFirst = true }: MenuProps) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const popRef = useRef<HTMLDivElement | null>(null)
  const id = useRef<symbol>(Symbol('menu'))

  useEffect(() => {
    function onOtherOpen(e: Event) {
      if ((e as CustomEvent<symbol>).detail !== id.current) setOpen(false)
    }
    document.addEventListener(MENU_OPEN_EVENT, onOtherOpen)
    return () => document.removeEventListener(MENU_OPEN_EVENT, onOtherOpen)
  }, [])

  useEffect(() => {
    if (!open) return
    document.dispatchEvent(new CustomEvent(MENU_OPEN_EVENT, { detail: id.current }))
    function onDocMouseDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', onDocMouseDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // Auto-focus first menu item when opening simple menus (no search input)
  useEffect(() => {
    if (!open || !autoFocusFirst) return
    const timer = window.setTimeout(() => {
      const firstItem = popRef.current?.querySelector<HTMLElement>('[role="menuitem"]:not(:disabled)')
      firstItem?.focus()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [open, autoFocusFirst])

  function handlePopKeyDown(e: React.KeyboardEvent) {
    const items = Array.from(
      popRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled)') ?? []
    )
    if (!items.length) return
    const current = document.activeElement as HTMLElement
    if (!items.includes(current)) return
    const idx = items.indexOf(current)

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      items[(idx + 1) % items.length]?.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      items[(idx - 1 + items.length) % items.length]?.focus()
    } else if (e.key === 'Home') {
      e.preventDefault()
      items[0]?.focus()
    } else if (e.key === 'End') {
      e.preventDefault()
      items[items.length - 1]?.focus()
    }
  }

  return (
    <div
      className="menu-wrap"
      ref={wrapRef}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setOpen(false)
        }
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        className={`menu-trigger ${open ? 'is-open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' && !open) {
            e.preventDefault()
            setOpen(true)
          }
        }}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {label}
      </button>
      {open && (
        <div
          ref={popRef}
          className={`menu-pop menu-pop-${align}`}
          role="menu"
          style={width ? { minWidth: width } : undefined}
          onKeyDown={handlePopKeyDown}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  )
}

function MenuItem({
  onClick,
  icon,
  label,
  hint,
  danger,
  disabled,
}: {
  onClick: () => void
  icon?: ReactNode
  label: ReactNode
  hint?: ReactNode
  danger?: boolean
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="menuitem"
      className={`menu-item ${danger ? 'is-danger' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="menu-item-icon">{icon}</span>
      <span className="menu-item-label">{label}</span>
      {hint && <span className="menu-item-hint">{hint}</span>}
    </button>
  )
}

function MenuSep() {
  return <div className="menu-sep" role="separator" />
}

function formatRelative(ts: number): string {
  const diff = Date.now() - ts
  const s = Math.round(diff / 1000)
  if (s < 60) return `${s}s`
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.round(h / 24)}d`
}

interface Props {
  doc: DocRow
  commands: Command[]
  onOpenPalette: () => void
  confirm: ConfirmFn
}

const FILE_ACTION_IDS_TOP = ['file.new', 'file.open'] as const
const FILE_ACTION_IDS_MID = [
  'file.saveToDisk', 'file.unlink', 'file.downloadMd',
  'file.backupExport', 'file.backupImport',
  'file.exportHtml', 'file.exportPdf',
] as const
const THEME_IDS = ['theme.light', 'theme.dark'] as const

export default function MenuBar({ doc, commands, onOpenPalette, confirm }: Props) {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const { locale, setLocale, t } = useLocale()
  const docs = useLiveQuery(() => db.docs.orderBy('updatedAt').reverse().toArray(), [])
  const [query, setQuery] = useState('')
  // Track which doc row is keyboard-focused inside the documents list
  const [focusedDocId, setFocusedDocId] = useState<string | null>(null)

  const byId = useMemo(() => {
    const m = new Map<string, Command>()
    for (const c of commands) m.set(c.id, c)
    return m
  }, [commands])

  function run(close: () => void, id: string) {
    close()
    const cmd = byId.get(id)
    if (cmd) void cmd.run()
  }

  const filteredDocs = useMemo(() => {
    if (!docs) return []
    const q = query.trim().toLowerCase()
    if (!q) return docs
    return docs.filter(
      (d) => d.title.toLowerCase().includes(q) || d.content.toLowerCase().includes(q),
    )
  }, [docs, query])

  async function handleSwitchDoc(id: string, close: () => void) {
    await setLastOpened(id)
    close()
    navigate({ to: '/doc/$docId', params: { docId: id } })
  }

  async function handleDeleteDoc(d: DocRow, isActive: boolean, close: () => void) {
    const label = isActive ? t.confirm.deleteActive(d.title) : t.confirm.deleteOther(d.title)
    const ok = await confirm({ message: label })
    if (!ok) return

    if (isActive) {
      // Same logic as file.delete command
      const all = docs ?? []
      const currentIndex = all.findIndex((x) => x.id === d.id)
      const remaining = all.filter((x) => x.id !== d.id)
      const target = remaining[currentIndex] ?? remaining[currentIndex - 1] ?? null
      await deleteDoc(d.id)
      close()
      if (target) {
        navigate({ to: '/doc/$docId', params: { docId: target.id } })
      } else {
        const fresh = await createDoc(undefined, locale)
        navigate({ to: '/doc/$docId', params: { docId: fresh.id } })
      }
    } else {
      await deleteDoc(d.id)
    }
  }

  async function handleNewInSidebar(close: () => void) {
    const d = await createDoc(undefined, locale)
    close()
    navigate({ to: '/doc/$docId', params: { docId: d.id } })
  }

  return (
    <header className="menubar">
      <div className="menubar-brand" />

      <nav className="menubar-menus" aria-label="Application menu">
        <Menu label={t.menu.file} width={240}>
          {(close) => (
            <>
              {FILE_ACTION_IDS_TOP.map((id) => {
                const cmd = byId.get(id)
                if (!cmd) return null
                return (
                  <MenuItem
                    key={id}
                    icon={cmd.icon}
                    label={cmd.title}
                    onClick={() => run(close, id)}
                  />
                )
              })}
              <MenuSep />
              {FILE_ACTION_IDS_MID.map((id) => {
                const cmd = byId.get(id)
                if (!cmd) return null
                return (
                  <MenuItem
                    key={id}
                    icon={cmd.icon}
                    label={cmd.title}
                    onClick={() => run(close, id)}
                  />
                )
              })}
              <MenuSep />
              {byId.get('file.delete') && (
                <MenuItem
                  icon={byId.get('file.delete')!.icon}
                  label={t.actions.deleteDocument}
                  onClick={() => run(close, 'file.delete')}
                  danger
                />
              )}
            </>
          )}
        </Menu>

        <Menu label={t.menu.settings} width={260}>
          {(close) => (
            <>
              <div className="menu-section-label">{t.menu.themeSection}</div>
              {THEME_IDS.map((id) => {
                const cmd = byId.get(id)
                if (!cmd) return null
                const themeKey = id.split('.')[1] as 'light' | 'dark'
                return (
                  <MenuItem
                    key={id}
                    icon={cmd.icon}
                    label={
                      <span className="menu-theme-label">
                        <span>{t.theme[themeKey].label}</span>
                        <span className="menu-theme-hint">{t.theme[themeKey].description}</span>
                      </span>
                    }
                    hint={theme === themeKey ? <Check size={12} /> : null}
                    onClick={() => run(close, id)}
                  />
                )
              })}
              <MenuSep />
              <div className="menu-section-label">{t.menu.languageSection}</div>
              {(Object.keys(LOCALES) as Locale[]).map((loc) => (
                <MenuItem
                  key={loc}
                  icon={<span className="menu-locale-code">{loc.toUpperCase()}</span>}
                  label={LOCALES[loc].nativeLabel}
                  hint={locale === loc ? <Check size={12} /> : null}
                  onClick={() => {
                    setLocale(loc)
                    close()
                  }}
                />
              ))}
            </>
          )}
        </Menu>

        <Menu
          label={
            <>
              {t.menu.documents}
              <span className="menu-trigger-badge">{docs?.length ?? 0}</span>
            </>
          }
          width={340}
          autoFocusFirst={false}
        >
          {(close) => (
            <>
              <div className="menu-search">
                <SearchIcon size={13} />
                <input
                  type="search"
                  placeholder={t.documentsMenu.searchPlaceholder}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault()
                      e.stopPropagation()
                      const firstDoc = e.currentTarget.closest('.menu-pop')?.querySelector<HTMLElement>('.menu-doc[tabindex="0"]')
                      firstDoc?.focus()
                    }
                  }}
                />
              </div>
              <div className="menu-list">
                {filteredDocs.length === 0 && (
                  <p className="menu-empty">{t.documentsMenu.empty}</p>
                )}
                {filteredDocs.map((d) => {
                  const isActive = d.id === doc.id
                  const isFocused = d.id === focusedDocId
                  return (
                    <div
                      key={d.id}
                      className={`menu-doc ${isActive ? 'is-active' : ''} ${isFocused ? 'is-keyboard-focused' : ''}`}
                      // Track keyboard focus per row
                      onMouseEnter={() => setFocusedDocId(d.id)}
                      onMouseLeave={() => setFocusedDocId(null)}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' || e.key === 'Delete') {
                          e.preventDefault()
                          e.stopPropagation()
                          void handleDeleteDoc(d, isActive, close)
                          return
                        }
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          void handleSwitchDoc(d.id, close)
                          return
                        }
                        if (e.key === 'ArrowDown') {
                          e.preventDefault()
                          e.stopPropagation()
                          const next = e.currentTarget.nextElementSibling as HTMLElement | null
                          if (next?.matches('.menu-doc')) {
                            next.focus()
                          } else {
                            e.currentTarget.closest('.menu-pop')?.querySelector<HTMLElement>('[role="menuitem"]:not(:disabled)')?.focus()
                          }
                          return
                        }
                        if (e.key === 'ArrowUp') {
                          e.preventDefault()
                          e.stopPropagation()
                          const prev = e.currentTarget.previousElementSibling as HTMLElement | null
                          if (prev?.matches('.menu-doc')) {
                            prev.focus()
                          } else {
                            e.currentTarget.closest('.menu-pop')?.querySelector<HTMLElement>('input[type="search"]')?.focus()
                          }
                        }
                      }}
                      // Make the row keyboard-focusable so keydown fires
                      tabIndex={0}
                    >
                      <button
                        type="button"
                        className="menu-doc-main"
                        onClick={() => handleSwitchDoc(d.id, close)}
                        // Prevent the row tabIndex from stealing focus from inner buttons
                        tabIndex={-1}
                      >
                        <span className="menu-doc-icon">
                          <FileText size={13} />
                          {d.linkedHandleKey && (
                            <span className="menu-doc-badge" title={t.documentsMenu.linkedHint} />
                          )}
                        </span>
                        <span className="menu-doc-body">
                          <span className="menu-doc-title">{d.title || 'Untitled'}</span>
                          <span className="menu-doc-meta">
                            {formatRelative(d.updatedAt)} {t.documentsMenu.agoSuffix}
                          </span>
                        </span>
                        {isActive && <Check size={13} className="menu-doc-check" />}
                      </button>
                      <button
                        type="button"
                        className="menu-doc-delete"
                        onClick={() => void handleDeleteDoc(d, isActive, close)}
                        title={t.actions.deleteDocument}
                        aria-label={`${t.actions.deleteDocument} ${d.title}`}
                        tabIndex={-1}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )
                })}
              </div>
              <MenuSep />
              <MenuItem
                icon={<FilePlus size={14} />}
                label={t.actions.newDocument}
                onClick={() => handleNewInSidebar(close)}
              />
            </>
          )}
        </Menu>
      </nav>

      <div className="menubar-title" title={doc.title}>
        {doc.title || 'Untitled'}
        {doc.linkedHandleKey && (
          <span className="menubar-chip">
            <HardDrive size={10} /> {t.page.diskChip}
          </span>
        )}
      </div>

      <div className="menubar-right">
        <button
          type="button"
          className="palette-trigger"
          onClick={onOpenPalette}
          title={t.palette.buttonTooltip(MOD_LABEL)}
          aria-label={t.palette.buttonTooltip(MOD_LABEL)}
        >
          <SearchIcon size={12} />
          <span className="palette-trigger-label">{t.palette.buttonLabel}</span>
          <span className="palette-trigger-kbd">
            <span className="kbd">{MOD_LABEL}</span>
            <span className="kbd">K</span>
          </span>
        </button>
      </div>
    </header>
  )
}
