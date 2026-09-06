import { registerCategoryHandlers } from './categories'
import { registerAppHandlers } from './app'
import { registerRecordHandlers } from './records'
import { registerStatsHandlers } from './stats'

// 主进程启动时注册全部 IPC 处理器
export function registerAllIpcHandlers(): void {
  registerCategoryHandlers()
  registerRecordHandlers()
  registerStatsHandlers()
  registerAppHandlers()
}
