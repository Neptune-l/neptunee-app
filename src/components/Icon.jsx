import React from 'react'
import { iconSrc, iconLabel } from '../utils/icons'

/**
 * 统一图标渲染。
 *
 * 优先渲染 PNG 图标（name = slug），取不到就回退 emoji 文本。
 * 这样老数据（只存了 emoji 字符）不需要迁移，新数据存 slug 即可。
 *
 * @param name  图标 slug（如 'noodle'）
 * @param emoji 兜底 emoji 字符（老数据 / 没选图标时）
 * @param size  边长 px（图标与 emoji 字号共用这一个值）
 */
export default function Icon({ name, emoji, size = 24, className = '', style, title }) {
  const src = iconSrc(name)

  if (src) {
    return (
      <img
        className={['icon-img', className].filter(Boolean).join(' ')}
        src={src}
        width={size}
        height={size}
        alt={title || iconLabel(name)}
        draggable={false}
        style={{ width: size, height: size, ...style }}
      />
    )
  }

  if (!emoji) return null
  return (
    <span
      className={className}
      style={{ fontSize: size, lineHeight: 1, ...style }}
      aria-hidden="true"
    >
      {emoji}
    </span>
  )
}
