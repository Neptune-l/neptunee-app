import React, { useState, useMemo, useRef, useEffect } from 'react'
import { useApp } from '../store/store'
import { getToday, getRecentDates, getMonthRange, formatDate, parseCheckKey, CHECK_KEY_PREFIX } from '../utils/date'
import { buildScoreLedger, buildScoreTrend } from '../utils/score'
import { getAll, getGlobal } from '../store/db'
import { fmtMoney, fmtMoneyShort } from '../utils/money'
import { macaronByIndex, macaronKeyOf } from '../utils/palette'

/* ===== 工具 ===== */

function getMonthDatesFn(dateStr) {
  const r = getMonthRange(dateStr)
  const d = []
  const dt = new Date(r.firstDay + 'T00:00:00')
  const end = new Date(r.lastDay + 'T00:00:00')
  while (dt <= end) { d.push(formatDate(dt)); dt.setDate(dt.getDate() + 1) }
  return d
}

/**
 * 读取 CSS 变量真实值。
 * canvas 的 fillStyle / strokeStyle 不认识 'var(--x)'，
 * 直接赋值会被静默忽略，导致文字沿用上一次的颜色。
 */
function cssVar(el, name, fallback) {
  if (!el || typeof window === 'undefined') return fallback
  const v = getComputedStyle(el).getPropertyValue(name).trim()
  return v || fallback
}

/** 给颜色加透明度。CSS 变量取出来可能是 #RRGGBB 或 rgb()/rgba()，两种都要认 */
function alpha(color, a) {
  const s = String(color || '').trim()
  if (s.startsWith('#')) {
    let h = s.slice(1)
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
    if (h.length !== 6) return `rgba(14,124,140,${a})`
    const r = parseInt(h.slice(0, 2), 16)
    const g = parseInt(h.slice(2, 4), 16)
    const b = parseInt(h.slice(4, 6), 16)
    return `rgba(${r},${g},${b},${a})`
  }
  const m = s.match(/rgba?\(([^)]+)\)/)
  if (m) {
    const p = m[1].split(',').map(x => parseFloat(x))
    return `rgba(${p[0]},${p[1]},${p[2]},${a})`
  }
  return s
}

/** 把 canvas 按 DPR 初始化，返回 { ctx, w, h }；尺寸为 0 时返回 null */
function setupCanvas(c, cssW, cssH) {
  const dpr = window.devicePixelRatio || 1
  const w = cssW || c.clientWidth
  const h = cssH || c.clientHeight
  if (!w || !h) return null
  c.width = Math.round(w * dpr)
  c.height = Math.round(h * dpr)
  const ctx = c.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, w, h)
  return { ctx, w, h }
}

/** 稀疏地挑出要显示的 x 轴刻度 */
function pickTicks(len, max = 5) {
  if (len <= max) return new Set(Array.from({ length: len }, (_, i) => i))
  const step = Math.ceil(len / max)
  const s = new Set()
  for (let i = 0; i < len; i += step) s.add(i)
  s.add(len - 1)
  return s
}

