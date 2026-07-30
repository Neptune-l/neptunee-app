import React, { useState, useMemo, useRef, useEffect } from 'react'
import { useApp } from '../store/store'
import { getToday, getRecentDates, getMonthRange, getMonthDates, formatDate } from '../utils/date'
import { getAll } from '../store/db'

function getMonthDatesFn(dateStr) {
  const r = getMonthRange(dateStr); const d = []; const dt = new Date(r.firstDay + 'T00:00:00')
  const end = new Date(r.lastDay + 'T00:00:00')
  while (dt <= end) { d.push(formatDate(dt)); dt.setDate(dt.getDate() + 1) }
  return d
}

function LineChart({ data, color }) {
  const ref = useRef(null)
  useEffect(() => {
    const c = ref.current; if (!c || data.length < 2) return
    const ctx = c.getContext('2d'), dpr = window.devicePixelRatio || 1
    c.width = c.clientWidth * dpr; c.height = c.clientHeight * dpr; ctx.scale(dpr, dpr)
    const pad = { top: 20, bottom: 20, left: 40, right: 10 }
    const cw = c.clientWidth - pad.left - pad.right, ch = c.clientHeight - pad.top - pad.bottom
    const vals = data.map(d => d.value), max = Math.max(...vals, 1), min = Math.min(...vals, 0), rng = max - min || 1
    const pts = data.map((d, i) => ({ x: pad.left + (i / (data.length - 1)) * cw, y: pad.top + ch - ((d.value - min) / rng) * ch }))
    const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + ch)
    grad.addColorStop(0, color + '80'); grad.addColorStop(1, color + '10')
    ctx.beginPath(); ctx.moveTo(pts[0].x, pad.top + ch); pts.forEach(p => ctx.lineTo(p.x, p.y))
    ctx.lineTo(pts[pts.length - 1].x, pad.top + ch); ctx.closePath(); ctx.fillStyle = grad; ctx.fill()
    ctx.beginPath(); pts.forEach((p, i) => { i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y) })
    ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.stroke()
    pts.forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill() })
  }, [data, color])
  return <canvas ref={ref} style={{ width: '100%', height: 180 }} />
}

function Donut({ data, total }) {
  const ref = useRef(null)
  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d'), dpr = window.devicePixelRatio || 1
    c.width = 160 * dpr; c.height = 160 * dpr; ctx.scale(dpr, dpr)
    const cx = 80, cy = 80, r = 60, ir = 40
    if (total === 0) { ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.arc(cx, cy, ir, 0, Math.PI * 2, true); ctx.fillStyle = '#F0E8EA'; ctx.fill(); return }
    let sa = -Math.PI / 2; const cs = ['#F2B8C6','#F8D2B8','#B8E2D0','#C4D7F0','#DCC2F0','#FCE4BA','#F4ACAC','#E8D0B8']
    data.forEach((d, i) => { const a = (d.value / total) * Math.PI * 2; ctx.beginPath(); ctx.arc(cx, cy, r, sa, sa + a); ctx.arc(cx, cy, ir, sa + a, sa, true); ctx.closePath(); ctx.fillStyle = cs[i % cs.length]; ctx.fill(); sa += a })
  })
  return <canvas ref={ref} style={{ width: 160, height: 160, margin: '0 auto', display: 'block' }} />
}

function WeekBar({ data }) {
  const ref = useRef(null)
  useEffect(() => {
    const c = ref.current; if (!c || data.length === 0) return
    const ctx = c.getContext('2d'), dpr = window.devicePixelRatio || 1
    c.width = c.clientWidth * dpr; c.height = c.clientHeight * dpr; ctx.scale(dpr, dpr)
    const pad = { top: 10, bottom: 24, left: 8, right: 8 }
    const cw = c.clientWidth - pad.left - pad.right, ch = c.clientHeight - pad.top - pad.bottom
    const max = Math.max(...data.map(d => Math.max(d.income || 0, d.expense || 0)), 1)
    const bw = Math.min((cw / data.length) * 0.7, 40), gap = (cw - bw * data.length) / (data.length + 1)
    data.forEach((d, i) => {
      const x = pad.left + gap + i * (bw + gap)
      if (d.expense > 0) { ctx.fillStyle = '#F4ACAC'; ctx.fillRect(x, pad.top + ch - (d.expense / max) * ch, bw / 2 - 2, (d.expense / max) * ch); ctx.roundRect && ctx.roundRect(x, pad.top + ch - (d.expense / max) * ch, bw / 2 - 2, (d.expense / max) * ch, 3) }
      if (d.income > 0) { ctx.fillStyle = '#B8E2D0'; ctx.fillRect(x + bw / 2 + 2, pad.top + ch - (d.income / max) * ch, bw / 2 - 2, (d.income / max) * ch) }
      ctx.fillStyle = 'var(--text-secondary)'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center'
      ctx.fillText(d.label, x + bw / 2, pad.top + ch + 16)
    })
  }, [data])
  return <canvas ref={ref} style={{ width: '100%', height: 160 }} />
}

