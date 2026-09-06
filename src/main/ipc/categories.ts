import { ipcMain } from 'electron'
import { IPC } from '../../shared/ipc'
import type { ApiResult, Category } from '../../shared/types'
import { getDb } from '../db/connection'
import { listCategories } from '../db/categories.repo'
import { guard } from './helpers'

export function registerCategoryHandlers(): void {
  ipcMain.handle(IPC.categoriesList, (): ApiResult<Category[]> => {
    return guard(() => listCategories(getDb()))
  })
}
