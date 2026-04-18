import { db, type DocRow } from './db'
import { titleFromMarkdown } from './markdown'
import { removeHandle } from './handles'
import type { Locale } from './i18n'

const DEFAULT_CONTENT_EN = `# Untitled

Start writing here. Type \`/\` for the command menu, or use standard markdown:

- **bold**, *italic*, ~~strikethrough~~
- \`inline code\`
- [links](https://example.com)

\`\`\`js
// fenced code with syntax highlighting
console.log('hello world')
\`\`\`

> A blockquote for a memorable line.

| Col A | Col B |
| ----- | ----- |
| foo   | bar   |
`

const DEFAULT_CONTENT_TR = `# Başlıksız

Yazmaya başlayın. Komut menüsü için \`/\` tuşuna basın ya da standart markdown kullanın:

- **kalın**, *italik*, ~~üstü çizili~~
- \`satır içi kod\`
- [bağlantılar](https://example.com)

\`\`\`js
// sözdizimi vurgulamalı kod bloğu
console.log('merhaba dünya')
\`\`\`

> Akılda kalıcı bir alıntı için blok alıntı.

| Sütun A | Sütun B |
| ------- | ------- |
| foo     | bar     |
`

const DEFAULT_CONTENT: Record<Locale, string> = {
  en: DEFAULT_CONTENT_EN,
  tr: DEFAULT_CONTENT_TR,
}

/**
 * IDs of documents created in this session that haven't been navigated to yet.
 * DocPage reads this set to decide whether to auto-focus the start of the document.
 */
export const newDocIds = new Set<string>()

export async function createDoc(initial?: Partial<DocRow>, locale: Locale = 'en'): Promise<DocRow> {
  const now = Date.now()
  const content = initial?.content ?? DEFAULT_CONTENT[locale] ?? DEFAULT_CONTENT_EN
  const row: DocRow = {
    id: initial?.id ?? crypto.randomUUID(),
    title: initial?.title ?? titleFromMarkdown(content),
    content,
    createdAt: now,
    updatedAt: now,
    linkedHandleKey: initial?.linkedHandleKey,
  }
  await db.docs.put(row)
  await setLastOpened(row.id)
  newDocIds.add(row.id)
  return row
}

export async function getDoc(id: string): Promise<DocRow | undefined> {
  return db.docs.get(id)
}

export async function listDocs(): Promise<DocRow[]> {
  return db.docs.orderBy('updatedAt').reverse().toArray()
}

export async function updateDocContent(id: string, content: string): Promise<void> {
  const title = titleFromMarkdown(content)
  await db.docs.update(id, { content, title, updatedAt: Date.now() })
}

export async function renameDoc(id: string, title: string): Promise<void> {
  await db.docs.update(id, { title: title.trim() || 'Untitled', updatedAt: Date.now() })
}

export async function linkDocToHandle(id: string, handleKey: string): Promise<void> {
  await db.docs.update(id, { linkedHandleKey: handleKey, updatedAt: Date.now() })
}

export async function unlinkDocFromHandle(id: string): Promise<void> {
  const doc = await db.docs.get(id)
  if (doc?.linkedHandleKey) await removeHandle(doc.linkedHandleKey)
  await db.docs.update(id, { linkedHandleKey: undefined, updatedAt: Date.now() })
}

export async function deleteDoc(id: string): Promise<void> {
  const doc = await db.docs.get(id)
  if (doc?.linkedHandleKey) await removeHandle(doc.linkedHandleKey)
  await db.docs.delete(id)
  const last = await getLastOpened()
  if (last === id) await setLastOpened('')
}

export async function getLastOpened(): Promise<string | null> {
  const row = await db.meta.get('lastOpenedId')
  return row?.value || null
}

export async function setLastOpened(id: string): Promise<void> {
  await db.meta.put({ key: 'lastOpenedId', value: id })
}
