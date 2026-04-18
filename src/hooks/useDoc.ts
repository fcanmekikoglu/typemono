import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../lib/db'
import { updateDocContent } from '../lib/docs'
import { writeToHandle } from '../lib/fs'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'dirty' | 'error'

const LOADING = Symbol('loading')

const docChannel =
  typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('doc-sync') : null

export function useDoc(id: string | undefined) {
  const [externalContent, setExternalContent] = useState<string | null>(null)
  const [externalCursor, setExternalCursor] = useState<{ from: number; to: number } | null>(null)
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null)
  const timer = useRef<number | null>(null)
  const latest = useRef<string>('')
  const rawDoc = useLiveQuery(() => (id ? db.docs.get(id) : undefined), [id], LOADING)

  const isLoading = rawDoc === LOADING
  const doc = isLoading ? undefined : (rawDoc as Awaited<ReturnType<typeof db.docs.get>>)

  useEffect(() => {
    if (!docChannel || !id) return
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'content' && e.data?.id === id) {
        setExternalContent(e.data.content as string)
      } else if (e.data?.type === 'cursor' && e.data?.id === id) {
        setExternalCursor({ from: e.data.from as number, to: e.data.to as number })
      }
    }
    docChannel.addEventListener('message', handler)
    return () => docChannel.removeEventListener('message', handler)
  }, [id])

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [])

  function queueSave(content: string) {
    if (!id) return
    latest.current = content
    setStatus('dirty')
    // Broadcast immediately to other tabs — no DB round-trip needed for live sync
    docChannel?.postMessage({ type: 'content', id, content })
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(async () => {
      setStatus('saving')
      try {
        await updateDocContent(id, latest.current)
        const current = await db.docs.get(id)
        if (current?.linkedHandleKey) {
          const ok = await writeToHandle(current.linkedHandleKey, latest.current)
          if (!ok) {
            setStatus('error')
            return
          }
        }
        setLastSavedAt(Date.now())
        setStatus('saved')
      } catch {
        setStatus('error')
      }
    }, 500)
  }

  function broadcastCursor(from: number, to: number) {
    if (!id) return
    docChannel?.postMessage({ type: 'cursor', id, from, to })
  }

  return { doc, isLoading, status, lastSavedAt, queueSave, externalContent, externalCursor, broadcastCursor }
}
