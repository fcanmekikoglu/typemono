const H1_RE = /^\s*#\s+(.+?)\s*$/m
const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---\n?/

export function titleFromMarkdown(md: string): string {
  const body = md.replace(FRONTMATTER_RE, '')
  const h1 = body.match(H1_RE)
  if (h1) return h1[1].trim().slice(0, 120) || 'Untitled'
  const firstLine = body.split('\n').find((l) => l.trim().length > 0)
  if (firstLine) return firstLine.trim().replace(/^[#>\-*\d.\s]+/, '').slice(0, 80) || 'Untitled'
  return 'Untitled'
}

export function wordCount(md: string): number {
  const text = md
    .replace(FRONTMATTER_RE, '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/[#>*_~`\-]/g, ' ')
  const matches = text.match(/\S+/g)
  return matches ? matches.length : 0
}

export function slugForFilename(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 60) || 'untitled'
  )
}
