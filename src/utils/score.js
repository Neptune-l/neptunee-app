/**
 * 积分流水还原
 *
 * 应用本身只持久化「当前总积分」，没有逐日快照。这里改为从积分来源
 * 反推每天的增减额，再累加成趋势曲线：
 *   - 正向习惯打卡：+ habit.score
 *   - 克制习惯破戒：- habit.score × 当日次数
 *   - 愿望兑换：    - wish.cost
 *
 * 已知近似：习惯分值取的是「当前值」，若中途改过分值，历史曲线会有
 * 整体平移。对纯本地离线应用来说这是可接受的取舍。
 */

import { formatDate, parseCheckKey } from './date'

/**
 * 生成「日期 -> 当日积分增减」表
 * @param {Array<{key: string, value: any}>} checkRecords global store 里的打卡记录
 * @param {Array} habits 习惯列表
 * @param {Array} exchangeRecords 愿望兑换记录
 * @returns {Map<string, number>}
 */
export function buildScoreLedger(checkRecords = [], habits = [], exchangeRecords = []) {
  const delta = new Map()
  const bump = (date, v) => {
    if (!date || !v) return
    delta.set(date, (delta.get(date) || 0) + v)
  }

  const habitById = new Map(habits.map(h => [h.id, h]))

  for (const rec of checkRecords) {
    const parsed = parseCheckKey(rec?.key)
    if (!parsed) continue
    const habit = habitById.get(parsed.habitId)
    if (!habit) continue

    const score = habit.score || (habit.type === 'restraint' ? 3 : 5)
    if (habit.type === 'restraint') {
      bump(parsed.dateStr, -score * (Number(rec.value) || 0))
    } else if (rec.value) {
      bump(parsed.dateStr, score)
    }
  }

  for (const rec of exchangeRecords) {
    if (!rec?.time) continue
    bump(formatDate(new Date(rec.time)), -(rec.cost || 0))
  }

  return delta
}

/**
 * 把流水表转成给定日期区间的累加曲线
 * @param {Map<string, number>} ledger
 * @param {string[]} dates 升序的 YYYY-MM-DD 数组
 * @returns {Array<{label: string, value: number, date: string}>}
 */
export function buildScoreTrend(ledger, dates = []) {
  const entries = [...ledger.entries()].sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
  let idx = 0
  let running = 0

  return dates.map(date => {
    while (idx < entries.length && entries[idx][0] <= date) {
      running += entries[idx][1]
      idx++
    }
    return { label: date.slice(5), date, value: Math.max(0, running) }
  })
}
