import React, { useState } from 'react'
import { useApp, showGlobalToast } from '../store/store'
import IconPicker from '../components/IconPicker'
import Icon from '../components/Icon'
import ConfirmModal from '../components/ConfirmModal'
import { DEFAULT_EMOJI, DEFAULT_COLOR, DEFAULT_CATEGORY_ICON, MACARON_COLORS } from '../utils/constants'
import { macaronKeyOf } from '../utils/palette'

export default function CategoryManage({ onClose }) {
  const { categories, addCategory, updateCategory, deleteCategory } = useApp()
  const [tab, setTab] = useState('expense')
  const [editing, setEditing] = useState(null)
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState(DEFAULT_EMOJI)
  const [icon, setIcon] = useState(DEFAULT_CATEGORY_ICON)
  const [color, setColor] = useState(DEFAULT_COLOR)
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const filteredCats = categories.filter(c => c.type === tab)

  const startEdit = (cat) => {
    setEditing(cat)
    setName(cat.name)
    setEmoji(cat.emoji || DEFAULT_EMOJI)
    setIcon(cat.icon || DEFAULT_CATEGORY_ICON)
    setColor(cat.color)
  }

  const handleIconSelect = ({ type, value }) => {
    if (type === 'icon') { setIcon(value); setEmoji('') }
    else { setEmoji(value); setIcon(null) }
  }

  const handleSave = async () => {
    if (!name.trim()) { showGlobalToast('请输入分类名称'); return }
    if (name.trim().length > 10) { showGlobalToast('名称不能超过10个字'); return }

    if (editing) {
      await updateCategory({ ...editing, name: name.trim(), emoji, icon, color })
      showGlobalToast('分类已更新')
    } else {
      await addCategory({ name: name.trim(), emoji, icon, color, type: tab })
      showGlobalToast('分类创建成功')
    }
    setEditing(null)
    setName('')
    setEmoji(DEFAULT_EMOJI)
    setIcon(DEFAULT_CATEGORY_ICON)
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="icon-preview" onClick={() => setShowIconPicker(true)} title="点击更换图标">
              <Icon name={icon} emoji={emoji} size={28} />
            </div>
            <input className="form-input" style={{ flex: 1 }} placeholder="分类名称" value={name} onChange={e => setName(e.target.value)} maxLength={10} />
          </div>

          <div className="section-header" style={{ margin: '12px 0 8px' }}>
            <span className="section-title" style={{ fontSize: 13 }}>主题色</span>
          </div>
          <div className="color-strip">
            {MACARON_COLORS.map(item => (
              <button
                key={item}
                type="button"
                className={`color-strip-item${color === item ? ' active' : ''}`}
                style={{ background: item }}
                aria-label={`选择颜色 ${item}`}
                aria-pressed={color === item}
                onClick={() => setColor(item)}
              />
            ))}
          </div>

          <button className="btn btn-primary btn-block" style={{ marginTop: 14 }} onClick={handleSave}>
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
          filteredCats.map((cat, idx) => (
            <div key={cat.id} className="list-item" onClick={() => startEdit(cat)}>
              <div className="item-icon" data-mc={macaronKeyOf(cat.color, idx)}>
                <Icon name={cat.icon} emoji={cat.emoji} size={24} />
              </div>
              <div className="item-content">
                <div className="item-title">{cat.name}</div>
              </div>
              <button className="btn btn-sm btn-danger" onClick={(e) => { e.stopPropagation(); confirmDelete(cat) }}>删除</button>
            </div>
          ))
        )}
      </div>

      {showIconPicker && (
        <IconPicker
          current={icon ? { type: 'icon', value: icon } : { type: 'emoji', value: emoji }}
          onSelect={handleIconSelect}
          onClose={() => setShowIconPicker(false)}
        />
      )}
      {showDeleteConfirm && (
        <ConfirmModal
          message="删除后历史账单将保留，归类为「其他」，是否确认删除？"
          icon="⚠️" onConfirm={handleDelete} onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  )
}
