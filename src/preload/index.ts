import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../shared/ipc'
import type {
  CategoryCreateInput,
  CategoryRenameInput,
  PikaApi,
  RecordCreateInput,
  RecordListQuery,
  RecordUpdateInput
} from '../shared/ipc'
import type { TxType } from '../shared/types'

// 渲染层唯一入口：全部能力都通过 window.api 访问，渲染层接触不到 Node
const api: PikaApi = {
  categories: {
    list: () => ipcRenderer.invoke(IPC.categoriesList),
    create: (input: CategoryCreateInput) => ipcRenderer.invoke(IPC.categoriesCreate, input),
    rename: (input: CategoryRenameInput) => ipcRenderer.invoke(IPC.categoriesRename, input),
    delete: (id: number) => ipcRenderer.invoke(IPC.categoriesDelete, id),
    restore: (id: number) => ipcRenderer.invoke(IPC.categoriesRestore, id)
  },
  records: {
    list: (query: RecordListQuery) => ipcRenderer.invoke(IPC.recordsList, query),
    create: (input: RecordCreateInput) => ipcRenderer.invoke(IPC.recordsCreate, input),
    update: (input: RecordUpdateInput) => ipcRenderer.invoke(IPC.recordsUpdate, input),
    delete: (id: number) => ipcRenderer.invoke(IPC.recordsDelete, id)
  },
  stats: {
    monthSummary: (month: string) => ipcRenderer.invoke(IPC.statsMonthSummary, month),
    categoryBreakdown: (month: string, type: TxType, parentId?: number | null) =>
      ipcRenderer.invoke(IPC.statsCategoryBreakdown, month, type, parentId ?? null),
    dailySeries: (month: string) => ipcRenderer.invoke(IPC.statsDailySeries, month),
    monthlyTrend: (fromMonth: string, toMonth: string) =>
      ipcRenderer.invoke(IPC.statsMonthlyTrend, fromMonth, toMonth)
  },
  app: {
    getInfo: () => ipcRenderer.invoke(IPC.appGetInfo),
    openDataFolder: () => ipcRenderer.invoke(IPC.appOpenDataFolder)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (defined in index.d.ts)
  window.api = api
}
