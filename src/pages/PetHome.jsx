import React, { useMemo, useState } from 'react'
import { useApp, showGlobalToast } from '../store/store'
import { PET_SPECIES, PET_STATE_META, PET_LINES, PET_MARKET_IMG } from '../utils/petConstants'
import { computePetView } from '../utils/petLogic'
import { getToday } from '../utils/date'

export default function PetHome({ petId, onClose }) {
  const {
    pets, petPlans, petHistory, petInventory,
    petRevivePills, petCatchupTickets,
    togglePetTask, useCatchupTicket, revivePet, updatePetPlanDay,
  } = useApp()
  const today = getToday()
  const [tab, setTab] = useState('metric')
  const [line, setLine] = useState('')
  const [editingDate, setEditingDate] = useState(null)
  const [editTexts, setEditTexts] = useState([])

  const pet = pets.find(p => p.id === petId)
  const plan = petPlans.find(p => p.id === petId)
  const history = petHistory.filter(h => h.petId === petId)
  const view = useMemo(() => computePetView(pet, plan, history, today), [pet, plan, history, today])

  const linePool = useMemo(() => {
    if (!pet) return []
    const now = new Date()
    const pool = PET_LINES[pet.species]?.[view.state] || []
    if (view.state !== 'alive' && now.getHours() >= 19 && PET_LINES[pet.species]?.evening) {
      return [...PET_LINES[pet.species].evening, ...pool]
    }
    return pool
  }, [pet, view.state])

  const speak = () => {
    if (linePool.length === 0) return
    const pick = linePool[Math.floor(Math.random() * linePool.length)]
    setLine(pick)
  }

  if (!pet || !view) return <div className="loading">加载中...</div>

  const sp = PET_SPECIES[pet.species]
  const st = PET_STATE_META[view.state]
  const bigImg = view.state === 'alive'
    ? sp.stages[Math.min(view.stage - 1, 4)]
    : sp.states[view.state]
  const ownedDecor = petInventory.filter(d => !d.species || d.species === pet.species)

  const missDays = view.days.filter(d => !d.ok)
  const futureDays = (plan?.days || []).filter(d => d.date >= today)

  const startEdit = (date) => {
    const day = plan?.days.find(d => d.date === date)
    setEditingDate(date)
    setEditTexts((day?.tasks || []).map(t => t.text))
  }

  const saveEdit = async () => {
    await updatePetPlanDay(pet.id, editingDate, editTexts)
    showGlobalToast('计划已更新')
    setEditingDate(null)
  }

  return (
    <div className="subpage">
      <div className="subpage-header">
        <button className="back-btn" onClick={onClose}>‹</button>
        <span className="subpage-title">{pet.name}</span>
        <span className="pet-state-chip" style={{ background: st.color + '22', color: st.color }}>{st.name}</span>
      </div>

      <div className="subpage-body">
        <div className="tab-bar" style={{ marginBottom: 12 }}>
          <button className={'tab-bar-item' + (tab === 'metric' ? ' active' : '')} onClick={() => setTab('metric')}>活命指标</button>
          <button className={'tab-bar-item' + (tab === 'play' ? ' active' : '')} onClick={() => { setTab('play'); speak() }}>贴贴互动</button>
        </div>

        {tab === 'metric' ? (
          <>
            {/* 今日任务 */}
            <div className="card" style={{ marginBottom: 12 }}>
              <div className="section-title" style={{ marginBottom: 8 }}>今日任务 {view.todayTasks.length ? `(${view.todayDone}/${view.todayTasks.length})` : '（空清单=保命）'}</div>
              {view.todayTasks.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', padding: '4px 0' }}>今天没有安排任务，小可怜自动存活，但无口粮和成长。</div>
              ) : (
                view.todayTasks.map(t => (
                  <div key={t.id} className="list-item" style={{ cursor: 'pointer' }} onClick={async () => {
                    const r = await togglePetTask(pet.id, today, t.id)
                    if (r?.graduate) showGlobalToast('🎓 已开智！再见了妈妈今晚我就要远航')
                  }}>
                    <div className={'checkbox-round' + (t.done ? ' checked' : '')} />
                    <div className="item-content"><div className="item-title" style={{ textDecoration: t.done ? 'line-through' : 'none' }}>{t.text}</div></div>
                    <div className="item-right" style={{ color: 'var(--text-secondary)', fontSize: 12 }}>+1成长</div>
                  </div>
                ))
              )}
            </div>

            {/* 状态栏 */}
            <div className="pet-stat-row">
              <div className="pet-stat"><b>{view.growth}</b><span>成长值</span></div>
              <div className="pet-stat"><b>Lv.{view.stage}</b><span>成长阶段</span></div>
              <div className="pet-stat"><b>{view.streak}</b><span>连续天数</span></div>
              <div className="pet-stat"><b>{view.okDays}/{view.totalDays}</b><span>存活天数</span></div>
            </div>

            {/* 沉寂/复活 */}
            {pet.status === 'dead' && (
              <div className="card" style={{ marginBottom: 12, borderColor: st.color }}>
                <div className="section-title">{st.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>复活消耗 1 颗续命丸 + 1 次额度，剩余复活额度 {pet.revivesLeft} 次。</div>
                <button className="btn btn-primary" disabled={petRevivePills < 1} onClick={async () => {
                  const ok = await revivePet(pet.id)
                  showGlobalToast(ok ? '复活成功，连续天数已清零' : '需要续命丸（黑市 300 口粮）')
                }}>复活小可怜</button>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>续命丸库存：{petRevivePills}</div>
              </div>
            )}

            {/* 历史补卡 */}
            {pet.status === 'active' && missDays.length > 0 && (
              <div className="card" style={{ marginBottom: 12 }}>
                <div className="section-title" style={{ marginBottom: 8 }}>断更记录（打卡券可补）</div>
                {missDays.map(d => (
                  <div key={d.date} className="list-item" style={{ padding: '8px 4px' }}>
                    <div className="item-content"><div className="item-title" style={{ fontSize: 13 }}>{d.date}</div></div>
                    <div className="item-right">
                      <button className="btn btn-sm btn-outline" disabled={petCatchupTickets < 1} onClick={async () => {
                        const ok = await useCatchupTicket(pet.id, d.date)
                        showGlobalToast(ok ? '补卡成功，成长/口粮已发放' : '补卡失败（需打卡券，且沉寂期间不可补）')
                      }}>用打卡券</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 未来计划 */}
            <div className="card">
              <div className="section-title" style={{ marginBottom: 8 }}>长期计划</div>
              {futureDays.map(d => {
                const day = plan?.days.find(x => x.date === d.date)
                return (
                  <div key={d.date} className="list-item" style={{ padding: '8px 4px', flexWrap: 'wrap' }}>
                    <div className="item-content">
                      <div className="item-title" style={{ fontSize: 13 }}>{d.date}</div>
                      <div className="item-sub" style={{ fontSize: 12 }}>{day?.tasks.map(t => t.text).join(' / ') || '空'}</div>
                    </div>
                    {d.date > today && (
                      <div className="item-right">
                        <button className="btn btn-sm btn-outline" onClick={() => startEdit(d.date)}>编辑</button>
                      </div>
                    )}
                    {editingDate === d.date && (
                      <div style={{ width: '100%', marginTop: 8 }}>
                        {editTexts.map((txt, i) => (
                          <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                            <input className="form-input" value={txt} onChange={e => {
                              const next = [...editTexts]; next[i] = e.target.value; setEditTexts(next)
                            }} />
                            <button className="btn btn-sm btn-outline" onClick={() => setEditTexts(editTexts.filter((_, j) => j !== i))}>删</button>
                          </div>
                        ))}
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-sm btn-outline" onClick={() => setEditTexts([...editTexts, ''])}>+ 添加任务</button>
                          <button className="btn btn-sm btn-primary" onClick={saveEdit}>保存</button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          <>
            {/* 贴贴互动 */}
            <div className="pet-stage-area" onClick={speak}>
              <img src={bigImg} alt={sp.name} className="pet-big" style={{ opacity: view.state === 'dead' ? 0.75 : 1 }} />
              <div className="pet-name-tag">{pet.name} · {st.name}</div>
            </div>
            {line && <div className="pet-bubble">{line}</div>}
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center', marginTop: 8 }}>点它一下，听它说话</div>

            {/* 装饰展示 */}
            {ownedDecor.length > 0 && (
              <div className="card" style={{ marginTop: 12 }}>
                <div className="section-title" style={{ marginBottom: 8 }}>我的装饰</div>
                <div className="pet-decor-row">
                  {ownedDecor.map(d => (
                    <div key={d.id} className="pet-decor">
                      <img src={PET_MARKET_IMG[d.itemId] || sp.stages[0]} alt={d.itemId} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
