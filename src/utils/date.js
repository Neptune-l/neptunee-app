/**
 * 日期工具函数
 */

/**
 * 格式化日期为 YYYY-MM-DD
 */
export function formatDate(date) {
  const d = date instanceof Date ? date : new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 获取今日日期字符串 YYYY-MM-DD
 */
export function getToday() {
  return formatDate(new Date())
}

/**
 * 检查是否是今天
 */
export function isToday(dateStr) {
  return dateStr === getToday()
}

/**
 * 获取当前日期的友好显示
 * 例：7月28日 星期二
 */
export function getFriendlyDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const month = d.getMonth() + 1
  const day = d.getDate()
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  const weekday = weekdays[d.getDay()]
  return `${month}月${day}日 ${weekday}`
}

/**
 * 获取周标识 YYYY-WW
 */
export function getWeekKey(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  // 获取当前周四是哪一天（ISO周规则）
  const dayOfWeek = d.getDay()
  const diff = (dayOfWeek === 0 ? 6 : dayOfWeek - 1) // 周一 = 0
  
  // 获取本周四（ISO周规则中，周四所在的周就是当前周）
  const thursday = new Date(d)
  thursday.setDate(d.getDate() - diff + 3)
  
  const year = thursday.getFullYear()
  // 计算当前是一年中的第几周
  const firstJan = new Date(year, 0, 1)
  const days = Math.floor((thursday - firstJan) / (24 * 60 * 60 * 1000))
  const weekNum = Math.ceil((days + firstJan.getDay() + 1) / 7)
  
  return `${year}-${String(weekNum).padStart(2, '0')}`
}

/**
 * 获取当前日期所在月份的第一天和最后一天
 */
export function getMonthRange(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const year = d.getFullYear()
  const month = d.getMonth()
  const firstDay = formatDate(new Date(year, month, 1))
  const lastDay = formatDate(new Date(year, month + 1, 0))
  return { firstDay, lastDay }
}

/**
 * 获取日期范围（YYYY-MM-DD 数组）
 */
export function getDateRange(startDateStr, endDateStr) {
  const dates = []
  const start = new Date(startDateStr + 'T00:00:00')
  const end = new Date(endDateStr + 'T00:00:00')
  const current = new Date(start)
  while (current <= end) {
    dates.push(formatDate(current))
    current.setDate(current.getDate() + 1)
  }
  return dates
}

/**
 * 获取当月所有日期
 */
export function getMonthDates(dateStr) {
  const { firstDay, lastDay } = getMonthRange(dateStr)
  return getDateRange(firstDay, lastDay)
}

/**
 * 获取最近N天的日期数组
 */
export function getRecentDates(dateStr, days) {
  const end = new Date(dateStr + 'T00:00:00')
  const start = new Date(end)
  start.setDate(start.getDate() - days + 1)
  return getDateRange(formatDate(start), dateStr)
}

/**
 * 生成唯一ID
 * 注意：生成的 ID 自身包含下划线，任何地方都不要用 split('_') 去反解打卡键。
 */
let _idCounter = 0
export function generateId() {
  _idCounter++
  return `${Date.now()}_${_idCounter}_${Math.random().toString(36).slice(2, 8)}`
}

/* ===== 打卡记录键 check_<YYYY-MM-DD>_<habitId> ===== */

export const CHECK_KEY_PREFIX = 'check_'
const CHECK_DATE_LEN = 10 // 'YYYY-MM-DD'

/** 由日期 + 习惯 ID 生成打卡记录键 */
export function makeCheckKey(dateStr, habitId) {
  return `${CHECK_KEY_PREFIX}${dateStr}_${habitId}`
}

/**
 * 反解打卡记录键。
 * habitId 本身可能含有下划线，因此这里按固定长度切片而不是 split。
 * @returns {{dateStr: string, habitId: string} | null}
 */
export function parseCheckKey(key) {
  if (typeof key !== 'string' || !key.startsWith(CHECK_KEY_PREFIX)) return null
  const rest = key.slice(CHECK_KEY_PREFIX.length)
  if (rest.length < CHECK_DATE_LEN + 2) return null
  if (rest[CHECK_DATE_LEN] !== '_') return null
  const dateStr = rest.slice(0, CHECK_DATE_LEN)
  const habitId = rest.slice(CHECK_DATE_LEN + 1)
  if (!habitId) return null
  return { dateStr, habitId }
}

/**
 * 从一组打卡日期里数出连续天数。
 *
 * @param {Set<string>|string[]} dates 已打卡日期（YYYY-MM-DD）
 * @param {string} endDate 统计截止日（通常是今天，或正在查看的那天）
 * @returns {number}
 *
 * 截止日本身没打卡时，允许从它的前一天开始数 ——
 * 「今天还没到打卡的时候」不应该算作连续记录已断。
 */
export function countStreak(dates, endDate) {
  if (!dates) return 0
  const isSet = dates instanceof Set
  const empty = isSet ? dates.size === 0 : dates.length === 0
  if (empty) return 0

  const has = (d) => (isSet ? dates.has(d) : dates.includes(d))
  const shift = (dateStr, delta) => {
    const d = new Date(dateStr + 'T00:00:00')
    d.setDate(d.getDate() + delta)
    return formatDate(d)
  }

  let cursor = endDate
  if (!has(cursor)) {
    cursor = shift(cursor, -1)
    if (!has(cursor)) return 0
  }

  let n = 0
  // 上限保护：脏数据不至于让循环跑飞
  while (has(cursor) && n < 3660) {
    n++
    cursor = shift(cursor, -1)
  }
  return n
}

/**
 * 分钟数转友好显示
 */
export function formatMinutes(mins) {
  if (mins >= 60) {
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return m > 0 ? `${h}小时${m}分钟` : `${h}小时`
  }
  return `${mins}分钟`
}

/**
 * 秒数转友好显示
 */
export function formatSeconds(secs) {
  if (secs >= 3600) {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    return m > 0 ? `${h}小时${m}分钟` : `${h}小时`
  }
  if (secs >= 60) {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return s > 0 ? `${m}分钟${s}秒` : `${m}分钟`
  }
  return `${secs}秒`
}

/**
 * 获取当天起始时间戳
 */
export function getDayStart(dateStr) {
  return new Date(dateStr + 'T00:00:00').getTime()
}

/**
 * 获取当天结束时间戳
 */
export function getDayEnd(dateStr) {
  return new Date(dateStr + 'T23:59:59.999').getTime()
}

/**
 * 获取当前日期所在月份的名称
 */
export function getMonthName(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getFullYear()}年${d.getMonth() + 1}月`
}
