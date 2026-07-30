import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useApp, showGlobalToast, navigateToTab } from '../store/store'
import { getToday } from '../utils/date'
import ConfirmModal from '../components/ConfirmModal'

export default function FocusTimer() {
  const { loaded, tasks, updateTask, checkHabit, addFocusDiary } = useApp()
  const today = getToday()
  const [selectedTask, setSelectedTask] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [showTaskPicker, setShowTaskPicker] = useState(false)
  const [showQuitConfirm, setShowQuitConfirm] = useState(false)
  const [timerMode, setTimerMode] = useState('regular')
  const [pomoPhase, setPomoPhase] = useState('work')
  const [pomoCycle, setPomoCycle] = useState(0)
  const timerRef = useRef(null)
  const startTimeRef = useRef(null)
  const elapsedRef = useRef(0)

  const POMO_WORK = 25 * 60, POMO_SHORT = 5 * 60, POMO_LONG = 15 * 60

  useEffect(() => {
    if (!loaded) return
    const saved = localStorage.getItem('focusTimerState')
    if (saved) { try { const s = JSON.parse(saved); if (s.taskId) { const t = tasks.find(x => x.id === s.taskId); if (t) { setSelectedTask(t); const base = t.timerTotal || 0; setElapsed(base); elapsedRef.current = base } } } catch (e) {} }
  }, [loaded, tasks])

  useEffect(() => {
    if (timerMode === 'pomodoro' && isComplete && selectedTask) {
      if (pomoPhase === 'work') {
        const newCycle = pomoCycle + 1
        if (newCycle >= 4) {
          showGlobalToast('🎉 已完成4个番茄！休息15分钟吧')
          setPomoPhase('longBreak'); setElapsed(0); elapsedRef.current = 0; setPomoCycle(0)
          setTimeout(() => handleStart(), 500)
        } else {
          showGlobalToast('🍅 番茄完成！休息5分钟')
          setPomoPhase('shortBreak'); setElapsed(0); elapsedRef.current = 0; setPomoCycle(newCycle)
          setTimeout(() => handleStart(), 500)
        }
        setIsComplete(false)
      } else {
        showGlobalToast('💪 休息结束，开始新的番茄！')
        setPomoPhase('work'); setElapsed(0); elapsedRef.current = 0
        setIsComplete(false)
        setTimeout(() => handleStart(), 500)
      }
    }
  }, [isComplete])

  const saveTimerState = useCallback(() => {
    if (selectedTask) { localStorage.setItem('focusTimerState', JSON.stringify({ taskId: selectedTask.id, isRunning, startTime: isRunning ? (startTimeRef.current || Date.now()) : null })) }
  }, [selectedTask, isRunning])

  useEffect(() => {
    if (isRunning && !isPaused && selectedTask && !isComplete) {
      timerRef.current = setInterval(() => {
        const extra = Math.floor((Date.now() - startTimeRef.current) / 1000)
        const total = elapsedRef.current + extra
        setElapsed(total)
        elapsedRef.current = total
        const target = timerMode === 'regular' ? (selectedTask.timerTarget || 0) * 60 : (pomoPhase === 'work' ? POMO_WORK : pomoPhase === 'longBreak' ? POMO_LONG : POMO_SHORT)
        if (target > 0 && total >= target) {
          clearInterval(timerRef.current)
          if (timerMode === 'regular') {
            completeTimer()
          } else {
            setIsRunning(false); setIsComplete(true)
          }
        }
      }, 1000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [isRunning, isPaused, selectedTask, isComplete, timerMode, pomoPhase])

  useEffect(() => { const si = setInterval(saveTimerState, 5000); return () => clearInterval(si) }, [saveTimerState])

  const completeTimer = async () => {
    setIsRunning(false); setIsComplete(true); clearInterval(timerRef.current)
    if (selectedTask) {
      selectedTask.timerTotal = elapsedRef.current; selectedTask.completed = true; selectedTask.completeTime = Date.now()
      await updateTask(selectedTask)
      if (selectedTask.linkedHabitId) { const r = await checkHabit(selectedTask.linkedHabitId, today); if (r && !r.already) showGlobalToast('专注完成！习惯自动打卡 +' + r.delta + '分') } else { showGlobalToast('专注时长达标！任务已完成') }
      await addFocusDiary({ taskName: selectedTask.name, duration: elapsedRef.current, date: today })
    }
    localStorage.removeItem('focusTimerState')
  }

  const handleStart = () => { startTimeRef.current = Date.now(); elapsedRef.current = elapsed; setIsRunning(true); setIsPaused(false) }
  const handlePause = () => { clearInterval(timerRef.current); elapsedRef.current = elapsed; setIsPaused(true) }
  const handleResume = () => { startTimeRef.current = Date.now(); setIsPaused(false) }
  const handleQuit = () => setShowQuitConfirm(true)
  const confirmQuit = () => {
    clearInterval(timerRef.current); setElapsed(0); elapsedRef.current = 0; setIsRunning(false); setIsPaused(false); setIsComplete(false)
    setSelectedTask(null); setPomoPhase('work'); setPomoCycle(0); localStorage.removeItem('focusTimerState'); setShowQuitConfirm(false)
  }

  const formatTime = (s) => { const m = Math.floor(s / 60); const sec = s % 60; return String(m).padStart(2, '0') + ':' + String(sec).padStart(2, '0') }

  const todayTasksWithTimer = tasks.filter(t => t.date === today && !t.completed && t.timerTarget > 0)
  const targetSeconds = timerMode === 'regular' ? ((selectedTask?.timerTarget || 0) * 60) : (pomoPhase === 'work' ? POMO_WORK : pomoPhase === 'longBreak' ? POMO_LONG : POMO_SHORT)
  const progress = selectedTask ? Math.min(elapsed / targetSeconds, 1) : 0
  const circ = 2 * Math.PI * 120
  const offset = circ * (1 - progress)

  if (!loaded) return <div className="loading">加载中...</div>

  return (
    <div className="page-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 12 }}>
      {/* 模式切换 */}
      <div className="pomodoro-selector">
        <button className={'pomo-option' + (timerMode === 'regular' ? ' active' : '')} onClick={() => { if (!isRunning) { setTimerMode('regular'); setElapsed(0); elapsedRef.current = 0; setIsComplete(false) } }}>⏱ 普通计时</button>
        <button className={'pomo-option' + (timerMode === 'pomodoro' ? ' active' : '')} onClick={() => { if (!isRunning) { setTimerMode('pomodoro'); setElapsed(0); elapsedRef.current = 0; setPomoPhase('work'); setPomoCycle(0); setIsComplete(false) } }}>🍅 番茄钟</button>
      </div>
      {timerMode === 'pomodoro' && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
          <span className={'pomo-option work' + (pomoPhase === 'work' ? ' active' : '')} style={{ padding: '4px 12px', fontSize: 12 }}>专注</span>
          <span className={'pomo-option break' + (pomoPhase !== 'work' ? ' active' : '')} style={{ padding: '4px 12px', fontSize: 12 }}>{pomoPhase === 'longBreak' ? '长休' : '短休'}</span>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>第 {pomoCycle + 1}/4 轮</span>
        </div>
      )}
      {/* 计时圆环 */}
      <div style={{ position: 'relative', width: 280, height: 280, margin: '8px auto' }}>
        <svg width="280" height="280" viewBox="0 0 280 280">
          <circle cx="140" cy="140" r="120" fill="none" stroke="var(--border)" strokeWidth="12" />
          {selectedTask && <circle cx="140" cy="140" r="120" fill="none"
            stroke={isComplete ? 'var(--success)' : timerMode === 'pomodoro' && pomoPhase === 'work' ? 'var(--danger)' : 'var(--primary)'}
            strokeWidth="12" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} transform="rotate(-90 140 140)" style={{ transition: 'stroke-dashoffset 0.3s ease' }} />}
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          {!selectedTask ? (<><div style={{ fontSize: 36, marginBottom: 8 }}>⏱️</div><div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>选择任务开始专注</div></>)
          : isComplete ? (<><div style={{ fontSize: 36, marginBottom: 4 }}>🎉</div><div style={{ fontSize: 18, fontWeight: 700 }}>完成</div><div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{formatTime(elapsed)}</div></>)
          : (<><div style={{ fontSize: 28, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{formatTime(elapsed)}<span style={{ fontSize: 16, color: 'var(--text-secondary)', fontWeight: 400 }}> / {formatTime(targetSeconds)}</span></div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{selectedTask.name}</div></>)}
        </div>
      </div>
      {/* 操作区 */}
      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        {!selectedTask ? (
          <button className="btn btn-primary" onClick={() => setShowTaskPicker(true)}>选择任务</button>
        ) : isComplete ? (
          <button className="btn btn-primary" onClick={() => {
            if (timerMode === 'regular') navigateToTab('home')
            else { setIsComplete(false); setIsRunning(false); setElapsed(0); elapsedRef.current = 0 }
          }}>{timerMode === 'regular' ? '返回首页' : '继续下一个番茄'}</button>
        ) : !isRunning ? (
          <>{!isPaused ? <button className="btn btn-primary" onClick={handleStart}>开始专注</button>
            : <><button className="btn btn-primary" onClick={handleResume}>继续</button><button className="btn btn-outline" onClick={handleQuit}>放弃</button></>}
            <button className="btn btn-outline" onClick={() => { setSelectedTask(null); setElapsed(0); elapsedRef.current = 0 }}>重选任务</button></>
        ) : (
          <><button className="btn btn-primary" onClick={handlePause}>暂停</button><button className="btn btn-outline" onClick={handleQuit}>放弃</button></>
        )}
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center', marginTop: 16, lineHeight: 1.6 }}>
        {timerMode === 'regular' ? '支持多次暂停，累计时长达标即可完成任务' : '番茄钟：25分钟专注 + 5分钟休息，4轮后休息15分钟'}
      </p>
      {/* 任务选择弹窗 */}
      {showTaskPicker && (
        <div className="modal-overlay" onClick={() => setShowTaskPicker(false)}>
          <div className="modal-content" style={{ padding: 16, maxWidth: 340 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>选择要专注的任务</div>
            {todayTasksWithTimer.length === 0 ? <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 20 }}>今日没有待完成且设置计时的任务</div>
            : todayTasksWithTimer.map(task => (
              <div key={task.id} className="list-item" onClick={() => { setSelectedTask(task); setElapsed(task.timerTotal || 0); elapsedRef.current = task.timerTotal || 0; setShowTaskPicker(false); setIsComplete(false) }}>
                <div className="item-content"><div className="item-title">{task.name}</div><div className="item-sub">目标 {task.timerTarget}分钟</div></div>
              </div>
            ))}
          </div>
        </div>
      )}
      {showQuitConfirm && <ConfirmModal message="放弃将清空本次计时" icon="⏹️" onConfirm={confirmQuit} onCancel={() => setShowQuitConfirm(false)} />}
    </div>
  )
}
