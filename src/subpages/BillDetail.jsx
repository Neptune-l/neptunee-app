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
    <div className="subpage">
      <div className="subpage-header">
        <button className="back-btn" onClick={onClose}>‹</button>
        <span className="subpage-title">账单详情</span>
        <button className="btn btn-primary btn-sm" onClick={handleSave}>保存</button>
      </div>

      <div className="subpage-body">
        <div className="tab-bar" style={{ marginBottom: 16 }}>
          <button className={`tab-bar-item${type === 'expense' ? ' active' : ''}`} onClick={() => { setType('expense'); setCategoryId('') }}>支出</button>
          <button className={`tab-bar-item${type === 'income' ? ' active' : ''}`} onClick={() => { setType('income'); setCategoryId('') }}>收入</button>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">金额</label>
            <input className="form-input" type="number" step="0.01" min="0" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
        </div>

        <div className="section-header"><span className="section-title">选择分类</span></div>
        <div className="category-grid" style={{ marginBottom: 16 }}>
          {filteredCats.map(cat => (
            <div key={cat.id} className={`category-grid-item${categoryId === cat.id ? ' selected' : ''}`} onClick={() => setCategoryId(cat.id)}>
              <div className="cat-emoji">{cat.emoji}</div>
              <div className="cat-name">{cat.name}</div>
            </div>
          ))}
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">日期</label>
            <input className="form-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">备注</label>
            <input className="form-input" placeholder="添加备注..." value={remark} onChange={e => setRemark(e.target.value)} maxLength={50} />
          </div>
        </div>

        <button className="delete-btn mt-16" onClick={() => setShowDeleteConfirm(true)}>删除该账单</button>
      </div>

      {showDeleteConfirm && (
        <ConfirmModal message="删除后该账单将无法恢复，是否确认？" icon="⚠️"
          onConfirm={handleDelete} onCancel={() => setShowDeleteConfirm(false)} />
      )}
    </div>
  )
}
