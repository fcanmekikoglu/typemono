export type Theme = 'github' | 'light' | 'dark'

export const DEFAULT_THEME: Theme = 'light'

export interface ThemeDef {
  id: Theme
  label: string
  description: string
  colorScheme: 'light' | 'dark'
}

export const THEMES: Record<Theme, ThemeDef> = {
  github: {
    id: 'github',
    label: 'GitHub',
    description: 'GitHub-flavored sans-serif',
    colorScheme: 'light',
  },
  light: {
    id: 'light',
    label: 'Light',
    description: 'Clean serif (Typora-like)',
    colorScheme: 'light',
  },
  dark: {
    id: 'dark',
    label: 'Dark',
    description: 'Serif on deep background',
    colorScheme: 'dark',
  },
}

export function isTheme(v: unknown): v is Theme {
  return v === 'github' || v === 'light' || v === 'dark'
}

/** Standalone CSS for the chosen theme (used in HTML/PDF export). */
export function exportCss(theme: Theme): string {
  switch (theme) {
    case 'github':
      return GITHUB_EXPORT_CSS
    case 'dark':
      return DARK_EXPORT_CSS
    case 'light':
    default:
      return LIGHT_EXPORT_CSS
  }
}

const GITHUB_EXPORT_CSS = `
  :root { color-scheme: light; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif;
    font-size: 16px;
    line-height: 1.5;
    color: #1f2328;
    background: #ffffff;
    max-width: 860px;
    margin: 2.5rem auto;
    padding: 0 1.5rem;
    word-wrap: break-word;
  }
  h1, h2, h3, h4, h5, h6 {
    font-weight: 600;
    margin-top: 24px;
    margin-bottom: 16px;
    line-height: 1.25;
  }
  h1 { font-size: 2em; padding-bottom: .3em; border-bottom: 1px solid #d1d9e0; }
  h2 { font-size: 1.5em; padding-bottom: .3em; border-bottom: 1px solid #d1d9e0; }
  h3 { font-size: 1.25em; }
  h4 { font-size: 1em; }
  h5 { font-size: .875em; }
  h6 { font-size: .85em; color: #59636e; }
  p { margin: 0 0 16px; }
  a { color: #0969da; text-decoration: none; }
  a:hover { text-decoration: underline; }
  code, kbd, samp, pre {
    font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace;
  }
  code {
    padding: .2em .4em;
    font-size: 85%;
    background: rgba(129,139,152,0.18);
    border-radius: 6px;
  }
  pre {
    padding: 16px;
    font-size: 85%;
    line-height: 1.45;
    color: #1f2328;
    background: #f6f8fa;
    border-radius: 6px;
    overflow-x: auto;
  }
  pre code { padding: 0; background: transparent; font-size: 100%; }
  blockquote {
    padding: 0 1em;
    color: #59636e;
    border-left: .25em solid #d1d9e0;
    margin: 0 0 16px;
  }
  hr { height: .25em; margin: 24px 0; background: #d1d9e0; border: 0; }
  table { border-collapse: collapse; margin: 0 0 16px; display: block; width: max-content; max-width: 100%; overflow: auto; }
  th, td { padding: 6px 13px; border: 1px solid #d1d9e0; }
  th { background: #f6f8fa; font-weight: 600; }
  tr:nth-child(2n) td { background: #f6f8fa; }
  img { max-width: 100%; }
  ul, ol { padding-left: 2em; margin: 0 0 16px; }
  li + li { margin-top: 0.25em; }
  ul.contains-task-list { list-style: none; padding-left: 1.3em; }
  ul.contains-task-list li input { margin-right: .4em; }
  .mermaid-diagram { display: flex; justify-content: center; margin: 1.25rem 0; }
  .mermaid-diagram svg { max-width: 100%; height: auto; }
`

