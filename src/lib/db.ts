import Dexie, { type Table } from 'dexie'

export interface DocRow {
  id: string
  title: string
  content: string
  createdAt: number
  updatedAt: number
  linkedHandleKey?: string
}

export interface MetaRow {
  key: string
  value: string
}

export class InkwellDB extends Dexie {
  docs!: Table<DocRow, string>
  meta!: Table<MetaRow, string>

  constructor() {
    super('inkwell')
    this.version(1).stores({
      docs: 'id, updatedAt, title',
      meta: 'key',
    })
  }
}

export const db = new InkwellDB()
