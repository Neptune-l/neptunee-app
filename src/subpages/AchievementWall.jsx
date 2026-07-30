import React from 'react'
import { useApp } from '../store/store'
import { ACHIEVEMENTS_CONFIG } from '../utils/constants'

export default function AchievementWall({ onClose }) {
  const { achievements } = useApp()
  const unlockedIds = new Set(achievements.map(a => a.id))

  return (
    <div className="subpage">
      <div className="subpage-header">
        <button className="back-btn" onClick={onClose}>‹</button>
        <span className="subpage-title">🏆 成就徽章</span>
      </div>
      <div className="subpage-body">
        <div className="achievement-grid">
          {ACHIEVEMENTS_CONFIG.map(ach => {
            const unlocked = unlockedIds.has(ach.id)
            return (
              <div key={ach.id} className={`achievement-item${!unlocked ? ' locked' : ''}`}>
                <div className="ach-emoji">{ach.emoji}</div>
                <div className="ach-name">{ach.name}</div>
                <div className="ach-condition">{unlocked ? '已解锁 ✨' : ach.condition}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