function HabitGrid({ checkData, monthDates, viewDate }) {
  const ref = useRef(null)
  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d'), dpr = window.devicePixelRatio || 1
    const cellSize = 18, gap = 3, cols = 7, rows = Math.ceil(monthDates.length / 7)
    const w = 30 + cols * (cellSize + gap), h = 20 + rows * (cellSize + gap)
    c.width = w * dpr; c.height = h * dpr; ctx.scale(dpr, dpr)
    ctx.fillStyle = 'var(--card-bg)'; ctx.fillRect(0, 0, w, h)
    const weekDays = ['日','一','二','三','四','五','六']
    ctx.fillStyle = 'var(--text-secondary)'; ctx.font = '9px sans-serif'; ctx.textAlign = 'center'
    weekDays.forEach((d, i) => { ctx.fillText(d, 30 + i * (cellSize + gap) + cellSize / 2, 12) })
    const today = getToday()
    monthDates.forEach((dateStr, i) => {
      const row = Math.floor(i / 7), col = i % 7
      const x = 30 + col * (cellSize + gap), y = 20 + row * (cellSize + gap)
      const checked = checkData[dateStr]
      if (checked) { ctx.fillStyle = '#F2B8C6'; ctx.fillRect(x, y, cellSize, cellSize) }
      else { ctx.fillStyle = '#F0E8EA'; ctx.fillRect(x, y, cellSize, cellSize) }
      if (dateStr === today) { ctx.strokeStyle = 'var(--text-primary)'; ctx.lineWidth = 1.5; ctx.strokeRect(x, y, cellSize, cellSize) }
      ctx.fillStyle = checked ? '#fff' : 'var(--text-secondary)'
      ctx.font = '9px sans-serif'; ctx.textAlign = 'center'
      ctx.fillText(parseInt(dateStr.slice(-2)), x + cellSize / 2, y + cellSize / 2 + 3)
    })
  })
  return <canvas ref={ref} style={{ width: '100%', maxWidth: 340 }} />
}

