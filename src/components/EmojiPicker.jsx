import React, { useState } from 'react'
import { EMOJI_CATEGORIES } from '../utils/constants'

export default function EmojiPicker({ onSelect, onClose }) {
  const [catIndex, setCatIndex] = useState(0)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content emoji-picker" onClick={e => e.stopPropagation()}>
        <div className="emoji-picker-tabs">
          {EMOJI_CATEGORIES.map((cat, i) => (
            <button key={i} className={`emoji-picker-tab${i === catIndex ? ' active' : ''}`} onClick={() => setCatIndex(i)}>
              {cat.name}
            </button>
          ))}
        </div>
        <div className="emoji-picker-grid">
          {EMOJI_CATEGORIES[catIndex].items.map((emoji, i) => (
            <button key={i} className="emoji-item" onClick={() => { onSelect(emoji); onClose() }}>
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
