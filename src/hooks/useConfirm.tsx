import { useCallback, useState } from 'react'
import ConfirmDialog from '../components/editor/ConfirmDialog'

interface ConfirmOptions {
  message: string
  detail?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

interface PendingConfirm {
  options: ConfirmOptions
  resolve: (ok: boolean) => void
}

/**
 * Returns a `confirm(options)` function that shows an in-app dialog
 * and resolves to `true` (confirmed) or `false` (cancelled).
 *
 * Also returns a `ConfirmNode` element that must be rendered in the tree.
 */
export function useConfirm() {
  const [pending, setPending] = useState<PendingConfirm | null>(null)

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setPending({ options, resolve })
    })
  }, [])

  function settle(ok: boolean) {
    if (!pending) return
    const { resolve } = pending
    setPending(null)
    resolve(ok)
  }

  const ConfirmNode = pending ? (
    <ConfirmDialog
      message={pending.options.message}
      detail={pending.options.detail}
      confirmLabel={pending.options.confirmLabel}
      cancelLabel={pending.options.cancelLabel}
      danger={pending.options.danger ?? true}
      onConfirm={() => settle(true)}
      onCancel={() => settle(false)}
    />
  ) : null

  return { confirm, ConfirmNode }
}
