import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle } from 'lucide-react'

interface Props {
  message: string
  detail?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  message,
  detail,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = true,
  onConfirm,
  onCancel,
}: Props) {
  const cancelRef = useRef<HTMLButtonElement | null>(null)
  const confirmRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    cancelRef.current?.focus()
  }, [])

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault()
      onCancel()
      return
    }
    if (e.key === 'Tab') {
      e.preventDefault()
      if (document.activeElement === confirmRef.current) {
        cancelRef.current?.focus()
      } else {
        confirmRef.current?.focus()
      }
    }
  }

  return createPortal(
    <div
      className="cdlg-backdrop"
      onMouseDown={onCancel}
      role="presentation"
    >
      <div
        className={`cdlg-card ${danger ? 'is-danger' : ''}`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="cdlg-msg"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        {danger && (
          <div className="cdlg-icon-wrap">
            <AlertTriangle size={18} />
          </div>
        )}
        <p id="cdlg-msg" className="cdlg-message">{message}</p>
        {detail && <p className="cdlg-detail">{detail}</p>}
        <div className="cdlg-actions">
          <button
            ref={cancelRef}
            type="button"
            className="cdlg-btn cdlg-btn-cancel"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            className={`cdlg-btn ${danger ? 'cdlg-btn-danger' : 'cdlg-btn-confirm'}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
