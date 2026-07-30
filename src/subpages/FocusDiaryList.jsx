import React, { useState } from 'react'
import { useApp, showGlobalToast } from '../store/store'
import { formatSeconds } from '../utils/date'
import ConfirmModal from '../components/ConfirmModal'

export default function FocusDiaryList({ onClose }) {
  const { focusDiary, deleteFocusDiary } = useApp()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)

  const sorted = [...focusDiary].sort((a, b) => b.createTime - a.createTime)

  return (
    <div className="subpage">
      <div className="subpage-header">
        <button className="back-btn" onClick={onClose}>‹</button>
        <span className="subpage-title">📝 专注日记</span>
      </div>
      <div className="subpage-body">
        {sorted.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <div className="empty-text">还没有专注记录，完成一次专注计时后这里会出现记录</div>
          </div>
        ) : (
          sorted.map(entry => (
            <div key={entry.id} className="list-item"
              onContextMenu={(e) => { e.preventDefault(); setShowDeleteConfirm(entry.id) }}>
              <div className="item-icon" style={{ background: 'rgba(242,184,198,0.2)' }}>⏱️</div>
              <div className="item-content">
                <div className="item-title">{entry.taskName}</div>
                <div className="item-sub">{entry.date} · {formatSeconds(entry.duration)}</div>
              </div>
              <button className="btn btn-sm btn-danger" onClick={() => setShowDeleteConfirm(entry.id)}>删除</button>
            </div>
          ))
        )}
      </div>

      {showDeleteConfirm && (
        <ConfirmModal
          message="删除此记录不影响任务完成状态和积分，是否确认？"
          icon="📝"
          onConfirm={async () => {
            await deleteFocusDiary(showDeleteConfirm)
            showGlobalToast('已删除')
            setShowDeleteConfirm(null)
          }}
          onCancel={() => setShowDeleteConfirm(null)}
        />
      )}
    </div>
  )
}
