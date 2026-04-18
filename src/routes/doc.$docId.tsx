import { useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import MenuBar from '../components/editor/MenuBar'
import MilkdownEditor from '../components/editor/MilkdownEditor'
import StatusBar from '../components/editor/StatusBar'
import { useDoc } from '../hooks/useDoc'
import { setLastOpened } from '../lib/docs'

export const Route = createFileRoute('/doc/$docId')({ component: DocPage })

function DocPage() {
  const { docId } = Route.useParams()
  const { doc, isLoading, status, lastSavedAt, queueSave } = useDoc(docId)

  useEffect(() => {
    if (docId) void setLastOpened(docId)
  }, [docId])

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
    <div className="app-shell">
      <MenuBar doc={doc} />
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
    </div>
  )
}
