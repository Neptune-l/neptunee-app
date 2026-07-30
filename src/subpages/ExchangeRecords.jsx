import React from 'react'
import { useApp } from '../store/store'

export default function ExchangeRecords({ onClose }) {
  const { exchangeRecords } = useApp()
  const sorted = [...exchangeRecords].sort((a, b) => b.time - a.time)

  return (
    <div className="subpage">
      <div className="subpage-header">
        <button className="back-btn" onClick={onClose}>‹</button>
        <span className="subpage-title">兑换记录</span>
      </div>
      <div className="subpage-body">
        {sorted.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <div className="empty-text">暂无兑换记录</div>
          </div>
        ) : (
          sorted.map(record => (
            <div key={record.id} className="list-item">
              <div className="item-icon" style={{ background: 'rgba(242,184,198,0.2)' }}>🎁</div>
              <div className="item-content">
                <div className="item-title">{record.wishName}</div>
                <div className="item-sub">{new Date(record.time).toLocaleDateString()}</div>
              </div>
              <div className="item-score negative">-{record.cost}分</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
