import React, { useState } from 'react'
import ToastManager from './components/Toast'
import AchievementModal from './components/AchievementModal'
import HomePage from './pages/HomePage'
import HabitCheckPage from './pages/HabitCheckPage'
import TaskCenter from './pages/TaskCenter'
import FocusTimer from './pages/FocusTimer'
import Accounting from './pages/Accounting'
import Statistics from './pages/Statistics'
import Profile from './pages/Profile'
import { setGlobalNavigateTab } from './store/store'
import { useEffect } from 'react'

const TABS = [
  { key: 'home', label: '首页', icon: '🏠' },
  { key: 'habits', label: '打卡', icon: '✅' },
  { key: 'tasks', label: '任务', icon: '📋' },
  { key: 'timer', label: '专注', icon: '⏱️' },
  { key: 'accounting', label: '记账', icon: '💰' },
  { key: 'stats', label: '数据', icon: '📊' },
  { key: 'profile', label: '我的', icon: '👤' },
]

const PAGES = {
  home: HomePage,
  habits: HabitCheckPage,
  tasks: TaskCenter,
  timer: FocusTimer,
  accounting: Accounting,
  stats: Statistics,
  profile: Profile,
}

export default function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [subpage, setSubpage] = useState(null)

  const openSubpage = (Component, props = {}) => setSubpage({ Component, props })
  const closeSubpage = () => setSubpage(null)
  useEffect(() => { setGlobalNavigateTab(setActiveTab) }, [])

  const PageComponent = PAGES[activeTab]

  return (
    <div className="app-container">
      <ToastManager />
      <AchievementModal />
      <PageComponent openSubpage={openSubpage} closeSubpage={closeSubpage} />
      {subpage && <subpage.Component {...subpage.props} onClose={closeSubpage} />}
      <div className="bottom-tab-bar" style={{ justifyContent: 'space-around' }}>
        {TABS.map(tab => (
          <div key={tab.key} className={`tab-item${activeTab === tab.key ? ' active' : ''}`} onClick={() => setActiveTab(tab.key)}>
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
