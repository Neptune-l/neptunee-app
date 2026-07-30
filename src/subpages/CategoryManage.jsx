import React, { useState } from 'react'
import { useApp, showGlobalToast } from '../store/store'
import EmojiPicker from '../components/EmojiPicker'
import ColorPicker from '../components/ColorPicker'
import ConfirmModal from '../components/ConfirmModal'
import { DEFAULT_EMOJI, DEFAULT_COLOR } from '../utils/constants'

export default function CategoryManage({ onClose }) {
  const { categories, addCategory, updateCategory, deleteCategory } = useApp()
  const [tab, setTab] = useState('expense')
  const [editing, setEditing] = useState(null)
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState(DEFAULT_EMOJI)
  const [color, setColor] = useState(DEFAULT_COLOR)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const filteredCats = categories.filter(c => c.type === tab)

  const startEdit = (cat) => {
    setEditing(cat)
    setName(cat.name)
    setEmoji(cat.emoji)
    setColor(cat.color)
  }

  const handleSave = async () => {
    if (!name.trim()) { showGlobalToast('请输入分类名称'); return }
    if (name.trim().length > 10) { showGlobalToast('名称不能超过10个字'); return }

    if (editing) {
      await updateCategory({ ...editing, name: name.trim(), emoji, color })
      showGlobalToast('分类已更新')
    } else {
      await addCategory({ name: name.trim(), emoji, color, type: tab })
      showGlobalToast('分类创建成功')
    }
    setEditing(null)
    setName('')
    setEmoji(DEFAULT_EMOJI)
    setColor(DEFAULT_COLOR)
  }

  const confirmDelete = (cat) => {
    setDeleteTarget(cat)
    setShowDeleteConfirm(true)
  }

  const handleDelete = async () => {
    if (deleteTarget) {
      await deleteCategory(deleteTarget.id)
      showGlobalToast('分类已删除')
      setShowDeleteConfirm(false)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="subpage">
      <div className="subpage-header">
        <button className="back-btn" onClick={onClose}>‹</button>
        <span className="subpage-title">分类管理</span>
      </div>

      <div className="subpage-body">
        <div className="tab-bar">
          <button className={`tab-bar-item${tab === 'expense' ? ' active' : ''}`} onClick={() => setTab('expense')}>支出</button>
          <button className={`tab-bar-item${tab === 'income' ? ' active' : ''}`} onClick={() => setTab('income')}>收入</button>
        </div>

        {/* 新建/编辑区 */}
        <div className="card" style={{ marginTop: 12, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ fontSize: 32, cursor: 'pointer' }} onClick={() => setShowEmojiPicker(true)}>{emoji}</div>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: color, cursor: 'pointer', flexShrink: 0 }} onClick={() => setShowColorPicker(true)} />
            <input className="form-input" style={{ flex: 1 }} placeholder="分类名称" value={name} onChange={e => setName(e.target.value)} maxLength={10} />
          </div>
          <button className="btn btn-primary btn-block" onClick={handleSave}>
            {editing ? '保存修改' : '添加分类'}
          </button>
        </div>

        {/* 分类列表 */}
        {filteredCats.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📁</div>
            <div className="empty-text">暂无分类，在上方添加吧</div>
          </div>
        ) : (
          filteredCats.map(cat => (
            <div key={cat.id} className="list-item" onClick={() => startEdit(cat)}>
              <div className="item-icon" style={{ background: `${cat.color}33` }}>{cat.emoji}</div>
              <div className="item-content">
                <div className="item-title">{cat.name}</div>
              </div>
              <button className="btn btn-sm btn-danger" onClick={(e) => { e.stopPropagation(); confirmDelete(cat) }}>删除</button>
            </div>
          ))
        )}
      </div>

      {showEmojiPicker && <EmojiPicker onSelect={setEmoji} onClose={() => setShowEmojiPicker(false)} />}
      {showColorPicker && <ColorPicker currentColor={color} onSelect={setColor} onClose={() => setShowColorPicker(false)} />}
      {showDeleteConfirm && (
        <ConfirmModal
          message="删除后历史账单将保留，归类为「其他」，是否确认删除？"
          icon="⚠️" onConfirm={handleDelete} onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  )
}
