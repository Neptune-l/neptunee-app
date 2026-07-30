import React, { useState, useEffect, useMemo } from 'react'
import { useApp, showGlobalToast } from '../store/store'
import { getToday, isToday, getFriendlyDate } from '../utils/date'
import CalendarModal from '../components/CalendarModal'
import ConfirmModal from '../components/ConfirmModal'
import TaskEdit from '../subpages/TaskEdit'

export default function HomePage({ openSubpage }) {
  const { loaded, habits, tasks, bills, focusDiary, totalScore, viewDate, setViewDate, updateTask, checkHabit, getHabitStatus } = useApp()
  const [showCalendar, setShowCalendar] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)
  const [editingTask, setEditingTask] = useState(null)
  const [habitStatuses, setHabitStatuses] = useState({})
  const [statusVersion, setStatusVersion] = useState(0)
  const [celebration, setCelebration] = useState(null)

  const today = getToday()
  const isViewToday = viewDate === today

  useEffect(() => {
    if (!loaded) return
    const load = async () => {
      const ss = {}
      for (const h of habits) { if (h.type === 'positive') { const s = await getHabitStatus(h.id, viewDate); if (s) ss[h.id] = s } }
      setHabitStatuses(ss)
    }
    load()
  }, [loaded, habits, viewDate, getHabitStatus, statusVersion])

  const todayBills = useMemo(() => bills.filter(b => b.date === viewDate), [bills, viewDate])
  const todayExpense = useMemo(() => todayBills.filter(b => b.type === 'expense').reduce((s, b) => s + b.amount, 0), [todayBills])
  const todayFocus = useMemo(() => focusDiary.filter(f => f.date === viewDate).reduce((s, f) => s + f.duration, 0), [focusDiary, viewDate])
  const dayTasks = useMemo(() => tasks.filter(t => t.date === viewDate), [tasks, viewDate])
  const pendingTasks = useMemo(() => dayTasks.filter(t => !t.completed), [dayTasks])
  const completedTasks = useMemo(() => dayTasks.filter(t => t.completed), [dayTasks])

  const todayHabits = useMemo(() => {
    return habits.filter(h => {
      if (h.type !== 'positive') return false
      if (!h.frequency || h.frequency.type === 'daily') return true
      const d = new Date(viewDate + 'T00:00:00'); const dow = d.getDay()
      if (h.frequency.type === 'weekly') return h.frequency.days?.includes(dow)
      if (h.frequency.type === 'biweekly') { const ref = new Date(h.createTime); return Math.floor((d - ref) / (7 * 24 * 60 * 60 * 1000)) % (h.frequency.interval || 2) === 0 && h.frequency.days?.includes(dow) }
      if (h.frequency.type === 'monthly') return h.frequency.days?.includes(d.getDate())
      return true
    })
  }, [habits, viewDate])

  const allDone = todayHabits.length > 0 && todayHabits.every(h => habitStatuses[h.id]?.checked)
  const fmtFocus = (secs) => secs >= 3600 ? (secs / 3600).toFixed(1) + 'h' : Math.round(secs / 60) + 'm'

  const handleTaskToggle = async (task) => {
    if (!task.completed) {
      task.completed = true; task.completeTime = Date.now(); await updateTask(task); showGlobalToast('任务完成！')
      if (task.linkedHabitId) { try { const r = await checkHabit(task.linkedHabitId, viewDate); if (r && !r.already) showGlobalToast('任务完成，习惯自动打卡 +' + r.delta + '分') } catch (e) { showGlobalToast('打卡出错: ' + e.message) } }
    } else { setConfirmAction({ message: '取消完成将同步取消对应习惯打卡，是否继续？', onConfirm: async () => { task.completed = false; task.completeTime = null; await updateTask(task); showGlobalToast('已取消完成'); setConfirmAction(null) }, onCancel: () => setConfirmAction(null) }) }
  }

  const handleHabitCheck = async (habit) => {
    try {
      const r = await checkHabit(habit.id, viewDate)
      if (!r) { showGlobalToast('未找到该习惯'); return }
      if (r.already) { showGlobalToast('今日已经打过卡啦'); return }
      setStatusVersion(v => v + 1)
      setCelebration({ icon: '🎉', text: '打卡成功！+' + r.delta + '分' })
      setTimeout(() => setCelebration(null), 1500)
    } catch (e) { console.error('Check failed:', e); showGlobalToast('出错: ' + e.message) }
  }

  if (!loaded) return <div className="loading">加载中...</div>

  return (
    <>
      {celebration && <div className="celebration"><span className="celeb-icon">{celebration.icon}</span><span className="celeb-txt">{celebration.text}</span></div>}
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
        <div className="card-section"><p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>今天也要好好加油呀</p></div>
        {allDone && <div className="card" style={{ marginBottom: 12, textAlign: 'center', background: 'var(--success)', color: '#fff' }}>🎉 今天的打卡全部完成！太棒了！</div>}
        <div className="summary-cards">
          <div className="summary-card"><div className="summary-value">{totalScore}</div><div className="summary-label">净积分</div></div>
          <div className="summary-card"><div className="summary-value">{'¥' + todayExpense.toFixed(2)}</div><div className="summary-label">支出</div></div>
          <div className="summary-card"><div className="summary-value">{fmtFocus(todayFocus)}</div><div className="summary-label">专注</div></div>
        </div>
        <div className="card-section">
          <div className="section-header"><span className="section-title">今日待办</span></div>
          {pendingTasks.length === 0 && completedTasks.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">✨</div><div className="empty-text">今日没有待办任务，好好休息吧</div></div>
          ) : (
            <>{pendingTasks.map(task => (
              <div key={task.id} className="list-item" onClick={() => setEditingTask(task)}>
                <div className="checkbox-round" onClick={(e) => { e.stopPropagation(); handleTaskToggle(task) }} />
                <div className="item-content"><div className="item-title">{task.name}</div></div>
              </div>
            ))}{completedTasks.map(task => (
              <div key={task.id} className="list-item completed" onClick={() => setEditingTask(task)}>
                <div className="checkbox-round checked" onClick={(e) => { e.stopPropagation(); handleTaskToggle(task) }} />
                <div className="item-content"><div className="item-title" style={{ textDecoration: 'line-through' }}>{task.name}</div></div>
              </div>
            ))}</>
          )}
          <button className="btn btn-outline btn-block mt-8" onClick={() => openSubpage(TaskEdit)}>+ 新建任务</button>
        </div>
        <div className="card-section">
          <div className="section-header"><span className="section-title">今日打卡</span></div>
          {todayHabits.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">✅</div><div className="empty-text">今天没有需要打卡的习惯</div></div>
          ) : (
            todayHabits.map(habit => {
              const st = habitStatuses[habit.id]; const done = st?.checked
              return (
                <div key={habit.id} className="list-item" onClick={() => handleHabitCheck(habit)} style={{ opacity: done ? 0.5 : 1, cursor: 'pointer' }}>
                  <div className="item-icon" style={{ background: (habit.color || '#F2B8C6') + '33' }}>{habit.emoji || ''}</div>
                  <div className="item-content"><div className="item-title">{habit.name}{done ? ' (已打卡)' : ''}</div></div>
                  <div className="item-right"><span style={{ color: 'var(--primary)', fontWeight: 600 }}>+{habit.score || 5}</span></div>
                </div>
              )
            })
          )}
        </div>
        <div style={{ height: 80 }} />
      </div>
      {showCalendar && <CalendarModal currentDate={viewDate} onSelect={(d) => { setViewDate(d); setShowCalendar(false) }} onClose={() => setShowCalendar(false)} />}
      {confirmAction && <ConfirmModal message={confirmAction.message} onConfirm={confirmAction.onConfirm} onCancel={confirmAction.onCancel} />}
      {editingTask && <TaskEdit task={editingTask} onClose={() => setEditingTask(null)} />}
    </>
  )
}
