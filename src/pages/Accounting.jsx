import React, { useState, useMemo } from 'react'
import { useApp, showGlobalToast } from '../store/store'
import { getFriendlyDate, isToday, getToday, getMonthRange, getMonthName } from '../utils/date'
import CalendarModal from '../components/CalendarModal'
import ConfirmModal from '../components/ConfirmModal'
import BillNew from '../subpages/BillNew'
import BillDetail from '../subpages/BillDetail'
import CategoryManage from '../subpages/CategoryManage'
import CategoryBills from '../subpages/CategoryBills'

export default function Accounting({ openSubpage }) {
  const { loaded, bills, categories, viewDate, setViewDate } = useApp()
  const [showCalendar, setShowCalendar] = useState(false)
  const [tab, setTab] = useState('daily')
  const [editingBill, setEditingBill] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState(null)

  const today = getToday()
  const isViewToday = viewDate === today
  const monthRange = getMonthRange(viewDate)

  // 当日账单
  const dayBills = useMemo(() =>
    bills.filter(b => b.date === viewDate),
    [bills, viewDate]
  )
  const dayIncome = useMemo(() =>
    dayBills.filter(b => b.type === 'income').reduce((s, b) => s + b.amount, 0),
    [dayBills]
  )
  const dayExpense = useMemo(() =>
    dayBills.filter(b => b.type === 'expense').reduce((s, b) => s + b.amount, 0),
    [dayBills]
  )

  // 月度账单
  const monthBills = useMemo(() =>
    bills.filter(b => b.date >= monthRange.firstDay && b.date <= monthRange.lastDay),
    [bills, monthRange]
  )
  const monthIncome = useMemo(() =>
    monthBills.filter(b => b.type === 'income').reduce((s, b) => s + b.amount, 0),
    [monthBills]
  )
  const monthExpense = useMemo(() =>
    monthBills.filter(b => b.type === 'expense').reduce((s, b) => s + b.amount, 0),
    [monthBills]
  )

  const getCategory = (catId) => categories.find(c => c.id === catId)

  // 月度分类汇总
  const monthCategorySummary = useMemo(() => {
    const map = {}
    monthBills.forEach(b => {
      if (!map[b.categoryId]) {
        map[b.categoryId] = { income: 0, expense: 0 }
      }
      if (b.type === 'income') map[b.categoryId].income += b.amount
      else map[b.categoryId].expense += b.amount
    })
    return Object.entries(map).map(([catId, sums]) => ({
      catId,
      cat: getCategory(catId),
      ...sums,
    })).filter(x => x.cat)
  }, [monthBills, categories])

  const fmtMoney = (n) => `¥${n.toFixed(2)}`

  if (!loaded) return <div className="loading">加载中...</div>

  return (
    <>
      <div className="page-content">
        {/* 顶部 */}
        <div className="top-bar">
          <div className="top-bar-left">
            <span className="date-display" onClick={() => setShowCalendar(true)}>
              {getFriendlyDate(viewDate)}
              {!isViewToday && (
                <span className="back-today-btn" onClick={(e) => { e.stopPropagation(); setViewDate(today) }}>
                  回到今天
                </span>
              )}
            </span>
          </div>
          <div className="top-bar-right">
            <button className="btn btn-sm btn-outline" onClick={() => openSubpage(CategoryManage)}>
              分类管理
            </button>
          </div>
        </div>

        {/* Tab */}
        <div className="tab-bar">
          <button className={`tab-bar-item${tab === 'daily' ? ' active' : ''}`} onClick={() => setTab('daily')}>
            当日账单
          </button>
          <button className={`tab-bar-item${tab === 'monthly' ? ' active' : ''}`} onClick={() => setTab('monthly')}>
            月度概览
          </button>
        </div>

        {tab === 'daily' && (
          <>
            {/* 汇总卡片 */}
            <div className="summary-cards">
              <div className="summary-card">
                <div className="summary-value text-green">{fmtMoney(dayIncome)}</div>
                <div className="summary-label">收入</div>
              </div>
              <div className="summary-card">
                <div className="summary-value text-red">{fmtMoney(dayExpense)}</div>
                <div className="summary-label">支出</div>
              </div>
              <div className="summary-card">
                <div className="summary-value">{fmtMoney(dayIncome - dayExpense)}</div>
                <div className="summary-label">结余</div>
              </div>
            </div>

            {/* 账单列表 */}
            {dayBills.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">💰</div>
                <div className="empty-text">当日还没有账单，点击右下角记一笔吧</div>
              </div>
            ) : (
              dayBills.sort((a, b) => b.createTime - a.createTime).map(bill => {
                const cat = getCategory(bill.categoryId)
                return (
                  <div key={bill.id} className="list-item" onClick={() => setEditingBill(bill)}>
                    <div className="item-icon" style={{ background: `${cat?.color || '#F2B8C6'}33` }}>
                      {cat?.emoji || '💰'}
                    </div>
                    <div className="item-content">
                      <div className="item-title">{cat?.name || '未分类'}</div>
                      {bill.remark && <div className="item-sub">{bill.remark}</div>}
                    </div>
                    <div className={`item-score ${bill.type === 'income' ? 'positive' : 'negative'}`}>
                      {bill.type === 'income' ? '+' : '-'}{fmtMoney(bill.amount)}
                    </div>
                  </div>
                )
              })
            )}
          </>
        )}

        {tab === 'monthly' && (
          <>
            {/* 月度汇总 */}
            <div className="summary-cards">
              <div className="summary-card">
                <div className="summary-value text-green">{fmtMoney(monthIncome)}</div>
                <div className="summary-label">月收入</div>
              </div>
              <div className="summary-card">
                <div className="summary-value text-red">{fmtMoney(monthExpense)}</div>
                <div className="summary-label">月支出</div>
              </div>
              <div className="summary-card">
                <div className="summary-value">{fmtMoney(monthIncome - monthExpense)}</div>
                <div className="summary-label">月结余</div>
              </div>
            </div>

            {/* 分类详情 */}
            <div className="section-header" style={{ marginTop: 8 }}>
              <span className="section-title">支出分类</span>
            </div>
            {monthCategorySummary.filter(s => s.expense > 0).length === 0 ? (
              <div className="empty-state" style={{ padding: 20 }}>
                <div className="empty-text">本月暂无支出</div>
              </div>
            ) : (
              monthCategorySummary.filter(s => s.expense > 0).map(s => {
                const pct = monthExpense > 0 ? (s.expense / monthExpense * 100) : 0
                return (
                  <div key={s.catId} className="list-item" onClick={() => openSubpage(CategoryBills, { categoryId: s.catId, viewDate })}>
                    <div className="item-icon" style={{ background: `${s.cat.color}33` }}>
                      {s.cat.emoji}
                    </div>
                    <div className="item-content">
                      <div className="item-title">{s.cat.name}</div>
                      <div className="progress-bar" style={{ marginTop: 4 }}>
                        <div className="progress-fill" style={{ width: `${pct}%`, background: s.cat.color }} />
                      </div>
                    </div>
                    <div className="item-right" style={{ flexDirection: 'column', alignItems: 'flex-end' }}>
                      <div className="text-red" style={{ fontSize: 14, fontWeight: 500 }}>{fmtMoney(s.expense)}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{pct.toFixed(0)}%</div>
                    </div>
                  </div>
                )
              })
            )}

            <div className="section-header" style={{ marginTop: 16 }}>
              <span className="section-title">收入分类</span>
            </div>
            {monthCategorySummary.filter(s => s.income > 0).length === 0 ? (
              <div className="empty-state" style={{ padding: 20 }}>
                <div className="empty-text">本月暂无收入</div>
              </div>
            ) : (
              monthCategorySummary.filter(s => s.income > 0).map(s => {
                const pct = monthIncome > 0 ? (s.income / monthIncome * 100) : 0
                return (
                  <div key={s.catId} className="list-item" onClick={() => openSubpage(CategoryBills, { categoryId: s.catId, viewDate })}>
                    <div className="item-icon" style={{ background: `${s.cat.color}33` }}>
                      {s.cat.emoji}
                    </div>
                    <div className="item-content">
                      <div className="item-title">{s.cat.name}</div>
                      <div className="progress-bar" style={{ marginTop: 4 }}>
                        <div className="progress-fill" style={{ width: `${pct}%`, background: s.cat.color }} />
                      </div>
                    </div>
                    <div className="item-right" style={{ flexDirection: 'column', alignItems: 'flex-end' }}>
                      <div className="text-green" style={{ fontSize: 14, fontWeight: 500 }}>{fmtMoney(s.income)}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{pct.toFixed(0)}%</div>
                    </div>
                  </div>
                )
              })
            )}
          </>
        )}

        <div style={{ height: 80 }} />
      </div>

      {/* FAB */}
      <button className="fab" onClick={() => openSubpage(BillNew)}>+</button>

      {/* 日历 */}
      {showCalendar && (
        <CalendarModal
          currentDate={viewDate}
          onSelect={(d) => { setViewDate(d); setShowCalendar(false) }}
          onClose={() => setShowCalendar(false)}
        />
      )}

      {/* 编辑账单 */}
      {editingBill && (
        <BillDetail bill={editingBill} onClose={() => setEditingBill(null)} />
      )}
    </>
  )
}
