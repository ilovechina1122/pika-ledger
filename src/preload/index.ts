import { contextBridge } from 'electron'

// 渲染层能用的接口（M2 起会加入数据库相关方法，通过共享类型约束）
const api = {}

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
