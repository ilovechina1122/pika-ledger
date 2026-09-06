import { app } from 'electron'
import { promises as fs } from 'fs'
import { join } from 'path'
import dayjs from 'dayjs'
import type Database from 'better-sqlite3'

// 每天首次启动时备份数据库，保留最近 30 份（数据安全的兜底网）
export async function backupDaily(db: Database.Database): Promise<void> {
  const dir = join(app.getPath('userData'), 'backups')
  await fs.mkdir(dir, { recursive: true })

  const today = dayjs().format('YYYYMMDD')
  const target = join(dir, `ledger-${today}.db`)

  // 今天的备份已存在则跳过
  try {
    await fs.access(target)
    return
  } catch {
    // 不存在，继续备份
  }

  await db.backup(target)

  // 清理 30 天前的旧备份
  const files = (await fs.readdir(dir)).filter((f) => f.startsWith('ledger-') && f.endsWith('.db'))
  for (const f of files) {
    const m = /^ledger-(\d{8})\.db$/.exec(f)
    if (m && dayjs(m[1], 'YYYYMMDD').isBefore(dayjs().subtract(30, 'day'), 'day')) {
      await fs.unlink(join(dir, f)).catch(() => {})
    }
  }
}