export default function Statistics() {
  const { loaded, bills, habits, focusDiary, viewDate } = useApp()
  const [timeFilter, setTimeFilter] = useState('30d')
  const [scoreTrend, setScoreTrend] = useState([])
  const [statV, setStatV] = useState({ s: 0, cd: 0, me: 0, mb: 0, tf: 0 })
  const [checkData, setCheckData] = useState({})
  const today = getToday()
  const monthRange = getMonthRange(viewDate)

  useEffect(() => {
    if (!loaded) return
    const load = async () => {
      try {
        const s = await (await import('../store/db')).getGlobal('totalScore') || 0
        const g = await getAll('global')
        const ck = g.filter(x => x.key && x.key.startsWith('check_') && x.value === true)
        const ud = new Set(ck.map(x => x.key.split('_')[1]))
        const mb = bills.filter(b => b.date >= monthRange.firstDay && b.date <= monthRange.lastDay)
        const me = mb.filter(b => b.type === 'expense').reduce((s, b) => s + b.amount, 0)
        const mi = mb.filter(b => b.type === 'income').reduce((s, b) => s + b.amount, 0)
        setStatV({ s, cd: ud.size, me, mb: mi - me, tf: focusDiary.reduce((s, d) => s + d.duration, 0) })
        const dates = timeFilter === '7d' ? getRecentDates(today, 7) : timeFilter === '30d' ? getRecentDates(today, 30) : timeFilter === 'thisMonth' ? getMonthDatesFn(viewDate) : getRecentDates(today, 90)
        setScoreTrend(dates.map(d => ({ label: d, value: 0 })))
        // 加载打卡日历数据
        const md = getMonthDatesFn(viewDate)
        const chk = {}
        for (const dateStr of md) {
          let dayChecked = false
          for (const h of habits) {
            const k = `check_${dateStr}_${h.id}`
            if (ck.some(x => x.key === k)) { dayChecked = true; break }
          }
          chk[dateStr] = dayChecked
        }
        setCheckData(chk)
      } catch(e) { console.error('Stats error:', e) }
    }
    load()
  }, [loaded, timeFilter, viewDate, bills, focusDiary, habits])

  const ringData = useMemo(() => habits.filter(h => h.type === 'positive').map(h => ({ label: h.name, value: h.score || 5 })), [habits])
  const ringTotal = useMemo(() => ringData.reduce((s, d) => s + d.value, 0), [ringData])
  const monthDates = useMemo(() => getMonthDatesFn(viewDate), [viewDate])

  const weekBars = useMemo(() => {
    const groups = []; let cur = { label: 'W1', income: 0, expense: 0 }; let wk = 1; let cnt = 0
    const db = bills.filter(b => b.date >= monthRange.firstDay && b.date <= monthRange.lastDay)
    monthDates.forEach(d => {
      const dayB = db.filter(b => b.date === d)
      cur.income += dayB.filter(b => b.type === 'income').reduce((s, b) => s + b.amount, 0)
      cur.expense += dayB.filter(b => b.type === 'expense').reduce((s, b) => s + b.amount, 0)
      cnt++
      if (cnt === 7 || d === monthDates[monthDates.length - 1]) { groups.push({ ...cur }); wk++; cur = { label: 'W' + wk, income: 0, expense: 0 }; cnt = 0 }
    })
    return groups
  }, [bills, monthDates])

  const focusLine = useMemo(() => {
    return monthDates.map(d => ({ label: d.slice(5), value: focusDiary.filter(f => f.date === d).reduce((s, f) => s + f.duration, 0) / 3600 }))
  }, [focusDiary, monthDates])

  const fmt = (n) => '¥' + n.toFixed(2)
  const fmtD = (s) => s >= 3600 ? (s / 3600).toFixed(1) + 'h' : Math.round(s / 60) + 'm'

  if (!loaded) return <div className="loading">加载中...</div>

  return (
    <div className="page-content" key={viewDate}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {[{ k: '7d', l: '7天' }, { k: '30d', l: '30天' }, { k: 'thisMonth', l: '本月' }, { k: 'all', l: '全部' }].map(f => (
          <button key={f.k} className={'btn btn-sm ' + (timeFilter === f.k ? 'btn-primary' : 'btn-outline')} onClick={() => setTimeFilter(f.k)}>{f.l}</button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 12 }}>
        <div className="summary-card" style={{ minWidth: 0 }}><div className="summary-value">{statV.s}</div><div className="summary-label">积分</div></div>
        <div className="summary-card" style={{ minWidth: 0 }}><div className="summary-value">{statV.cd}</div><div className="summary-label">打卡天数</div></div>
        <div className="summary-card" style={{ minWidth: 0 }}><div className="summary-value">{fmt(statV.me)}</div><div className="summary-label">月支出</div></div>
        <div className="summary-card" style={{ minWidth: 0 }}><div className="summary-value">{fmtD(statV.tf)}</div><div className="summary-label">专注</div></div>
      </div>
      <div className="chart-card"><div className="chart-title">积分趋势</div>
        {scoreTrend.length < 2 ? <div className="empty-state" style={{ padding: 16 }}><div className="empty-text">数据积累后显示</div></div> : <LineChart data={scoreTrend} color="#F2B8C6" />}
      </div>
      <div className="chart-card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ flex: 1 }}><div className="chart-title">习惯分布</div></div>
        <Donut data={ringData} total={ringTotal} />
      </div>
      <div className="chart-card">
        <div className="chart-title">周收支对比</div>
        <WeekBar data={weekBars} />
      </div>
      <div className="chart-card">
        <div className="chart-title">本月专注趋势</div>
        {focusLine.every(f => f.value === 0) ? <div className="empty-state" style={{ padding: 16 }}><div className="empty-text">暂无专注数据</div></div> : <LineChart data={focusLine} color="#F8D2B8" />}
      </div>
      <div className="chart-card">
        <div className="chart-title">本月打卡日历</div>
        <HabitGrid checkData={checkData} monthDates={monthDates} viewDate={viewDate} />
      </div>
    </div>
  )
}
