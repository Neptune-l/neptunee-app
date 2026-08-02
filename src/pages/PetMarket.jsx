import React from 'react'
import { useApp, showGlobalToast } from '../store/store'
import { PET_MARKET_ITEMS, PET_ITEM_ICON } from '../utils/petConstants'

export default function PetMarket({ onClose }) {
  const { petRations, petRevivePills, petCatchupTickets, petInventory, buyMarketItem } = useApp()

  const ownedIds = new Set(petInventory.map(i => i.itemId))

  return (
    <div className="subpage">
      <div className="subpage-header">
        <button className="back-btn" onClick={onClose}>‹</button>
        <span className="subpage-title">🖤 黑市</span>
        <div className="pet-wallet" style={{ fontSize: 14 }}>
          <img src={PET_ITEM_ICON.ration} alt="口粮" className="wallet-ico" />
          <span>{petRations}</span>
        </div>
      </div>

      <div className="subpage-body">
        <div className="card" style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
          续命丸 ×{petRevivePills} · 打卡券 ×{petCatchupTickets} · 观赏品买断后永久拥有
        </div>

        {PET_MARKET_ITEMS.map(item => {
          const owned = item.type === 'decor' && ownedIds.has(item.id)
          const canBuy = petRations >= item.price
          return (
            <div key={item.id} className="list-item">
              <div className="pet-thumb" style={{ width: 56, height: 56, background: '#FFF8F2' }}>
                <img src={item.img} alt={item.name} style={{ width: 44, height: 44 }} />
              </div>
              <div className="item-content">
                <div className="item-title">{item.name}{item.species === 'cat' ? '（猫）' : item.species === 'dog' ? '（犬）' : ''}</div>
                <div className="item-sub">{item.desc}</div>
                <div className="item-sub" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                  <img src={PET_ITEM_ICON.ration} alt="口粮" className="wallet-ico" style={{ width: 14, height: 14 }} /> {item.price}
                </div>
              </div>
              <div className="item-right">
                {owned ? (
                  <span className="pet-state-chip" style={{ background: '#7BC5A022', color: '#5BA583' }}>已拥有</span>
                ) : (
                  <button className="btn btn-sm btn-primary" disabled={!canBuy} onClick={async () => {
                    const ok = await buyMarketItem(item.id)
                    showGlobalToast(ok ? `${item.name} 购买成功` : '口粮不足')
                  }}>购买</button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
