import dayjs from 'dayjs'

const WEEK = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

// 账单分组标题：今天 / 昨天 / 2026年09月01日 星期三
export function dateGroupLabel(dateStr: string): string {
  const d = dayjs(dateStr)
  if (d.isSame(dayjs(), 'day')) return '今天'
  if (d.isSame(dayjs().subtract(1, 'day'), 'day')) return '昨天'
  return `${d.format('YYYY年MM月DD日')} ${WEEK[d.day()]}`
}