/* ===== 折线图 ===== */
function LineChart({ data, themeKey }) {
  const ref = useRef(null)
  useEffect(() => {
    const c = ref.current
    if (!c || data.length < 2) return
    const box = setupCanvas(c, 0, 180)
    if (!box) return
    const { ctx, w, h } = box

    const muted = cssVar(c, '--text-secondary', '#5A7A83')
    const border = cssVar(c, '--border', '#DEEBEF')
    // 折线是「线」，必须用深同伴；面积仍用品牌亮青，深线 + 浅晕
    const line = cssVar(c, '--primary-ink', '#0E7C8C')
    const area = cssVar(c, '--primary', '#6AE6FA')
    const pad = { top: 16, bottom: 22, left: 36, right: 10 }
    const cw = w - pad.left - pad.right
    const ch = h - pad.top - pad.bottom

    const vals = data.map(d => d.value)
    const max = Math.max(...vals, 1)
    const min = Math.min(...vals, 0)
    const rng = max - min || 1
    const X = i => pad.left + (i / (data.length - 1)) * cw
    const Y = v => pad.top + ch - ((v - min) / rng) * ch

    // 横向网格 + y 轴刻度
    ctx.strokeStyle = border
    ctx.lineWidth = 1
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = muted
    for (let i = 0; i <= 2; i++) {
      const v = min + (rng * i) / 2
      const y = Y(v)
      ctx.beginPath()
      ctx.moveTo(pad.left, y)
      ctx.lineTo(pad.left + cw, y)
      ctx.stroke()
      ctx.fillText(v >= 1000 ? (v / 1000).toFixed(1) + 'k' : Math.round(v), pad.left - 6, y)
    }

    // 面积
    const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + ch)
    grad.addColorStop(0, alpha(area, 0.5))
    grad.addColorStop(1, alpha(area, 0.06))
    ctx.beginPath()
    ctx.moveTo(X(0), pad.top + ch)
    data.forEach((d, i) => ctx.lineTo(X(i), Y(d.value)))
    ctx.lineTo(X(data.length - 1), pad.top + ch)
    ctx.closePath()
    ctx.fillStyle = grad
    ctx.fill()

    // 折线
    ctx.beginPath()
    data.forEach((d, i) => (i === 0 ? ctx.moveTo(X(i), Y(d.value)) : ctx.lineTo(X(i), Y(d.value))))
    ctx.strokeStyle = line
    ctx.lineWidth = 2.5
    ctx.lineJoin = 'round'
    ctx.stroke()

    // 只在数据点较少时画圆点，避免糊成一片
    if (data.length <= 32) {
      ctx.fillStyle = line
      data.forEach((d, i) => {
        ctx.beginPath()
        ctx.arc(X(i), Y(d.value), 2.5, 0, Math.PI * 2)
        ctx.fill()
      })
    }

    // x 轴刻度
    const ticks = pickTicks(data.length)
    ctx.fillStyle = muted
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    data.forEach((d, i) => {
      if (!ticks.has(i)) return
      ctx.fillText((d.label || '').slice(5), X(i), pad.top + ch + 6)
    })
  }, [data, themeKey])
  return <canvas ref={ref} style={{ width: '100%', height: 180, display: 'block' }} />
}

/* ===== 环形图 ===== */
function Donut({ data, total, themeKey }) {
  const ref = useRef(null)
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const box = setupCanvas(c, 160, 160)
    if (!box) return
    const { ctx } = box
    const cx = 80, cy = 80, r = 60, ir = 40

    if (!total || data.length === 0) {
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.arc(cx, cy, ir, 0, Math.PI * 2, true)
      ctx.fillStyle = cssVar(c, '--sunk', '#E9F3F6')
      ctx.fill()
      return
    }

    // 扇区用马卡龙浅色填充（浅色只做填充），两种主题下都是中等明度、分得开
    let sa = -Math.PI / 2
    data.forEach((d, i) => {
      const a = (d.value / total) * Math.PI * 2
      ctx.beginPath()
      ctx.arc(cx, cy, r, sa, sa + a)
      ctx.arc(cx, cy, ir, sa + a, sa, true)
      ctx.closePath()
      ctx.fillStyle = macaronByIndex(i).fill
      ctx.fill()
      sa += a
    })
  }, [data, total, themeKey])
  return <canvas ref={ref} style={{ width: 160, height: 160, margin: '0 auto', display: 'block' }} />
}

