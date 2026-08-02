import React from 'react'
import { useApp } from '../store/store'
import { PET_SPECIES, PET_ITEM_ICON, getPetStage } from '../utils/petConstants'

export default function PetMemorial({ onClose }) {
  const { pets } = useApp()
  const graduated = pets.filter(p => p.status === 'graduated')
  const memorialized = pets.filter(p => p.status === 'memorialized')

  const renderCard = (p) => {
    const sp = PET_SPECIES[p.species]
    const img = sp.stages[getPetStage(p.growth) - 1] || sp.icon
    const days = p.totalDays || 0
    return (
      <div key={p.id} className="list-item">
        <div className="pet-thumb" style={{ background: '#F0ECE6' }}>
          <img src={img} alt={sp.name} style={{ filter: p.status === 'memorialized' ? 'grayscale(1)' : 'none' }} />
        </div>
        <div className="item-content">
          <div className="item-title">{p.name}</div>
          <div className="item-sub">{sp.name} · {p.planName}</div>
          <div className="item-sub">成长 {p.growth} · 存活 {days} 天 · 复活 {p.reviveCount || 0} 次</div>
          <div className="item-sub">{p.status === 'memorialized' ? '阵亡于 ' : '毕业于 '}{p.memorialAt ? new Date(p.memorialAt).toLocaleDateString() : p.graduateAt ? new Date(p.graduateAt).toLocaleDateString() : ''}</div>
        </div>
        <div className="item-right">
          <span className="pet-state-chip" style={{ background: p.status === 'memorialized' ? '#8B817822' : '#F2B8C622', color: p.status === 'memorialized' ? '#8B8178' : '#C07A9A' }}>
            {p.status === 'memorialized' ? '阵亡' : '已开智'}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="subpage">
      <div className="subpage-header">
        <button className="back-btn" onClick={onClose}>‹</button>
        <span className="subpage-title">🕯️ 遗照合集</span>
      </div>
      <div className="subpage-body">
        {graduated.length === 0 && memorialized.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🕯️</div>
            <div className="empty-text">这里还很空，希望永远不拥挤</div>
          </div>
        ) : (
          <>
            {graduated.length > 0 && (
              <>
                <div className="section-title" style={{ marginBottom: 8 }}><img src={PET_ITEM_ICON.icon_graduate} alt="毕业" className="wallet-ico" /> 已开智</div>
                {graduated.map(renderCard)}
              </>
            )}
            {memorialized.length > 0 && (
              <>
                <div className="section-title" style={{ margin: '16px 0 8px' }}><img src={PET_ITEM_ICON.icon_memorial} alt="阵亡" className="wallet-ico" /> 阵亡</div>
                {memorialized.map(renderCard)}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
