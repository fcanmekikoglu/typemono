import { useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Check,
  Download,
  FileDown,
  FilePlus,
  FileText,
  FolderOpen,
  HardDrive,
  MoonStar,
  Printer,
  Save,
  Sun,
  SunMoon,
  Trash2,
  Upload,
} from 'lucide-react'
import { createElement } from 'react'
import type { DocRow } from '../lib/db'
import { db } from '../lib/db'
import {
  createDoc,
  deleteDoc,
  linkDocToHandle,
  setLastOpened,
  unlinkDocFromHandle,
} from '../lib/docs'
import {
  downloadFile,
  importFileFallback,
  openMarkdownFromDisk,
  saveAsToDisk,
  supportsFileSystemAccess,
} from '../lib/fs'
import { openPrintWindow, toStandaloneHtml } from '../lib/export'
import { slugForFilename } from '../lib/markdown'
import type { Command } from '../lib/commands'
import { THEMES, type Theme } from '../lib/themes'
import { useTheme } from './useTheme'

const THEME_ICONS: Record<Theme, typeof Sun> = {
  github: SunMoon,
  light: Sun,
  dark: MoonStar,
}

export function useDocCommands(doc: DocRow): Command[] {
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
  const allDocs = useLiveQuery(() => db.docs.orderBy('updatedAt').reverse().toArray(), [])

  return useMemo<Command[]>(() => {
    const cmds: Command[] = []
    const icon = (I: typeof Sun, size = 14) => createElement(I, { size })

    // --- Actions ---
    cmds.push({
      id: 'file.new',
      section: 'action',
      title: 'New document',
      keywords: 'create blank',
      icon: icon(FilePlus),
      run: async () => {
        const d = await createDoc()
        navigate({ to: '/doc/$docId', params: { docId: d.id } })
      },
    })

    cmds.push({
      id: 'file.open',
      section: 'action',
      title: supportsFileSystemAccess() ? 'Open from disk…' : 'Import file…',
      keywords: 'open import upload disk file',
      icon: icon(supportsFileSystemAccess() ? FolderOpen : Upload),
      run: async () => {
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
      },
    })

    if (supportsFileSystemAccess() && !doc.linkedHandleKey) {
      cmds.push({
        id: 'file.saveToDisk',
        section: 'action',
        title: 'Save to disk…',
        keywords: 'save disk file link',
        icon: icon(Save),
        run: async () => {
          const key = await saveAsToDisk(
            `${slugForFilename(doc.title)}.md`,
            doc.content,
          ).catch(() => null)
          if (key) await linkDocToHandle(doc.id, key)
        },
      })
    }

    if (doc.linkedHandleKey) {
      cmds.push({
        id: 'file.unlink',
        section: 'action',
        title: 'Unlink disk file',
        keywords: 'unlink disconnect disk',
        icon: icon(HardDrive),
        run: () => unlinkDocFromHandle(doc.id),
      })
    }

    cmds.push({
      id: 'file.downloadMd',
      section: 'action',
      title: 'Download .md',
      keywords: 'export markdown download',
      icon: icon(Download),
      run: () => {
        downloadFile(`${slugForFilename(doc.title)}.md`, doc.content)
      },
    })

    cmds.push({
      id: 'file.exportHtml',
      section: 'action',
      title: 'Export HTML',
      keywords: 'export html download',
      icon: icon(FileDown),
      run: async () => {
        const html = await toStandaloneHtml(doc.title, doc.content, theme)
        downloadFile(`${slugForFilename(doc.title)}.html`, html, 'text/html')
      },
    })

    cmds.push({
      id: 'file.exportPdf',
      section: 'action',
      title: 'Export PDF (Print)',
      keywords: 'export pdf print',
      icon: icon(Printer),
      run: () => openPrintWindow(doc.title, doc.content, theme),
    })

    cmds.push({
      id: 'file.delete',
      section: 'action',
      title: 'Delete this document',
      subtitle: doc.title,
      keywords: 'delete remove trash',
      icon: icon(Trash2),
      danger: true,
      run: async () => {
        const ok = window.confirm(`Delete "${doc.title}"? This cannot be undone.`)
        if (!ok) return
        const all = allDocs ?? []
        const currentIndex = all.findIndex((d) => d.id === doc.id)
        const remaining = all.filter((d) => d.id !== doc.id)
        const target = remaining[currentIndex] ?? remaining[currentIndex - 1] ?? null
        await deleteDoc(doc.id)
        if (target) {
          navigate({ to: '/doc/$docId', params: { docId: target.id } })
        } else {
          const fresh = await createDoc()
          navigate({ to: '/doc/$docId', params: { docId: fresh.id } })
        }
      },
    })

    // --- Theme ---
    for (const t of ['github', 'light', 'dark'] as const) {
      cmds.push({
        id: `theme.${t}`,
        section: 'theme',
        title: `Theme: ${THEMES[t].label}`,
        subtitle: THEMES[t].description,
        keywords: `theme appearance ${t} ${THEMES[t].label}`,
        icon: icon(THEME_ICONS[t]),
        hint: theme === t ? createElement(Check, { size: 13 }) : null,
        run: () => setTheme(t),
      })
    }

    // --- Documents ---
    if (allDocs) {
      for (const d of allDocs) {
        if (d.id === doc.id) continue
        cmds.push({
          id: `doc.${d.id}`,
          section: 'document',
          title: d.title || 'Untitled',
          subtitle: d.linkedHandleKey ? 'Linked to disk' : undefined,
          keywords: `open switch document ${d.title}`,
          icon: icon(FileText),
          run: async () => {
            await setLastOpened(d.id)
            navigate({ to: '/doc/$docId', params: { docId: d.id } })
          },
        })
      }
    }

    return cmds
  }, [doc, allDocs, theme, setTheme, navigate])
}
