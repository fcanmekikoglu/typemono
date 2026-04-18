import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../lib/db'
import { updateDocContent } from '../lib/docs'
import { writeToHandle } from '../lib/fs'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'dirty' | 'error'

const LOADING = Symbol('loading')

export function useDoc(id: string | undefined) {
  const rawDoc = useLiveQuery(() => (id ? db.docs.get(id) : undefined), [id], LOADING)
  const isLoading = rawDoc === LOADING
  const doc = isLoading ? undefined : (rawDoc as Awaited<ReturnType<typeof db.docs.get>>)
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null)
  const timer = useRef<number | null>(null)
  const latest = useRef<string>('')

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [])

  function queueSave(content: string) {
    if (!id) return
    latest.current = content
    setStatus('dirty')
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

  return { doc, isLoading, status, lastSavedAt, queueSave }
}
