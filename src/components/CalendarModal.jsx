import React, { useState } from 'react'

export default function CalendarModal({ currentDate, onSelect, onClose }) {
  const [year, setYear] = useState(currentDate ? parseInt(currentDate.split('-')[0]) : new Date().getFullYear())
  const [month, setMonth] = useState(currentDate ? parseInt(currentDate.split('-')[1]) - 1 : new Date().getMonth())

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDayOfWeek = firstDay.getDay()
  const daysInMonth = lastDay.getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }

  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  const days = []

  // 上月补位
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i
    const m = month === 0 ? 11 : month - 1
    const y = month === 0 ? year - 1 : year
    days.push({ day, month: m, year: y, other: true })
  }

  // 本月
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ day: i, month, year, other: false })
  }

  // 下月补位
  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    const m = month === 11 ? 0 : month + 1
    const y = month === 11 ? year + 1 : year
    days.push({ day: i, month: m, year: y, other: true })
  }

  const handleSelect = (day) => {
    const dateStr = `${day.year}-${String(day.month + 1).padStart(2, '0')}-${String(day.day).padStart(2, '0')}`
    onSelect(dateStr)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content calendar-modal" onClick={e => e.stopPropagation()}>
        <div className="calendar-header">
          <button className="calendar-nav-btn" onClick={prevMonth}>‹</button>
          <span className="month-label">{year}年{month + 1}月</span>
          <button className="calendar-nav-btn" onClick={nextMonth}>›</button>
        </div>
        <div className="calendar-weekdays">
          {weekdays.map(w => <span key={w}>{w}</span>)}
        </div>
        <div className="calendar-days">
          {days.map((d, i) => {
            const dateStr = `${d.year}-${String(d.month + 1).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`
            const isToday = dateStr === todayStr
            const isSelected = dateStr === currentDate
            return (
              <button
                key={i}
                className={`calendar-day${d.other ? ' other-month' : ''}${isToday ? ' today' : ''}${isSelected ? ' selected' : ''}`}
                onClick={() => handleSelect(d)}
              >
                {d.day}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
