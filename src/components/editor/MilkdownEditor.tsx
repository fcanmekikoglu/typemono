import { useEffect, useRef } from 'react'
import { Crepe } from '@milkdown/crepe'
import '@milkdown/crepe/theme/common/style.css'
import '@milkdown/crepe/theme/frame.css'
import '@milkdown/crepe/theme/frame-dark.css'

interface Props {
  docId: string
  initialValue: string
  onChange: (markdown: string) => void
}

export default function MilkdownEditor({ docId, initialValue, onChange }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    if (!hostRef.current) return
    let destroyed = false
    const crepe = new Crepe({ root: hostRef.current, defaultValue: initialValue })
    crepe.on((listener) => {
      listener.markdownUpdated((_ctx, markdown, prev) => {
        if (markdown === prev) return
        onChangeRef.current(markdown)
      })
    })
    crepe.create().catch((err) => {
      if (!destroyed) console.error('Crepe init failed', err)
    })
    return () => {
      destroyed = true
      crepe.destroy().catch(() => {})
    }
    // docId in deps so switching documents re-instantiates the editor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docId])

  return <div ref={hostRef} className="milkdown-host" />
}
