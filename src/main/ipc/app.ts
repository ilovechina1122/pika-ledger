import { app, ipcMain, shell } from 'electron'
import { IPC } from '../../shared/ipc'
import type { ApiResult, AppInfo } from '../../shared/types'
import { guard, ok } from './helpers'

export function registerAppHandlers(): void {
  ipcMain.handle(IPC.appGetInfo, (): ApiResult<AppInfo> => {
    return ok({ version: app.getVersion(), dataDir: app.getPath('userData') })
  })

  ipcMain.handle(IPC.appOpenDataFolder, (): ApiResult<null> => {
    return guard(() => {
      shell.openPath(app.getPath('userData'))
      return null
    })
  })
}
