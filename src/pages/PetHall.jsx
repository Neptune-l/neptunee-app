import React, { useMemo } from 'react'
import { useApp } from '../store/store'
import { PET_SPECIES, PET_STATE_META, PET_ITEM_ICON } from '../utils/petConstants'
import { computePetView } from '../utils/petLogic'
import { getToday } from '../utils/date'
import PetHome from './PetHome'
import PetMarket from './PetMarket'
import PetMemorial from './PetMemorial'
import PetNew from '../subpages/PetNew'

export default function PetHall({ openSubpage }) {
  const {
    loaded, pets, petPlans, petHistory, petRations,
    petRevivePills, petCatchupTickets,
  } = useApp()
  const today = getToday()

  const activePets = useMemo(() => {
    return pets
      .filter(p => p.status === 'active' || p.status === 'dead')
      .map(p => ({
        ...computePetView(p, petPlans.find(pl => pl.id === p.id), petHistory.filter(h => h.petId === p.id), today),
      }))
  }, [pets, petPlans, petHistory, today])

  if (!loaded) return <div className="loading">加载中...</div>

  return (
    <>
      <div className="page-content">
        <div className="top-bar">
          <div className="top-bar-left"><span style={{ fontSize: 17, fontWeight: 700 }}>🐾 收容大厅</span></div>
          <div className="top-bar-right pet-wallet">
            <img src={PET_ITEM_ICON.ration} alt="口粮" className="wallet-ico" />
            <span>{petRations}</span>
            <img src={PET_ITEM_ICON.revive_pill} alt="续命丸" className="wallet-ico" />
            <span>{petRevivePills}</span>
            <img src={PET_ITEM_ICON.catchup_ticket} alt="打卡券" className="wallet-ico" />
            <span>{petCatchupTickets}</span>
          </div>
        </div>

        <div className="tab-bar" style={{ marginBottom: 12 }}>
          <button className="tab-bar-item active">别养死了</button>
          <button className="tab-bar-item" onClick={() => openSubpage(PetMarket)}>🖤 黑市</button>
          <button className="tab-bar-item" onClick={() => openSubpage(PetMemorial)}>🕯️ 遗照合集</button>
        </div>

        {activePets.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🐾</div>
            <div className="empty-text">还没有小可怜，领养一只开始坚持吧</div>
            <button className="btn btn-primary mt-8" onClick={() => openSubpage(PetNew)}>新建活命指标</button>
          </div>
        ) : (
          activePets.map(v => {
            const sp = PET_SPECIES[v.pet.species]
            const st = PET_STATE_META[v.state]
            const img = v.state === 'alive'
              ? sp.stages[Math.min(v.stage - 1, 4)]
              : sp.states[v.state]
            return (
              <div key={v.pet.id} className="list-item pet-card" onClick={() => openSubpage(PetHome, { petId: v.pet.id })}>
                <div className="pet-thumb" style={{ background: (sp.accent || '#F2B8C6') + '33' }}>
                  <img src={img} alt={sp.name} />
                </div>
                <div className="item-content">
                  <div className="item-title">{v.pet.name}</div>
                  <div className="item-sub">{v.pet.planName}</div>
                  <div className="pet-progress">
                    <div className="pet-progress-bar">
                      <div className="pet-progress-fill" style={{ width: v.todayTasks.length ? Math.min(100, v.todayDone / v.todayTasks.length * 100) + '%' : '100%' }} />
                    </div>
                    <span>{v.todayTasks.length ? `${v.todayDone}/${v.todayTasks.length}` : '今日休息'}</span>
                  </div>
                </div>
                <div className="item-right pet-card-right">
                  <span className="pet-state-chip" style={{ background: st.color + '22', color: st.color }}>{st.name}</span>
                  <span className="pet-stage">Lv.{v.stage} · {v.pet.growth}成长</span>
                  <span className="pet-streak">🔥 {v.streak}天</span>
                </div>
              </div>
            )
          })
        )}
        <div style={{ height: 80 }} />
      </div>
      <button className="fab" onClick={() => openSubpage(PetNew)}>+</button>
    </>
  )
}
