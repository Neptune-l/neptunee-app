import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useApp, showGlobalToast, navigateToTab } from '../store/store'
import { getToday, getFriendlyDate } from '../utils/date'
import { fmtMoney, fmtMoneyShort, round2 } from '../utils/money'
import CalendarModal from '../components/CalendarModal'
import ConfirmModal from '../components/ConfirmModal'
import TaskEdit from '../subpages/TaskEdit'
import AssetsManage from '../subpages/AssetsManage'
import { PET_SPECIES, PET_STATE_META } from '../utils/petConstants'
import { computePetView } from '../utils/petLogic'
import { macaronKeyOf } from '../utils/palette'

/** 在 YYYY-MM-DD 上加减天数（本地时区，避免 UTC 偏移） */
function shiftDay(dateStr, delta) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + delta)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function HomePage({ openSubpage }) {
  const { loaded, habits, tasks, bills, totalScore, viewDate, setViewDate, updateTask, checkHabit, uncheckHabit, getHabitStatus, getHabitStreak, pets, petPlans, petHistory, petWidgetEnabled, habitLayout, balance, assetsTotal, savingsNet, savingsGoals, totalAssetsBase } = useApp()
  const [showCalendar, setShowCalendar] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)
  const [editingTask, setEditingTask] = useState(null)
  const [habitStatuses, setHabitStatuses] = useState({})
  const [statusVersion, setStatusVersion] = useState(0)
  const [celebration, setCelebration] = useState(null)
  // 网格模式下"只看未完成"，习惯偏多时可以一键把已打卡的收起来
  const [hideDone, setHideDone] = useState(false)

  const today = getToday()
  const isViewToday = viewDate === today

  // 左右滑动切换日期（在页面容器上监听，纵向滚动不会误触）
  const touchRef = useRef({ x: 0, y: 0, active: false })
  const handleTouchStart = (e) => {
    const t = e.touches[0]
    touchRef.current = { x: t.clientX, y: t.clientY, active: true }
  }
  const handleTouchEnd = (e) => {
    if (!touchRef.current.active) return
    const t = e.changedTouches[0]
    const dx = t.clientX - touchRef.current.x
    const dy = t.clientY - touchRef.current.y
    touchRef.current.active = false
    // 位移够大、且明显偏横向，才算翻页手势
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 2) return
    setViewDate(shiftDay(viewDate, dx < 0 ? 1 : -1))
  }

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
  const todayIncome = useMemo(() => todayBills.filter(b => b.type === 'income').reduce((s, b) => s + b.amount, 0), [todayBills])
  /** 还没录过总资产、也没记过账：首页卡片改成引导态 */
  const assetsVirgin = totalAssetsBase === 0 && bills.length === 0 && savingsNet === 0
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

  const checkedCount = useMemo(() => todayHabits.filter(h => habitStatuses[h.id]?.checked).length, [todayHabits, habitStatuses])
  const visibleHabits = useMemo(() => (hideDone ? todayHabits.filter(h => !habitStatuses[h.id]?.checked) : todayHabits), [todayHabits, habitStatuses, hideDone])

  const widgetPet = useMemo(() => {
    if (!petWidgetEnabled) return null
    const active = pets.find(p => p.status === 'active' || p.status === 'dead')
    if (!active) return null
    return {
      ...computePetView(active, petPlans.find(pl => pl.id === active.id), petHistory.filter(h => h.petId === active.id), viewDate),
    }
  }, [petWidgetEnabled, pets, petPlans, petHistory, viewDate])

  const allDone = todayHabits.length > 0 && checkedCount === todayHabits.length

  const handleTaskToggle = async (task) => {
    if (!task.completed) {
      task.completed = true; task.completeTime = Date.now(); await updateTask(task); showGlobalToast('任务完成！')
      if (task.linkedHabitId) { try { const r = await checkHabit(task.linkedHabitId, viewDate); if (r && !r.already) showGlobalToast('任务完成，习惯自动打卡 +' + r.delta + '分') } catch (e) { showGlobalToast('打卡出错: ' + e.message) } }
    } else { setConfirmAction({ message: '取消完成将同步取消对应习惯打卡，是否继续？', onConfirm: async () => { task.completed = false; task.completeTime = null; await updateTask(task); if (task.linkedHabitId) { await uncheckHabit(task.linkedHabitId, viewDate) }; showGlobalToast('已取消完成'); setConfirmAction(null) }, onCancel: () => setConfirmAction(null) }) }
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

  const handleHabitUncheck = (habit) => {
    setConfirmAction({
      message: `取消「${habit.name}」今天的打卡？积分会同步扣回`,
      onConfirm: async () => {
        await uncheckHabit(habit.id, viewDate)
        showGlobalToast('已取消打卡')
        setStatusVersion(v => v + 1)
        setConfirmAction(null)
      },
      onCancel: () => setConfirmAction(null),
    })
  }

  const handleHabitTap = (habit) => {
    if (habitStatuses[habit.id]?.checked) handleHabitUncheck(habit)
    else handleHabitCheck(habit)
  }

  if (!loaded) return <div className="loading">加载中...</div>

  return (
    <>
      {celebration && <div className="celebration"><span className="celeb-icon">{celebration.icon}</span><span className="celeb-txt">{celebration.text}</span></div>}
      <div
        className="page-content home-dense"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={() => { touchRef.current.active = false }}
      >
        <div className="top-bar">
          <div className="top-bar-left">
            <div className="date-nav">
              <button type="button" className="date-nav-btn" aria-label="前一天" onClick={() => setViewDate(shiftDay(viewDate, -1))}>‹</button>
              <span className="date-nav-label" onClick={() => setShowCalendar(true)}>{getFriendlyDate(viewDate)}</span>
              <button type="button" className="date-nav-btn" aria-label="后一天" onClick={() => setViewDate(shiftDay(viewDate, 1))}>›</button>
            </div>
            {!isViewToday && <span className="back-today-btn" onClick={() => setViewDate(today)}>回到今天</span>}
          </div>
          <div className="top-bar-right"><span className="score-display">{totalScore}</span></div>
        </div>

        {/* 资产卡：余额 = 总资产 - 存钱罐 */}
        <div className="assets-hero" onClick={() => openSubpage(AssetsManage)}>
          <div className="assets-hero-top">
            <span className="assets-hero-label">余额</span>
            <span className="assets-hero-more">资产管理 ›</span>
          </div>
          <div className="assets-hero-value">{fmtMoney(balance)}</div>
          {assetsVirgin ? (
            <div className="assets-hero-empty">点这里录入你的总资产，开始跟踪余额</div>
          ) : (
            <>
              <div className="assets-hero-sub">
                <span>总资产 {fmtMoneyShort(assetsTotal)}</span>
                <span className="assets-dot">·</span>
                <span>存钱罐 {fmtMoneyShort(savingsNet)}</span>
                {savingsGoals.filter(g => g.status !== 'done').length > 0 && (
                  <>
                    <span className="assets-dot">·</span>
                    <span>{savingsGoals.filter(g => g.status !== 'done').length} 个存钱计划</span>
                  </>
                )}
              </div>
              <div className="assets-hero-flow">
                <span>今日 <b className="text-green">+{fmtMoney(round2(todayIncome))}</b></span>
                <span><b className="text-red">-{fmtMoney(round2(todayExpense))}</b></span>
              </div>
            </>
          )}
        </div>

        {/* 一行指标条：取代原来的宠物挂件卡 + 三张摘要卡（净积分与顶栏重复、支出与资产卡重复，都去掉） */}
        <div className="metric-strip">
          {widgetPet && (
            <>
              <button type="button" className="ms-pet" onClick={() => navigateToTab('pets')}>
                <img src={PET_SPECIES[widgetPet.pet.species].icon} alt="" />
                <span className="ms-pet-name">{widgetPet.pet.name}</span>
                <span className="ms-pet-state" style={{ color: PET_STATE_META[widgetPet.state].color }}>{PET_STATE_META[widgetPet.state].name}</span>
              </button>
              <span className="ms-sep" />
            </>
          )}
          {todayHabits.length > 0 && (
            <>
              <div className="ms-item"><span className="ms-value">{checkedCount}/{todayHabits.length}</span><span className="ms-label">打卡</span></div>
              <span className="ms-sep" />
            </>
          )}
          <div className="ms-item"><span className="ms-value">{pendingTasks.length}</span><span className="ms-label">待办</span></div>
        </div>

        <div className="card-section">
          <div className="section-header">
            <span className="section-title">今日待办</span>
            <div className="section-actions">
              {dayTasks.length > 0 && <span className="section-progress"><b>{completedTasks.length}</b>/{dayTasks.length}</span>}
              <button className="link-btn" onClick={() => openSubpage(TaskEdit)}>+ 新建</button>
            </div>
          </div>
          {dayTasks.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">✨</div><div className="empty-text">今日没有待办任务，好好休息吧</div></div>
          ) : (
            <div className="card-list">
              {pendingTasks.map(task => (
                <div key={task.id} className="list-item compact" onClick={() => setEditingTask(task)}>
                  <button type="button" className="checkbox-round" aria-label={`完成任务：${task.name}`} onClick={(e) => { e.stopPropagation(); handleTaskToggle(task) }} />
                  <div className="item-content"><div className="item-title">{task.name}</div></div>
                </div>
              ))}
              {completedTasks.map(task => (
                <div key={task.id} className="list-item compact completed" onClick={() => setEditingTask(task)}>
                  <button type="button" className="checkbox-round checked" aria-label={`取消完成：${task.name}`} onClick={(e) => { e.stopPropagation(); handleTaskToggle(task) }} />
                  <div className="item-content"><div className="item-title" style={{ textDecoration: 'line-through' }}>{task.name}</div></div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card-section">
          <div className="section-header">
            <span className="section-title">今日打卡</span>
            <div className="section-actions">
              {todayHabits.length > 0 && (allDone
                ? <span className="section-progress" style={{ color: 'var(--success)' }}>全部完成 🎉</span>
                : <span className="section-progress"><b>{checkedCount}</b>/{todayHabits.length}</span>)}
              {todayHabits.length > 3 && (
                <button className="link-btn" onClick={() => setHideDone(v => !v)}>{hideDone ? '显示全部' : '只看未完成'}</button>
              )}
            </div>
          </div>
          {todayHabits.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">✅</div><div className="empty-text">今天没有需要打卡的习惯</div></div>
          ) : visibleHabits.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">🎉</div><div className="empty-text">今天的习惯全部打卡完成！</div></div>
          ) : habitLayout === 'list' ? (
            <div className="card-list">
              {visibleHabits.map((habit, i) => {
                const done = habitStatuses[habit.id]?.checked
                const streak = getHabitStreak(habit.id, viewDate)
                return (
                  <div key={habit.id} className="list-item compact" onClick={() => handleHabitTap(habit)}>
                    <div className="item-icon" data-mc={macaronKeyOf(habit.color, i)}>{habit.emoji || '💪'}</div>
                    <div className="item-content">
                      <div className="item-title">
                        {habit.name}
                        {streak >= 2 && <span className="item-streak">🔥{streak}</span>}
                      </div>
                    </div>
                    <div className="item-right"><span className="habit-score">+{habit.score || 5}</span></div>
                    <div className={'checkbox-round' + (done ? ' checked' : '')} />
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="habit-grid">
              {visibleHabits.map((habit, i) => {
                const done = !!habitStatuses[habit.id]?.checked
                const streak = getHabitStreak(habit.id, viewDate)
                return (
                  <button
                    key={habit.id}
                    type="button"
                    data-mc={macaronKeyOf(habit.color, i)}
                    className={'habit-cell' + (done ? ' done' : '')}
                    aria-pressed={done}
                    aria-label={done ? `取消打卡：${habit.name}` : `打卡：${habit.name}`}
                    onClick={() => handleHabitTap(habit)}
                  >
                    {streak >= 2 && <span className="cell-streak">🔥{streak}</span>}
                    <span className="cell-emoji">{habit.emoji || '💪'}</span>
                    <span className="cell-name">{habit.name}</span>
                    <span className="cell-mark">✓</span>
                  </button>
                )
              })}
            </div>
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