const LIGHT_EXPORT_CSS = `
  :root { color-scheme: light; }
  body {
    font-family: 'Fraunces', Georgia, 'Times New Roman', serif;
    font-size: 17px;
    line-height: 1.7;
    color: #1a2327;
    background: #fafbfa;
    max-width: 760px;
    margin: 3rem auto;
    padding: 0 1.5rem;
  }
  h1, h2, h3, h4, h5, h6 {
    font-family: 'Fraunces', Georgia, serif;
    font-weight: 600;
    line-height: 1.25;
    letter-spacing: -0.012em;
    color: #1a2327;
  }
  h1 { font-size: 2.2em; margin: 0 0 .5em; }
  h2 { font-size: 1.6em; margin: 1.6em 0 .5em; }
  h3 { font-size: 1.3em; margin: 1.4em 0 .5em; }
  h4 { font-size: 1.1em; margin: 1.2em 0 .5em; }
  p { margin: 0 0 1em; }
  a { color: #17514f; text-decoration-color: rgba(43,122,120,0.6); text-decoration-thickness: 1px; text-underline-offset: 3px; }
  code, kbd, pre, samp { font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace; }
  code { font-size: .9em; padding: .15em .4em; background: rgba(23,40,45,0.08); border-radius: 5px; }
  pre {
    background: #f1f4f2;
    border: 1px solid rgba(23,40,45,0.09);
    border-radius: 10px;
    padding: 14px 16px;
    font-size: 13.5px;
    overflow-x: auto;
  }
  pre code { padding: 0; background: transparent; font-size: inherit; }
  blockquote {
    border-left: 3px solid #2b7a78;
    padding: .2em 1em;
    margin: 1em 0;
    color: #5a6b70;
    background: rgba(43,122,120,0.06);
    border-radius: 0 6px 6px 0;
  }
  hr { border: 0; border-top: 1px solid rgba(23,40,45,0.16); margin: 2em 0; }
  table { border-collapse: collapse; width: 100%; margin: 1em 0; }
  th, td { border: 1px solid rgba(23,40,45,0.09); padding: .45em .65em; }
  th { background: #f1f4f2; text-align: left; font-weight: 600; }
  img { max-width: 100%; border-radius: 8px; }
  ul, ol { padding-left: 1.6em; }
  ul.contains-task-list { list-style: none; padding-left: 1.1em; }
  ul.contains-task-list li input { margin-right: .4em; }
  .mermaid-diagram { display: flex; justify-content: center; margin: 1.25rem 0; }
  .mermaid-diagram svg { max-width: 100%; height: auto; }
`

const DARK_EXPORT_CSS = `
  :root { color-scheme: dark; }
  body {
    font-family: 'Fraunces', Georgia, 'Times New Roman', serif;
    font-size: 17px;
    line-height: 1.7;
    color: #e3ecef;
    background: #0d1418;
    max-width: 760px;
    margin: 3rem auto;
    padding: 0 1.5rem;
  }
  h1, h2, h3, h4, h5, h6 {
    font-family: 'Fraunces', Georgia, serif;
    font-weight: 600;
    line-height: 1.25;
    letter-spacing: -0.012em;
    color: #e3ecef;
  }
  h1 { font-size: 2.2em; margin: 0 0 .5em; }
  h2 { font-size: 1.6em; margin: 1.6em 0 .5em; }
  h3 { font-size: 1.3em; margin: 1.4em 0 .5em; }
  h4 { font-size: 1.1em; margin: 1.2em 0 .5em; }
  p { margin: 0 0 1em; }
  a { color: #a3eee9; text-decoration-color: rgba(110,212,207,0.55); text-decoration-thickness: 1px; text-underline-offset: 3px; }
  code, kbd, pre, samp { font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace; }
  code { font-size: .9em; padding: .15em .4em; background: rgba(200,230,235,0.12); border-radius: 5px; }
  pre {
    background: #0a1014;
    border: 1px solid rgba(200,230,235,0.1);
    border-radius: 10px;
    padding: 14px 16px;
    font-size: 13.5px;
    overflow-x: auto;
    color: #e3ecef;
  }
  pre code { padding: 0; background: transparent; font-size: inherit; }
  blockquote {
    border-left: 3px solid #6ed4cf;
    padding: .2em 1em;
    margin: 1em 0;
    color: #a7b8bd;
    background: rgba(110,212,207,0.08);
    border-radius: 0 6px 6px 0;
  }
  hr { border: 0; border-top: 1px solid rgba(200,230,235,0.18); margin: 2em 0; }
  table { border-collapse: collapse; width: 100%; margin: 1em 0; }
  th, td { border: 1px solid rgba(200,230,235,0.1); padding: .45em .65em; }
  th { background: #0a1014; text-align: left; font-weight: 600; }
  img { max-width: 100%; border-radius: 8px; }
  ul, ol { padding-left: 1.6em; }
  ul.contains-task-list { list-style: none; padding-left: 1.1em; }
  ul.contains-task-list li input { margin-right: .4em; }
  .mermaid-diagram { display: flex; justify-content: center; margin: 1.25rem 0; }
  .mermaid-diagram svg { max-width: 100%; height: auto; }
`
