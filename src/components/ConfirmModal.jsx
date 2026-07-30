import React from 'react'

export default function ConfirmModal({ message, icon, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content confirm-modal" onClick={e => e.stopPropagation()}>
        {icon && <div className="confirm-icon">{icon}</div>}
        <div className="confirm-text">{message}</div>
        <div className="confirm-buttons">
          <button className="btn btn-outline" onClick={onCancel}>取消</button>
          <button className="btn btn-primary" onClick={onConfirm}>确认</button>
        </div>
      </div>
    </div>
  )
}
