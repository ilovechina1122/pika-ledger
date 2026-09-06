import { registerCategoryHandlers } from './categories'
import { registerAppHandlers } from './app'

// 主进程启动时注册全部 IPC 处理器
export function registerAllIpcHandlers(): void {
  registerCategoryHandlers()
  registerAppHandlers()
}
