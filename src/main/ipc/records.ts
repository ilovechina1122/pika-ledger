import { ipcMain } from 'electron'
import { z } from 'zod'
import { IPC } from '../../shared/ipc'
import type { ApiResult, TransactionRecord } from '../../shared/types'
import { getDb } from '../db/connection'
import { createTransaction } from '../db/transactions.repo'
import { fail, guard } from './helpers'

const createSchema = z.object({
  amountCents: z.number().int().positive(),
  type: z.enum(['expense', 'income']),
  categoryId: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().max(50).optional()
})

export function registerRecordHandlers(): void {
  // 记一笔：校验输入后写入数据库
  ipcMain.handle(IPC.recordsCreate, (_event, raw: unknown): ApiResult<TransactionRecord> => {
    const parsed = createSchema.safeParse(raw)
    if (!parsed.success) {
      const detail = parsed.error.issues.map((i) => i.message).join('；')
      return fail(`输入数据不合法：${detail}`, 'BAD_INPUT')
    }
    return guard(() => createTransaction(getDb(), parsed.data))
  })
}
