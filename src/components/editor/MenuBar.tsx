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
import { THEMES } from '../../lib/themes'
import { MOD_LABEL } from '../../hooks/useHotkey'
import type { Command } from '../../lib/commands'

interface MenuProps {
  label: ReactNode
  children: (close: () => void) => ReactNode
  align?: 'left' | 'right'
  width?: number
}

const MENU_OPEN_EVENT = 'typemono:menu-open'

function Menu({ label, children, align = 'left', width }: MenuProps) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement | null>(null)
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
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="menu-wrap" ref={wrapRef}>
      <button
        type="button"
        className={`menu-trigger ${open ? 'is-open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {label}
      </button>
      {open && (
        <div
          className={`menu-pop menu-pop-${align}`}
          role="menu"
          style={width ? { minWidth: width } : undefined}
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
}

const FILE_ACTION_IDS_TOP = ['file.new', 'file.open'] as const
const FILE_ACTION_IDS_MID = ['file.saveToDisk', 'file.unlink', 'file.downloadMd', 'file.exportHtml', 'file.exportPdf'] as const
const THEME_IDS = ['theme.github', 'theme.light', 'theme.dark'] as const

export default function MenuBar({ doc, commands, onOpenPalette }: Props) {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const docs = useLiveQuery(() => db.docs.orderBy('updatedAt').reverse().toArray(), [])
  const [query, setQuery] = useState('')

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

  async function handleDeleteOther(id: string) {
    const target = docs?.find((d) => d.id === id)
    if (!target) return
    const ok = window.confirm(`Delete "${target.title}"?`)
    if (!ok) return
    await deleteDoc(id)
  }

  async function handleNewInSidebar(close: () => void) {
    const d = await createDoc()
    close()
    navigate({ to: '/doc/$docId', params: { docId: d.id } })
  }

  return (
    <header className="menubar">
      <div className="menubar-brand" />

      <nav className="menubar-menus" aria-label="Application menu">
        <Menu label="File" width={240}>
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
                  label="Delete this document"
                  onClick={() => run(close, 'file.delete')}
                  danger
                />
              )}
            </>
          )}
        </Menu>

        <Menu label="Settings" width={260}>
          {(close) => (
            <>
              <div className="menu-section-label">Theme</div>
              {THEME_IDS.map((id) => {
                const cmd = byId.get(id)
                if (!cmd) return null
                const t = id.split('.')[1] as 'github' | 'light' | 'dark'
                return (
                  <MenuItem
                    key={id}
                    icon={cmd.icon}
                    label={
                      <span className="menu-theme-label">
                        <span>{THEMES[t].label}</span>
                        <span className="menu-theme-hint">{THEMES[t].description}</span>
                      </span>
                    }
                    hint={theme === t ? <Check size={12} /> : null}
                    onClick={() => run(close, id)}
                  />
                )
              })}
            </>
          )}
        </Menu>

        <Menu
          label={
            <>
              Documents
              <span className="menu-trigger-badge">{docs?.length ?? 0}</span>
            </>
          }
          width={340}
        >
          {(close) => (
            <>
              <div className="menu-search">
                <SearchIcon size={13} />
                <input
                  type="search"
                  placeholder="Search documents…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="menu-list">
                {filteredDocs.length === 0 && (
                  <p className="menu-empty">No documents match.</p>
                )}
                {filteredDocs.map((d) => (
                  <div
                    key={d.id}
                    className={`menu-doc ${d.id === doc.id ? 'is-active' : ''}`}
                  >
                    <button
                      type="button"
                      className="menu-doc-main"
                      onClick={() => handleSwitchDoc(d.id, close)}
                    >
                      <span className="menu-doc-icon">
                        <FileText size={13} />
                        {d.linkedHandleKey && (
                          <span className="menu-doc-badge" title="Linked to disk file" />
                        )}
                      </span>
                      <span className="menu-doc-body">
                        <span className="menu-doc-title">{d.title || 'Untitled'}</span>
                        <span className="menu-doc-meta">{formatRelative(d.updatedAt)} ago</span>
                      </span>
                      {d.id === doc.id && <Check size={13} className="menu-doc-check" />}
                    </button>
                    <button
                      type="button"
                      className="menu-doc-delete"
                      onClick={() =>
                        d.id === doc.id
                          ? run(close, 'file.delete')
                          : handleDeleteOther(d.id)
                      }
                      title="Delete"
                      aria-label={`Delete ${d.title}`}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
              <MenuSep />
              <MenuItem
                icon={<FilePlus size={14} />}
                label="New document"
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
            <HardDrive size={10} /> Disk
          </span>
        )}
      </div>

      <div className="menubar-right">
        <button
          type="button"
          className="palette-trigger"
          onClick={onOpenPalette}
          title={`Search (${MOD_LABEL}+K)`}
          aria-label={`Open command palette (${MOD_LABEL}+K)`}
        >
          <SearchIcon size={12} />
          <span className="palette-trigger-label">Search…</span>
          <span className="palette-trigger-kbd">
            <span className="kbd">{MOD_LABEL}</span>
            <span className="kbd">K</span>
          </span>
        </button>
      </div>
    </header>
  )
}
