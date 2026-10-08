import React, { useState } from 'react'
import { useApp, showGlobalToast } from '../store/store'
import { fmtMoney, round2, parseAmount } from '../utils/money'
import { SAVINGS_EMOJIS, MACARON_COLORS, DEFAULT_SAVINGS_EMOJI, DEFAULT_COLOR } from '../utils/constants'
import { macaronKeyOf } from '../utils/palette'

/**
 * 新建 / 编辑存钱目标
 * goal 为空表示新建
 */
export default function SavingsEdit({ goal, onClose }) {
  const { addSavingsGoal, updateSavingsGoal } = useApp()
  const editing = !!goal

  const [emoji, setEmoji] = useState(goal?.emoji || DEFAULT_SAVINGS_EMOJI)
  const [color, setColor] = useState(goal?.color || DEFAULT_COLOR)
  const [name, setName] = useState(goal?.name || '')
  const [target, setTarget] = useState(goal?.target ? String(goal.target) : '')
  const [hasDeadline, setHasDeadline] = useState(!!goal?.deadline)
  const [deadline, setDeadline] = useState(goal?.deadline || '')
  const [note, setNote] = useState(goal?.note || '')

  const handleSave = async () => {
    const trimmed = name.trim()
    if (!trimmed) { showGlobalToast('给它起个名字吧'); return }
    const targetNum = parseAmount(target)
    if (!(targetNum > 0)) { showGlobalToast('请输入有效的目标金额'); return }
    if (hasDeadline && !deadline) { showGlobalToast('请选择截止日期'); return }

    const payload = {
      name: trimmed,
      emoji,
      color,
      target: round2(targetNum),
      deadline: hasDeadline ? deadline : null,
      note: note.trim(),
    }

    if (editing) {
      await updateSavingsGoal({ ...goal, ...payload })
      showGlobalToast('已保存修改')
    } else {
      await addSavingsGoal(payload)
      showGlobalToast('存钱计划已创建')
    }
    onClose()
  }

  return (
    <div className="subpage">
      <div className="subpage-header">
        <button className="back-btn" onClick={onClose}>‹</button>
        <span className="subpage-title">{editing ? '编辑存钱计划' : '🐷 新建存钱计划'}</span>
        <button className="btn btn-primary btn-sm" onClick={handleSave}>{editing ? '保存' : '创建'}</button>
      </div>

      <div className="subpage-body">
        {/* 预览 */}
        <div className="savings-preview" data-mc={macaronKeyOf(color, 0)}>
          <div className="savings-preview-emoji" style={{ borderColor: color }}>{emoji}</div>
          <div>
            <div className="savings-preview-name">{name.trim() || '存钱计划'}</div>
            <div className="savings-preview-target">
              {target ? `目标 ${fmtMoney(parseAmount(target))}` : '目标金额待填'}
            </div>
          </div>
        </div>

        {/* 名称 */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">计划名称</label>
            <input
              className="form-input"
              placeholder="例如：买新手机、旅行基金"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={20}
            />
          </div>
        </div>

        {/* 目标金额 */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">目标金额</label>
            <input
              className="form-input"
              type="number"
              step="0.01"
              inputMode="decimal"
              placeholder="例如 5000"
              value={target}
              onChange={e => setTarget(e.target.value)}
            />
          </div>
          <div className="savings-quick-amounts">
            {[500, 1000, 3000, 5000, 10000, 20000].map(v => (
              <button
                key={v}
                type="button"
                className="savings-quick-amount"
                onClick={() => setTarget(String(v))}
              >
                {v >= 10000 ? `${v / 10000}万` : v}
              </button>
            ))}
          </div>
        </div>

        {/* 图标 */}
        <div className="section-header"><span className="section-title">图标</span></div>
        <div className="emoji-strip" style={{ marginBottom: 20 }}>
          {SAVINGS_EMOJIS.map(item => (
            <button
              key={item}
              type="button"
              className={`emoji-strip-item${emoji === item ? ' active' : ''}`}
              onClick={() => setEmoji(item)}
            >
              {item}
            </button>
          ))}
        </div>

        {/* 颜色 */}
        <div className="section-header"><span className="section-title">主题色</span></div>
        <div className="color-strip" style={{ marginBottom: 20 }}>
          {MACARON_COLORS.slice(0, 12).map(item => (
            <button
              key={item}
              type="button"
              className={`color-strip-item${color === item ? ' active' : ''}`}
              style={{ background: item }}
              aria-label={`选择颜色 ${item}`}
              onClick={() => setColor(item)}
            />
          ))}
        </div>

        {/* 截止日期 */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="settings-item" style={{ padding: 0, boxShadow: 'none', margin: 0, background: 'transparent' }}
            onClick={() => setHasDeadline(v => !v)}>
            <div className="settings-left">
              <span className="settings-icon">📅</span>
              <span className="settings-label">设置截止日期</span>
            </div>
            <div className={`toggle-switch${hasDeadline ? ' on' : ''}`} />
          </div>
          {hasDeadline && (
            <div className="form-group" style={{ margin: '12px 0 0' }}>
              <input
                className="form-input"
                type="date"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
              />
              <div className="assets-hint">设了截止日期后会帮你算「每天需要存多少」。</div>
            </div>
          )}
        </div>

        {/* 备注 */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">备注（选填）</label>
            <input
              className="form-input"
              placeholder="为什么想存这笔钱？"
              value={note}
              onChange={e => setNote(e.target.value)}
              maxLength={50}
            />
          </div>
        </div>

        <div style={{ height: 40 }} />
      </div>
    </div>
  )
}
