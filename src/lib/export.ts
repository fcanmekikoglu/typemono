import { marked } from 'marked'
import mermaid from 'mermaid'
import { exportCss, type Theme } from './themes'

let mermaidInited: 'default' | 'dark' | null = null
function initMermaid(theme: Theme) {
  const mTheme = theme === 'dark' ? 'dark' : 'default'
  if (mermaidInited === mTheme) return
  mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: mTheme })
  mermaidInited = mTheme
}

async function renderMermaidBlocks(html: string, theme: Theme): Promise<string> {
  const parser = new DOMParser()
  const doc = parser.parseFromString(`<body>${html}</body>`, 'text/html')
  const blocks = doc.querySelectorAll('pre > code.language-mermaid, pre > code.lang-mermaid')
  if (blocks.length === 0) return html
  initMermaid(theme)
  let i = 0
  for (const code of Array.from(blocks)) {
    const source = code.textContent ?? ''
    try {
      const { svg } = await mermaid.render(`mmd-${Date.now()}-${i++}`, source)
      const wrapper = doc.createElement('div')
      wrapper.className = 'mermaid-diagram'
      wrapper.innerHTML = svg
      const pre = code.parentElement
      pre?.replaceWith(wrapper)
    } catch {
      /* leave as code block if invalid */
    }
  }
  return doc.body.innerHTML
}

export async function markdownToHtml(md: string, theme: Theme = 'light'): Promise<string> {
  const raw = await marked.parse(md, { gfm: true, breaks: false, async: true })
  return renderMermaidBlocks(raw as string, theme)
}

const FONT_LINK =
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=JetBrains+Mono:wght@400;500&display=swap">'

export async function toStandaloneHtml(
  title: string,
  md: string,
  theme: Theme = 'light',
): Promise<string> {
  const body = await markdownToHtml(md, theme)
  const safeTitle = title.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[c]!)
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${safeTitle}</title>
${FONT_LINK}
<style>${exportCss(theme)}</style>
</head>
<body>
${body}
</body>
</html>
`
}

export async function openPrintWindow(title: string, md: string, theme: Theme = 'light'): Promise<void> {
  const html = await toStandaloneHtml(title, md, theme)
  const w = window.open('', '_blank', 'width=900,height=1100')
  if (!w) {
    alert('Please allow popups to export PDF (print).')
    return
  }
  w.document.open()
  w.document.write(html)
  w.document.close()
  setTimeout(() => {
    w.focus()
    w.print()
  }, 400)
}
