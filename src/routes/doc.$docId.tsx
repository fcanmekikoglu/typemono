import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import MilkdownEditor from '../components/editor/MilkdownEditor'
import Sidebar from '../components/editor/Sidebar'
import StatusBar from '../components/editor/StatusBar'
import Toolbar from '../components/editor/Toolbar'
import { useDoc } from '../hooks/useDoc'
import { setLastOpened } from '../lib/docs'

export const Route = createFileRoute('/doc/$docId')({ component: DocPage })

function DocPage() {
  const { docId } = Route.useParams()
  const { doc, status, lastSavedAt, queueSave } = useDoc(docId)
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return true
    return window.matchMedia('(min-width: 820px)').matches
  })

  useEffect(() => {
    if (docId) void setLastOpened(docId)
  }, [docId])

  if (!doc) {
    return (
      <div className="app-shell">
        <div className="editor-loading">Loading…</div>
      </div>
    )
  }

  return (
    <div className={`app-shell ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {sidebarOpen && <Sidebar activeDocId={docId} onClose={() => setSidebarOpen(false)} />}
      <main className="editor-pane">
        <Toolbar doc={doc} onToggleSidebar={() => setSidebarOpen((o) => !o)} />
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
