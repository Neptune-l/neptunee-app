import React, { useState } from 'react'
import { useApp, showGlobalToast } from '../store/store'
import { getToday } from '../utils/date'

export default function BillNew({ onClose }) {
  const { addBill, categories } = useApp()
  const [type, setType] = useState('expense')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [date, setDate] = useState(getToday())
  const [remark, setRemark] = useState('')

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

    await addBill({
      type,
      amount: Math.round(numAmount * 100) / 100,
      categoryId,
      date,
      remark: remark.trim(),
    })
    showGlobalToast('记账成功')
    onClose()
  }

  const handleNumberClick = (n) => {
    if (n === '.') {
      if (amount.includes('.')) return
      if (amount === '') setAmount('0.')
      else setAmount(amount + '.')
    } else {
      if (amount.includes('.') && amount.split('.')[1].length >= 2) return
      if (amount === '0' && n !== '.') setAmount(String(n))
      else setAmount(amount + String(n))
    }
  }

  const handleDelete = () => {
    setAmount(amount.slice(0, -1))
  }

  return (
    <div className="subpage">
      <div className="subpage-header">
        <button className="back-btn" onClick={onClose}>‹</button>
        <span className="subpage-title">记一笔</span>
        <button className="btn btn-primary btn-sm" onClick={handleSave}>保存</button>
      </div>

      <div className="subpage-body" style={{ display: 'flex', flexDirection: 'column' }}>
        {/* 收支切换 */}
        <div className="tab-bar" style={{ marginBottom: 16 }}>
          <button className={`tab-bar-item${type === 'expense' ? ' active' : ''}`} onClick={() => { setType('expense'); setCategoryId('') }}>
            支出
          </button>
          <button className={`tab-bar-item${type === 'income' ? ' active' : ''}`} onClick={() => { setType('income'); setCategoryId('') }}>
            收入
          </button>
        </div>

        {/* 金额输入 */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <span style={{ fontSize: 28, fontWeight: 700, color: type === 'expense' ? 'var(--danger)' : 'var(--success)' }}>
              {type === 'expense' ? '-' : '+'}
            </span>
            <span className="amount-input">{amount || '0'}</span>
          </div>
        </div>

        {/* 分类网格 */}
        <div className="section-header">
          <span className="section-title">选择分类</span>
        </div>
        {filteredCats.length === 0 ? (
          <div className="empty-state" style={{ padding: 20 }}>
            <div className="empty-text">暂无分类，先去管理分类添加吧</div>
          </div>
        ) : (
          <div className="category-grid" style={{ marginBottom: 16 }}>
            {filteredCats.map(cat => (
              <div
                key={cat.id}
                className={`category-grid-item${categoryId === cat.id ? ' selected' : ''}`}
                onClick={() => setCategoryId(cat.id)}
              >
                <div className="cat-emoji">{cat.emoji}</div>
                <div className="cat-name">{cat.name}</div>
              </div>
            ))}
          </div>
        )}

        {/* 日期和备注 */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">日期</label>
            <input className="form-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
        </div>

        <div className="card">
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">备注（选填）</label>
            <input className="form-input" placeholder="添加备注..." value={remark} onChange={e => setRemark(e.target.value)} maxLength={50} />
          </div>
        </div>

        {/* 数字键盘 */}
        <div style={{ marginTop: 'auto', paddingTop: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0].map(n => (
              <button key={n} className="btn" style={{ height: 48, fontSize: 22, background: 'var(--border)', borderRadius: 'var(--radius-btn)' }}
                onClick={() => handleNumberClick(n)}>
                {n}
              </button>
            ))}
            <button className="btn" style={{ height: 48, fontSize: 18, background: 'var(--danger)', color: 'white', borderRadius: 'var(--radius-btn)' }}
              onClick={handleDelete}>
              删除
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
