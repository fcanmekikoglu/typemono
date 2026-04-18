import { useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Archive,
  ArchiveRestore,
  Check,
  Download,
  FileDown,
  FilePlus,
  FileText,
  FolderOpen,
  Globe,
  HardDrive,
  Keyboard,
  MoonStar,
  Printer,
  Save,
  Sun,
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
import { exportBackup, importBackupFromFile } from '../lib/backup'
import { slugForFilename } from '../lib/markdown'
import { LOCALES, type Locale } from '../lib/i18n'
import type { Command } from '../lib/commands'
import { type Theme } from '../lib/themes'
import { useTheme } from './useTheme'
import { useLocale } from './useLocale'

const THEME_ICONS: Record<Theme, typeof Sun> = {
  light: Sun,
  dark: MoonStar,
}

type ConfirmFn = (opts: { message: string; detail?: string }) => Promise<boolean>

export function useDocCommands(doc: DocRow, confirmFn?: ConfirmFn): Command[] {
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
  const { locale, setLocale, t } = useLocale()
  const allDocs = useLiveQuery(() => db.docs.orderBy('updatedAt').reverse().toArray(), [])
  const resolvedConfirm: ConfirmFn = confirmFn ?? (({ message }) =>
    Promise.resolve(window.confirm(message))
  )

  return useMemo<Command[]>(() => {
    const cmds: Command[] = []
    const icon = (I: typeof Sun, size = 14) => createElement(I, { size })

    // --- Actions ---
    cmds.push({
      id: 'file.new',
      section: 'action',
      title: t.actions.newDocument,
      keywords: t.keywords.newDocument,
      icon: icon(FilePlus),
      run: async () => {
        const d = await createDoc(undefined, locale)
        navigate({ to: '/doc/$docId', params: { docId: d.id } })
      },
    })

    cmds.push({
      id: 'file.open',
      section: 'action',
      title: supportsFileSystemAccess() ? t.actions.openFromDisk : t.actions.importFile,
      keywords: t.keywords.open,
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
        title: t.actions.saveToDisk,
        keywords: t.keywords.save,
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
        title: t.actions.unlinkDisk,
        keywords: t.keywords.unlink,
        icon: icon(HardDrive),
        run: () => unlinkDocFromHandle(doc.id),
      })
    }

    cmds.push({
      id: 'file.downloadMd',
      section: 'action',
      title: t.actions.downloadMd,
      keywords: t.keywords.download,
      icon: icon(Download),
      run: () => {
        downloadFile(`${slugForFilename(doc.title)}.md`, doc.content)
      },
    })

    cmds.push({
      id: 'file.backupExport',
      section: 'action',
      title: t.actions.backupExport,
      keywords: t.keywords.backupExport,
      icon: icon(Archive),
      run: () => exportBackup(),
    })

    cmds.push({
      id: 'file.backupImport',
      section: 'action',
      title: t.actions.backupImport,
      keywords: t.keywords.backupImport,
      icon: icon(ArchiveRestore),
      run: async () => {
        try {
          const result = await importBackupFromFile()
          if (result === null) return
          window.alert(t.confirm.importDone(result.imported, result.skipped))
        } catch {
          window.alert(t.confirm.importInvalid)
        }
      },
    })

    cmds.push({
      id: 'file.exportHtml',
      section: 'action',
      title: t.actions.exportHtml,
      keywords: t.keywords.exportHtml,
      icon: icon(FileDown),
      run: async () => {
        const html = await toStandaloneHtml(doc.title, doc.content, theme)
        downloadFile(`${slugForFilename(doc.title)}.html`, html, 'text/html')
      },
    })

    cmds.push({
      id: 'file.exportPdf',
      section: 'action',
      title: t.actions.exportPdf,
      keywords: t.keywords.exportPdf,
      icon: icon(Printer),
      run: () => openPrintWindow(doc.title, doc.content, theme),
    })

    cmds.push({
      id: 'file.delete',
      section: 'action',
      title: t.actions.deleteDocument,
      subtitle: doc.title,
      keywords: t.keywords.delete,
      icon: icon(Trash2),
      danger: true,
      run: async () => {
        const ok = await resolvedConfirm({ message: t.confirm.deleteActive(doc.title) })
        if (!ok) return
        const all = allDocs ?? []
        const currentIndex = all.findIndex((d) => d.id === doc.id)
        const remaining = all.filter((d) => d.id !== doc.id)
        const target = remaining[currentIndex] ?? remaining[currentIndex - 1] ?? null
        await deleteDoc(doc.id)
        if (target) {
          navigate({ to: '/doc/$docId', params: { docId: target.id } })
        } else {
          const fresh = await createDoc(undefined, locale)
          navigate({ to: '/doc/$docId', params: { docId: fresh.id } })
        }
      },
    })

    // --- Theme ---
    for (const th of ['light', 'dark'] as const) {
      const info = t.theme[th]
      cmds.push({
        id: `theme.${th}`,
        section: 'theme',
        title: `${t.theme.prefix}: ${info.label}`,
        subtitle: info.description,
        keywords: `${t.keywords.theme} ${th} ${info.label}`,
        icon: icon(THEME_ICONS[th]),
        hint: theme === th ? createElement(Check, { size: 13 }) : null,
        run: () => setTheme(th),
      })
    }

    // --- Language ---
    for (const loc of Object.keys(LOCALES) as Locale[]) {
      const locInfo = LOCALES[loc]
      cmds.push({
        id: `language.${loc}`,
        section: 'language',
        title: locInfo.nativeLabel,
        subtitle: locInfo.label,
        keywords: `${t.keywords.language} ${loc} ${locInfo.label} ${locInfo.nativeLabel}`,
        icon: icon(Globe),
        hint: locale === loc ? createElement(Check, { size: 13 }) : null,
        run: () => setLocale(loc),
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
          subtitle: d.linkedHandleKey ? t.documentsMenu.linkedHint : undefined,
          keywords: `${t.keywords.openSwitch} ${d.title}`,
          icon: icon(FileText),
          run: async () => {
            await setLastOpened(d.id)
            navigate({ to: '/doc/$docId', params: { docId: d.id } })
          },
        })
      }
    }

    return cmds
  }, [doc, allDocs, theme, setTheme, locale, setLocale, navigate, t, resolvedConfirm])
}
