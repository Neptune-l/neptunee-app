/**
 * 金额工具
 * 所有金额一律以「分」为单位四舍五入后再参与展示，避免浮点误差累积
 * （0.1 + 0.2 = 0.30000000000000004 这类问题在账单累加里很常见）
 */

/** 四舍五入到 2 位小数（返回 number） */
export function round2(n) {
  const v = Number(n)
  if (!Number.isFinite(v)) return 0
  return Math.round((v + Number.EPSILON) * 100) / 100
}

/** 把一串金额求和并规整到 2 位小数 */
export function sumMoney(list, pick) {
  return round2(list.reduce((s, item) => s + (Number(pick ? pick(item) : item) || 0), 0))
}

/** 标准金额显示：¥1,234.50 */
export function fmtMoney(n) {
  const v = round2(n)
  const sign = v < 0 ? '-' : ''
  const abs = Math.abs(v)
  const [int, dec] = abs.toFixed(2).split('.')
  const withComma = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `${sign}¥${withComma}.${dec}`
}

/** 紧凑金额显示：¥1.23万 / ¥0.8万，用于空间紧张的地方 */
export function fmtMoneyShort(n) {
  const v = round2(n)
  const abs = Math.abs(v)
  if (abs >= 100000000) return `¥${(v / 100000000).toFixed(2)}亿`
  if (abs >= 10000) return `¥${(v / 10000).toFixed(2)}万`
  return fmtMoney(v)
}

/** 带正负号的金额：+¥12.00 / -¥12.00 */
export function fmtMoneySigned(n) {
  const v = round2(n)
  if (v > 0) return `+${fmtMoney(v)}`
  return fmtMoney(v)
}

/** 解析用户输入的金额；非法或非正数返回 0 */
export function parseAmount(text) {
  if (typeof text === 'number') return Number.isFinite(text) ? round2(text) : 0
  const cleaned = String(text ?? '').replace(/[^\d.-]/g, '')
  const v = round2(cleaned)
  return v > 0 ? v : 0
}

/**
 * 两个日期字符串（YYYY-MM-DD）之间的天数差：to - from
 */
export function diffDays(from, to) {
  const a = new Date(`${from}T00:00:00`)
  const b = new Date(`${to}T00:00:00`)
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0
  return Math.round((b - a) / 86400000)
}
