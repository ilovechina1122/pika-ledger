import { ipcMain } from 'electron'
import { z } from 'zod'
import { IPC } from '../../shared/ipc'
import type { ApiResult, Category } from '../../shared/types'
import type { CategoryWithCount } from '../../shared/ipc'
import { getDb } from '../db/connection'
import {
  createCategory,
  deleteCategory,
  listCategories,
  renameCategory,
  restoreCategory
} from '../db/categories.repo'
import { fail, guard } from './helpers'

const createSchema = z.object({
  name: z.string().trim().min(1, '名称不能为空').max(10, '名称最多 10 个字'),
  type: z.enum(['expense', 'income']),
  parentId: z.number().int().positive().nullable(),
  emoji: z.string().max(8).optional()
})

const renameSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().trim().min(1, '名称不能为空').max(10, '名称最多 10 个字'),
  emoji: z.string().max(8).optional()
})

const idSchema = z.number().int().positive()

function parseFail(parsed: { success: false; error: { issues: { message: string }[] } }): ApiResult<never> {
  const detail = parsed.error.issues.map((i) => i.message).join('；')
  return fail(`输入数据不合法：${detail}`, 'BAD_INPUT')
}

export function registerCategoryHandlers(): void {
  ipcMain.handle(IPC.categoriesList, (): ApiResult<CategoryWithCount[]> => {
    return guard(() => listCategories(getDb()))
  })

  ipcMain.handle(IPC.categoriesCreate, (_event, raw: unknown): ApiResult<Category> => {
    const parsed = createSchema.safeParse(raw)
    if (!parsed.success) return parseFail(parsed)
    return guard(() => createCategory(getDb(), parsed.data))
  })

  ipcMain.handle(IPC.categoriesRename, (_event, raw: unknown): ApiResult<Category> => {
    const parsed = renameSchema.safeParse(raw)
    if (!parsed.success) return parseFail(parsed)
    return guard(() => renameCategory(getDb(), parsed.data))
  })

  ipcMain.handle(IPC.categoriesDelete, (_event, raw: unknown): ApiResult<null> => {
    const parsed = idSchema.safeParse(raw)
    if (!parsed.success) return parseFail(parsed)
    return guard(() => {
      deleteCategory(getDb(), parsed.data)
      return null
    })
  })

  ipcMain.handle(IPC.categoriesRestore, (_event, raw: unknown): ApiResult<null> => {
    const parsed = idSchema.safeParse(raw)
    if (!parsed.success) return parseFail(parsed)
    return guard(() => {
      restoreCategory(getDb(), parsed.data)
      return null
    })
  })
}
