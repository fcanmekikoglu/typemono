import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { Crepe } from '@milkdown/crepe'
import { editorViewCtx, serializerCtx } from '@milkdown/kit/core'
import { TextSelection } from '@milkdown/kit/prose/state'
import { replaceAll } from '@milkdown/kit/utils'
import '@milkdown/crepe/theme/common/style.css'
import '@milkdown/crepe/theme/frame.css'
import '@milkdown/crepe/theme/frame-dark.css'

interface Props {
  docId: string
  initialValue: string
  onChange: (markdown: string) => void
  onReady?: () => void
  onCursorChange?: (from: number, to: number) => void
}

export interface MilkdownEditorHandle {
  setContent(markdown: string): void
  setCursor(from: number, to: number): void
  focus(): void
  focusStart(): void
}

const MilkdownEditor = forwardRef<MilkdownEditorHandle, Props>(function MilkdownEditor(
  { docId, initialValue, onChange, onReady, onCursorChange },
  ref,
) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const onReadyRef = useRef(onReady)
  onReadyRef.current = onReady
  const onCursorChangeRef = useRef(onCursorChange)
  onCursorChangeRef.current = onCursorChange
  const crepeRef = useRef<Crepe | null>(null)
  // Prevents re-broadcasting content that arrived from another tab
  const isApplyingExternal = useRef(false)
  // Prevents re-broadcasting cursor that arrived from another tab
  const isApplyingExternalCursor = useRef(false)

  useImperativeHandle(ref, () => ({
    setContent(markdown: string) {
      const crepe = crepeRef.current
      if (!crepe) return
      isApplyingExternal.current = true
      crepe.editor.action((ctx) => {
        const view = ctx.get(editorViewCtx)
        const { from, to } = view.state.selection
        replaceAll(markdown)(ctx)
        // Restore cursor position clamped to new doc size
        const newDoc = view.state.doc
        const max = newDoc.content.size
        try {
          view.dispatch(
            view.state.tr.setSelection(
              TextSelection.create(newDoc, Math.min(from, max), Math.min(to, max)),
            ),
          )
        } catch {
          // Leave cursor wherever replaceAll put it if position is invalid
        }
      })
      // Reset after Milkdown's internal 200ms debounce so it doesn't re-broadcast
      setTimeout(() => {
        isApplyingExternal.current = false
      }, 250)
    },
    setCursor(from: number, to: number) {
      const crepe = crepeRef.current
      if (!crepe) return
      isApplyingExternalCursor.current = true
      crepe.editor.action((ctx) => {
        const view = ctx.get(editorViewCtx)
        const max = view.state.doc.content.size
        try {
          view.dispatch(
            view.state.tr.setSelection(
              TextSelection.create(
                view.state.doc,
                Math.min(from, max),
                Math.min(to, max),
              ),
            ),
          )
        } catch {
          // ignore invalid positions
        }
      })
      setTimeout(() => {
        isApplyingExternalCursor.current = false
      }, 50)
    },
    focus() {
      const crepe = crepeRef.current
      if (!crepe) return
      crepe.editor.action((ctx) => {
        ctx.get(editorViewCtx).focus()
      })
    },
    focusStart() {
      const crepe = crepeRef.current
      if (!crepe) return
      crepe.editor.action((ctx) => {
        const view = ctx.get(editorViewCtx)
        try {
          view.dispatch(
            view.state.tr.setSelection(
              TextSelection.create(view.state.doc, 1),
            ),
          )
        } catch {
          // doc might be empty; fallback to plain focus
        }
        view.focus()
      })
    },
  }))

  useEffect(() => {
    if (!hostRef.current) return
    let destroyed = false
    let flushTimer: ReturnType<typeof setTimeout> | null = null

    const crepe = new Crepe({ root: hostRef.current, defaultValue: initialValue })
    crepeRef.current = crepe

    crepe
      .create()
      .then(() => {
        if (destroyed) return
        onReadyRef.current?.()
        // Intercept view.dispatch to notify onChange per-keystroke,
        // bypassing Milkdown's 200ms markdownUpdated debounce.
        crepe.editor.action((ctx) => {
          const view = ctx.get(editorViewCtx)
          const serialize = ctx.get(serializerCtx)
          const originalDispatch = view.dispatch.bind(view)

          view.dispatch = (tr) => {
            originalDispatch(tr)
            // Broadcast cursor position on every selection change (not only doc changes)
            if (!isApplyingExternalCursor.current && !destroyed && tr.selectionSet) {
              const { from, to } = view.state.selection
              onCursorChangeRef.current?.(from, to)
            }
            if (!tr.docChanged || isApplyingExternal.current || destroyed) return
            if (flushTimer !== null) clearTimeout(flushTimer)
            flushTimer = setTimeout(() => {
              flushTimer = null
              if (destroyed || isApplyingExternal.current) return
              onChangeRef.current(serialize(view.state.doc))
            }, 0)
          }
        })
      })
      .catch((err) => {
        if (!destroyed) console.error('Crepe init failed', err)
      })

    return () => {
      destroyed = true
      crepeRef.current = null
      if (flushTimer !== null) clearTimeout(flushTimer)
      crepe.destroy().catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docId])

  return <div ref={hostRef} className="milkdown-host" />
})

export default MilkdownEditor
