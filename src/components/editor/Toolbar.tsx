import { useEffect, useRef, useState } from 'react'
import {
  Download,
  FileDown,
  HardDrive,
  Menu,
  MoonStar,
  MoreHorizontal,
  Printer,
  Save,
  Sun,
  SunMoon,
} from 'lucide-react'
import type { DocRow } from '../../lib/db'
import { linkDocToHandle, unlinkDocFromHandle } from '../../lib/docs'
import { downloadFile, saveAsToDisk, supportsFileSystemAccess } from '../../lib/fs'
import { openPrintWindow, toStandaloneHtml } from '../../lib/export'
import { slugForFilename } from '../../lib/markdown'
import { useTheme } from '../../hooks/useTheme'

interface Props {
  doc: DocRow
  onToggleSidebar: () => void
}

export default function Toolbar({ doc, onToggleSidebar }: Props) {
  const { mode, cycle } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!menuOpen) return
    function onDocClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [menuOpen])

  async function exportMarkdown() {
    downloadFile(`${slugForFilename(doc.title)}.md`, doc.content)
    setMenuOpen(false)
  }

  async function exportHtml() {
    const html = await toStandaloneHtml(doc.title, doc.content)
    downloadFile(`${slugForFilename(doc.title)}.html`, html, 'text/html')
    setMenuOpen(false)
  }

  async function exportPdf() {
    await openPrintWindow(doc.title, doc.content)
    setMenuOpen(false)
  }

  async function linkToDisk() {
    const key = await saveAsToDisk(`${slugForFilename(doc.title)}.md`, doc.content).catch(() => null)
    if (key) await linkDocToHandle(doc.id, key)
    setMenuOpen(false)
  }

  async function unlinkDisk() {
    await unlinkDocFromHandle(doc.id)
    setMenuOpen(false)
  }

  const ThemeIcon = mode === 'light' ? Sun : mode === 'dark' ? MoonStar : SunMoon
  const themeLabel =
    mode === 'auto'
      ? 'Theme: auto (system)'
      : mode === 'dark'
        ? 'Theme: dark'
        : 'Theme: light'

  return (
    <header className="toolbar">
      <button
        type="button"
        className="icon-btn toolbar-menu-btn"
        onClick={onToggleSidebar}
        aria-label="Toggle sidebar"
        title="Toggle sidebar"
      >
        <Menu size={16} />
      </button>
      <div className="toolbar-title" title={doc.title}>
        {doc.title || 'Untitled'}
      </div>
      <div className="toolbar-right">
        {doc.linkedHandleKey && (
          <span className="toolbar-chip" title="Linked to a file on disk">
            <HardDrive size={12} /> Disk
          </span>
        )}
        <button type="button" className="icon-btn" onClick={cycle} title={themeLabel} aria-label={themeLabel}>
          <ThemeIcon size={16} />
        </button>
        <div className="toolbar-menu-wrap" ref={menuRef}>
          <button
            type="button"
            className="icon-btn"
            onClick={() => setMenuOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="More actions"
            title="More"
          >
            <MoreHorizontal size={16} />
          </button>
          {menuOpen && (
            <div className="toolbar-menu" role="menu">
              {supportsFileSystemAccess() && !doc.linkedHandleKey && (
                <button type="button" className="toolbar-menu-item" onClick={linkToDisk} role="menuitem">
                  <Save size={14} /> Save to disk…
                </button>
              )}
              {doc.linkedHandleKey && (
                <button type="button" className="toolbar-menu-item" onClick={unlinkDisk} role="menuitem">
                  <HardDrive size={14} /> Unlink disk file
                </button>
              )}
              <div className="toolbar-menu-sep" />
              <button type="button" className="toolbar-menu-item" onClick={exportMarkdown} role="menuitem">
                <Download size={14} /> Download .md
              </button>
              <button type="button" className="toolbar-menu-item" onClick={exportHtml} role="menuitem">
                <FileDown size={14} /> Export HTML
              </button>
              <button type="button" className="toolbar-menu-item" onClick={exportPdf} role="menuitem">
                <Printer size={14} /> Export PDF (Print)
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
