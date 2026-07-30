import React, { useState } from 'react'
import { useApp, showGlobalToast } from '../store/store'
import EmojiPicker from '../components/EmojiPicker'
import ColorPicker from '../components/ColorPicker'
import ConfirmModal from '../components/ConfirmModal'
import { DEFAULT_EMOJI, DEFAULT_COLOR } from '../utils/constants'

const WEEKDAYS_SHORT = ['日', '一', '二', '三', '四', '五', '六']
const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

export default function HabitEdit({ habit, onClose }) {
  const isEdit = !!habit
  const { addHabit, updateHabit, deleteHabit } = useApp()

  const [name, setName] = useState(habit?.name || '')
  const [type, setType] = useState(habit?.type || 'positive')
  const [score, setScore] = useState(habit?.score || 5)
  const [emoji, setEmoji] = useState(habit?.emoji || DEFAULT_EMOJI)
  const [color, setColor] = useState(habit?.color || DEFAULT_COLOR)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // 频率设置
  const [freqType, setFreqType] = useState(habit?.frequency?.type || 'daily')
  const [freqDays, setFreqDays] = useState(habit?.frequency?.days || [1, 3, 5])
  const [freqInterval, setFreqInterval] = useState(habit?.frequency?.interval || 2)
  const [freqMonthDays, setFreqMonthDays] = useState(habit?.frequency?.days || [1, 15])

  const toggleDay = (d) => {
    setFreqDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort())
  }

  const toggleMonthDay = (d) => {
    setFreqMonthDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort())
  }

  const handleSave = async () => {
    if (!name.trim()) { showGlobalToast('请输入习惯名称'); return }
    if (score < 1 || !Number.isInteger(Number(score))) { showGlobalToast('分值必须为正整数'); return }

    // 构建频率对象
    let frequency = { type: 'daily' }
    if (freqType === 'weekly') {
      if (freqDays.length === 0) { showGlobalToast('请至少选择一天'); return }
      frequency = { type: 'weekly', days: freqDays }
    } else if (freqType === 'biweekly') {
      if (freqDays.length === 0) { showGlobalToast('请至少选择一天'); return }
      frequency = { type: 'biweekly', days: freqDays, interval: Number(freqInterval) }
    } else if (freqType === 'monthly') {
      if (freqMonthDays.length === 0) { showGlobalToast('请至少选择一天'); return }
      frequency = { type: 'monthly', days: freqMonthDays }
    }

    const data = {
      name: name.trim(), type, score: Number(score),
      emoji, color, frequency,
      createTime: habit?.createTime || Date.now(),
    }

    if (isEdit) { await updateHabit({ ...habit, ...data }); showGlobalToast('习惯已更新') }
    else { await addHabit(data); showGlobalToast('习惯创建成功') }
    onClose()
  }

  const handleDelete = async () => { await deleteHabit(habit.id); showGlobalToast('习惯已删除'); setShowDeleteConfirm(false); onClose() }

  return (
    <div className="subpage">
      <div className="subpage-header">
        <button className="back-btn" onClick={onClose}>‹</button>
        <span className="subpage-title">{isEdit ? '编辑习惯' : '新建习惯'}</span>
        <button className="btn btn-primary btn-sm" onClick={handleSave}>保存</button>
      </div>

      <div className="subpage-body">
        {/* 图标+颜色 */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <div className="card" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => setShowEmojiPicker(true)}>
            <span className="form-label" style={{ margin: 0 }}>图标</span>
            <span style={{ fontSize: 36 }}>{emoji}</span>
          </div>
          <div className="card" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => setShowColorPicker(true)}>
            <span className="form-label" style={{ margin: 0 }}>颜色</span>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: color }} />
          </div>
        </div>

        {/* 名称 */}
        <div className="card card-section">
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">习惯名称</label>
            <input className="form-input" placeholder="输入习惯名称，比如：喝8杯水" value={name} onChange={e => setName(e.target.value)} maxLength={30} />
          </div>
        </div>

        {/* 类型 */}
        {!isEdit && (
          <div className="card card-section">
            <label className="form-label">习惯类型</label>
            <div className="tab-bar" style={{ marginTop: 8 }}>
              <button className={`tab-bar-item${type === 'positive' ? ' active' : ''}`} onClick={() => setType('positive')}>正向习惯</button>
              <button className={`tab-bar-item${type === 'restraint' ? ' active' : ''}`} onClick={() => setType('restraint')}>克制习惯</button>
            </div>
            <p className="form-label" style={{ marginTop: 8, fontSize: 11, color: 'var(--text-secondary)' }}>
              {type === 'positive' ? '每日可打卡1次，获得对应分值' : '记录破戒扣除对应分值，多次破戒多次扣除'}
            </p>
          </div>
        )}

        {/* 分值 */}
        <div className="card card-section">
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">{type === 'positive' ? '打卡获得分值' : '每次破戒扣除分值'}</label>
            <input className="form-input" type="number" min="1" value={score} onChange={e => setScore(e.target.value)} />
          </div>
        </div>

        {/* 频率设置（仅正向习惯） */}
        {(type === 'positive' || isEdit && habit?.type === 'positive') && (
          <div className="card card-section">
            <label className="form-label">打卡频率</label>
            <div className="tab-bar" style={{ marginTop: 8, marginBottom: 12 }}>
              <button className={`tab-bar-item${freqType === 'daily' ? ' active' : ''}`} onClick={() => setFreqType('daily')}>每天</button>
              <button className={`tab-bar-item${freqType === 'weekly' ? ' active' : ''}`} onClick={() => setFreqType('weekly')}>每周</button>
              <button className={`tab-bar-item${freqType === 'biweekly' ? ' active' : ''}`} onClick={() => setFreqType('biweekly')}>每N周</button>
              <button className={`tab-bar-item${freqType === 'monthly' ? ' active' : ''}`} onClick={() => setFreqType('monthly')}>每月</button>
            </div>

            {freqType === 'weekly' && (
              <div>
                <p className="form-label" style={{ marginBottom: 8 }}>选择每周周几打卡：</p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {WEEKDAYS_SHORT.map((label, i) => (
                    <button key={i} className={`btn btn-sm${freqDays.includes(i) ? ' btn-primary' : ' btn-outline'}`} onClick={() => toggleDay(i)}>
                      {label}
                    </button>
                  ))}
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6 }}>{freqDays.length > 0 ? `每周 ${freqDays.length} 次` : '未选择'}</p>
              </div>
            )}

            {freqType === 'biweekly' && (
              <div>
                <div className="form-group">
                  <label className="form-label">每</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input className="form-input" type="number" min="1" max="12" value={freqInterval} onChange={e => setFreqInterval(e.target.value)} style={{ width: 80 }} />
                    <span>周</span>
                  </div>
                </div>
                <p className="form-label" style={{ marginBottom: 8 }}>选择打卡的周几：</p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {WEEKDAYS_SHORT.map((label, i) => (
                    <button key={i} className={`btn btn-sm${freqDays.includes(i) ? ' btn-primary' : ' btn-outline'}`} onClick={() => toggleDay(i)}>
                      {label}
                    </button>
                  ))}
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6 }}>每{freqInterval}周 {freqDays.length > 0 ? `${freqDays.length} 次` : ''}</p>
              </div>
            )}

            {freqType === 'monthly' && (
              <div>
                <p className="form-label" style={{ marginBottom: 8 }}>选择每月几号打卡：</p>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                    <button key={d} className={`btn btn-sm${freqMonthDays.includes(d) ? ' btn-primary' : ' btn-outline'}`}
                      style={{ minWidth: 32, padding: '4px 6px' }} onClick={() => toggleMonthDay(d)}>
                      {d}
                    </button>
                  ))}
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6 }}>{freqMonthDays.length > 0 ? `每月 ${freqMonthDays.length} 天` : '未选择'}</p>
              </div>
            )}
          </div>
        )}

        {/* 删除 */}
        {isEdit && <button className="delete-btn mt-16" onClick={() => setShowDeleteConfirm(true)}>删除该习惯</button>}
      </div>

      {showEmojiPicker && <EmojiPicker onSelect={setEmoji} onClose={() => setShowEmojiPicker(false)} />}
      {showColorPicker && <ColorPicker currentColor={color} onSelect={setColor} onClose={() => setShowColorPicker(false)} />}
      {showDeleteConfirm && (
        <ConfirmModal message="删除后该习惯及所有历史记录将无法恢复，是否确认？" icon="⚠️"
          onConfirm={handleDelete} onCancel={() => setShowDeleteConfirm(false)} />
      )}
    </div>
  )
}
