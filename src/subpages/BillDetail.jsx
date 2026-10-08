import React, { useState } from 'react'
import { useApp, showGlobalToast } from '../store/store'
import ConfirmModal from '../components/ConfirmModal'

export default function BillDetail({ bill, onClose }) {
  const { updateBill, deleteBill, categories } = useApp()
  const [type, setType] = useState(bill.type)
  const [amount, setAmount] = useState(String(bill.amount))
  const [categoryId, setCategoryId] = useState(bill.categoryId)
  const [date, setDate] = useState(bill.date)
  const [remark, setRemark] = useState(bill.remark || '')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const filteredCats = categories.filter(c => c.type === type)

  const handleSave = async () => {
    const numAmount = parseFloat(amount)
    if (!numAmount || numAmount <= 0) {
      showGlobalToast('请输入有效金额')
      return
    }
    if (!categoryId) {
      showGlobalToast('请选择分类')
      return
    }

    await updateBill({
      ...bill,
      type,
      amount: Math.round(numAmount * 100) / 100,
      categoryId,
      date,
      remark: remark.trim(),
    })
    showGlobalToast('账单已更新')
    onClose()
  }

  const handleDelete = async () => {
    await deleteBill(bill.id)
    showGlobalToast('账单已删除')
    setShowDeleteConfirm(false)
    onClose()
  }

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose}>
        <div className="sheet" onClick={e => e.stopPropagation()}>
          <div className="sheet-grip" />
          <div className="sheet-header">
            <span className="sheet-title">账单详情</span>
            <button type="button" className="sheet-close" aria-label="关闭" onClick={onClose}>✕</button>
            <button className="btn btn-primary btn-sm" onClick={handleSave}>保存</button>
          </div>

          <div className="sheet-body">
            <div className="tab-bar" style={{ marginBottom: 12 }}>
              <button className={`tab-bar-item${type === 'expense' ? ' active' : ''}`} onClick={() => { setType('expense'); setCategoryId('') }}>支出</button>
              <button className={`tab-bar-item${type === 'income' ? ' active' : ''}`} onClick={() => { setType('income'); setCategoryId('') }}>收入</button>
            </div>

            <div className="card" style={{ marginBottom: 12 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">金额</label>
                <input className="form-input" type="number" step="0.01" min="0" value={amount} onChange={e => setAmount(e.target.value)} />
              </div>
            </div>

            <div className="section-header"><span className="section-title">选择分类</span></div>
            {filteredCats.length === 0 ? (
              <div className="empty-state" style={{ padding: 16 }}>
                <div className="empty-text">暂无分类，先去管理分类添加吧</div>
              </div>
            ) : (
              <div className="cat-chips" style={{ marginBottom: 14 }}>
                {filteredCats.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`cat-chip${categoryId === cat.id ? ' selected' : ''}`}
                    aria-pressed={categoryId === cat.id}
                    onClick={() => setCategoryId(cat.id)}
                  >
                    <span className="chip-emoji">{cat.emoji}</span>
                    <span className="chip-name">{cat.name}</span>
                  </button>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <input
                className="form-input"
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                style={{ flex: '0 0 142px', width: 142 }}
              />
              <input
                className="form-input"
                placeholder="备注（选填）"
                value={remark}
                onChange={e => setRemark(e.target.value)}
                maxLength={50}
                style={{ flex: 1, minWidth: 0 }}
              />
            </div>

            <button className="delete-btn" onClick={() => setShowDeleteConfirm(true)}>删除该账单</button>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <ConfirmModal message="删除后该账单将无法恢复，是否确认？" icon="⚠️"
          onConfirm={handleDelete} onCancel={() => setShowDeleteConfirm(false)} />
      )}
    </>
  )
}
