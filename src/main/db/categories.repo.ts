import type Database from 'better-sqlite3'
import type { CategoryCreateInput, CategoryRenameInput, CategoryWithCount } from '../../shared/ipc'
import type { Category, TxType } from '../../shared/types'

interface CategoryRow {
  id: number
  name: string
  type: TxType
  parent_id: number | null
  sort_order: number
  is_builtin: number
  is_hidden: number
  emoji: string
}

function toCategory(r: CategoryRow): Category {
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    parentId: r.parent_id,
    sortOrder: r.sort_order,
    isBuiltin: !!r.is_builtin,
    isHidden: !!r.is_hidden,
    emoji: r.emoji
  }
}

function getRow(db: Database.Database, id: number): CategoryRow {
  const row = db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as CategoryRow | undefined
  if (!row) throw new Error('分类不存在')
  return row
}

// 全部分类（含已隐藏）及各分类下的记账笔数，按 类型 + 排序 输出
export function listCategories(db: Database.Database): CategoryWithCount[] {
  const rows = db
    .prepare(
      `SELECT c.*, (SELECT COUNT(*) FROM transactions t WHERE t.category_id = c.id) AS tx_count
       FROM categories c ORDER BY c.type DESC, c.sort_order, c.id`
    )
    .all() as (CategoryRow & { tx_count: number })[]
  return rows.map((r) => ({ ...toCategory(r), txCount: r.tx_count }))
}

// 校验：同级同类型下不重名（排除自身）
function assertNameUnique(
  db: Database.Database,
  name: string,
  type: TxType,
  parentId: number | null,
  excludeId?: number
): void {
  const dup = db
    .prepare(
      `SELECT id FROM categories
       WHERE name = ? AND type = ? AND COALESCE(parent_id, -1) = COALESCE(?, -1) AND is_hidden = 0 AND id != ?`
    )
    .get(name, type, parentId, excludeId ?? -1)
  if (dup) throw new Error('同一层级下已存在同名分类')
}

export function createCategory(db: Database.Database, input: CategoryCreateInput): Category {
  const name = input.name.trim()
  assertNameUnique(db, name, input.type, input.parentId)

  if (input.parentId !== null) {
    const parent = db
      .prepare('SELECT id FROM categories WHERE id = ? AND parent_id IS NULL AND type = ? AND is_hidden = 0')
      .get(input.parentId, input.type)
    if (!parent) throw new Error('所属大类不存在或类型不匹配')
  }

  const maxSort = (
    db
      .prepare(
        'SELECT COALESCE(MAX(sort_order), 0) AS m FROM categories WHERE type = ? AND COALESCE(parent_id, -1) = COALESCE(?, -1)'
      )
      .get(input.type, input.parentId) as { m: number }
  ).m

  const info = db
    .prepare('INSERT INTO categories (name, type, parent_id, sort_order, emoji) VALUES (?, ?, ?, ?, ?)')
    .run(name, input.type, input.parentId, maxSort + 1, input.emoji ?? '')

  return toCategory(getRow(db, Number(info.lastInsertRowid)))
}

export function renameCategory(db: Database.Database, input: CategoryRenameInput): Category {
  const row = getRow(db, input.id)
  const name = input.name.trim()
  assertNameUnique(db, name, row.type, row.parent_id, input.id)

  db.prepare('UPDATE categories SET name = ?, emoji = ? WHERE id = ?').run(
    name,
    input.emoji ?? '',
    input.id
  )
  return toCategory(getRow(db, input.id))
}

// 软删除：历史账单不受影响；删除一级大类时连同其小类一起隐藏
export function deleteCategory(db: Database.Database, id: number): void {
  const row = getRow(db, id)
  db.transaction(() => {
    if (row.parent_id === null) {
      db.prepare('UPDATE categories SET is_hidden = 1 WHERE id = ? OR parent_id = ?').run(id, id)
    } else {
      db.prepare('UPDATE categories SET is_hidden = 1 WHERE id = ?').run(id)
    }
  })()
}

export function restoreCategory(db: Database.Database, id: number): void {
  const row = getRow(db, id)
  db.transaction(() => {
    if (row.parent_id === null) {
      db.prepare('UPDATE categories SET is_hidden = 0 WHERE id = ? OR parent_id = ?').run(id, id)
    } else {
      db.prepare('UPDATE categories SET is_hidden = 0 WHERE id = ?').run(id)
    }
  })()
}
