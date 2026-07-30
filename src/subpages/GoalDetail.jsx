import React from 'react'
import { useApp } from '../store/store'

export default function GoalDetail({ goal, onClose }) {
  const statusLabels = { active: '进行中', paused: '暂停', completed: '已完成' }
  const statusClasses = { active: 'active', paused: 'paused', completed: 'done' }

  return (
    <div className="subpage">
      <div className="subpage-header">
        <button className="back-btn" onClick={onClose}>‹</button>
        <span className="subpage-title">目标详情</span>
      </div>
      <div className="subpage-body">
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 19, fontWeight: 700, marginBottom: 8 }}>{goal.name}</div>
          <span className={`goal-status ${statusClasses[goal.status]}`}>{statusLabels[goal.status]}</span>
        </div>
        {goal.remark && (
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>备注</div>
            <div>{goal.remark}</div>
          </div>
        )}
        {goal.deadline && (
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>截止日期</div>
            <div>{goal.deadline}</div>
          </div>
        )}
        <div className="card">
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>进度</div>
          <div className="progress-bar"><div className="progress-fill" style={{ width: goal.progressText ? '60%' : '0%' }} /></div>
          <div style={{ marginTop: 8, color: 'var(--primary)', fontWeight: 500 }}>{goal.progressText || '暂无进度'}</div>
        </div>
      </div>
    </div>
  )
}
