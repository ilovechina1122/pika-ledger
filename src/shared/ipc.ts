import type { ApiResult, AppInfo, Category, TransactionRecord, TxType } from './types'

// IPC 通道名常量：主进程注册与渲染层调用共用，防止拼写不一致
export const IPC = {
  categoriesList: 'categories:list',
  categoriesCreate: 'categories:create',
  categoriesRename: 'categories:rename',
  categoriesDelete: 'categories:delete',
  categoriesRestore: 'categories:restore',
  recordsList: 'records:list',
  recordsCreate: 'records:create',
  recordsUpdate: 'records:update',
  recordsDelete: 'records:delete',
  statsMonthSummary: 'stats:monthSummary',
  statsCategoryBreakdown: 'stats:categoryBreakdown',
  statsDailySeries: 'stats:dailySeries',
  statsMonthlyTrend: 'stats:monthlyTrend',
  appGetInfo: 'app:getInfo',
  appOpenDataFolder: 'app:openDataFolder'
} as const

// 各通道的请求/响应类型
export interface CategoryCreateInput {
  name: string
  type: TxType
  parentId: number | null
  emoji?: string
}

export interface CategoryRenameInput {
  id: number
  name: string
  emoji?: string
}

export interface RecordCreateInput {
  amountCents: number
  type: TxType
  categoryId: number
  date: string
  note?: string
}

export interface RecordUpdateInput {
  id: number
  amountCents?: number
  type?: TxType
  categoryId?: number
  date?: string
  note?: string
}

export interface RecordListQuery {
  startDate?: string
  endDate?: string
  type?: TxType
  categoryId?: number
  noteKeyword?: string
}

export interface MonthSummary {
  income: number
  expense: number
  balance: number
}

export interface CategoryBreakdownRow {
  categoryId: number
  categoryName: string
  categoryEmoji: string
  amountCents: number
  count: number
  percent: number
}

export interface DaySeriesRow {
  date: string
  income: number
  expense: number
}

export interface MonthTrendRow {
  month: string
  income: number
  expense: number
}

// 渲染层 window.api 的完整形状（预加载脚本按此实现）
export interface PikaApi {
  categories: {
    list(): Promise<ApiResult<Category[]>>
    create(input: CategoryCreateInput): Promise<ApiResult<Category>>
    rename(input: CategoryRenameInput): Promise<ApiResult<Category>>
    delete(id: number): Promise<ApiResult<null>>
    restore(id: number): Promise<ApiResult<null>>
  }
  records: {
    list(query: RecordListQuery): Promise<ApiResult<TransactionRecord[]>>
    create(input: RecordCreateInput): Promise<ApiResult<TransactionRecord>>
    update(input: RecordUpdateInput): Promise<ApiResult<TransactionRecord>>
    delete(id: number): Promise<ApiResult<null>>
  }
  stats: {
    monthSummary(month: string): Promise<ApiResult<MonthSummary>>
    categoryBreakdown(
      month: string,
      type: TxType,
      parentId?: number | null
    ): Promise<ApiResult<CategoryBreakdownRow[]>>
    dailySeries(month: string): Promise<ApiResult<DaySeriesRow[]>>
    monthlyTrend(fromMonth: string, toMonth: string): Promise<ApiResult<MonthTrendRow[]>>
  }
  app: {
    getInfo(): Promise<ApiResult<AppInfo>>
    openDataFolder(): Promise<ApiResult<null>>
  }
}
