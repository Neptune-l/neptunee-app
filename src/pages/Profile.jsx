import React from 'react'
import { useApp } from '../store/store'
import AchievementWall from '../subpages/AchievementWall'
import FocusDiaryList from '../subpages/FocusDiaryList'
import WishEdit from '../subpages/WishEdit'
import ExchangeRecords from '../subpages/ExchangeRecords'
import DietRecordList from '../subpages/DietRecordList'
import DietEdit from '../subpages/DietEdit'
import GoalEdit from '../subpages/GoalEdit'
import GoalDetail from '../subpages/GoalDetail'
import RandomPicker from '../subpages/RandomPicker'
import Settings from '../subpages/Settings'

const FEATURE_GROUPS = [
  {
    title: null,
    items: [
      { icon: '🏆', label: '成就徽章', subpage: AchievementWall },
      { icon: '📝', label: '专注日记', subpage: FocusDiaryList },
    ]
  },
  {
    title: '愿望兑换组',
    items: [
      { icon: '🎁', label: '愿望列表', subpage: WishEdit },
      { icon: '📋', label: '兑换记录', subpage: ExchangeRecords },
    ]
  },
  {
    title: '生活记录组',
    items: [
      { icon: '🍽️', label: '饮食记录', subpage: DietRecordList },
      { icon: '🎯', label: '中长期目标', subpage: GoalEdit },
    ]
  },
  {
    title: '小工具组',
    items: [
      { icon: '🎲', label: '随机选择器', subpage: RandomPicker },
    ]
  },
  {
    title: '设置组',
    items: [
      { icon: '⚙️', label: '设置', subpage: Settings },
    ]
  },
]

export default function Profile({ openSubpage }) {
  const { totalScore, achievements } = useApp()

  return (
    <div className="page-content">
      {/* 顶部 */}
      <div style={{ textAlign: 'center', padding: '20px 0 16px' }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>🗓️</div>
        <div style={{ fontSize: 19, fontWeight: 700 }}>Neptune 自律百宝箱</div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>v1.0.0</div>
        <div className="card" style={{ marginTop: 12, display: 'inline-block', padding: '8px 24px' }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>总积分</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--primary)' }}>{totalScore}</div>
        </div>
      </div>

      {/* 功能组 */}
      {FEATURE_GROUPS.map((group, gi) => (
        <div key={gi} className="settings-group">
          {group.title && <div className="settings-group-title">{group.title}</div>}
          {group.items.map((item, ii) => (
            <div key={ii} className="settings-item" onClick={() => openSubpage(item.subpage)}>
              <div className="settings-left">
                <span className="settings-icon">{item.icon}</span>
                <span className="settings-label">{item.label}</span>
              </div>
              <span className="settings-arrow">›</span>
            </div>
          ))}
        </div>
      ))}

      {/* 底部提示 */}
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center', marginTop: 20, lineHeight: 1.6 }}>
        所有数据仅存储在本地浏览器，请定期备份
      </p>
      <div style={{ height: 40 }} />
    </div>
  )
}
