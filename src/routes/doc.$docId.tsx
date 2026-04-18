import { useCallback, useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import CommandPalette from '../components/editor/CommandPalette'
import MenuBar from '../components/editor/MenuBar'
import MilkdownEditor from '../components/editor/MilkdownEditor'
import StatusBar from '../components/editor/StatusBar'
import { useDoc } from '../hooks/useDoc'
import { useDocCommands } from '../hooks/useDocCommands'
import { useHotkey } from '../hooks/useHotkey'
import { setLastOpened } from '../lib/docs'

export const Route = createFileRoute('/doc/$docId')({ component: DocPage })

function DocPage() {
  const { docId } = Route.useParams()
  const { doc, isLoading, status, lastSavedAt, queueSave } = useDoc(docId)
  const [paletteOpen, setPaletteOpen] = useState(false)

  useEffect(() => {
    if (docId) void setLastOpened(docId)
  }, [docId])

  useEffect(() => {
    if (paletteOpen) setPaletteOpen(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docId])

  const togglePalette = useCallback(() => setPaletteOpen((v) => !v), [])
  useHotkey('mod+k', togglePalette, { allowInInputs: true })

  if (isLoading) {
    return (
      <div className="app-shell">
        <div className="editor-loading">Loading…</div>
      </div>
    )
  }

  if (!doc) {
    return (
      <div className="app-shell">
        <div className="editor-loading">Document not found.</div>
      </div>
    )
  }

  return (
    <DocShell doc={doc} paletteOpen={paletteOpen} setPaletteOpen={setPaletteOpen}>
      <main className="editor-pane">
        <div className="editor-scroll">
          <div className="editor-center">
            <MilkdownEditor
              docId={doc.id}
              initialValue={doc.content}
              onChange={(md) => queueSave(md)}
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
  children,
}: {
  doc: NonNullable<ReturnType<typeof useDoc>['doc']>
  paletteOpen: boolean
  setPaletteOpen: (v: boolean) => void
  children: React.ReactNode
}) {
  const commands = useDocCommands(doc)
  return (
    <div className="app-shell">
      <MenuBar doc={doc} commands={commands} onOpenPalette={() => setPaletteOpen(true)} />
      {children}
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        commands={commands}
      />
    </div>
  )
}
