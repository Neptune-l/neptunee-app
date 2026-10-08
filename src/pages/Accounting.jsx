import React, { useState, useMemo } from 'react'
import { useApp, showGlobalToast } from '../store/store'
import { getFriendlyDate, getToday, getMonthRange } from '../utils/date'
import { fmtMoney, fmtMoneyShort, round2 } from '../utils/money'
import CalendarModal from '../components/CalendarModal'
import ConfirmModal from '../components/ConfirmModal'
import BillNew from '../subpages/BillNew'
import BillDetail from '../subpages/BillDetail'
import CategoryManage from '../subpages/CategoryManage'
import CategoryBills from '../subpages/CategoryBills'
import AssetsManage from '../subpages/AssetsManage'
import SavingsEdit from '../subpages/SavingsEdit'
import SavingsDetail from '../subpages/SavingsDetail'
import { macaronKeyOf } from '../utils/palette'

export default function Accounting({ openSubpage }) {
  const {
    loaded, bills, categories, viewDate, setViewDate,
    savingsGoals, savingsByGoal, savingsNet, balance, assetsTotal,
  } = useApp()
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
    bills.filter(b => b.date === viewDate && b.type === 'income').reduce((s, b) => s + b.amount, 0),
    [bills, viewDate]
  )
  const dayExpense = useMemo(() =>
    bills.filter(b => b.date === viewDate && b.type === 'expense').reduce((s, b) => s + b.amount, 0),
    [bills, viewDate]
  )

  // 月度账单
  const monthBills = useMemo(() =>
    bills.filter(b => b.date >= monthRange.firstDay && b.date <= monthRange.lastDay),
    [bills, monthRange.firstDay, monthRange.lastDay]
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

  // 存钱计划：进行中的排前面，其余按创建时间倒序
  const sortedGoals = useMemo(() => {
    return [...savingsGoals].sort((a, b) => {
      const sa = a.status === 'done' ? 1 : 0
      const sb = b.status === 'done' ? 1 : 0
      if (sa !== sb) return sa - sb
      return (b.createdAt || 0) - (a.createdAt || 0)
    })
  }, [savingsGoals])

  const activeGoalCount = useMemo(() => savingsGoals.filter(g => g.status !== 'done').length, [savingsGoals])

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
            <button className="btn btn-sm btn-outline" onClick={() => openSubpage(AssetsManage)}>
              资产
            </button>
            <button className="btn btn-sm btn-outline" onClick={() => openSubpage(CategoryManage)}>
              分类
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
          <button className={`tab-bar-item${tab === 'savings' ? ' active' : ''}`} onClick={() => setTab('savings')}>
            存钱罐
          </button>
        </div>

        {tab === 'daily' && (
          <>
            {/* 一行内联统计：原来三个大盒子占掉四分之一屏 */}
            <div className="stat-inline">
              <div className="si">
                <div className="si-l">收入</div>
                <div className="si-v text-green">{fmtMoney(dayIncome)}</div>
              </div>
              <div className="si">
                <div className="si-l">支出</div>
                <div className="si-v text-red">{fmtMoney(dayExpense)}</div>
              </div>
              <div className="si">
                <div className="si-l">结余</div>
                <div className="si-v">{fmtMoney(round2(dayIncome - dayExpense))}</div>
              </div>
            </div>

            {/* 账单列表：一组一张卡，发丝线分隔 */}
            {dayBills.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">💰</div>
                <div className="empty-text">当日还没有账单，点击右下角记一笔吧</div>
              </div>
            ) : (
              <div className="card-list">
                {[...dayBills].sort((a, b) => b.createTime - a.createTime).map((bill, idx) => {
                  const cat = getCategory(bill.categoryId)
                  return (
                    <div key={bill.id} className="list-item compact" onClick={() => setEditingBill(bill)}>
                      <div className="item-icon" data-mc={macaronKeyOf(cat?.color, idx)}>
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
                })}
              </div>
            )}
          </>
        )}

        {tab === 'monthly' && (
          <>
            {/* 月度汇总 */}
            <div className="stat-inline">
              <div className="si">
                <div className="si-l">月收入</div>
                <div className="si-v text-green">{fmtMoney(monthIncome)}</div>
              </div>
              <div className="si">
                <div className="si-l">月支出</div>
                <div className="si-v text-red">{fmtMoney(monthExpense)}</div>
              </div>
              <div className="si">
                <div className="si-l">月结余</div>
                <div className="si-v">{fmtMoney(round2(monthIncome - monthExpense))}</div>
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
              <div className="card-list">
                {monthCategorySummary.filter(s => s.expense > 0).map((s, idx) => {
                  const pct = monthExpense > 0 ? (s.expense / monthExpense * 100) : 0
                  return (
                    <div key={s.catId} className="list-item compact" data-mc={macaronKeyOf(s.cat.color, idx)} onClick={() => openSubpage(CategoryBills, { categoryId: s.catId, viewDate })}>
                      <div className="item-icon" data-mc={macaronKeyOf(s.cat.color, idx)}>
                        {s.cat.emoji}
                      </div>
                      <div className="item-content">
                        <div className="item-title">{s.cat.name}</div>
                        <div className="progress-bar" style={{ marginTop: 5 }}>
                          <div className="progress-fill" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <div className="item-right" style={{ flexDirection: 'column', alignItems: 'flex-end' }}>
                        <div className="text-red" style={{ fontSize: 14, fontWeight: 500 }}>{fmtMoney(s.expense)}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{pct.toFixed(0)}%</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="section-header" style={{ marginTop: 16 }}>
              <span className="section-title">收入分类</span>
            </div>
            {monthCategorySummary.filter(s => s.income > 0).length === 0 ? (
              <div className="empty-state" style={{ padding: 20 }}>
                <div className="empty-text">本月暂无收入</div>
              </div>
            ) : (
              <div className="card-list">
                {monthCategorySummary.filter(s => s.income > 0).map((s, idx) => {
                  const pct = monthIncome > 0 ? (s.income / monthIncome * 100) : 0
                  return (
                    <div key={s.catId} className="list-item compact" data-mc={macaronKeyOf(s.cat.color, idx)} onClick={() => openSubpage(CategoryBills, { categoryId: s.catId, viewDate })}>
                      <div className="item-icon" data-mc={macaronKeyOf(s.cat.color, idx)}>
                        {s.cat.emoji}
                      </div>
                      <div className="item-content">
                        <div className="item-title">{s.cat.name}</div>
                        <div className="progress-bar" style={{ marginTop: 5 }}>
                          <div className="progress-fill" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <div className="item-right" style={{ flexDirection: 'column', alignItems: 'flex-end' }}>
                        <div className="text-green" style={{ fontSize: 14, fontWeight: 500 }}>{fmtMoney(s.income)}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{pct.toFixed(0)}%</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {tab === 'savings' && (
          <>
            {/* 存钱罐汇总 */}
            <div className="savings-summary" onClick={() => openSubpage(AssetsManage)}>
              <div>
                <div className="savings-summary-label">存钱罐总额</div>
                <div className="savings-summary-value">{fmtMoney(savingsNet)}</div>
              </div>
              <div className="savings-summary-side">
                <div>可用余额 {fmtMoneyShort(balance)}</div>
                <div>总资产 {fmtMoneyShort(assetsTotal)}</div>
              </div>
            </div>

            {sortedGoals.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🐷</div>
                <div className="empty-text">
                  还没有存钱计划<br />给想买的东西建个罐子，一点点存起来吧
                </div>
                <button className="btn btn-primary mt-16" onClick={() => openSubpage(SavingsEdit)}>+ 新建存钱计划</button>
              </div>
            ) : (
              <>
                {sortedGoals.map((goal, idx) => {
                  const saved = savingsByGoal[goal.id]?.saved || 0
                  const pct = goal.target > 0 ? Math.min(1, saved / goal.target) : 0
                  const remaining = round2(Math.max(0, goal.target - saved))
                  const done = goal.status === 'done'
                  return (
                    <div
                      key={goal.id}
                      data-mc={macaronKeyOf(goal.color, idx)}
                      className={`savings-card${done ? ' done' : ''}`}
                      onClick={() => openSubpage(SavingsDetail, { goalId: goal.id })}
                    >
                      <div className="savings-card-head">
                        <div className="savings-card-emoji" data-mc={macaronKeyOf(goal.color, idx)}>{goal.emoji}</div>
                        <div className="savings-card-info">
                          <div className="savings-card-name">
                            {goal.name}
                            {done && <span className="savings-tag-done">已完成</span>}
                          </div>
                          <div className="savings-card-amount">
                            {fmtMoney(saved)} <span className="savings-card-target">/ {fmtMoney(goal.target)}</span>
                          </div>
                        </div>
                        <div className="savings-card-pct" data-mc={macaronKeyOf(goal.color, idx)}>{Math.round(pct * 100)}%</div>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${pct * 100}%` }} />
                      </div>
                      <div className="savings-card-foot">
                        <span>{remaining > 0 ? `还差 ${fmtMoney(remaining)}` : '已达成目标 🎉'}</span>
                        <span>{savingsByGoal[goal.id]?.records.length || 0} 笔记录</span>
                      </div>
                    </div>
                  )
                })}
                <button className="btn btn-outline btn-block mt-8" onClick={() => openSubpage(SavingsEdit)}>
                  + 新建存钱计划
                </button>
              </>
            )}
          </>
        )}

        <div style={{ height: 80 }} />
      </div>

      {/* FAB：账单页记一笔 / 存钱罐页新建计划 */}
      <button
        className="fab"
        aria-label={tab === 'savings' ? '新建存钱计划' : '记一笔'}
        onClick={() => openSubpage(tab === 'savings' ? SavingsEdit : BillNew)}
      >
        +
      </button>

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
