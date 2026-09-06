import type { ApiResult } from '../../shared/types'

// 统一结果封装：主进程 IPC 处理器全部通过这三个函数返回
export function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data }
}

export function fail<T = never>(message: string, code = 'INTERNAL'): ApiResult<T> {
  return { ok: false, error: { code, message } }
}

// 包装同步逻辑：异常自动转成失败结果，不会把原始错误抛过 IPC 边界
export function guard<T>(fn: () => T): ApiResult<T> {
  try {
    return ok(fn())
  } catch (err) {
    return fail(err instanceof Error ? err.message : String(err))
  }
}
