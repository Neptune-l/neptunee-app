import React, { useState } from 'react'
import { useApp } from '../store/store'
import { getToday } from '../utils/date'
import { MEAL_SLOTS } from '../utils/constants'
import CalendarModal from '../components/CalendarModal'
import DietEdit from './DietEdit'

export default function DietRecordList({ onClose }) {
  const { dietRecords } = useApp()
  const [viewDate, setViewDate] = useState(getToday())
  const [showCalendar, setShowCalendar] = useState(false)
  const [editing, setEditing] = useState(null)

  const dayRecords = dietRecords.filter(r => r.date === viewDate)
  const totalCal = dayRecords.reduce((s, r) => s + (r.calories || 0), 0)

  const grouped = {}
  MEAL_SLOTS.forEach(slot => { grouped[slot] = [] })
  dayRecords.forEach(r => {
    if (grouped[r.mealSlot]) grouped[r.mealSlot].push(r)
    else grouped[r.mealSlot] = [r]
  })

  return (
    <div className="subpage">
      <div className="subpage-header">
        <button className="back-btn" onClick={onClose}>‹</button>
        <span className="subpage-title">🍽️ 饮食记录</span>
        <button className="btn btn-primary btn-sm" onClick={() => setEditing({ date: viewDate })}>新增</button>
      </div>
      <div className="subpage-body">
        {/* 日期选择 */}
        <div className="date-display" style={{ marginBottom: 12 }} onClick={() => setShowCalendar(true)}>
          {new Date(viewDate + 'T00:00:00').toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' })}
        </div>

        {viewDate === getToday() && (
          <div className="card" style={{ marginBottom: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>今日总热量</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--primary)' }}>{totalCal} kcal</div>
          </div>
        )}

        {MEAL_SLOTS.map(slot => {
          const items = grouped[slot] || []
          if (items.length === 0) return null
          return (
            <div key={slot} className="meal-group">
              <div className="meal-header">
                <span className="meal-label">{slot}餐</span>
                <span className="meal-cal">{items.reduce((s, r) => s + (r.calories || 0), 0)} kcal</span>
              </div>
              {items.map(record => (
                <div key={record.id} className="food-item" onClick={() => setEditing(record)} style={{ cursor: 'pointer' }}>
                  <span className="food-name">{record.foodName}</span>
                  <span className="food-cal">{record.calories || 0} kcal</span>
                </div>
              ))}
            </div>
          )
        })}

        {dayRecords.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🍽️</div>
            <div className="empty-text">还没有饮食记录，点击右上角新增吧</div>
          </div>
        )}
      </div>

      {showCalendar && (
        <CalendarModal currentDate={viewDate} onSelect={(d) => { setViewDate(d); setShowCalendar(false) }} onClose={() => setShowCalendar(false)} />
      )}

      {editing && (
        <DietEdit record={editing.id ? editing : null} defaultDate={viewDate} onClose={() => setEditing(null)} />
      )}
    </div>
  )
}
