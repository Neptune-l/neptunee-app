import React, { useState, useEffect, useMemo } from 'react'
import { useApp, showGlobalToast, navigateToTab } from '../store/store'
import { getFriendlyDate, isToday, getToday } from '../utils/date'
import CalendarModal from '../components/CalendarModal'
import ConfirmModal from '../components/ConfirmModal'
import TaskEdit from '../subpages/TaskEdit'

export default function TaskCenter({ openSubpage }) {
  const { loaded, tasks, viewDate, setViewDate, checkHabit } = useApp()
  const [showCalendar, setShowCalendar] = useState(false)
  const [tab, setTab] = useState('pending')
  const [editingTask, setEditingTask] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)

  const today = getToday()
  const isViewToday = viewDate === today

  const dayTasks = useMemo(() => tasks.filter(t => t.date === viewDate), [tasks, viewDate])
  const pendingTasks = useMemo(() => dayTasks.filter(t => !t.completed), [dayTasks])
  const completedTasks = useMemo(() => dayTasks.filter(t => t.completed), [dayTasks])

  const { updateTask } = useApp()

  const handleToggle = async (task) => {
    if (!task.completed) {
      // 完成任务
      task.completed = true
      task.completeTime = Date.now()
      await updateTask(task)
      showGlobalToast('任务完成！')

      // 关联习惯自动打卡
      if (task.linkedHabitId) {
        const result = await checkHabit(task.linkedHabitId, viewDate)
        if (result && !result.already) {
          showGlobalToast(`任务完成，习惯自动打卡 +${result.delta}分`)
        }
      }
    } else {
      // 取消完成
      setConfirmAction({
        message: '取消完成将同步取消对应习惯打卡，是否继续？',
        onConfirm: async () => {
          task.completed = false
          task.completeTime = null
          await updateTask(task)
          showGlobalToast('已取消完成')
          setConfirmAction(null)
        },
        onCancel: () => setConfirmAction(null),
      })
    }
  }

  const handleTaskClick = (task) => {
    setEditingTask(task)
  }

  if (!loaded) return <div className="loading">加载中...</div>

  return (
    <>
      <div className="page-content">
        {/* 顶部 */}
        <div className="top-bar">
          <div className="top-bar-left">
            <span className="date-display" onClick={() => setShowCalendar(true)}>
              {getFriendlyDate(viewDate)}
              {!isViewToday && (
                <span className="back-today-btn" onClick={(e) => { e.stopPropagation(); setViewDate(today) }}>
                  回到今天
                </span>
              )}
            </span>
          </div>
          <div className="top-bar-right">
            <span className="section-sub">{completedTasks.length}/{dayTasks.length}</span>
          </div>
        </div>

        {/* Tab */}
        <div className="tab-bar">
          <button className={`tab-bar-item${tab === 'pending' ? ' active' : ''}`} onClick={() => setTab('pending')}>
            待完成
          </button>
          <button className={`tab-bar-item${tab === 'done' ? ' active' : ''}`} onClick={() => setTab('done')}>
            已完成
          </button>
        </div>

        {/* 任务列表 */}
        {tab === 'pending' && (
          <>
            {pendingTasks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">✨</div>
                <div className="empty-text">今日没有待办任务，好好休息吧✨</div>
              </div>
            ) : (
              pendingTasks.map(task => (
                <div key={task.id} className="list-item" onClick={() => handleTaskClick(task)}>
                  <div className="checkbox-round" onClick={(e) => { e.stopPropagation(); handleToggle(task) }} />
                  <div className="item-content">
                    <div className="item-title">{task.name}</div>
                    {task.remark && <div className="item-sub">{task.remark}</div>}
                  </div>
                  {task.timerTarget > 0 && (
                    <div className="item-right">
                      <button className="btn btn-outline btn-sm" onClick={(e) => { e.stopPropagation(); navigateToTab("timer") }}>
                        ▶ 开始计时
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </>
        )}

        {tab === 'done' && (
          <>
            {completedTasks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🎉</div>
                <div className="empty-text">还没有完成的任务</div>
              </div>
            ) : (
              completedTasks.map(task => (
                <div key={task.id} className="list-item completed" onClick={() => handleTaskClick(task)}>
                  <div className="checkbox-round checked" onClick={(e) => { e.stopPropagation(); handleToggle(task) }} />
                  <div className="item-content">
                    <div className="item-title" style={{ textDecoration: 'line-through' }}>{task.name}</div>
                    {task.remark && <div className="item-sub">{task.remark}</div>}
                  </div>
                </div>
              ))
            )}
          </>
        )}

        <div style={{ height: 80 }} />
      </div>

      {/* FAB */}
      <button className="fab" onClick={() => openSubpage(TaskEdit)}>+</button>

      {/* 日历 */}
      {showCalendar && (
        <CalendarModal
          currentDate={viewDate}
          onSelect={(d) => { setViewDate(d); setShowCalendar(false) }}
          onClose={() => setShowCalendar(false)}
        />
      )}

      {/* 确认 */}
      {confirmAction && (
        <ConfirmModal
          message={confirmAction.message}
          onConfirm={confirmAction.onConfirm}
          onCancel={confirmAction.onCancel}
        />
      )}

      {/* 编辑任务二级页 */}
      {editingTask && (
        <TaskEdit task={editingTask} onClose={() => setEditingTask(null)} />
      )}
    </>
  )
}
