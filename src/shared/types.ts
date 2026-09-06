// 多宝记账共享类型：主进程 / 预加载 / 渲染层共用同一份定义

export type TxType = 'expense' | 'income'

export interface Category {
  id: number
  name: string
  type: TxType
  parentId: number | null
  sortOrder: number
  isBuiltin: boolean
  isHidden: boolean
  emoji: string
}

export interface TransactionRecord {
  id: number
  amountCents: number
  type: TxType
  categoryId: number
  categoryName: string
  categoryEmoji: string
  date: string
  note: string
  createdAt: string
  updatedAt: string
}

// 主进程统一返回结构：渲染层先看 ok，再看 data
export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } }

export interface AppInfo {
  version: string
  dataDir: string
}
