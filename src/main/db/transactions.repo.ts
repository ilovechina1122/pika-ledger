import type Database from 'better-sqlite3'
import type { RecordCreateInput, RecordListQuery, RecordUpdateInput } from '../../shared/ipc'
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
  assertCategoryUsable(db, input.categoryId, input.type)

  const info = db
    .prepare(
      'INSERT INTO transactions (amount_cents, type, category_id, date, note) VALUES (?, ?, ?, ?, ?)'
    )
    .run(input.amountCents, input.type, input.categoryId, input.date, input.note ?? '')

  const row = db.prepare(`${TX_SELECT} WHERE t.id = ?`).get(info.lastInsertRowid) as TxRow
  return toRecord(row)
}

// 账单列表：支持时间范围 / 类型 / 分类 / 备注关键词组合筛选，按日期倒序
export function listTransactions(db: Database.Database, query: RecordListQuery): TransactionRecord[] {
  const conds: string[] = []
  const params: unknown[] = []

  if (query.startDate) {
    conds.push('t.date >= ?')
    params.push(query.startDate)
  }
  if (query.endDate) {
    conds.push('t.date <= ?')
    params.push(query.endDate)
  }
  if (query.type) {
    conds.push('t.type = ?')
    params.push(query.type)
  }
  if (query.categoryId) {
    // 选一级大类时，自动包含它下面的全部小类
    const cat = db
      .prepare('SELECT parent_id FROM categories WHERE id = ?')
      .get(query.categoryId) as { parent_id: number | null } | undefined
    if (cat && cat.parent_id === null) {
      conds.push('(t.category_id = ? OR c.parent_id = ?)')
      params.push(query.categoryId, query.categoryId)
    } else {
      conds.push('t.category_id = ?')
      params.push(query.categoryId)
    }
  }
  if (query.noteKeyword) {
    conds.push('t.note LIKE ?')
    params.push(`%${query.noteKeyword}%`)
  }

  const where = conds.length > 0 ? `WHERE ${conds.join(' AND ')}` : ''
  const rows = db.prepare(`${TX_SELECT} ${where} ORDER BY t.date DESC, t.id DESC`).all(...params) as TxRow[]
  return rows.map(toRecord)
}

export function updateTransaction(db: Database.Database, input: RecordUpdateInput): TransactionRecord {
  const existing = db.prepare('SELECT id FROM transactions WHERE id = ?').get(input.id)
  if (!existing) throw new Error('记录不存在')

  // 更换分类时校验分类有效且与类型匹配
  if (input.categoryId !== undefined) {
    const currentType = input.type ?? (
      db.prepare('SELECT type FROM transactions WHERE id = ?').get(input.id) as { type: TxType }
    ).type
    assertCategoryUsable(db, input.categoryId, currentType)
  }

  const sets: string[] = []
  const params: unknown[] = []
  if (input.amountCents !== undefined) {
    sets.push('amount_cents = ?')
    params.push(input.amountCents)
  }
  if (input.type !== undefined) {
    sets.push('type = ?')
    params.push(input.type)
  }
  if (input.categoryId !== undefined) {
    sets.push('category_id = ?')
    params.push(input.categoryId)
  }
  if (input.date !== undefined) {
    sets.push('date = ?')
    params.push(input.date)
  }
  if (input.note !== undefined) {
    sets.push('note = ?')
    params.push(input.note)
  }
  if (sets.length === 0) throw new Error('没有需要修改的内容')
  sets.push("updated_at = datetime('now','localtime')")

  db.prepare(`UPDATE transactions SET ${sets.join(', ')} WHERE id = ?`).run(...params, input.id)

  const row = db.prepare(`${TX_SELECT} WHERE t.id = ?`).get(input.id) as TxRow
  return toRecord(row)
}

export function deleteTransaction(db: Database.Database, id: number): void {
  const info = db.prepare('DELETE FROM transactions WHERE id = ?').run(id)
  if (info.changes === 0) throw new Error('记录不存在')
}

function assertCategoryUsable(db: Database.Database, categoryId: number, type: TxType): void {
  const cat = db
    .prepare('SELECT type FROM categories WHERE id = ? AND is_hidden = 0')
    .get(categoryId) as { type: TxType } | undefined
  if (!cat) throw new Error('分类不存在或已被删除')
  if (cat.type !== type) throw new Error('所选分类与收支类型不匹配')
}
