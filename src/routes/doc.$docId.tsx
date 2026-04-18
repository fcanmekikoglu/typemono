import { useCallback, useEffect, useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import CommandPalette from '../components/editor/CommandPalette'
import MenuBar from '../components/editor/MenuBar'
import MilkdownEditor, { type MilkdownEditorHandle } from '../components/editor/MilkdownEditor'
import StatusBar from '../components/editor/StatusBar'
import { useDoc } from '../hooks/useDoc'
import { useDocCommands } from '../hooks/useDocCommands'
import { useHotkey } from '../hooks/useHotkey'
import { useLocale } from '../hooks/useLocale'
import { setLastOpened, newDocIds } from '../lib/docs'
import { useConfirm } from '../hooks/useConfirm'
import type { DocRow } from '../lib/db'




export const Route = createFileRoute('/doc/$docId')({ component: DocPage })

function DocPage() {
  const { docId } = Route.useParams()
  const { doc, isLoading, status, lastSavedAt, queueSave, externalContent, externalCursor, broadcastCursor } = useDoc(docId)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const { t } = useLocale()
  const editorRef = useRef<MilkdownEditorHandle | null>(null)

  useEffect(() => {
    if (docId) void setLastOpened(docId)
  }, [docId])

  useEffect(() => {
    if (paletteOpen) setPaletteOpen(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docId])

  useEffect(() => {
    if (externalContent !== null) {
      editorRef.current?.setContent(externalContent)
    }
  }, [externalContent])

  useEffect(() => {
    if (externalCursor !== null) {
      editorRef.current?.setCursor(externalCursor.from, externalCursor.to)
    }
  }, [externalCursor])

  const closePalette = useCallback(() => {
    setPaletteOpen(false)
    // Restore editor focus so ProseMirror keeps its cursor/selection.
    // Use a microtask to let the palette unmount first.
    void Promise.resolve().then(() => editorRef.current?.focus())
  }, [])

  const togglePalette = useCallback(() => {
    setPaletteOpen((v) => {
      if (v) {
        // Closing: restore editor focus after unmount
        void Promise.resolve().then(() => editorRef.current?.focus())
        return false
      }
      return true
    })
  }, [])
  useHotkey('mod+k', togglePalette, { allowInInputs: true })
  const focusFileMenu = useCallback(() => {
    document.getElementById('file-menu-trigger')?.focus()
  }, [])
  useHotkey('mod+b', focusFileMenu, { allowInInputs: true })

  if (isLoading) {
    return (
      <div className="app-shell">
        <div className="editor-loading">{t.page.loading}</div>
      </div>
    )
  }

  if (!doc) {
    return (
      <div className="app-shell">
        <div className="editor-loading">{t.page.notFound}</div>
      </div>
    )
  }

  return (
    <DocShell doc={doc} paletteOpen={paletteOpen} setPaletteOpen={setPaletteOpen} onClosePalette={closePalette}>
      <main className="editor-pane">
        <div className="editor-scroll">
          <div className="editor-center">
            <MilkdownEditor
              ref={editorRef}
              docId={doc.id}
              initialValue={doc.content}
              onChange={(md) => queueSave(md)}
              onCursorChange={(from, to) => broadcastCursor(from, to)}
              onReady={() => {
                if (newDocIds.has(doc.id)) {
                  newDocIds.delete(doc.id)
                  editorRef.current?.focusStart()
                }
              }}
            />
          </div>
        </div>
        <StatusBar
          content={doc.content}
          status={status}
          lastSavedAt={lastSavedAt}
          linked={Boolean(doc.linkedHandleKey)}
        />
      </main>
    </DocShell>
  )
}

function DocShell({
  doc,
  paletteOpen,
  setPaletteOpen,
  onClosePalette,
  children,
}: {
  doc: DocRow
  paletteOpen: boolean
  setPaletteOpen: (v: boolean) => void
  onClosePalette: () => void
  children: React.ReactNode
}) {
  const { confirm, ConfirmNode } = useConfirm()
  const commands = useDocCommands(doc, confirm)
  return (
    <div className="app-shell">
      <MenuBar doc={doc} commands={commands} onOpenPalette={() => setPaletteOpen(true)} confirm={confirm} />
      {children}
      <CommandPalette
        open={paletteOpen}
        onClose={onClosePalette}
        commands={commands}
      />
      {ConfirmNode}
    </div>
  )
}
