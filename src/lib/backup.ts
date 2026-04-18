import { db } from './db'
import { downloadFile } from './fs'

interface BackupDoc {
  id: string
  title: string
  content: string
  createdAt: number
  updatedAt: number
}

interface BackupFile {
  version: 1
  appId: 'typemono'
  exportedAt: number
  docs: BackupDoc[]
}

export type ImportResult = { imported: number; skipped: number } | null

export async function exportBackup(): Promise<void> {
  const rows = await db.docs.toArray()
  const docs: BackupDoc[] = rows.map(({ id, title, content, createdAt, updatedAt }) => ({
    id, title, content, createdAt, updatedAt,
  }))
  const backup: BackupFile = { version: 1, appId: 'typemono', exportedAt: Date.now(), docs }
  const date = new Date().toISOString().slice(0, 10)
  downloadFile(`typemono-backup-${date}.json`, JSON.stringify(backup, null, 2), 'application/json')
}

function parseAndValidate(json: string): BackupFile {
  const data = JSON.parse(json) as BackupFile
  if (data.appId !== 'typemono') throw new Error('invalid_backup')
  if (data.version > 1) throw new Error('unsupported_version')
  return data
}

export function importBackupFromFile(): Promise<ImportResult> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,application/json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return resolve(null)
      try {
        const text = await file.text()
        const backup = parseAndValidate(text)
        const existingKeys = await db.docs.orderBy('id').primaryKeys()
        const existing = new Set(existingKeys as string[])
        const toInsert = backup.docs.filter((d) => !existing.has(d.id))
        if (toInsert.length > 0) await db.docs.bulkPut(toInsert)
        resolve({ imported: toInsert.length, skipped: backup.docs.length - toInsert.length })
      } catch (err) {
        reject(err)
      }
    }
    input.oncancel = () => resolve(null)
    input.click()
  })
}
