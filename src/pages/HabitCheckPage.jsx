import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useApp, showGlobalToast } from '../store/store'
import { getToday, isToday, getFriendlyDate, getMonthRange } from '../utils/date'
import { getAll } from '../store/db'
import CalendarModal from '../components/CalendarModal'
import ConfirmModal from '../components/ConfirmModal'
import HabitEdit from '../subpages/HabitEdit'

export default function HabitCheckPage({ openSubpage }) {
  const { loaded, habits, totalScore, viewDate, setViewDate, checkHabit, uncheckHabit, getHabitStatus } = useApp()
  const [showCalendar, setShowCalendar] = useState(false)
  const [habitStatuses, setHabitStatuses] = useState({})
  const [loadingStatuses, setLoadingStatuses] = useState(true)
  const [habitTab, setHabitTab] = useState('positive')
  const [confirmAction, setConfirmAction] = useState(null)
  const [statusVersion, setStatusVersion] = useState(0)
  const [editingHabit, setEditingHabit] = useState(null)
  const longPressTimer = useRef(null)
  const [restraintStats, setRestraintStats] = useState({ thisMonth: 0, lastMonth: 0 })
  const today = getToday()
  const isViewToday = viewDate === today
  const monthRange = getMonthRange(viewDate)

  useEffect(() => {
    if (!loaded) return
    const load = async () => {
      setLoadingStatuses(true); const ss = {}
      for (const h of habits) { ss[h.id] = await getHabitStatus(h.id, viewDate) }
      setHabitStatuses(ss); setLoadingStatuses(false)
    }
    load()
  }, [habits, viewDate, loaded, getHabitStatus, statusVersion])

  // 加载克制习惯月度统计
  useEffect(() => {
    if (!loaded) return
    const loadStats = async () => {
      try {
        const g = await getAll('global')
        const checkKeys = g.filter(x => x.key && x.key.startsWith('check_'))
        const restraintHabits = habits.filter(h => h.type === 'restraint')
        const m = monthRange.firstDay.slice(0, 7)
        const prevM = (parseInt(m.split('-')[1]) - 1 || 12).toString().padStart(2, '0')
        const prevY = prevM === '12' ? parseInt(m.split('-')[0]) - 1 : parseInt(m.split('-')[0])
        let thisC = 0, lastC = 0
        for (const rh of restraintHabits) {
          for (const ck of checkKeys) {
            const parts = ck.key.split('_')
            if (parts.length === 3 && parts[2] === rh.id) {
              const dateStr = parts[1]
              if (dateStr.startsWith(m)) thisC += ck.value
              else if (dateStr.startsWith(prevY + '-' + prevM)) lastC += ck.value
            }
          }
        }
        setRestraintStats({ thisMonth: thisC, lastMonth: lastC })
      } catch (e) { console.error(e) }
    }
    loadStats()
  }, [loaded, habits, monthRange, statusVersion])

  const filteredHabits = useMemo(() => {
    return habits.filter(h => {
      if (h.type !== habitTab) return false
      if (h.type === 'restraint') return true
      if (!h.frequency || h.frequency.type === 'daily') return true
      const d = new Date(viewDate + 'T00:00:00'); const dow = d.getDay()
      if (h.frequency.type === 'weekly') return h.frequency.days?.includes(dow)
      if (h.frequency.type === 'biweekly') { const ref = new Date(h.createTime); return Math.floor((d - ref) / (7 * 24 * 60 * 60 * 1000)) % (h.frequency.interval || 2) === 0 && h.frequency.days?.includes(dow) }
      if (h.frequency.type === 'monthly') return h.frequency.days?.includes(d.getDate())
      return true
    })
  }, [habits, viewDate, habitTab])

  const handleAction = useCallback(async (habit) => {
    const r = await checkHabit(habit.id, viewDate)
    if (!r) return
    if (habit.type === 'positive') { if (r.already) { showGlobalToast('今日已经打过卡啦'); return }; showGlobalToast('打卡成功！+' + r.delta + '分') }
    else { showGlobalToast('记录破戒，' + r.delta + '分') }
    setStatusVersion(v => v + 1)
  }, [checkHabit, viewDate])

  const handleLongPress = useCallback((habit) => {
    const s = habitStatuses[habit.id]
    if (!s) return
    if (habit.type === 'positive' && s.checked) { setConfirmAction({ message: '是否取消本次记录？积分将同步调整', onConfirm: async () => { await uncheckHabit(habit.id, viewDate); showGlobalToast('已取消打卡'); setStatusVersion(v => v + 1); setConfirmAction(null) }, onCancel: () => setConfirmAction(null) }) }
    else if (habit.type === 'restraint' && s.count > 0) { setConfirmAction({ message: '是否取消本次记录？积分将同步调整', onConfirm: async () => { await uncheckHabit(habit.id, viewDate); showGlobalToast('已取消记录'); setStatusVersion(v => v + 1); setConfirmAction(null) }, onCancel: () => setConfirmAction(null) }) }
  }, [habitStatuses, uncheckHabit, viewDate])

  if (!loaded) return <div className="loading">加载中...</div>

  return (
    <>
      <div className="page-content">
        <div className="top-bar">
          <div className="top-bar-left">
            <span className="date-display" onClick={() => setShowCalendar(true)}>
              {getFriendlyDate(viewDate)}
              {!isViewToday && <span className="back-today-btn" onClick={(e) => { e.stopPropagation(); setViewDate(today) }}>回到今天</span>}
            </span>
          </div>
          <div className="top-bar-right"><span className="score-display">{totalScore}</span></div>
        </div>
        <div className="tab-bar" style={{ marginBottom: 12 }}>
          <button className={'tab-bar-item' + (habitTab === 'positive' ? ' active' : '')} onClick={() => setHabitTab('positive')}>正向习惯</button>
          <button className={'tab-bar-item' + (habitTab === 'restraint' ? ' active' : '')} onClick={() => setHabitTab('restraint')}>克制习惯</button>
        </div>
        {habitTab === 'restraint' && (
          <div className="card" style={{ marginBottom: 12 }}>
            <div className="section-title" style={{ marginBottom: 8 }}>月度统计</div>
            <div className="restraint-stat">
              <div className="rs-item"><div className="rs-value">{restraintStats.thisMonth}</div><div className="rs-label">本月破戒</div></div>
              {restraintStats.lastMonth > 0 && (
                <div className="rs-item">
                  <div className={'rs-trend ' + (restraintStats.thisMonth <= restraintStats.lastMonth ? 'down' : 'up')}>
                    {restraintStats.thisMonth <= restraintStats.lastMonth ? '↓ 减少' : '↑ 增加'}
                  </div>
                  <div className="rs-label">较上月</div>
                </div>
              )}
            </div>
          </div>
        )}
        {loadingStatuses ? <div className="loading">加载中...</div> : filteredHabits.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">{habitTab === 'positive' ? '💪' : '🛡️'}</div>
            <div className="empty-text">{habitTab === 'positive' ? '今天没有需要打卡的习惯' : '还没有克制习惯'}</div>
          </div>
        ) : (
          filteredHabits.map(habit => {
            const status = habitStatuses[habit.id]; const isChecked = status?.checked; const rc = status?.count || 0
            let freqLabel = '每天'
            if (habit.frequency) { if (habit.frequency.type === 'weekly') freqLabel = '每周' + (habit.frequency.days?.length || 0) + '次'; else if (habit.frequency.type === 'biweekly') freqLabel = '每' + (habit.frequency.interval || 2) + '周' + (habit.frequency.days?.length || 1) + '次'; else if (habit.frequency.type === 'monthly') freqLabel = '每月打卡' }
            return (
              <div key={habit.id} className="list-item" style={{ opacity: isChecked ? 0.7 : 1, cursor: 'pointer' }}
                onClick={() => handleAction(habit)} onContextMenu={(e) => { e.preventDefault(); handleLongPress(habit) }} onTouchStart={() => { longPressTimer.current = setTimeout(() => handleLongPress(habit), 600) }} onTouchEnd={() => { clearTimeout(longPressTimer.current) }} onTouchMove={() => { clearTimeout(longPressTimer.current) }}>
                <div className="item-icon" style={{ background: (habit.color || '#F2B8C6') + '33' }}>{habit.emoji || (habit.type === 'positive' ? '💪' : '🛡️')}</div>
                <div className="item-content"><div className="item-title">{habit.name}</div>
                  <div className="item-sub">{habit.type === 'positive' ? '+' + (habit.score || 5) + '分 · ' + freqLabel : '-' + (habit.score || 3) + '分'}</div>
                </div>
                <div className="item-right" style={{ gap: 4, display: 'flex', alignItems: 'center' }}>
                  {habit.type === 'positive' ? <div className={'checkbox-round' + (isChecked ? ' checked' : '')} /> :
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: rc > 0 ? 'var(--danger)' : 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'white' }}>{rc > 0 ? '×' + rc : '🛡️'}</div>}
                  <button className="btn btn-sm btn-outline" style={{ padding: '2px 6px', fontSize: 11 }} onClick={(e) => { e.stopPropagation(); setEditingHabit(habit) }}>编辑</button>
                </div>
              </div>
            )
          })
        )}
        <div style={{ height: 80 }} />
      </div>
      <button className="fab" onClick={() => openSubpage(HabitEdit)}>+</button>
      {showCalendar && <CalendarModal currentDate={viewDate} onSelect={(d) => { setViewDate(d); setShowCalendar(false) }} onClose={() => setShowCalendar(false)} />}
      {confirmAction && <ConfirmModal message={confirmAction.message} onConfirm={confirmAction.onConfirm} onCancel={confirmAction.onCancel} />}
      {editingHabit && <HabitEdit habit={editingHabit} onClose={() => setEditingHabit(null)} />}
    </>
  )
}
