import React, { useState } from 'react'
import { useApp, showGlobalToast } from '../store/store'
import { getToday } from '../utils/date'
import ConfirmModal from '../components/ConfirmModal'

export default function TaskEdit({ task, onClose }) {
  const isEdit = !!task
  const { addTask, updateTask, deleteTask, habits } = useApp()

  const [name, setName] = useState(task?.name || '')
  const [date, setDate] = useState(task?.date || getToday())
  const [remark, setRemark] = useState(task?.remark || '')
  const [linkedHabitId, setLinkedHabitId] = useState(task?.linkedHabitId || '')
  const [timerTarget, setTimerTarget] = useState(task?.timerTarget || 0)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const positiveHabits = habits.filter(h => h.type === 'positive')

  const handleSave = async () => {
    if (!name.trim()) {
      showGlobalToast('请输入任务名称')
      return
    }
    if (timerTarget < 0) {
      showGlobalToast('时长不能为负数')
      return
    }

    const data = {
      name: name.trim(),
      date,
      remark: remark.trim(),
      linkedHabitId: linkedHabitId || '',
      timerTarget: Number(timerTarget),
    }

    if (isEdit) {
      await updateTask({ ...task, ...data })
      showGlobalToast('任务已更新')
    } else {
      await addTask(data)
      showGlobalToast('任务创建成功')
    }
    onClose()
  }

  const handleDelete = async () => {
    await deleteTask(task.id)
    showGlobalToast('任务已删除')
    setShowDeleteConfirm(false)
    onClose()
  }

  return (
    <div className="subpage">
      <div className="subpage-header">
        <button className="back-btn" onClick={onClose}>‹</button>
        <span className="subpage-title">{isEdit ? '编辑任务' : '新建任务'}</span>
        <button className="btn btn-primary btn-sm" onClick={handleSave}>保存</button>
      </div>

      <div className="subpage-body">
        <div className="card card-section">
          <div className="form-group">
            <label className="form-label">任务名称</label>
            <input className="form-input" placeholder="输入任务名称" value={name} onChange={e => setName(e.target.value)} maxLength={30} />
          </div>
        </div>

        <div className="card card-section">
          <div className="form-group">
            <label className="form-label">所属日期</label>
            <input className="form-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
        </div>

        <div className="card card-section">
          <div className="form-group">
            <label className="form-label">备注（选填）</label>
            <textarea className="form-input" placeholder="添加备注..." value={remark} onChange={e => setRemark(e.target.value)} maxLength={100} />
          </div>
        </div>

        <div className="card card-section">
          <div className="form-group">
            <label className="form-label">关联习惯（选填）</label>
            <select className="form-input" value={linkedHabitId} onChange={e => setLinkedHabitId(e.target.value)}>
              <option value="">不关联</option>
              {positiveHabits.map(h => (
                <option key={h.id} value={h.id}>{h.emoji} {h.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="card card-section">
          <div className="form-group">
            <label className="form-label">计时目标（分钟，0=不计时）</label>
            <input className="form-input" type="number" min="0" value={timerTarget} onChange={e => setTimerTarget(e.target.value)} />
          </div>
        </div>

        {isEdit && (
          <button className="delete-btn mt-16" onClick={() => setShowDeleteConfirm(true)}>
            删除该任务
          </button>
        )}
      </div>

      {showDeleteConfirm && (
        <ConfirmModal
          message="删除后该任务将无法恢复，是否确认？"
          icon="⚠️"
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  )
}