/* ===== 周收支柱状图 ===== */
function WeekBar({ data, themeKey }) {
  const ref = useRef(null)
  useEffect(() => {
    const c = ref.current
    if (!c || data.length === 0) return
    const box = setupCanvas(c, 0, 160)
    if (!box) return
    const { ctx, w, h } = box
    const muted = cssVar(c, '--text-secondary', '#5A7A83')
    // 收支柱固定语义色（收=绿 / 支=红），两种主题各取一套
    const cExpense = cssVar(c, '--danger', '#A8324C')
    const cIncome = cssVar(c, '--success', '#0B6E5E')
    const pad = { top: 10, bottom: 24, left: 8, right: 8 }
    const cw = w - pad.left - pad.right
    const ch = h - pad.top - pad.bottom
    const max = Math.max(...data.map(d => Math.max(d.income || 0, d.expense || 0)), 1)
    const bw = Math.min((cw / data.length) * 0.7, 40)
    const gap = (cw - bw * data.length) / (data.length + 1)
    const half = Math.max(bw / 2 - 2, 2)

    data.forEach((d, i) => {
      const x = pad.left + gap + i * (bw + gap)
      if (d.expense > 0) {
        const bh = (d.expense / max) * ch
        ctx.fillStyle = cExpense
        ctx.fillRect(x, pad.top + ch - bh, half, bh)
      }
      if (d.income > 0) {
        const bh = (d.income / max) * ch
        ctx.fillStyle = cIncome
        ctx.fillRect(x + half + 4, pad.top + ch - bh, half, bh)
      }
      ctx.fillStyle = muted
      ctx.font = '10px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillText(d.label, x + bw / 2, pad.top + ch + 6)
    })
  }, [data, themeKey])
  return <canvas ref={ref} style={{ width: '100%', height: 160, display: 'block' }} />
}

/* ===== 月度打卡日历 ===== */
function HabitGrid({ checkData, monthDates, themeKey }) {
  const ref = useRef(null)
  useEffect(() => {
    const c = ref.current
    if (!c || monthDates.length === 0) return

    const cellSize = 18, gap = 3, cols = 7, rows = Math.ceil(monthDates.length / 7)
    const w = 30 + cols * (cellSize + gap)
    const h = 20 + rows * (cellSize + gap)
    const box = setupCanvas(c, w, h)
    if (!box) return
    const { ctx } = box

    const muted = cssVar(c, '--text-secondary', '#5A7A83')
    const strong = cssVar(c, '--text-primary', '#0F3038')
    const empty = cssVar(c, '--sunk', '#E9F3F6')
    // 已打卡格是「填充 + 白字」，必须用深同伴，否则浅青上的字看不见
    const filled = cssVar(c, '--primary-ink', '#0E7C8C')
    const onFilled = cssVar(c, '--card-bg', '#FFFFFF')

    const weekDays = ['日', '一', '二', '三', '四', '五', '六']
    ctx.fillStyle = muted
    ctx.font = '9px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    weekDays.forEach((d, i) => ctx.fillText(d, 30 + i * (cellSize + gap) + cellSize / 2, 10))

    const today = getToday()
    monthDates.forEach((dateStr, i) => {
      const row = Math.floor(i / 7), col = i % 7
      const x = 30 + col * (cellSize + gap)
      const y = 20 + row * (cellSize + gap)
      const checked = !!checkData[dateStr]

      ctx.fillStyle = checked ? filled : empty
      ctx.fillRect(x, y, cellSize, cellSize)

      if (dateStr === today) {
        ctx.strokeStyle = strong
        ctx.lineWidth = 1.5
        ctx.strokeRect(x + 0.5, y + 0.5, cellSize - 1, cellSize - 1)
      }

      ctx.fillStyle = checked ? onFilled : muted
      ctx.font = '9px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(parseInt(dateStr.slice(-2), 10), x + cellSize / 2, y + cellSize / 2 + 1)
    })
  }, [checkData, monthDates, themeKey])
  return <canvas ref={ref} style={{ width: '100%', maxWidth: 340, display: 'block' }} />
}

