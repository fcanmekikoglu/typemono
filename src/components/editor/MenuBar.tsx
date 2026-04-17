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
  ChevronDown,
  Download,
  FileDown,
  FilePlus,
  FileText,
  FolderOpen,
  HardDrive,
  MoonStar,
  Printer,
  Save,
  Search,
  Sun,
  SunMoon,
  Trash2,
  Upload,
} from 'lucide-react'
import type { DocRow } from '../../lib/db'
import { db } from '../../lib/db'
import {
  createDoc,
  deleteDoc,
  linkDocToHandle,
  setLastOpened,
  unlinkDocFromHandle,
} from '../../lib/docs'
import {
  downloadFile,
  importFileFallback,
  openMarkdownFromDisk,
  saveAsToDisk,
  supportsFileSystemAccess,
} from '../../lib/fs'
import { openPrintWindow, toStandaloneHtml } from '../../lib/export'
import { slugForFilename } from '../../lib/markdown'
import { useTheme, type ThemeMode } from '../../hooks/useTheme'

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

  function toggle() {
    setOpen((o) => !o)
  }

  return (
    <div className="menu-wrap" ref={wrapRef}>
      <button
        type="button"
        className={`menu-trigger ${open ? 'is-open' : ''}`}
        onClick={toggle}
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
}

export default function MenuBar({ doc }: Props) {
  const navigate = useNavigate()
  const { mode, setMode } = useTheme()
  const docs = useLiveQuery(() => db.docs.orderBy('updatedAt').reverse().toArray(), [])
  const [query, setQuery] = useState('')

  const filteredDocs = useMemo(() => {
    if (!docs) return []
    const q = query.trim().toLowerCase()
    if (!q) return docs
    return docs.filter(
      (d) => d.title.toLowerCase().includes(q) || d.content.toLowerCase().includes(q),
    )
  }, [docs, query])

  async function handleNew(close: () => void) {
    const d = await createDoc()
    close()
    navigate({ to: '/doc/$docId', params: { docId: d.id } })
  }

  async function handleOpen(close: () => void) {
    close()
    if (supportsFileSystemAccess()) {
      const result = await openMarkdownFromDisk().catch(() => null)
      if (!result) return
      const d = await createDoc({
        content: result.content,
        title: result.name.replace(/\.(md|markdown|mdx)$/i, ''),
      })
      await linkDocToHandle(d.id, result.handleKey)
      navigate({ to: '/doc/$docId', params: { docId: d.id } })
    } else {
      const result = await importFileFallback()
      if (!result) return
      const d = await createDoc({
        content: result.content,
        title: result.name.replace(/\.(md|markdown|mdx)$/i, ''),
      })
      navigate({ to: '/doc/$docId', params: { docId: d.id } })
    }
  }

  async function handleLinkToDisk(close: () => void) {
    const key = await saveAsToDisk(`${slugForFilename(doc.title)}.md`, doc.content).catch(() => null)
    if (key) await linkDocToHandle(doc.id, key)
    close()
  }

  async function handleUnlink(close: () => void) {
    await unlinkDocFromHandle(doc.id)
    close()
  }

  function handleDownloadMd(close: () => void) {
    downloadFile(`${slugForFilename(doc.title)}.md`, doc.content)
    close()
  }

  async function handleExportHtml(close: () => void) {
    const html = await toStandaloneHtml(doc.title, doc.content)
    downloadFile(`${slugForFilename(doc.title)}.html`, html, 'text/html')
    close()
  }

  async function handleExportPdf(close: () => void) {
    await openPrintWindow(doc.title, doc.content)
    close()
  }

  async function handleDeleteActive(close: () => void) {
    close()
    const ok = window.confirm(`Delete "${doc.title}"? This cannot be undone.`)
    if (!ok) return
    const remaining = (docs ?? []).filter((d) => d.id !== doc.id)
    await deleteDoc(doc.id)
    if (remaining.length > 0) {
      navigate({ to: '/doc/$docId', params: { docId: remaining[0].id } })
    } else {
      const fresh = await createDoc()
      navigate({ to: '/doc/$docId', params: { docId: fresh.id } })
    }
  }

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

  const ThemeIcon = mode === 'light' ? Sun : mode === 'dark' ? MoonStar : SunMoon
  const themeLabelMap: Record<ThemeMode, string> = {
    auto: 'Auto',
    light: 'Light',
    dark: 'Dark',
  }

  return (
    <header className="menubar">
      <div className="menubar-brand">
        <span className="menubar-brand-dot" />
        <span className="menubar-brand-name">Typemono</span>
      </div>

      <nav className="menubar-menus" aria-label="Application menu">
        <Menu label="File" width={240}>
          {(close) => (
            <>
              <MenuItem
                icon={<FilePlus size={14} />}
                label="New document"
                onClick={() => handleNew(close)}
              />
              <MenuItem
                icon={supportsFileSystemAccess() ? <FolderOpen size={14} /> : <Upload size={14} />}
                label={supportsFileSystemAccess() ? 'Open from disk…' : 'Import file…'}
                onClick={() => handleOpen(close)}
              />
              <MenuSep />
              {supportsFileSystemAccess() && !doc.linkedHandleKey && (
                <MenuItem
                  icon={<Save size={14} />}
                  label="Save to disk…"
                  onClick={() => handleLinkToDisk(close)}
                />
              )}
              {doc.linkedHandleKey && (
                <MenuItem
                  icon={<HardDrive size={14} />}
                  label="Unlink disk file"
                  onClick={() => handleUnlink(close)}
                />
              )}
              <MenuItem
                icon={<Download size={14} />}
                label="Download .md"
                onClick={() => handleDownloadMd(close)}
              />
              <MenuItem
                icon={<FileDown size={14} />}
                label="Export HTML"
                onClick={() => handleExportHtml(close)}
              />
              <MenuItem
                icon={<Printer size={14} />}
                label="Export PDF (Print)"
                onClick={() => handleExportPdf(close)}
              />
              <MenuSep />
              <MenuItem
                icon={<Trash2 size={14} />}
                label="Delete this document"
                onClick={() => handleDeleteActive(close)}
                danger
              />
            </>
          )}
        </Menu>

        <Menu label="View" width={200}>
          {(close) => (
            <>
              {(['auto', 'light', 'dark'] as const).map((m) => (
                <MenuItem
                  key={m}
                  icon={m === 'auto' ? <SunMoon size={14} /> : m === 'light' ? <Sun size={14} /> : <MoonStar size={14} />}
                  label={themeLabelMap[m]}
                  hint={mode === m ? <Check size={12} /> : null}
                  onClick={() => {
                    setMode(m)
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
              Documents
              <span className="menu-trigger-badge">{docs?.length ?? 0}</span>
            </>
          }
          width={340}
        >
          {(close) => (
            <>
              <div className="menu-search">
                <Search size={13} />
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
                    {d.id !== doc.id && (
                      <button
                        type="button"
                        className="menu-doc-delete"
                        onClick={() => handleDeleteOther(d.id)}
                        title="Delete"
                        aria-label={`Delete ${d.title}`}
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <MenuSep />
              <MenuItem
                icon={<FilePlus size={14} />}
                label="New document"
                onClick={() => handleNew(close)}
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
          className="icon-btn"
          onClick={() => setMode(mode === 'light' ? 'dark' : mode === 'dark' ? 'auto' : 'light')}
          title={`Theme: ${themeLabelMap[mode]} (click to cycle)`}
          aria-label={`Theme: ${themeLabelMap[mode]}`}
        >
          <ThemeIcon size={15} />
        </button>
      </div>
    </header>
  )
}
