import { useMemo, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  FileText,
  FolderOpen,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { db } from '../../lib/db'
import {
  createDoc,
  deleteDoc,
  linkDocToHandle,
  setLastOpened,
} from '../../lib/docs'
import {
  importFileFallback,
  openMarkdownFromDisk,
  supportsFileSystemAccess,
} from '../../lib/fs'

interface Props {
  activeDocId?: string
  onClose?: () => void
}

function formatRelative(ts: number): string {
  const diff = Date.now() - ts
  const s = Math.round(diff / 1000)
  if (s < 60) return `${s}s`
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h`
  const d = Math.round(h / 24)
  return `${d}d`
}

export default function Sidebar({ activeDocId, onClose }: Props) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const docs = useLiveQuery(() => db.docs.orderBy('updatedAt').reverse().toArray(), [])

  const filtered = useMemo(() => {
    if (!docs) return []
    const q = query.trim().toLowerCase()
    if (!q) return docs
    return docs.filter(
      (d) => d.title.toLowerCase().includes(q) || d.content.toLowerCase().includes(q),
    )
  }, [docs, query])

  async function handleNew() {
    const doc = await createDoc()
    navigate({ to: '/doc/$docId', params: { docId: doc.id } })
  }

  async function handleOpenFromDisk() {
    if (supportsFileSystemAccess()) {
      const result = await openMarkdownFromDisk().catch(() => null)
      if (!result) return
      const doc = await createDoc({
        content: result.content,
        title: result.name.replace(/\.(md|markdown|mdx)$/i, ''),
      })
      await linkDocToHandle(doc.id, result.handleKey)
      navigate({ to: '/doc/$docId', params: { docId: doc.id } })
    } else {
      const result = await importFileFallback()
      if (!result) return
      const doc = await createDoc({
        content: result.content,
        title: result.name.replace(/\.(md|markdown|mdx)$/i, ''),
      })
      navigate({ to: '/doc/$docId', params: { docId: doc.id } })
    }
  }

  async function handleDelete(id: string) {
    const doc = docs?.find((d) => d.id === id)
    if (!doc) return
    const ok = window.confirm(`Delete "${doc.title}"? This cannot be undone.`)
    if (!ok) return
    await deleteDoc(id)
    if (id === activeDocId) {
      const remaining = docs?.filter((d) => d.id !== id) ?? []
      if (remaining.length > 0) {
        navigate({ to: '/doc/$docId', params: { docId: remaining[0].id } })
      } else {
        const fresh = await createDoc()
        navigate({ to: '/doc/$docId', params: { docId: fresh.id } })
      }
    }
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-head">
        <div className="sidebar-brand">
          <span className="sidebar-brand-dot" />
          <span>Inkwell</span>
        </div>
        {onClose && (
          <button type="button" className="icon-btn sidebar-close" onClick={onClose} aria-label="Close sidebar">
            <X size={16} />
          </button>
        )}
      </div>

      <div className="sidebar-actions">
        <button type="button" className="side-action" onClick={handleNew}>
          <Plus size={14} /> New
        </button>
        <button type="button" className="side-action" onClick={handleOpenFromDisk}>
          {supportsFileSystemAccess() ? <FolderOpen size={14} /> : <Upload size={14} />}
          {supportsFileSystemAccess() ? 'Open' : 'Import'}
        </button>
      </div>

      <div className="sidebar-search">
        <Search size={13} />
        <input
          type="search"
          placeholder="Search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <nav className="sidebar-list">
        {filtered.length === 0 && (
          <p className="sidebar-empty">No documents yet — create one to start.</p>
        )}
        {filtered.map((doc) => (
          <div
            key={doc.id}
            className={`doc-item ${doc.id === activeDocId ? 'is-active' : ''}`}
          >
            <Link
              to="/doc/$docId"
              params={{ docId: doc.id }}
              className="doc-item-link"
              onClick={() => setLastOpened(doc.id)}
            >
              <span className="doc-item-icon">
                <FileText size={13} />
                {doc.linkedHandleKey && <span className="doc-item-badge" title="Linked to disk file" />}
              </span>
              <span className="doc-item-body">
                <span className="doc-item-title">{doc.title || 'Untitled'}</span>
                <span className="doc-item-meta">{formatRelative(doc.updatedAt)} ago</span>
              </span>
            </Link>
            <button
              type="button"
              className="icon-btn doc-item-delete"
              onClick={() => handleDelete(doc.id)}
              aria-label={`Delete ${doc.title}`}
              title="Delete"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </nav>
    </aside>
  )
}
