// 渲染层可见的 window.api 类型（M2 起随共享接口扩展）
export interface PikaApi {}

declare global {
  interface Window {
    api: PikaApi
  }
}

export {}
