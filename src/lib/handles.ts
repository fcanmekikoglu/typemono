import { del, get, set } from 'idb-keyval'

const PREFIX = 'fsh:'

export async function saveHandle(key: string, handle: FileSystemFileHandle): Promise<void> {
  await set(PREFIX + key, handle)
}

export async function loadHandle(key: string): Promise<FileSystemFileHandle | undefined> {
  return (await get(PREFIX + key)) as FileSystemFileHandle | undefined
}

export async function removeHandle(key: string): Promise<void> {
  await del(PREFIX + key)
}
