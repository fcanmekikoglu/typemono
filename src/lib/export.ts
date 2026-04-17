import { marked } from 'marked'
import mermaid from 'mermaid'

let mermaidInited = false
function initMermaid() {
  if (mermaidInited) return
  mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'default' })
  mermaidInited = true
}

async function renderMermaidBlocks(html: string): Promise<string> {
  const parser = new DOMParser()
  const doc = parser.parseFromString(`<body>${html}</body>`, 'text/html')
  const blocks = doc.querySelectorAll('pre > code.language-mermaid, pre > code.lang-mermaid')
  if (blocks.length === 0) return html
  initMermaid()
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

export async function markdownToHtml(md: string): Promise<string> {
  const raw = await marked.parse(md, { gfm: true, breaks: false, async: true })
  return renderMermaidBlocks(raw as string)
}

const STANDALONE_CSS = `
  :root { color-scheme: light dark; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    max-width: 780px; margin: 2.5rem auto; padding: 0 1.25rem; line-height: 1.65;
    color: #1a2327; background: #fafbfa;
  }
  h1,h2,h3,h4 { font-family: Georgia, 'Times New Roman', serif; line-height: 1.25; }
  h1 { font-size: 2.1rem; border-bottom: 1px solid #e3e7e5; padding-bottom: .3rem; }
  h2 { font-size: 1.55rem; margin-top: 2rem; }
  a { color: #2b7a78; }
  code { background: #eef2ef; padding: .15em .4em; border-radius: 4px; font-size: .92em; }
  pre { background: #0f1720; color: #e6eef2; padding: 1rem; border-radius: 10px; overflow-x: auto; }
  pre code { background: transparent; padding: 0; color: inherit; }
  blockquote { border-left: 4px solid #cfd8d3; margin: 1rem 0; padding: .25rem 1rem; color: #445; background: #f1f6f3; }
  table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
  th, td { border: 1px solid #e3e7e5; padding: .45rem .65rem; }
  th { background: #f1f5f3; text-align: left; }
  img { max-width: 100%; height: auto; }
  hr { border: 0; border-top: 1px solid #e3e7e5; margin: 2rem 0; }
  .mermaid-diagram { display: flex; justify-content: center; margin: 1.25rem 0; }
  .mermaid-diagram svg { max-width: 100%; height: auto; }
  ul.contains-task-list { padding-left: 1.1rem; list-style: none; }
  ul.contains-task-list li input { margin-right: .4em; }
`

export async function toStandaloneHtml(title: string, md: string): Promise<string> {
  const body = await markdownToHtml(md)
  const safeTitle = title.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[c]!)
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${safeTitle}</title>
<style>${STANDALONE_CSS}</style>
</head>
<body>
${body}
</body>
</html>
`
}

export async function openPrintWindow(title: string, md: string): Promise<void> {
  const html = await toStandaloneHtml(title, md)
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
