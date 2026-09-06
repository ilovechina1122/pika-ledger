// 金额格式化：分 -> "1,234.56"
export function formatYuan(cents: number): string {
  return (cents / 100).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

// 带符号金额：负值显示 -¥1,234.56
export function formatSignedYuan(cents: number): string {
  const v = formatYuan(Math.abs(cents))
  return cents < 0 ? `-¥${v}` : `¥${v}`
}
