import type { PikaApi } from '@shared/ipc'

// 渲染层可见的 window.api 类型（由共享 IPC 契约保证主/渲染两侧一致）
declare global {
  interface Window {
    api: PikaApi
  }
}

export {}
