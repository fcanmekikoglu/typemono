import { loadHandle, removeHandle, saveHandle } from './handles'

export function supportsFileSystemAccess(): boolean {
  return typeof window !== 'undefined' && 'showOpenFilePicker' in window
}

const MD_ACCEPT = {
  description: 'Markdown',
  accept: { 'text/markdown': ['.md', '.markdown', '.mdx'] as string[] },
}

type PermissionMode = 'read' | 'readwrite'

type PermissiveHandle = FileSystemFileHandle & {
  queryPermission?: (d: { mode: PermissionMode }) => Promise<PermissionState>
  requestPermission?: (d: { mode: PermissionMode }) => Promise<PermissionState>
}

export async function ensurePermission(
  handle: FileSystemFileHandle,
  mode: PermissionMode = 'readwrite',
): Promise<boolean> {
  const h = handle as PermissiveHandle
  if (!h.queryPermission || !h.requestPermission) return true
  const q = await h.queryPermission({ mode })
  if (q === 'granted') return true
  const r = await h.requestPermission({ mode })
  return r === 'granted'
}

export interface OpenResult {
  handleKey: string
  name: string
  content: string
}

export async function openMarkdownFromDisk(): Promise<OpenResult | null> {
  if (!supportsFileSystemAccess()) return null
  const picker = (window as unknown as {
    showOpenFilePicker: (o: unknown) => Promise<FileSystemFileHandle[]>
  }).showOpenFilePicker
  const [handle] = await picker({
    types: [MD_ACCEPT],
    multiple: false,
    excludeAcceptAllOption: false,
  })
  if (!handle) return null
  await ensurePermission(handle, 'readwrite')
  const file = await handle.getFile()
  const content = await file.text()
  const key = crypto.randomUUID()
  await saveHandle(key, handle)
  return { handleKey: key, name: file.name, content }
}

export async function writeToHandle(handleKey: string, content: string): Promise<boolean> {
  const handle = await loadHandle(handleKey)
  if (!handle) return false
  const ok = await ensurePermission(handle, 'readwrite')
  if (!ok) return false
  const writable = await (handle as FileSystemFileHandle & {
    createWritable: () => Promise<FileSystemWritableFileStream>
  }).createWritable()
  await writable.write(content)
  await writable.close()
  return true
}

export async function saveAsToDisk(
  suggestedName: string,
  content: string,
): Promise<string | null> {
  if (!supportsFileSystemAccess()) return null
  const picker = (window as unknown as {
    showSaveFilePicker: (o: unknown) => Promise<FileSystemFileHandle>
  }).showSaveFilePicker
  const handle = await picker({
    suggestedName,
    types: [MD_ACCEPT],
  })
  await ensurePermission(handle, 'readwrite')
  const writable = await (handle as FileSystemFileHandle & {
    createWritable: () => Promise<FileSystemWritableFileStream>
  }).createWritable()
  await writable.write(content)
  await writable.close()
  const key = crypto.randomUUID()
  await saveHandle(key, handle)
  return key
}

export async function unlinkHandle(handleKey: string): Promise<void> {
  await removeHandle(handleKey)
}

export async function getHandleName(handleKey: string): Promise<string | null> {
  const handle = await loadHandle(handleKey)
  return handle ? handle.name : null
}

export function importFileFallback(): Promise<{ name: string; content: string } | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.md,.markdown,.mdx,text/markdown'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return resolve(null)
      const content = await file.text()
      resolve({ name: file.name, content })
    }
    input.oncancel = () => resolve(null)
    input.click()
  })
}

export function downloadFile(filename: string, content: string | Blob, mime = 'text/markdown'): void {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
