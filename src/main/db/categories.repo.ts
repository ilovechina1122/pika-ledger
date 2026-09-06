import type Database from 'better-sqlite3'
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

// 全部分类（含已隐藏），按 类型 + 排序 输出，渲染层自行组树
export function listCategories(db: Database.Database): Category[] {
  const rows = db
    .prepare('SELECT * FROM categories ORDER BY type DESC, sort_order, id')
    .all() as CategoryRow[]
  return rows.map(toCategory)
}
