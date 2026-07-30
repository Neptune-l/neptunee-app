import React, { useState } from 'react'
import { useApp, showGlobalToast } from '../store/store'
import EmojiPicker from '../components/EmojiPicker'
import ConfirmModal from '../components/ConfirmModal'

export default function WishEdit({ onClose }) {
  const { wishes, totalScore, addWish, updateWish, deleteWish, exchangeWish } = useApp()
  const [tab, setTab] = useState('available')
  const [editing, setEditing] = useState(null)
  const [name, setName] = useState('')
  const [cost, setCost] = useState('')
  const [emoji, setEmoji] = useState('🎁')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)

  const availableWishes = wishes.filter(w => !w.exchanged)
  const exchangedWishes = wishes.filter(w => w.exchanged)

  const startEdit = (wish) => {
    setEditing(wish)
    setName(wish.name)
    setCost(String(wish.cost))
    setEmoji(wish.emoji || '🎁')
  }

  const clearForm = () => {
    setEditing(null)
    setName('')
    setCost('')
    setEmoji('🎁')
  }

  const handleSave = async () => {
    if (!name.trim()) { showGlobalToast('请输入愿望名称'); return }
    if (!cost || parseInt(cost) <= 0) { showGlobalToast('请输入有效积分'); return }

    if (editing) {
      await updateWish({ ...editing, name: name.trim(), cost: parseInt(cost), emoji })
      showGlobalToast('愿望已更新')
    } else {
      await addWish({ name: name.trim(), cost: parseInt(cost), emoji })
      showGlobalToast('愿望创建成功')
    }
    clearForm()
  }

  const handleExchange = async (wish) => {
    const success = await exchangeWish(wish)
    if (success) {
      showGlobalToast('兑换成功！')
    } else {
      showGlobalToast('积分不足，继续加油哦')
    }
  }

  const handleDelete = async () => {
    if (showDeleteConfirm) {
      await deleteWish(showDeleteConfirm)
      showGlobalToast('已删除')
      setShowDeleteConfirm(null)
    }
  }

  return (
    <div className="subpage">
      <div className="subpage-header">
        <button className="back-btn" onClick={onClose}>‹</button>
        <span className="subpage-title">🎁 愿望兑换</span>
      </div>
      <div className="subpage-body">
        {/* 表单 */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ fontSize: 32, cursor: 'pointer' }} onClick={() => setShowEmojiPicker(true)}>{emoji}</div>
            <input className="form-input" placeholder="愿望名称" value={name} onChange={e => setName(e.target.value)} maxLength={20} style={{ flex: 1 }} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">所需积分</label>
            <input className="form-input" type="number" min="1" placeholder="100" value={cost} onChange={e => setCost(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="btn btn-primary btn-block" onClick={handleSave}>
              {editing ? '保存修改' : '添加愿望'}
            </button>
            {editing && <button className="btn btn-outline" onClick={clearForm}>取消</button>}
          </div>
        </div>

        {/* Tab */}
        <div className="tab-bar" style={{ marginBottom: 12 }}>
          <button className={`tab-bar-item${tab === 'available' ? ' active' : ''}`} onClick={() => setTab('available')}>
            可兑换 ({availableWishes.length})
          </button>
          <button className={`tab-bar-item${tab === 'exchanged' ? ' active' : ''}`} onClick={() => setTab('exchanged')}>
            已兑换 ({exchangedWishes.length})
          </button>
        </div>

        {tab === 'available' && (
          <>
            {availableWishes.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🎁</div>
                <div className="empty-text">还没有愿望，在上方添加吧</div>
              </div>
            ) : (
              availableWishes.map(wish => (
                <div key={wish.id} className="list-item" onClick={() => startEdit(wish)}>
                  <div className="item-icon" style={{ background: 'rgba(242,184,198,0.2)' }}>{wish.emoji || '🎁'}</div>
                  <div className="item-content">
                    <div className="item-title">{wish.name}</div>
                    <div className="item-sub">需要 {wish.cost} 积分</div>
                  </div>
                  <div className="item-right" style={{ gap: 4 }}>
                    <button className="btn btn-sm btn-primary"
                      onClick={async (e) => { e.stopPropagation(); await handleExchange(wish) }}>
                      兑换
                    </button>
                    <button className="btn btn-sm btn-danger"
                      onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(wish.id) }}>
                      删除
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {tab === 'exchanged' && (
          <>
            {exchangedWishes.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🎉</div>
                <div className="empty-text">还没有兑换过的愿望</div>
              </div>
            ) : (
              exchangedWishes.map(wish => (
                <div key={wish.id} className="list-item completed">
                  <div className="item-icon" style={{ background: 'rgba(184,226,208,0.2)' }}>{wish.emoji || '🎁'}</div>
                  <div className="item-content">
                    <div className="item-title" style={{ textDecoration: 'line-through' }}>{wish.name}</div>
                    <div className="item-sub">已兑换</div>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>

      {showEmojiPicker && <EmojiPicker onSelect={setEmoji} onClose={() => setShowEmojiPicker(false)} />}
      {showDeleteConfirm && (
        <ConfirmModal message="删除该愿望？" icon="⚠️"
          onConfirm={handleDelete} onCancel={() => setShowDeleteConfirm(null)} />
      )}
    </div>
  )
}
