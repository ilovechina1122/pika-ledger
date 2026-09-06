import type { ApiResult } from '@shared/types'

// 解包 IPC 结果：失败时抛出错误，由页面统一提示
export async function unwrap<T>(p: Promise<ApiResult<T>>): Promise<T> {
  const r = await p
  if (r.ok) return r.data
  throw new Error(r.error.message)
}
