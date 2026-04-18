import type { ReactNode } from 'react'

export type CommandSection = 'action' | 'theme' | 'document'

export interface Command {
  id: string
  title: string
  subtitle?: string
  section: CommandSection
  keywords?: string
  icon?: ReactNode
  hint?: ReactNode
  run: () => void | Promise<void>
  danger?: boolean
}

export const SECTION_LABEL: Record<CommandSection, string> = {
  action: 'Actions',
  theme: 'Theme',
  document: 'Documents',
}

const SECTION_ORDER: CommandSection[] = ['action', 'theme', 'document']

interface Scored {
  command: Command
  score: number
  order: number
}

export function filterCommands(query: string, commands: Command[]): Command[] {
  const q = query.trim().toLowerCase()
  if (!q) return [...commands].sort((a, b) => {
    const sa = SECTION_ORDER.indexOf(a.section)
    const sb = SECTION_ORDER.indexOf(b.section)
    return sa - sb
  })

  const scored: Scored[] = []
  commands.forEach((cmd, i) => {
    const hay = (cmd.title + ' ' + (cmd.keywords ?? '') + ' ' + (cmd.subtitle ?? '')).toLowerCase()
    const titleLower = cmd.title.toLowerCase()
    let score = 0
    if (titleLower === q) score = 1000
    else if (titleLower.startsWith(q)) score = 500
    else if (titleLower.includes(q)) score = 300
    else if (hay.includes(q)) score = 100
    else return
    scored.push({ command: cmd, score, order: i })
  })
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    const sa = SECTION_ORDER.indexOf(a.command.section)
    const sb = SECTION_ORDER.indexOf(b.command.section)
    if (sa !== sb) return sa - sb
    return a.order - b.order
  })
  return scored.map((s) => s.command)
}

export function groupCommands(commands: Command[]): Array<{ section: CommandSection; items: Command[] }> {
  const groups = new Map<CommandSection, Command[]>()
  for (const cmd of commands) {
    const list = groups.get(cmd.section)
    if (list) list.push(cmd)
    else groups.set(cmd.section, [cmd])
  }
  return SECTION_ORDER.filter((s) => groups.has(s)).map((s) => ({ section: s, items: groups.get(s)! }))
}
