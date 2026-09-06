import type Database from 'better-sqlite3'
import type { TxType } from '../../shared/types'

// 内置分类（与 claude.md 产品文档一致）：一级大类 + 二级小类
const BUILTIN: { type: TxType; name: string; emoji: string; children: string[] }[] = [
  { type: 'expense', name: '餐饮', emoji: '🍜', children: ['早餐', '午餐', '晚餐', '零食饮料', '外卖', '聚餐'] },
  { type: 'expense', name: '交通', emoji: '🚌', children: ['公交地铁', '打车', '火车飞机', '加油停车', '共享单车'] },
  { type: 'expense', name: '购物', emoji: '🛍️', children: ['日用品', '服饰鞋包', '数码电器', '美妆个护', '家居百货'] },
  { type: 'expense', name: '居住', emoji: '🏠', children: ['房租房贷', '水电燃气', '物业费', '家居维修', '宽带话费'] },
  { type: 'expense', name: '娱乐', emoji: '🎮', children: ['电影演出', '游戏充值', '运动健身', '旅游度假', '会员订阅'] },
  { type: 'expense', name: '医疗', emoji: '💊', children: ['门诊买药', '体检保健', '住院治疗'] },
  { type: 'expense', name: '学习', emoji: '📚', children: ['书籍资料', '课程培训', '文具用品'] },
  { type: 'expense', name: '人情', emoji: '🧧', children: ['红包礼金', '请客送礼', '孝敬长辈'] },
  { type: 'expense', name: '宠物', emoji: '🐕', children: ['狗粮零食', '宠物医疗', '宠物用品', '美容洗澡'] },
  { type: 'expense', name: '其他', emoji: '📦', children: ['其他支出'] },
  { type: 'income', name: '工资', emoji: '💰', children: ['基本工资', '奖金绩效', '加班补贴'] },
  { type: 'income', name: '兼职', emoji: '💼', children: ['副业收入', '临时收入'] },
  { type: 'income', name: '理财', emoji: '📈', children: ['利息收益', '基金股票', '房租收入'] },
  { type: 'income', name: '红包', emoji: '🧧', children: ['收红包', '礼金'] },
  { type: 'income', name: '退款', emoji: '🧾', children: ['购物退款', '报销'] },
  { type: 'income', name: '其他', emoji: '🎁', children: ['其他收入'] }
]

// 首次启动写入内置分类；已写入过则跳过（重复启动不会产生重复数据）
export function seedBuiltinCategories(db: Database.Database): void {
  const count = db
    .prepare('SELECT COUNT(*) AS n FROM categories WHERE is_builtin = 1')
    .get() as { n: number }
  if (count.n > 0) return

  const insert = db.prepare(
    'INSERT INTO categories (name, type, parent_id, sort_order, is_builtin, emoji) VALUES (?, ?, ?, ?, 1, ?)'
  )
  db.transaction(() => {
    BUILTIN.forEach((group, gi) => {
      const parentId = insert.run(group.name, group.type, null, gi + 1, group.emoji).lastInsertRowid
      group.children.forEach((name, ci) => {
        insert.run(name, group.type, parentId, ci + 1, '')
      })
    })
  })()
}