/* ===== 页面 ===== */
export default function Statistics() {
  const { loaded, bills, habits, exchangeRecords, viewDate, theme, savingsGoals, savingsByGoal, savingsNet, balance } = useApp()
  const [timeFilter, setTimeFilter] = useState('30d')
  const [globalRows, setGlobalRows] = useState([])
  const [statV, setStatV] = useState({ s: 0, cd: 0, me: 0, mb: 0, tf: 0 })

  const today = getToday()
  const monthRange = getMonthRange(viewDate)
  const monthDates = useMemo(() => getMonthDatesFn(viewDate), [viewDate])

  // 一次性把 global store 读进来，后面的统计全部在内存里算
  useEffect(() => {
    if (!loaded) return
    let alive = true
    const load = async () => {
      try {
        const [rows, score] = await Promise.all([getAll('global'), getGlobal('totalScore')])
        if (!alive) return
        setGlobalRows(rows || [])
        setStatV(prev => ({ ...prev, s: score || 0 }))
      } catch (e) { console.error('Stats load error:', e) }
    }
    load()
    return () => { alive = false }
  }, [loaded])

  // 打卡记录（键 -> 值）
  const checkRecords = useMemo(
    () => globalRows.filter(r => r && typeof r.key === 'string' && r.key.startsWith(CHECK_KEY_PREFIX)),
    [globalRows]
  )

  // 积分流水 / 趋势
  const ledger = useMemo(
    () => buildScoreLedger(checkRecords, habits, exchangeRecords),
    [checkRecords, habits, exchangeRecords]
  )

  const trendDates = useMemo(() => {
    if (timeFilter === '7d') return getRecentDates(today, 7)
    if (timeFilter === 'thisMonth') return monthDates
    if (timeFilter === 'all') {
      const all = [...ledger.keys()].sort()
      const start = all[0]
      if (!start) return getRecentDates(today, 30)
      // 上限 365 天，避免画布上挤成一片
      const days = Math.min(
        365,
        Math.floor((new Date(today + 'T00:00:00') - new Date(start + 'T00:00:00')) / 86400000) + 1
      )
      return getRecentDates(today, Math.max(days, 2))
    }
    return getRecentDates(today, 30)
  }, [timeFilter, today, monthDates, ledger])

  const scoreTrend = useMemo(() => buildScoreTrend(ledger, trendDates), [ledger, trendDates])

  // 月度汇总 + 打卡天数
  const monthStat = useMemo(() => {
    const mb = bills.filter(b => b.date >= monthRange.firstDay && b.date <= monthRange.lastDay)
    const me = mb.filter(b => b.type === 'expense').reduce((s, b) => s + b.amount, 0)
    const mi = mb.filter(b => b.type === 'income').reduce((s, b) => s + b.amount, 0)

    // 打卡天数：只统计"正向习惯"被打卡的日期
    const positiveIds = new Set(habits.filter(h => h.type === 'positive').map(h => h.id))
    const days = new Set()
    for (const rec of checkRecords) {
      const parsed = parseCheckKey(rec.key)
      if (parsed && positiveIds.has(parsed.habitId) && rec.value) days.add(parsed.dateStr)
    }

    return { me, mb: mi - me, cd: days.size, checkedDates: days }
  }, [bills, habits, checkRecords, monthRange])

  const checkData = useMemo(() => {
    const map = {}
    monthDates.forEach(d => { map[d] = monthStat.checkedDates.has(d) })
    return map
  }, [monthDates, monthStat])

  const ringData = useMemo(
    () => habits.filter(h => h.type === 'positive').map(h => ({ label: h.name, value: h.score || 5 })),
    [habits]
  )
  const ringTotal = useMemo(() => ringData.reduce((s, d) => s + d.value, 0), [ringData])

  // 近 6 个月收支（含当前月）
  const monthBars = useMemo(() => {
    const base = new Date(viewDate + 'T00:00:00')
    const out = []
    for (let i = 5; i >= 0; i--) {
      const dt = new Date(base.getFullYear(), base.getMonth() - i, 1)
      const { firstDay, lastDay } = getMonthRange(formatDate(dt))
      let income = 0, expense = 0
      for (const b of bills) {
        if (b.date < firstDay || b.date > lastDay) continue
        if (b.type === 'income') income += b.amount
        else expense += b.amount
      }
      out.push({ label: `${dt.getMonth() + 1}月`, income, expense })
    }
    return out
  }, [bills, viewDate])

  // 存钱罐总体进度：已存（= 存钱罐净额）对比目标合计
  const potStat = useMemo(() => {
    const target = savingsGoals.reduce((s, g) => s + (g.target || 0), 0)
    return { target, pct: target > 0 ? Math.min(1, savingsNet / target) : 0 }
  }, [savingsGoals, savingsNet])

  if (!loaded) return <div className="loading">加载中...</div>

  const hasTrend = scoreTrend.some(p => p.value > 0)

  return (
    <div className="page-content">
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {[{ k: '7d', l: '7天' }, { k: '30d', l: '30天' }, { k: 'thisMonth', l: '本月' }, { k: 'all', l: '全部' }].map(f => (
          <button key={f.k} className={'btn btn-sm ' + (timeFilter === f.k ? 'btn-primary' : 'btn-outline')} onClick={() => setTimeFilter(f.k)}>{f.l}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 12 }}>
        <div className="summary-card" style={{ minWidth: 0 }}><div className="summary-value">{statV.s}</div><div className="summary-label">当前积分</div></div>
        <div className="summary-card" style={{ minWidth: 0 }}><div className="summary-value">{monthStat.cd}</div><div className="summary-label">累计打卡天数</div></div>
        <div className="summary-card" style={{ minWidth: 0 }}><div className="summary-value">{fmtMoney(monthStat.me)}</div><div className="summary-label">本月支出</div></div>
        <div className="summary-card" style={{ minWidth: 0 }}><div className="summary-value">{fmtMoneyShort(balance)}</div><div className="summary-label">可用余额</div></div>
      </div>

      <div className="chart-card">
        <div className="chart-title">积分趋势</div>
        {!hasTrend ? (
          <div className="empty-state" style={{ padding: 16 }}><div className="empty-text">数据积累后显示</div></div>
        ) : (
          <>
            <LineChart data={scoreTrend} themeKey={theme} />
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6 }}>
              由打卡与兑换记录反推的累计净积分
            </div>
          </>
        )}
      </div>

      <div className="chart-card">
        <div className="chart-title">习惯分值分布</div>
        {ringTotal === 0 ? (
          <div className="empty-state" style={{ padding: 16 }}><div className="empty-text">还没有正向习惯</div></div>
        ) : (
          <>
            <Donut data={ringData} total={ringTotal} themeKey={theme} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', marginTop: 10, justifyContent: 'center' }}>
              {ringData.map((d, i) => (
                <span key={d.label} style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <i style={{
                    width: 8, height: 8, borderRadius: 2, display: 'inline-block',
                    background: macaronByIndex(i).fill,
                  }} />
                  {d.label}
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="chart-card">
        <div className="chart-title">近 6 个月收支</div>
        {monthBars.every(m => m.income === 0 && m.expense === 0) ? (
          <div className="empty-state" style={{ padding: 16 }}><div className="empty-text">还没有账单数据</div></div>
        ) : (
          <>
            <WeekBar data={monthBars} themeKey={theme} />
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 6, fontSize: 11, color: 'var(--text-secondary)' }}>
              <span><i style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--danger)', display: 'inline-block', marginRight: 4 }} />支出</span>
              <span><i style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--success)', display: 'inline-block', marginRight: 4 }} />收入</span>
            </div>
          </>
        )}
      </div>

      <div className="chart-card">
        <div className="chart-title">存钱罐</div>
        {savingsGoals.length === 0 ? (
          <div className="empty-state" style={{ padding: 16 }}><div className="empty-text">还没有存钱计划</div></div>
        ) : (
          <>
            <div className="pot-total">
              <span className="pot-total-value">{fmtMoney(savingsNet)}</span>
              <span className="pot-total-label">目标合计 {fmtMoney(potStat.target)}</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${potStat.pct * 100}%` }} />
            </div>
            <div className="pot-list">
              {savingsGoals.map((g, idx) => {
                const saved = savingsByGoal[g.id]?.saved || 0
                const pct = g.target > 0 ? Math.min(1, saved / g.target) : 0
                return (
                  <div key={g.id} className="pot-row" data-mc={macaronKeyOf(g.color, idx)}>
                    <div className="pot-row-emoji" data-mc={macaronKeyOf(g.color, idx)}>{g.emoji}</div>
                    <div className="pot-row-body">
                      <div className="pot-row-head">
                        <span className="pot-row-name">{g.name}</span>
                        <span className="pot-row-amount">{g.status === 'done' ? '已达成' : `${Math.round(pct * 100)}%`}</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${pct * 100}%` }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      <div className="chart-card">
        <div className="chart-title">本月打卡日历</div>
        <HabitGrid checkData={checkData} monthDates={monthDates} themeKey={theme} />
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6, textAlign: 'center' }}>
          深色格 = 当天至少完成一项正向习惯
        </div>
      </div>
    </div>
  )
}
