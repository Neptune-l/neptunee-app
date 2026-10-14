import React, { useState } from 'react'
import { EMOJI_CATEGORIES } from '../utils/constants'
import { ICON_GROUPS } from '../utils/icons'
import Icon from './Icon'

/**
 * 图标 / Emoji 选择器。
 *
 * 默认停在「图标」页签（有 174 个风格统一的 PNG 图标）；
 * 「Emoji」页签保留原来的 7 组系统 emoji，想用还是能用。
 *
 * onSelect 收到 { type: 'icon' | 'emoji', value: string }
 *
 * @param current 当前选中项，形如 { type, value }，用于高亮
 */
export default function IconPicker({ current, onSelect, onClose }) {
  const [mode, setMode] = useState(current?.type === 'emoji' ? 'emoji' : 'icon')
  const [groupIndex, setGroupIndex] = useState(0)
  const [emojiIndex, setEmojiIndex] = useState(0)

  const pick = (type, value) => { onSelect({ type, value }); onClose() }
  const isPicked = (type, value) => current?.type === type && current?.value === value

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content emoji-picker" onClick={e => e.stopPropagation()}>
        <div className="picker-modes">
          <button type="button" className={`picker-mode${mode === 'icon' ? ' active' : ''}`} onClick={() => setMode('icon')}>图标</button>
          <button type="button" className={`picker-mode${mode === 'emoji' ? ' active' : ''}`} onClick={() => setMode('emoji')}>Emoji</button>
        </div>

        {mode === 'icon' ? (
          <>
            <div className="emoji-picker-tabs">
              {ICON_GROUPS.map((grp, i) => (
                <button key={grp.name} type="button" className={`emoji-picker-tab${i === groupIndex ? ' active' : ''}`} onClick={() => setGroupIndex(i)}>
                  {grp.name}
                </button>
              ))}
            </div>
            <div className="icon-picker-grid">
              {ICON_GROUPS[groupIndex].icons.map(item => (
                <button
                  key={item.slug}
                  type="button"
                  title={item.label}
                  aria-label={item.label}
                  className={`icon-item${isPicked('icon', item.slug) ? ' active' : ''}`}
                  onClick={() => pick('icon', item.slug)}
                >
                  <Icon name={item.slug} size={30} />
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="emoji-picker-tabs">
              {EMOJI_CATEGORIES.map((cat, i) => (
                <button key={i} type="button" className={`emoji-picker-tab${i === emojiIndex ? ' active' : ''}`} onClick={() => setEmojiIndex(i)}>
                  {cat.name}
                </button>
              ))}
            </div>
            <div className="emoji-picker-grid">
              {EMOJI_CATEGORIES[emojiIndex].items.map((emoji, i) => (
                <button key={i} type="button" className={`emoji-item${isPicked('emoji', emoji) ? ' active' : ''}`} onClick={() => pick('emoji', emoji)}>
                  {emoji}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
