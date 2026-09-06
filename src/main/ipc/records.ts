import { ipcMain } from 'electron'
import { z } from 'zod'
import { IPC } from '../../shared/ipc'
import type { ApiResult, TransactionRecord } from '../../shared/types'
import { getDb } from '../db/connection'
import {
  createTransaction,
  deleteTransaction,
  listTransactions,
  updateTransaction
} from '../db/transactions.repo'
import { fail, guard } from './helpers'

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
const txType = z.enum(['expense', 'income'])

const createSchema = z.object({
  amountCents: z.number().int().positive(),
  type: txType,
  categoryId: z.number().int().positive(),
  date: dateStr,
  note: z.string().max(50).optional()
})

const listSchema = z.object({
  startDate: dateStr.optional(),
  endDate: dateStr.optional(),
  type: txType.optional(),
  categoryId: z.number().int().positive().optional(),
  noteKeyword: z.string().max(50).optional()
})

const updateSchema = z.object({
  id: z.number().int().positive(),
  amountCents: z.number().int().positive().optional(),
  type: txType.optional(),
  categoryId: z.number().int().positive().optional(),
  date: dateStr.optional(),
  note: z.string().max(50).optional()
})

const deleteSchema = z.number().int().positive()

function parseFail(parsed: { success: false; error: { issues: { message: string }[] } }): ApiResult<never> {
  const detail = parsed.error.issues.map((i) => i.message).join('；')
  return fail(`输入数据不合法：${detail}`, 'BAD_INPUT')
}

export function registerRecordHandlers(): void {
  // 记一笔
  ipcMain.handle(IPC.recordsCreate, (_event, raw: unknown): ApiResult<TransactionRecord> => {
    const parsed = createSchema.safeParse(raw)
    if (!parsed.success) return parseFail(parsed)
    return guard(() => createTransaction(getDb(), parsed.data))
  })

  // 账单列表（筛选）
  ipcMain.handle(IPC.recordsList, (_event, raw: unknown): ApiResult<TransactionRecord[]> => {
    const parsed = listSchema.safeParse(raw ?? {})
    if (!parsed.success) return parseFail(parsed)
    return guard(() => listTransactions(getDb(), parsed.data))
  })

  // 编辑记录
  ipcMain.handle(IPC.recordsUpdate, (_event, raw: unknown): ApiResult<TransactionRecord> => {
    const parsed = updateSchema.safeParse(raw)
    if (!parsed.success) return parseFail(parsed)
    return guard(() => updateTransaction(getDb(), parsed.data))
  })

  // 删除记录
  ipcMain.handle(IPC.recordsDelete, (_event, raw: unknown): ApiResult<null> => {
    const parsed = deleteSchema.safeParse(raw)
    if (!parsed.success) return parseFail(parsed)
    return guard(() => {
      deleteTransaction(getDb(), parsed.data)
      return null
    })
  })
}
