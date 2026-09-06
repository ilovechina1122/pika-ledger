import type Database from 'better-sqlite3'
import type {
  CategoryBreakdownRow,
  DaySeriesRow,
  MonthSummary,
  MonthTrendRow
} from '../../shared/ipc'
import type { TxType } from '../../shared/types'

// 月度总览：收入 / 支出 / 结余（单位：分）
export function monthSummary(db: Database.Database, month: string): MonthSummary {
  const rows = db
    .prepare(
      'SELECT type, SUM(amount_cents) AS total FROM transactions WHERE substr(date,1,7) = ? GROUP BY type'
    )
    .all(month) as { type: TxType; total: number | null }[]
  let income = 0
  let expense = 0
  for (const r of rows) {
    if (r.type === 'income') income = r.total ?? 0
    else expense = r.total ?? 0
  }
  return { income, expense, balance: income - expense }
}

interface BreakdownDbRow {
  category_id: number
  category_name: string
  category_emoji: string
  amount_cents: number
  cnt: number
}

// 分类构成：parentId 为空时按一级大类汇总，否则下钻到该大类的二级小类
export function categoryBreakdown(
  db: Database.Database,
  month: string,
  type: TxType,
  parentId: number | null
): CategoryBreakdownRow[] {
  const total =
    (
      db
        .prepare('SELECT SUM(amount_cents) AS t FROM transactions WHERE type = ? AND substr(date,1,7) = ?')
        .get(type, month) as { t: number | null }
    ).t ?? 0
  if (total === 0) return []

  const rows = (
    parentId === null
      ? db
          .prepare(
            `SELECT COALESCE(p.id, c.id) AS category_id,
                    COALESCE(p.name, c.name) AS category_name,
                    COALESCE(p.emoji, c.emoji) AS category_emoji,
                    SUM(t.amount_cents) AS amount_cents,
                    COUNT(*) AS cnt
             FROM transactions t
             JOIN categories c ON t.category_id = c.id
             LEFT JOIN categories p ON c.parent_id = p.id
             WHERE t.type = ? AND substr(t.date,1,7) = ?
             GROUP BY category_id
             ORDER BY amount_cents DESC`
          )
          .all(type, month)
      : db
          .prepare(
            `SELECT c.id AS category_id, c.name AS category_name, c.emoji AS category_emoji,
                    SUM(t.amount_cents) AS amount_cents, COUNT(*) AS cnt
             FROM transactions t
             JOIN categories c ON t.category_id = c.id
             WHERE t.type = ? AND c.parent_id = ? AND substr(t.date,1,7) = ?
             GROUP BY c.id
             ORDER BY amount_cents DESC`
          )
          .all(type, parentId, month)
  ) as BreakdownDbRow[]

  return rows.map((r) => ({
    categoryId: r.category_id,
    categoryName: r.category_name,
    categoryEmoji: r.category_emoji,
    amountCents: r.amount_cents,
    count: r.cnt,
    percent: Math.round((r.amount_cents / total) * 10000) / 100
  }))
}

// 当月每日收支（只包含有数据的日期，渲染层补全日历）
export function dailySeries(db: Database.Database, month: string): DaySeriesRow[] {
  const rows = db
    .prepare(
      `SELECT date, type, SUM(amount_cents) AS total
       FROM transactions WHERE substr(date,1,7) = ? GROUP BY date, type`
    )
    .all(month) as { date: string; type: TxType; total: number }[]
  const map = new Map<string, DaySeriesRow>()
  for (const r of rows) {
    let d = map.get(r.date) ?? { date: r.date, income: 0, expense: 0 }
    if (r.type === 'income') d.income = r.total
    else d.expense = r.total
    map.set(r.date, d)
  }
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([, v]) => v)
}

// 月度趋势（含零数据月份）
export function monthlyTrend(
  db: Database.Database,
  fromMonth: string,
  toMonth: string
): MonthTrendRow[] {
  const rows = db
    .prepare(
      `SELECT substr(date,1,7) AS month, type, SUM(amount_cents) AS total
       FROM transactions WHERE substr(date,1,7) BETWEEN ? AND ?
       GROUP BY month, type`
    )
    .all(fromMonth, toMonth) as { month: string; type: TxType; total: number }[]
  const map = new Map<string, MonthTrendRow>()
  for (const r of rows) {
    let m = map.get(r.month) ?? { month: r.month, income: 0, expense: 0 }
    if (r.type === 'income') m.income = r.total
    else m.expense = r.total
    map.set(r.month, m)
  }
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([, v]) => v)
}
