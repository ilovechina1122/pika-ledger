import { ipcMain } from 'electron'
import { z } from 'zod'
import { IPC } from '../../shared/ipc'
import type {
  CategoryBreakdownRow,
  DaySeriesRow,
  MonthSummary,
  MonthTrendRow
} from '../../shared/ipc'
import type { ApiResult, TxType } from '../../shared/types'
import { getDb } from '../db/connection'
import { categoryBreakdown, dailySeries, monthlyTrend, monthSummary } from '../db/stats.repo'
import { fail, guard } from './helpers'

const monthStr = z.string().regex(/^\d{4}-\d{2}$/)
const txType = z.enum(['expense', 'income'])

function parseFail(parsed: { success: false; error: { issues: { message: string }[] } }): ApiResult<never> {
  const detail = parsed.error.issues.map((i) => i.message).join('；')
  return fail(`输入数据不合法：${detail}`, 'BAD_INPUT')
}

export function registerStatsHandlers(): void {
  ipcMain.handle(IPC.statsMonthSummary, (_event, raw: unknown): ApiResult<MonthSummary> => {
    const parsed = monthStr.safeParse(raw)
    if (!parsed.success) return parseFail(parsed)
    return guard(() => monthSummary(getDb(), parsed.data))
  })

  ipcMain.handle(
    IPC.statsCategoryBreakdown,
    (_event, rawMonth: unknown, rawType: unknown, rawParentId: unknown): ApiResult<CategoryBreakdownRow[]> => {
      const parsedMonth = monthStr.safeParse(rawMonth)
      const parsedType = txType.safeParse(rawType)
      const parsedParent = z.number().int().positive().nullable().safeParse(rawParentId ?? null)
      if (!parsedMonth.success) return parseFail(parsedMonth)
      if (!parsedType.success) return parseFail(parsedType)
      if (!parsedParent.success) return parseFail(parsedParent)
      return guard(() =>
        categoryBreakdown(getDb(), parsedMonth.data, parsedType.data as TxType, parsedParent.data)
      )
    }
  )

  ipcMain.handle(IPC.statsDailySeries, (_event, raw: unknown): ApiResult<DaySeriesRow[]> => {
    const parsed = monthStr.safeParse(raw)
    if (!parsed.success) return parseFail(parsed)
    return guard(() => dailySeries(getDb(), parsed.data))
  })

  ipcMain.handle(IPC.statsMonthlyTrend, (_event, rawFrom: unknown, rawTo: unknown): ApiResult<MonthTrendRow[]> => {
    const from = monthStr.safeParse(rawFrom)
    const to = monthStr.safeParse(rawTo)
    if (!from.success) return parseFail(from)
    if (!to.success) return parseFail(to)
    return guard(() => monthlyTrend(getDb(), from.data, to.data))
  })
}
