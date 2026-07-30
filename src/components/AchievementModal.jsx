import React, { useState, useEffect } from 'react'
import { setGlobalAchievement } from '../store/store'

export default function AchievementModal() {
  const [achievement, setAchievement] = useState(null)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    setGlobalAchievement((ach) => {
      setAchievement(ach)
    })
  }, [])

  const handleClose = () => {
    setLeaving(true)
    setTimeout(() => {
      setAchievement(null)
      setLeaving(false)
    }, 120)
  }

  if (!achievement) return null

  return (
    <div className={`modal-overlay${leaving ? ' leaving' : ''}`} onClick={handleClose}>
      <div className={`modal-content achievement-modal${leaving ? ' leaving' : ''}`} onClick={e => e.stopPropagation()}>
        <div className="achievement-emoji">{achievement.emoji}</div>
        <div className="achievement-title">恭喜解锁 {achievement.name}</div>
        <div className="achievement-desc">你的自律开始发芽啦～</div>
        <button className="btn btn-primary mt-16" onClick={handleClose}>太棒了！</button>
      </div>
    </div>
  )
}
