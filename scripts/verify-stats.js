// 统计 SQL 验证脚本（在 Electron 环境下运行，复用 Electron ABI 的 better-sqlite3）
// 做法：用 SQLite backup API 把真实数据库快照到临时文件（与 App 每日备份同机制，WAL 安全）
//        → 在快照上插入已知金额的记录 → 核对每个统计接口的数字
// 用法: npx electron scripts/verify-stats.js
const fs = require('fs')
const path = require('path')
const os = require('os')
const Database = require('better-sqlite3')

// 优先使用隔离数据目录（PIKA_DATA_DIR），否则用正式数据目录
const src = process.env.PIKA_DATA_DIR
  ? path.join(process.env.PIKA_DATA_DIR, 'ledger.db')
  : path.join(process.env.APPDATA || '', 'pika-ledger', 'ledger.db')
const tmp = path.join(os.tmpdir(), `pika-verify-${Date.now()}.db`)

let failures = 0
function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (!ok) failures++
  console.log(`${ok ? '✅ PASS' : '❌ FAIL'} ${name}: 实际=${JSON.stringify(actual)} 期望=${JSON.stringify(expected)}`)
}

const srcDb = new Database(src, { readonly: true, fileMustExist: true })

srcDb
  .backup(tmp)
  .then(() => {
    srcDb.close()
    const tmpDb = new Database(tmp)
    run(tmpDb)
    tmpDb.close()
    fs.unlinkSync(tmp)
    console.log(failures === 0 ? '\n全部通过 🎉' : `\n${failures} 项失败`)
    process.exit(failures === 0 ? 0 : 1)
  })
  .catch((err) => {
    console.error('备份失败:', (err && err.stack) || err)
    process.exit(1)
  })

function run(db) {
  // ---- 准备：取分类 id，插入已知金额的记录 ----
  function catId(parentName, childName) {
    const parent = db
      .prepare('SELECT id FROM categories WHERE name = ? AND parent_id IS NULL')
      .get(parentName)
    return db.prepare('SELECT id FROM categories WHERE name = ? AND parent_id = ?').get(childName, parent.id).id
  }
  const breakfastId = catId('餐饮', '早餐')
  const taxiId = catId('交通', '打车')
  const salaryId = catId('工资', '基本工资')

  const month = new Date().toISOString().slice(0, 7) // 当前月 YYYY-MM
  const today = new Date().toISOString().slice(0, 10)
  const insert = db.prepare(
    'INSERT INTO transactions (amount_cents, type, category_id, date, note) VALUES (?, ?, ?, ?, ?)'
  )
  insert.run(1000, 'expense', breakfastId, today, '验证')
  insert.run(2000, 'expense', taxiId, today, '验证')
  insert.run(10000, 'income', salaryId, today, '验证')

  // ---- 1. 月度总览 ----
  const sum = db
    .prepare('SELECT type, SUM(amount_cents) AS t FROM transactions WHERE substr(date,1,7) = ? GROUP BY type')
    .all(month)
  let income = 0
  let expense = 0
  for (const r of sum) (r.type === 'income' ? (income = r.t) : (expense = r.t))
  check('月度总览', { income, expense, balance: income - expense }, { income: 10000, expense: 3000, balance: 7000 })

  // ---- 2. 分类构成（一级汇总）----
  const breakdown = db
    .prepare(
      `SELECT COALESCE(p.name, c.name) AS n, SUM(t.amount_cents) AS t
       FROM transactions t JOIN categories c ON t.category_id = c.id
       LEFT JOIN categories p ON c.parent_id = p.id
       WHERE t.type = 'expense' AND substr(t.date,1,7) = ? GROUP BY n ORDER BY t DESC`
    )
    .all(month)
  check('分类构成', breakdown, [
    { n: '交通', t: 2000 },
    { n: '餐饮', t: 1000 }
  ])

  // ---- 3. 分类下钻（餐饮小类）----
  const drill = db
    .prepare(
      `SELECT c.name AS n, SUM(t.amount_cents) AS t
       FROM transactions t JOIN categories c ON t.category_id = c.id
       WHERE t.type = 'expense'
         AND c.parent_id = (SELECT id FROM categories WHERE name = '餐饮' AND parent_id IS NULL)
         AND substr(t.date,1,7) = ? GROUP BY c.id ORDER BY t DESC`
    )
    .all(month)
  check('分类下钻', drill, [{ n: '早餐', t: 1000 }])

  // ---- 4. 每日收支 ----
  const daily = db
    .prepare(
      `SELECT date, type, SUM(amount_cents) AS t
       FROM transactions WHERE substr(date,1,7) = ? GROUP BY date, type ORDER BY date`
    )
    .all(month)
  check('每日收支', daily, [
    { date: today, type: 'expense', t: 3000 },
    { date: today, type: 'income', t: 10000 }
  ])

  // ---- 5. 月度趋势 ----
  const trend = db
    .prepare(
      `SELECT substr(date,1,7) AS m, type, SUM(amount_cents) AS t
       FROM transactions WHERE substr(date,1,7) BETWEEN ? AND ? GROUP BY m, type ORDER BY m`
    )
    .all(month, month)
  check('月度趋势', trend, [
    { m: month, type: 'expense', t: 3000 },
    { m: month, type: 'income', t: 10000 }
  ])
}
