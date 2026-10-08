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
    /* 半屏抽屉：记一笔不再整页跳走，存完即回到账单列表 */
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-grip" />
        <div className="sheet-header">
          <span className="sheet-title">记一笔</span>
          <button type="button" className="sheet-close" aria-label="关闭" onClick={onClose}>✕</button>
          <button className="btn btn-primary btn-sm" onClick={handleSave}>保存</button>
        </div>

        <div className="sheet-body">
          {/* 收支切换 */}
          <div className="tab-bar" style={{ marginBottom: 12 }}>
            <button className={`tab-bar-item${type === 'expense' ? ' active' : ''}`} onClick={() => { setType('expense'); setCategoryId('') }}>
              支出
            </button>
            <button className={`tab-bar-item${type === 'income' ? ' active' : ''}`} onClick={() => { setType('income'); setCategoryId('') }}>
              收入
            </button>
          </div>

          {/* 金额：去掉外层卡片，省 30px 纵向空间 */}
          <div style={{ textAlign: 'center', padding: '2px 0 12px' }}>
            <span style={{ fontSize: 26, fontWeight: 700, color: type === 'expense' ? 'var(--danger)' : 'var(--success)' }}>
              {type === 'expense' ? '-' : '+'}
            </span>
            <span className="amount-input">{amount || '0'}</span>
          </div>

          {/* 分类：胶囊流式，分类变多也只是多换几行 */}
          <div className="section-header">
            <span className="section-title">选择分类</span>
          </div>
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

          {/* 日期 + 备注并排，原来两张卡合成一行 */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
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

          {/* 数字键盘 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0].map(n => (
              <button key={n} className="btn" style={{ height: 46, fontSize: 21, background: 'var(--border)', borderRadius: 'var(--radius-btn)' }}
                onClick={() => handleNumberClick(n)}>
                {n}
              </button>
            ))}
            <button className="btn" style={{ height: 46, fontSize: 17, background: 'var(--danger)', color: 'white', borderRadius: 'var(--radius-btn)' }}
              onClick={handleDelete}>
              删除
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
