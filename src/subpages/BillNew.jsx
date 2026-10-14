import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useApp, showGlobalToast } from '../store/store'
import { getToday } from '../utils/date'
import { macaronKeyOf } from '../utils/palette'

// 数字键盘最多允许 9 位（含小数点后两位），避免长按乱输
const MAX_DIGITS = 9
const HOLD_MS = 520

export default function BillNew({ onClose }) {
  const { addBill, categories } = useApp()
  const [type, setType] = useState('expense')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [date, setDate] = useState(getToday())
  const [remark, setRemark] = useState('')

  const railRef = useRef(null)
  const holdRef = useRef(null)
  const [railEdges, setRailEdges] = useState({ left: false, right: false })

  const filteredCats = categories.filter(c => c.type === type)

  /* ---- 分类长条：两端渐隐，提示还能往哪边滑 ---- */
  const syncRail = useCallback(() => {
    const el = railRef.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    const left = el.scrollLeft > 4
    const right = max - el.scrollLeft > 4
    // 值没变就复用旧对象，避免每个 scroll 事件都触发重渲染
    setRailEdges(prev => (prev.left === left && prev.right === right) ? prev : { left, right })
  }, [])

  useEffect(() => {
    const el = railRef.current
    if (!el) return
    syncRail()
    const ro = new ResizeObserver(syncRail)
    ro.observe(el)
    return () => ro.disconnect()
  }, [syncRail, type, filteredCats.length])

  // 选中后把这一颗滚到长条中间，避免选了右边那颗却看不见
  const pickCategory = (id) => {
    setCategoryId(id)
    requestAnimationFrame(() => {
      const rail = railRef.current
      const el = rail?.querySelector(`[data-cat-id="${id}"]`)
      if (!rail || !el) return
      rail.scrollTo({
        left: Math.max(0, el.offsetLeft - (rail.clientWidth - el.offsetWidth) / 2),
        behavior: 'smooth',
      })
    })
  }

  /* ---- 数字键盘 ---- */
  const pressDigit = (k) => {
    setAmount(prev => {
      if (k === '.') {
        if (prev.includes('.')) return prev
        return prev === '' ? '0.' : prev + '.'
      }
      const dot = prev.indexOf('.')
      if (dot >= 0 && prev.length - dot - 1 >= 2) return prev      // 小数最多两位
      if (prev === '0') return k                                   // 不留前导零
      if (prev.replace('.', '').length >= MAX_DIGITS) return prev  // 位数封顶
      return prev + k
    })
  }

  // 长按 ⌫ 清空，单击退一位
  const startHold = () => {
    clearTimeout(holdRef.current)
    holdRef.current = setTimeout(() => {
      holdRef.current = 'fired'
      setAmount('')
    }, HOLD_MS)
  }
  const cancelHold = () => {
    if (holdRef.current && holdRef.current !== 'fired') clearTimeout(holdRef.current)
    if (holdRef.current !== 'fired') holdRef.current = null
  }
  const pressBackspace = () => {
    if (holdRef.current === 'fired') { holdRef.current = null; return }  // 长按已清空
    cancelHold()
    setAmount(prev => prev.slice(0, -1))
  }

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

  const switchType = (t) => {
    if (t === type) return
    setType(t)
    setCategoryId('')
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
          <div className="tab-bar" style={{ marginBottom: 10 }}>
            <button className={`tab-bar-item${type === 'expense' ? ' active' : ''}`} onClick={() => switchType('expense')}>
              支出
            </button>
            <button className={`tab-bar-item${type === 'income' ? ' active' : ''}`} onClick={() => switchType('income')}>
              收入
            </button>
          </div>

          {/* 金额：符号与数字同基线，空态用弱色 */}
          <div className="amount-display">
            <span className="amount-sign" style={{ color: type === 'expense' ? 'var(--danger)' : 'var(--success)' }}>
              {type === 'expense' ? '−' : '+'}
            </span>
            <span className={`amount-input${amount ? '' : ' is-empty'}`}>{amount || '0'}</span>
          </div>

          {/* 分类：横向滑动长条（chip rail），分类再多也不撑高页面 */}
          <div className="section-header">
            <span className="section-title">选择分类</span>
          </div>
          {filteredCats.length === 0 ? (
            <div className="empty-state" style={{ padding: 16 }}>
              <div className="empty-text">暂无分类，先去管理分类添加吧</div>
            </div>
          ) : (
            <div className={`cat-rail-wrap${railEdges.left ? ' can-left' : ''}${railEdges.right ? ' can-right' : ''}`}>
              <div className="cat-rail" ref={railRef} onScroll={syncRail} role="group" aria-label="选择分类">
                {filteredCats.map((cat, idx) => (
                  <button
                    key={cat.id}
                    type="button"
                    data-cat-id={cat.id}
                    data-mc={macaronKeyOf(cat.color, idx)}
                    className={`cat-chip${categoryId === cat.id ? ' selected' : ''}`}
                    aria-pressed={categoryId === cat.id}
                    onClick={() => pickCategory(cat.id)}
                  >
                    <span className="chip-emoji">{cat.emoji}</span>
                    <span className="chip-name">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 日期 + 备注并排，原来两张卡合成一行 */}
          <div style={{ display: 'flex', gap: 10, margin: '0 0 12px' }}>
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

          {/* 数字键盘：3 列 × 4 行，标准计算器排布 123/456/789/·0⌫ */}
          <div className="keypad">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'].map(k => (
              <button key={k} type="button" className="key" onClick={() => pressDigit(k)}>{k}</button>
            ))}
            <button
              type="button"
              className="key fn"
              aria-label="退格，长按清空"
              onClick={pressBackspace}
              onPointerDown={startHold}
              onPointerUp={cancelHold}
              onPointerLeave={cancelHold}
              onPointerCancel={cancelHold}
              onContextMenu={e => e.preventDefault()}
            >
              <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor"
                strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 5H9.6L3.7 11.6a.6.6 0 0 0 0 .8L9.6 19H20a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1Z" />
                <path d="m12.6 9.6 5 4.8m0-4.8-5 4.8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
