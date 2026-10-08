import React, { useMemo, useState } from 'react'
import { useApp, showGlobalToast } from '../store/store'
import { fmtMoney, round2, parseAmount, diffDays } from '../utils/money'
import { getToday, getFriendlyDate } from '../utils/date'
import ConfirmModal from '../components/ConfirmModal'
import SavingsEdit from './SavingsEdit'

/** 存钱计划详情：进度、存入/取出、流水 */
export default function SavingsDetail({ goalId, onClose }) {
  const {
    savingsGoals, savingsByGoal, balance,
    addSavingsRecord, deleteSavingsRecord, deleteSavingsGoal, toggleSavingsDone,
  } = useApp()

  const goal = savingsGoals.find(g => g.id === goalId)
  const bucket = savingsByGoal[goalId] || { saved: 0, records: [] }
  const today = getToday()

  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(today)
  const [remark, setRemark] = useState('')
  const [showEdit, setShowEdit] = useState(false)
  const [pending, setPending] = useState(null)   // 超出余额时的待确认操作
  const [showDelete, setShowDelete] = useState(false)

  const view = useMemo(() => {
    const saved = bucket.saved
    const target = goal?.target || 0
    const remaining = round2(Math.max(0, target - saved))
    const pct = target > 0 ? Math.min(1, saved / target) : 0
    const records = bucket.records
    const firstDate = records.length ? records[records.length - 1].date : null
    const elapsed = firstDate ? Math.max(1, diffDays(firstDate, today) + 1) : 1
    const avgPerDay = saved > 0 ? saved / elapsed : 0
    const daysNeeded = avgPerDay > 0 ? Math.ceil(remaining / avgPerDay) : null
    let eta = null
    if (daysNeeded !== null && daysNeeded > 0) {
      const d = new Date(`${today}T00:00:00`)
      d.setDate(d.getDate() + daysNeeded)
      eta = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    } else if (remaining === 0) {
      eta = today
    }
    let deadlineLeft = null
    let perDayNeeded = null
    if (goal?.deadline) {
      deadlineLeft = diffDays(today, goal.deadline)
      if (deadlineLeft > 0 && remaining > 0) perDayNeeded = round2(remaining / deadlineLeft)
    }
    return { saved, target, remaining, pct, elapsed, avgPerDay, daysNeeded, eta, deadlineLeft, perDayNeeded, firstDate }
  }, [bucket, goal, today])

  if (!goal) {
    return (
      <div className="subpage">
        <div className="subpage-header">
          <button className="back-btn" onClick={onClose}>‹</button>
          <span className="subpage-title">存钱计划</span>
        </div>
        <div className="subpage-body">
          <div className="empty-state">
            <div className="empty-icon">🐷</div>
            <div className="empty-text">该计划已不存在</div>
          </div>
        </div>
      </div>
    )
  }

  const R = 52
  const C = 2 * Math.PI * R

  const doSaveMoney = async (type) => {
    const n = parseAmount(amount)
    if (!(n > 0)) { showGlobalToast('请输入有效的金额'); return }
    if (goal.status === 'done' && type === 'in') {
      showGlobalToast('计划已完成，先「继续存」再加钱吧')
      return
    }
    await addSavingsRecord(goalId, { amount: n, type, date, remark })
    setAmount(''); setRemark(''); setDate(today)
    showGlobalToast(type === 'in' ? `已存入 ${fmtMoney(n)}` : `已取出 ${fmtMoney(n)}`)
  }

  const handleDeposit = () => {
    const n = parseAmount(amount)
    if (!(n > 0)) { showGlobalToast('请输入有效的金额'); return }
    if (n > balance) {
      setPending({ type: 'in', label: `存钱金额 ${fmtMoney(n)} 超过当前可用余额 ${fmtMoney(balance)}，存入后余额会变成负数。仍要继续吗？` })
      return
    }
    doSaveMoney('in')
  }

  const handleWithdraw = () => {
    const n = parseAmount(amount)
    if (!(n > 0)) { showGlobalToast('请输入有效的金额'); return }
    if (n > view.saved) {
      setPending({ type: 'out', label: `取出金额 ${fmtMoney(n)} 超过已存金额 ${fmtMoney(view.saved)}，取出后存钱罐会变成负数。仍要继续吗？` })
      return
    }
    doSaveMoney('out')
  }

  const handleDeleteGoal = async () => {
    await deleteSavingsGoal(goalId)
    showGlobalToast('计划已删除')
    setShowDelete(false)
    onClose()
  }

  return (
    <div className="subpage">
      <div className="subpage-header">
        <button className="back-btn" onClick={onClose}>‹</button>
        <span className="subpage-title">{goal.emoji} {goal.name}</span>
        <button className="btn btn-outline btn-sm" onClick={() => setShowEdit(true)}>编辑</button>
      </div>

      <div className="subpage-body">
        {/* 进度环 */}
        <div className="savings-hero">
          <div className="savings-ring">
            <svg viewBox="0 0 124 124" width="124" height="124" aria-hidden="true">
              <circle cx="62" cy="62" r={R} fill="none" stroke="var(--border)" strokeWidth="10" />
              <circle
                cx="62" cy="62" r={R} fill="none"
                stroke={goal.color} strokeWidth="10" strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={C * (1 - view.pct)}
                transform="rotate(-90 62 62)"
                style={{ transition: 'stroke-dashoffset 0.4s ease' }}
              />
            </svg>
            <div className="savings-ring-center">
              <div className="savings-ring-pct">{Math.round(view.pct * 100)}%</div>
              <div className="savings-ring-emoji">{goal.emoji}</div>
            </div>
          </div>
          <div className="savings-hero-info">
            <div className="savings-hero-saved">{fmtMoney(view.saved)}</div>
            <div className="savings-hero-target">目标 {fmtMoney(view.target)}</div>
            <div className="savings-hero-remain">
              {view.remaining > 0 ? `还差 ${fmtMoney(view.remaining)}` : '🎉 已达成目标'}
            </div>
            {goal.status === 'done' && <div className="savings-done-tag">已完成</div>}
          </div>
        </div>

        {goal.note && <div className="assets-hint" style={{ padding: '0 4px 12px' }}>📝 {goal.note}</div>}

        {/* 数据面板 */}
        <div className="savings-stats">
          <div className="savings-stat">
            <div className="savings-stat-value">{view.elapsed} 天</div>
            <div className="savings-stat-label">已坚持</div>
          </div>
          <div className="savings-stat">
            <div className="savings-stat-value">{fmtMoney(round2(view.avgPerDay))}</div>
            <div className="savings-stat-label">日均存入</div>
          </div>
          <div className="savings-stat">
            <div className="savings-stat-value">
              {goal.deadline
                ? (view.deadlineLeft > 0 ? `${view.deadlineLeft} 天` : '已到期')
                : (view.eta ? `≈${view.eta.slice(5)}` : '—')}
            </div>
            <div className="savings-stat-label">{goal.deadline ? '距截止' : '预计达成'}</div>
          </div>
        </div>

        {goal.deadline && view.perDayNeeded !== null && (
          <div className="savings-tip">
            想按期完成，接下来每天要存 <b>{fmtMoney(view.perDayNeeded)}</b>
          </div>
        )}
        {goal.deadline && view.deadlineLeft <= 0 && view.remaining > 0 && (
          <div className="savings-tip savings-tip-warn">
            截止日期已过，还差 {fmtMoney(view.remaining)}
          </div>
        )}

        {/* 存取 */}
        <div className="section-header" style={{ marginTop: 16 }}>
          <span className="section-title">存入 / 取出</span>
          <span className="section-sub">可用余额 {fmtMoney(balance)}</span>
        </div>
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="form-group" style={{ margin: 0 }}>
            <input
              className="form-input"
              type="number"
              step="0.01"
              inputMode="decimal"
              placeholder="金额"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
          </div>
          <div className="savings-quick-amounts">
            {[50, 100, 200, 500, 1000].map(v => (
              <button key={v} type="button" className="savings-quick-amount" onClick={() => setAmount(String(v))}>
                +{v}
              </button>
            ))}
            <button type="button" className="savings-quick-amount" onClick={() => setAmount(String(round2(balance)))}>
              全部余额
            </button>
          </div>
          <div className="savings-form-row">
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">日期</label>
              <input className="form-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
          </div>
          <div className="form-group" style={{ margin: '12px 0 0' }}>
            <input
              className="form-input"
              placeholder="备注（选填）"
              value={remark}
              onChange={e => setRemark(e.target.value)}
              maxLength={30}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="btn btn-primary btn-block" onClick={handleDeposit}>存入</button>
            <button className="btn btn-outline btn-block" onClick={handleWithdraw}>取出</button>
          </div>
        </div>

        {/* 流水 */}
        <div className="section-header">
          <span className="section-title">流水记录</span>
          <span className="section-sub">{bucket.records.length} 笔</span>
        </div>
        {bucket.records.length === 0 ? (
          <div className="empty-state" style={{ padding: 24 }}>
            <div className="empty-text">还没有存取记录</div>
          </div>
        ) : (
          bucket.records.map(rec => (
            <div key={rec.id} className="list-item">
              <div className="item-icon" style={{ background: rec.type === 'in' ? 'var(--success-soft)' : 'var(--danger-soft)' }}>
                {rec.type === 'in' ? '⬇️' : '⬆️'}
              </div>
              <div className="item-content">
                <div className="item-title">{rec.type === 'in' ? '存入' : '取出'}{rec.remark ? ` · ${rec.remark}` : ''}</div>
                <div className="item-sub">{getFriendlyDate(rec.date)}</div>
              </div>
              <div className={`item-score ${rec.type === 'in' ? 'positive' : 'negative'}`}>
                {rec.type === 'in' ? '+' : '-'}{fmtMoney(rec.amount)}
              </div>
              <button
                className="icon-btn"
                aria-label="删除这条记录"
                onClick={async () => { await deleteSavingsRecord(rec.id); showGlobalToast('已删除该记录') }}
              >
                ✕
              </button>
            </div>
          ))
        )}

        {/* 底部操作 */}
        <div style={{ marginTop: 20 }}>
          <button className="btn btn-outline btn-block" onClick={async () => {
            const next = await toggleSavingsDone(goal)
            showGlobalToast(next.status === 'done' ? '已标记完成 🎉' : '已重新开启')
          }}>
            {goal.status === 'done' ? '继续存' : '标记完成'}
          </button>
          <button className="btn btn-outline btn-block mt-8" onClick={() => setShowEdit(true)}>编辑计划</button>
          <button className="btn btn-outline btn-block mt-8" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
            onClick={() => setShowDelete(true)}>
            删除计划
          </button>
        </div>

        <div style={{ height: 40 }} />
      </div>

      {showEdit && <SavingsEdit goal={goal} onClose={() => setShowEdit(false)} />}

      {pending && (
        <ConfirmModal
          message={pending.label}
          icon="⚠️"
          onConfirm={() => { const t = pending.type; setPending(null); doSaveMoney(t) }}
          onCancel={() => setPending(null)}
        />
      )}

      {showDelete && (
        <ConfirmModal
          message={`删除「${goal.name}」及其全部流水记录？此操作不可恢复。`}
          icon="⚠️"
          onConfirm={handleDeleteGoal}
          onCancel={() => setShowDelete(false)}
        />
      )}
    </div>
  )
}
