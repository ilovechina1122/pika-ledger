import { app } from 'electron'
import { join } from 'path'
import Database from 'better-sqlite3'
import { runMigrations } from './schema'
import { seedBuiltinCategories } from './seed'
import { backupDaily } from './backup'

let db: Database.Database | null = null

// 主进程独占数据库连接，其他模块通过 getDb() 取用
export function getDb(): Database.Database {
  if (!db) throw new Error('数据库尚未初始化')
  return db
}

export async function initDb(): Promise<void> {
  const dbPath = join(app.getPath('userData'), 'ledger.db')
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  runMigrations(db)
  seedBuiltinCategories(db)
  const categoryCount = (db.prepare('SELECT COUNT(*) AS n FROM categories').get() as { n: number }).n
  console.log(`[皮卡记账] 数据库就绪: ${dbPath}（分类 ${categoryCount} 个）`)
  await backupDaily(db)
}

export function closeDb(): void {
  if (db) {
    db.close()
    db = null
  }
}
