import React, { useState, useMemo } from 'react'
import { useApp } from '../store/store'
import { getMonthRange } from '../utils/date'
import BillDetail from './BillDetail'

export default function CategoryBills({ categoryId, viewDate, onClose }) {
  const { bills, categories } = useApp()
  const [tab, setTab] = useState('month')
  const [editingBill, setEditingBill] = useState(null)

  const cat = categories.find(c => c.id === categoryId)
  const monthRange = getMonthRange(viewDate)

  const filteredBills = useMemo(() => {
    let list = bills.filter(b => b.categoryId === categoryId)
    if (tab === 'month') {
      list = list.filter(b => b.date >= monthRange.firstDay && b.date <= monthRange.lastDay)
    }
    return list.sort((a, b) => b.date.localeCompare(a.date) || (b.createTime - a.createTime))
  }, [bills, categoryId, tab, monthRange])

  const totalAmount = useMemo(() =>
    filteredBills.reduce((s, b) => s + b.amount, 0),
    [filteredBills]
  )

  const fmtMoney = (n) => `¥${n.toFixed(2)}`

  return (
    <div className="subpage">
      <div className="subpage-header">
        <button className="back-btn" onClick={onClose}>‹</button>
        <span className="subpage-title">{cat?.emoji} {cat?.name}</span>
      </div>

      <div className="subpage-body">
        <div className="tab-bar">
          <button className={`tab-bar-item${tab === 'month' ? ' active' : ''}`} onClick={() => setTab('month')}>当月账单</button>
          <button className={`tab-bar-item${tab === 'all' ? ' active' : ''}`} onClick={() => setTab('all')}>全部历史</button>
        </div>

        <div className="card" style={{ marginTop: 12, marginBottom: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>总金额</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--primary)' }}>{fmtMoney(totalAmount)}</div>
        </div>

        {filteredBills.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📄</div>
            <div className="empty-text">暂无账单记录</div>
          </div>
        ) : (
          filteredBills.map(bill => (
            <div key={bill.id} className="list-item" onClick={() => setEditingBill(bill)}>
              <div className="item-icon" style={{ background: `${cat?.color || '#F2B8C6'}33` }}>
                {cat?.emoji || '💰'}
              </div>
              <div className="item-content">
                <div className="item-title">{bill.date}</div>
                {bill.remark && <div className="item-sub">{bill.remark}</div>}
              </div>
              <div className={`item-score ${bill.type === 'income' ? 'positive' : 'negative'}`}>
                {bill.type === 'income' ? '+' : '-'}{fmtMoney(bill.amount)}
              </div>
            </div>
          ))
        )}
      </div>

      {editingBill && (
        <BillDetail bill={editingBill} onClose={() => setEditingBill(null)} />
      )}
    </div>
  )
}
