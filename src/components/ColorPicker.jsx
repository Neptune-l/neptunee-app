import React from 'react'
import { MACARON_COLORS } from '../utils/constants'

export default function ColorPicker({ currentColor, onSelect, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div style={{ padding: '16px 16px 0', fontSize: 16, fontWeight: 600, textAlign: 'center' }}>选择颜色</div>
        <div className="color-picker-grid">
          {MACARON_COLORS.map((color, i) => (
            <div
              key={i}
              className={`color-swatch${currentColor === color ? ' selected' : ''}`}
              style={{ background: color }}
              onClick={() => { onSelect(color); onClose() }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
