import React from 'react'
import { useBackLayer } from '../hooks/useBackLayer'

export default function ConfirmModal({ message, icon, onConfirm, onCancel }) {
  // 接入浏览器历史：打开时压一层，返回键 = 取消。
  // 手机返回键先关这个弹窗，而不是把整页退掉。
  const requestCancel = useBackLayer(true, onCancel)

  return (
    <div className="modal-overlay" onClick={requestCancel}>
      <div className="modal-content confirm-modal" onClick={e => e.stopPropagation()}>
        {icon && <div className="confirm-icon">{icon}</div>}
        <div className="confirm-text">{message}</div>
        <div className="confirm-buttons">
          <button className="btn btn-outline" onClick={requestCancel}>取消</button>
          <button className="btn btn-primary" onClick={onConfirm}>确认</button>
        </div>
      </div>
    </div>
  )
}
