import type Database from 'better-sqlite3'
import type { RecordCreateInput } from '../../shared/ipc'
import type { TransactionRecord, TxType } from '../../shared/types'

interface TxRow {
  id: number
  amount_cents: number
  type: TxType
  category_id: number
  date: string
  note: string
  created_at: string
  updated_at: string
  category_name: string
  category_emoji: string
}

// 查询时带上分类名与 emoji（小类无 emoji 时沿用大类的）
const TX_SELECT = `
  SELECT t.id, t.amount_cents, t.type, t.category_id, t.date, t.note, t.created_at, t.updated_at,
         c.name AS category_name,
         COALESCE(p.emoji, c.emoji) AS category_emoji
  FROM transactions t
  JOIN categories c ON t.category_id = c.id
  LEFT JOIN categories p ON c.parent_id = p.id
`

function toRecord(r: TxRow): TransactionRecord {
  return {
    id: r.id,
    amountCents: r.amount_cents,
    type: r.type,
    categoryId: r.category_id,
    categoryName: r.category_name,
    categoryEmoji: r.category_emoji,
    date: r.date,
    note: r.note,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  }
}

export function createTransaction(db: Database.Database, input: RecordCreateInput): TransactionRecord {
  const cat = db
    .prepare('SELECT type FROM categories WHERE id = ? AND is_hidden = 0')
    .get(input.categoryId) as { type: TxType } | undefined
  if (!cat) throw new Error('分类不存在或已被删除')
  if (cat.type !== input.type) throw new Error('所选分类与收支类型不匹配')

  const info = db
    .prepare(
      'INSERT INTO transactions (amount_cents, type, category_id, date, note) VALUES (?, ?, ?, ?, ?)'
    )
    .run(input.amountCents, input.type, input.categoryId, input.date, input.note ?? '')

  const row = db.prepare(`${TX_SELECT} WHERE t.id = ?`).get(info.lastInsertRowid) as TxRow
  return toRecord(row)
}
