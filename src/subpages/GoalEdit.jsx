import React, { useState } from 'react'
import { useApp, showGlobalToast } from '../store/store'
import ConfirmModal from '../components/ConfirmModal'
import GoalDetail from './GoalDetail'

export default function GoalEdit({ onClose }) {
  const { goals, addGoal, updateGoal, deleteGoal } = useApp()
  const [tab, setTab] = useState('active')
  const [editing, setEditing] = useState(null)
  const [name, setName] = useState('')
  const [remark, setRemark] = useState('')
  const [deadline, setDeadline] = useState('')
  const [progressText, setProgressText] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)
  const [selectedGoal, setSelectedGoal] = useState(null)

  const filtered = goals.filter(g => {
    if (tab === 'active') return g.status === 'active'
    if (tab === 'paused') return g.status === 'paused'
    if (tab === 'done') return g.status === 'completed'
    return true
  })

  const clearForm = () => {
    setEditing(null); setName(''); setRemark(''); setDeadline(''); setProgressText('')
  }

  const startEdit = (goal) => {
    setEditing(goal); setName(goal.name); setRemark(goal.remark || '')
    setDeadline(goal.deadline || ''); setProgressText(goal.progressText || '')
  }

  const handleSave = async () => {
    if (!name.trim()) { showGlobalToast('请输入目标名称'); return }
    const data = { name: name.trim(), remark: remark.trim(), deadline, progressText: progressText.trim(), status: editing?.status || 'active' }
    if (editing) {
      await updateGoal({ ...editing, ...data })
      showGlobalToast('目标已更新')
    } else {
      await addGoal(data)
      showGlobalToast('目标创建成功')
    }
    clearForm()
  }

  const handleDelete = async () => {
    if (showDeleteConfirm) {
      await deleteGoal(showDeleteConfirm)
      showGlobalToast('已删除')
      setShowDeleteConfirm(null)
    }
  }

  const handleStatusChange = async (goal, status) => {
    await updateGoal({ ...goal, status })
    showGlobalToast(`状态已更新为${status === 'active' ? '进行中' : status === 'paused' ? '暂停' : '已完成'}`)
  }

  const statusLabels = { active: '进行中', paused: '暂停', completed: '已完成' }
  const statusClasses = { active: 'active', paused: 'paused', completed: 'done' }

  return (
    <div className="subpage">
      <div className="subpage-header">
        <button className="back-btn" onClick={onClose}>‹</button>
        <span className="subpage-title">🎯 中长期目标</span>
      </div>
      <div className="subpage-body">
        {/* 表单 */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="form-group">
            <input className="form-input" placeholder="目标名称" value={name} onChange={e => setName(e.target.value)} maxLength={30} />
          </div>
          <div className="form-group">
            <textarea className="form-input" placeholder="备注（选填）" value={remark} onChange={e => setRemark(e.target.value)} rows={2} />
          </div>
          <div className="form-group">
            <label className="form-label">截止日期（选填）</label>
            <input className="form-input" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
          </div>
          <div className="form-group">
            <input className="form-input" placeholder="进度文字（如：已完成50%）" value={progressText} onChange={e => setProgressText(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary btn-block" onClick={handleSave}>
              {editing ? '保存修改' : '添加目标'}
            </button>
            {editing && <button className="btn btn-outline" onClick={clearForm}>取消</button>}
          </div>
        </div>

        {/* Tab */}
        <div className="tab-bar">
          <button className={`tab-bar-item${tab === 'active' ? ' active' : ''}`} onClick={() => setTab('active')}>进行中</button>
          <button className={`tab-bar-item${tab === 'paused' ? ' active' : ''}`} onClick={() => setTab('paused')}>暂停</button>
          <button className={`tab-bar-item${tab === 'done' ? ' active' : ''}`} onClick={() => setTab('done')}>已完成</button>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎯</div>
            <div className="empty-text">还没有目标，在上方添加吧</div>
          </div>
        ) : (
          filtered.reverse().map(goal => (
            <div key={goal.id} className="goal-card" onClick={() => setSelectedGoal(goal)}>
              <div className="goal-title">{goal.name}</div>
              <div className="goal-meta">
                <span className={`goal-status ${statusClasses[goal.status]}`}>{statusLabels[goal.status]}</span>
                {goal.deadline && <span> · 截止 {goal.deadline}</span>}
              </div>
              {goal.progressText && <div className="progress-bar mt-8"><div className="progress-fill" style={{ width: '60%' }} /></div>}
              {goal.progressText && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{goal.progressText}</div>}
              <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                <button className="btn btn-sm btn-outline" onClick={(e) => { e.stopPropagation(); handleStatusChange(goal, goal.status === 'active' ? 'paused' : 'active') }}>
                  {goal.status === 'active' ? '暂停' : '继续'}
                </button>
                <button className="btn btn-sm btn-outline" onClick={(e) => { e.stopPropagation(); handleStatusChange(goal, 'completed') }}>完成</button>
                <button className="btn btn-sm btn-danger" onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(goal.id) }}>删除</button>
                <button className="btn btn-sm btn-primary" onClick={(e) => { e.stopPropagation(); startEdit(goal) }}>编辑</button>
              </div>
            </div>
          ))
        )}
      </div>

      {showDeleteConfirm && (
        <ConfirmModal message="删除此目标？" icon="⚠️"
          onConfirm={handleDelete} onCancel={() => setShowDeleteConfirm(null)} />
      )}

      {selectedGoal && (
        <GoalDetail goal={selectedGoal} onClose={() => setSelectedGoal(null)} />
      )}
    </div>
  )
}
