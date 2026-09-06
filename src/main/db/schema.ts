import type Database from 'better-sqlite3'

// 数据库版本迁移：数组下标 = 版本号（user_version 从 0 开始逐级升级）
const MIGRATIONS: ((db: Database.Database) => void)[] = [
  // v1：初始表结构
  (db) => {
    db.exec(`
      CREATE TABLE categories (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        name       TEXT    NOT NULL,
        type       TEXT    NOT NULL CHECK (type IN ('expense','income')),
        parent_id  INTEGER REFERENCES categories(id) ON DELETE CASCADE,
        sort_order INTEGER NOT NULL DEFAULT 0,
        is_builtin INTEGER NOT NULL DEFAULT 0,
        is_hidden  INTEGER NOT NULL DEFAULT 0,
        emoji      TEXT    NOT NULL DEFAULT '',
        created_at TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
      );

      CREATE TABLE transactions (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
        type         TEXT    NOT NULL CHECK (type IN ('expense','income')),
        category_id  INTEGER NOT NULL REFERENCES categories(id),
        date         TEXT    NOT NULL,
        note         TEXT    NOT NULL DEFAULT '',
        created_at   TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
        updated_at   TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
      );

      CREATE INDEX idx_tx_date     ON transactions(date);
      CREATE INDEX idx_tx_category ON transactions(category_id);
    `)
  }
]

export function runMigrations(db: Database.Database): void {
  const current = db.pragma('user_version', { simple: true }) as number
  for (let v = current; v < MIGRATIONS.length; v++) {
    db.transaction(() => {
      MIGRATIONS[v](db)
      db.pragma(`user_version = ${v + 1}`)
    })()
  }
}
