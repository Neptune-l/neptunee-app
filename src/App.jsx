import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import ToastManager from './components/Toast'
import AchievementModal from './components/AchievementModal'
import ErrorBoundary from './components/ErrorBoundary'
import HomePage from './pages/HomePage'
import HabitCheckPage from './pages/HabitCheckPage'
import TaskCenter from './pages/TaskCenter'
import FocusTimer from './pages/FocusTimer'
import Accounting from './pages/Accounting'
import Statistics from './pages/Statistics'
import Profile from './pages/Profile'
import PetHall from './pages/PetHall'
import { setGlobalNavigateTab } from './store/store'

/**
 * 底部导航图标：统一 24×24 线性图标（stroke 由 CSS 控制，
 * 激活态只换描边色与粗细，不再用彩色 emoji）
 */
const ICONS = {
  home: (
    <>
      <path d="M4 10.3 12 3.6l8 6.7V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
      <path d="M9.6 21v-6.3h4.8V21" />
    </>
  ),
  habits: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <path d="m8.3 12.2 2.5 2.5 4.9-5" />
    </>
  ),
  tasks: (
    <>
      <path d="M9.5 6.6h11M9.5 12h11M9.5 17.4h11" />
      <path d="m3.4 6.5 1.7 1.7 3-3.2M3.4 11.9l1.7 1.7 3-3.2M3.4 17.3l1.7 1.7 3-3.2" />
    </>
  ),
  pets: (
    <>
      <ellipse cx="6.9" cy="10.4" rx="1.9" ry="2.2" />
      <ellipse cx="10.3" cy="7.6" rx="1.9" ry="2.3" />
      <ellipse cx="13.9" cy="7.6" rx="1.9" ry="2.3" />
      <ellipse cx="17.3" cy="10.4" rx="1.9" ry="2.2" />
      <path d="M12.1 12.6c-2.9 0-5.2 2.2-5.2 4.3 0 1.5 1.3 2.4 3.1 2.4 1.1 0 1.5-.4 2.1-.4s1 .4 2.1.4c1.8 0 3.1-.9 3.1-2.4 0-2.1-2.3-4.3-5.2-4.3z" />
    </>
  ),
  accounting: (
    <>
      <rect x="3" y="6.4" width="18" height="12.2" rx="2.7" />
      <path d="M3 10.6h18" />
      <circle cx="16.7" cy="14.8" r="1.15" />
    </>
  ),
  stats: (
    <>
      <path d="M4.4 20h15.2" />
      <path d="M8 20v-6.4M12 20V6.6M16 20v-8.6" />
    </>
  ),
  profile: (
    <>
      <circle cx="12" cy="8" r="3.7" />
      <path d="M4.7 20.2c1.1-3.8 3.9-5.7 7.3-5.7s6.2 1.9 7.3 5.7" />
    </>
  ),
}

const TABS = [
  { key: 'home', label: '首页' },
  { key: 'habits', label: '打卡' },
  { key: 'tasks', label: '任务' },
  { key: 'pets', label: '小可怜' },
  { key: 'accounting', label: '记账' },
  { key: 'stats', label: '数据' },
  { key: 'profile', label: '我的' },
]

const PAGES = {
  home: HomePage,
  habits: HabitCheckPage,
  tasks: TaskCenter,
  timer: FocusTimer,
  pets: PetHall,
  accounting: Accounting,
  stats: Statistics,
  profile: Profile,
}

export default function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [subpage, setSubpage] = useState(null)

  // 每个 tab 各自的滚动位置，切回来不会被顶到顶部
  const scrollPos = useRef({})
  const readScroll = () => {
    const el = document.querySelector('.page-content')
    return { win: window.scrollY || 0, el: el ? el.scrollTop : 0 }
  }
  const restoreScroll = (pos) => {
    if (!pos) return
    const el = document.querySelector('.page-content')
    if (el) el.scrollTop = pos.el || 0
    window.scrollTo(0, pos.win || 0)
  }

  const openSubpage = useCallback((Component, props = {}) => {
    scrollPos.current[activeTab] = readScroll()
    setSubpage({ Component, props })
  }, [activeTab])

  const closeSubpage = useCallback(() => setSubpage(null), [])

  const switchTo = useCallback((key) => {
    if (key === activeTab) return
    scrollPos.current[activeTab] = readScroll()
    setSubpage(null)
    setActiveTab(key)
    restoreScroll(scrollPos.current[key])
  }, [activeTab])

  const goTab = useCallback((key) => {
    if (key === activeTab) {
      // 再点一次当前 tab：平滑回到顶部
      const el = document.querySelector('.page-content')
      if (el) el.scrollTo({ top: 0, behavior: 'smooth' })
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    switchTo(key)
  }, [activeTab, switchTo])

  // 供非 React 模块（如任务页/专注页的跳转）切换 tab
  useEffect(() => { setGlobalNavigateTab(switchTo) }, [switchTo])

  // 布局阶段先把滚动位置放回去，避免"先闪到顶部再跳下去"
  useLayoutEffect(() => {
    const pos = scrollPos.current[activeTab]
    if (!pos) return
    restoreScroll(pos)
    const raf = requestAnimationFrame(() => restoreScroll(pos))
    return () => cancelAnimationFrame(raf)
  }, [activeTab])

  const PageComponent = PAGES[activeTab]
  const activeLabel = TABS.find(t => t.key === activeTab)?.label

  return (
    <div className="app-container">
      <ToastManager />
      <AchievementModal />
      <ErrorBoundary label={activeLabel}>
        <PageComponent openSubpage={openSubpage} closeSubpage={closeSubpage} />
      </ErrorBoundary>

      {subpage && (
        <ErrorBoundary label="二级页面">
          <subpage.Component {...subpage.props} onClose={closeSubpage} />
        </ErrorBoundary>
      )}

      <nav className="bottom-tab-bar" aria-label="主导航">
        {TABS.map(tab => (
          <button
            key={tab.key}
            type="button"
            className={`tab-item${activeTab === tab.key ? ' active' : ''}`}
            aria-current={activeTab === tab.key ? 'page' : undefined}
            onClick={() => goTab(tab.key)}
          >
            <span className="tab-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">{ICONS[tab.key]}</svg>
            </span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
