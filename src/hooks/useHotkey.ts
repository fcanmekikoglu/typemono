import { useEffect } from 'react'

export const IS_MAC =
  typeof navigator !== 'undefined' &&
  /mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent)

export const MOD_LABEL = IS_MAC ? '⌘' : 'Ctrl'

interface ParsedCombo {
  key: string
  mod: boolean
  shift: boolean
  alt: boolean
}

function parseCombo(combo: string): ParsedCombo {
  const parts = combo.toLowerCase().split('+').map((p) => p.trim())
  const key = parts[parts.length - 1]
  return {
    key,
    mod: parts.includes('mod') || parts.includes('cmd') || parts.includes('ctrl'),
    shift: parts.includes('shift'),
    alt: parts.includes('alt') || parts.includes('option'),
  }
}

function comboMatches(e: KeyboardEvent, p: ParsedCombo): boolean {
  const expectedMod = p.mod ? (IS_MAC ? e.metaKey : e.ctrlKey) : !(IS_MAC ? e.metaKey : e.ctrlKey)
  if (!expectedMod) return false
  if (p.shift !== e.shiftKey) return false
  if (p.alt !== e.altKey) return false
  return e.key.toLowerCase() === p.key
}

function isInEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  if (target.isContentEditable) return true
  return false
}

interface Options {
  /** Fire even when focus is inside an input/textarea/contenteditable. Default false. */
  allowInInputs?: boolean
  /** Disable the shortcut without unmounting. */
  enabled?: boolean
  /** Always preventDefault when matched. Default true. */
  preventDefault?: boolean
}

export function useHotkey(
  combo: string,
  handler: (e: KeyboardEvent) => void,
  { allowInInputs = false, enabled = true, preventDefault = true }: Options = {},
) {
  useEffect(() => {
    if (!enabled) return
    const parsed = parseCombo(combo)
    function onKey(e: KeyboardEvent) {
      if (!comboMatches(e, parsed)) return
      if (!allowInInputs && isInEditable(e.target)) return
      if (preventDefault) e.preventDefault()
      handler(e)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [combo, handler, allowInInputs, enabled, preventDefault])
}
