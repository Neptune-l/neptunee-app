import React, { useState } from 'react'
import { useApp, showGlobalToast } from '../store/store'
import { fmtMoney, round2 } from '../utils/money'
import ConfirmModal from '../components/ConfirmModal'

/**
 * 资产管理
 * 录入「我现在一共有多少钱」，之后余额会随记账自动变化。
 * 对外展示：当前总资产 → 减掉存进存钱罐的钱 → 可用余额
 */
export default function AssetsManage({ onClose }) {
  const {
    bills, savingsGoals, totalAssetsBase, assetsTotal, balance,
    totalIncome, totalExpense, savingsNet, setTotalAssetsBase,
  } = useApp()

  const [draft, setDraft] = useState(String(assetsTotal || ''))
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  const isVirgin = totalAssetsBase === 0 && bills.length === 0 && savingsNet === 0
  const goalCount = savingsGoals.filter(g => g.status === 'active').length

  /** 录入的是"当前总资产"，反推期初值，保证录入后 assetsTotal 恰好等于输入 */
  const handleSave = async () => {
    const target = parseFloat(draft)
    if (!Number.isFinite(target)) {
      showGlobalToast('请输入有效金额')
      return
    }
    const base = round2(target - totalIncome + totalExpense)
    await setTotalAssetsBase(base)
    setDraft(String(round2(target)))
    showGlobalToast('总资产已更新')
  }

  const handleReset = async () => {
    await setTotalAssetsBase(0)
    setDraft('')
    setShowResetConfirm(false)
    showGlobalToast('已清零')
  }

  return (
    <div className="subpage">
      <div className="subpage-header">
        <button className="back-btn" onClick={onClose}>‹</button>
        <span className="subpage-title">💰 资产管理</span>
        <button className="btn btn-primary btn-sm" onClick={handleSave}>保存</button>
      </div>

      <div className="subpage-body">
        {/* 余额总览 */}
        <div className="assets-overview">
          <div className="assets-overview-label">可用余额</div>
          <div className="assets-overview-value">{fmtMoney(balance)}</div>
          <div className="assets-overview-sub">
            <span>总资产 {fmtMoney(assetsTotal)}</span>
            <span className="assets-dot">·</span>
            <span>存钱罐 {fmtMoney(savingsNet)}</span>
          </div>
        </div>

        {/* 录入 */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">我现在一共有多少钱（总资产）</label>
            <input
              className="form-input"
              type="number"
              step="0.01"
              inputMode="decimal"
              placeholder="例如 50000"
              value={draft}
              onChange={e => setDraft(e.target.value)}
            />
          </div>
          <div className="assets-hint">
            填入你手上（含存钱罐）实际拥有的钱。之后每记一笔收入或支出，余额都会自动跟着变。
          </div>
          <button className="btn btn-primary btn-block mt-12" onClick={handleSave}>保存总资产</button>
          {!isVirgin && (
            <button className="btn btn-outline btn-block mt-8" onClick={() => setShowResetConfirm(true)}>
              清空资产设置
            </button>
          )}
        </div>

        {/* 推导明细 */}
        <div className="section-header">
          <span className="section-title">余额是怎么算出来的</span>
        </div>
        <div className="card">
          <div className="assets-detail-row">
            <span>期初基准</span>
            <span className="assets-detail-num">{fmtMoney(totalAssetsBase)}</span>
          </div>
          <div className="assets-detail-row">
            <span>累计收入 <em className="assets-detail-count">{bills.filter(b => b.type === 'income').length} 笔</em></span>
            <span className="assets-detail-num text-green">+{fmtMoney(totalIncome)}</span>
          </div>
          <div className="assets-detail-row">
            <span>累计支出 <em className="assets-detail-count">{bills.filter(b => b.type === 'expense').length} 笔</em></span>
            <span className="assets-detail-num text-red">-{fmtMoney(totalExpense)}</span>
          </div>
          <div className="assets-detail-row assets-detail-total">
            <span>当前总资产</span>
            <span className="assets-detail-num">{fmtMoney(assetsTotal)}</span>
          </div>
          <div className="assets-detail-row">
            <span>已存进存钱罐 <em className="assets-detail-count">{goalCount} 个进行中</em></span>
            <span className="assets-detail-num text-red">-{fmtMoney(savingsNet)}</span>
          </div>
          <div className="assets-detail-row assets-detail-total assets-detail-final">
            <span>可用余额</span>
            <span className="assets-detail-num">{fmtMoney(balance)}</span>
          </div>
        </div>

        <div className="assets-hint" style={{ padding: '12px 4px' }}>
          小提示：存钱罐里的钱不算花掉，只是从「可用余额」挪进了存钱罐，总资产不变。
        </div>

        <div style={{ height: 40 }} />
      </div>

      {showResetConfirm && (
        <ConfirmModal
          message="将清空总资产设置，余额会重新按「收入 − 支出」计算。已记录的账单不受影响，是否继续？"
          icon="⚠️"
          onConfirm={handleReset}
          onCancel={() => setShowResetConfirm(false)}
        />
      )}
    </div>
  )
}
