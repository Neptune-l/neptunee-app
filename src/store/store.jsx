import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { get, getAll, put, del, clear, getGlobal, setGlobal, exportAllData, importAllData, clearAllData, deleteKey as delKey } from './db'
import { STORE_NAMES, ACHIEVEMENTS_CONFIG } from '../utils/constants'
import { getWeekKey, getToday, generateId } from '../utils/date'

const AppContext = createContext(null)

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

// 全局实例引用（供非 React 组件使用）
let globalToastFn = null
let globalAchievementFn = null

export function setGlobalToast(fn) { globalToastFn = fn }
export function setGlobalAchievement(fn) { globalAchievementFn = fn }
export function showGlobalToast(msg) { if (globalToastFn) globalToastFn(msg) }
export function showGlobalAchievement(ach) { if (globalAchievementFn) globalAchievementFn(ach) }
let globalNavigateTabFn = null
export function setGlobalNavigateTab(fn) { globalNavigateTabFn = fn }
export function navigateToTab(key) { if (globalNavigateTabFn) globalNavigateTabFn(key) }

export function AppProvider({ children }) {
  const [habits, setHabits] = useState([])
  const [tasks, setTasks] = useState([])
  const [bills, setBills] = useState([])
  const [categories, setCategories] = useState([])
  const [wishes, setWishes] = useState([])
  const [exchangeRecords, setExchangeRecords] = useState([])
  const [focusDiary, setFocusDiary] = useState([])
  const [dietRecords, setDietRecords] = useState([])
  const [goals, setGoals] = useState([])
  const [achievements, setAchievements] = useState([])
  const [focusWeeks, setFocusWeeks] = useState([])
  const [totalScore, setTotalScore] = useState(0)
  const [maxScore, setMaxScore] = useState(0)
  const [theme, setTheme] = useState('light')
  const [greetingEnabled, setGreetingEnabled] = useState(true)
  const [chatCounter, setChatCounter] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [currentDate, setCurrentDate] = useState(getToday())
  const [viewDate, setViewDate] = useState(getToday())
  const lastProcessedWeekKey = useRef('')
  const initializationDone = useRef(false)

  // 积分变动回调
  const scoreChangeCallbacks = useRef([])
  const onScoreChange = useCallback((fn) => {
    scoreChangeCallbacks.current.push(fn)
    return () => {
      scoreChangeCallbacks.current = scoreChangeCallbacks.current.filter(f => f !== fn)
    }
  }, [])

  // 加载所有数据
  const loadAll = useCallback(async () => {
    const [h, t, b, c, w, e, f, d, g, a, fw] = await Promise.all([
      getAll(STORE_NAMES.HABITS),
      getAll(STORE_NAMES.TASKS),
      getAll(STORE_NAMES.BILLS),
      getAll(STORE_NAMES.CATEGORIES),
      getAll(STORE_NAMES.WISHES),
      getAll(STORE_NAMES.EXCHANGE_RECORDS),
      getAll(STORE_NAMES.FOCUS_DIARY),
      getAll(STORE_NAMES.DIET_RECORDS),
      getAll(STORE_NAMES.GOALS),
      getAll(STORE_NAMES.ACHIEVEMENTS),
      getAll(STORE_NAMES.FOCUS_WEEKS),
    ])
    setHabits(h || [])
    setTasks(t || [])
    setBills(b || [])
    setCategories(c || [])
    setWishes(w || [])
    setExchangeRecords(e || [])
    setFocusDiary(f || [])
    setDietRecords(d || [])
    setGoals(g || [])
    setAchievements(a || [])
    setFocusWeeks(fw || [])

    // 加载全局设置
    const savedScore = await getGlobal('totalScore')
    const savedMaxScore = await getGlobal('maxScore')
    const savedTheme = await getGlobal('theme')
    const savedGreeting = await getGlobal('greetingEnabled')
    const savedChatCounter = await getGlobal('chatCounter')
    const savedLastWeek = await getGlobal('lastProcessedWeek')

    setTotalScore(savedScore || 0)
    setMaxScore(savedMaxScore || 0)
    if (savedTheme) setTheme(savedTheme)
    if (savedGreeting !== null) setGreetingEnabled(savedGreeting)
    else setGreetingEnabled(true)
    if (savedChatCounter) setChatCounter(savedChatCounter)
    if (savedLastWeek) lastProcessedWeekKey.current = savedLastWeek

    setLoaded(true)
    initializationDone.current = true
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  // ===== 积分操作 =====
  const updateScore = useCallback(async (delta) => {
    const current = await getGlobal('totalScore')
    const newScore = Math.max(0, (current || 0) + delta)
    await setGlobal('totalScore', newScore)
    setTotalScore(newScore)

    // 更新历史最高积分
    const savedMax = await getGlobal('maxScore')
    if (newScore > (savedMax || 0)) {
      await setGlobal('maxScore', newScore)
      setMaxScore(newScore)
    }

    // 触发积分变动回调
    scoreChangeCallbacks.current.forEach(fn => fn())

    // 检测成就
    await checkAchievements(newScore > (savedMax || 0) ? newScore : (savedMax || 0))

    return newScore
  }, [])

  const getCurrentScore = useCallback(async () => {
    return await getGlobal('totalScore') || 0
  }, [])

  // ===== 成就检测 =====
  const checkAchievements = useCallback(async (currentMaxScore) => {
    const unlocked = await getAll(STORE_NAMES.ACHIEVEMENTS) || []
    const unlockedIds = new Set(unlocked.map(a => a.id))

    for (const ach of ACHIEVEMENTS_CONFIG) {
      if (!unlockedIds.has(ach.id) && ach.check(currentMaxScore)) {
        const newAch = { id: ach.id, name: ach.name, emoji: ach.emoji, unlockedAt: Date.now() }
        await put(STORE_NAMES.ACHIEVEMENTS, newAch)
        setAchievements(prev => [...prev, newAch])
        // 弹出解锁弹窗
        if (globalAchievementFn) {
          setTimeout(() => globalAchievementFn(newAch), 300)
        }
      }
    }
  }, [])

  // ===== 习惯操作 =====
  const addHabit = useCallback(async (habit) => {
    const newHabit = { ...habit, id: generateId(), type: habit.type || 'positive' }
    await put(STORE_NAMES.HABITS, newHabit)
    setHabits(prev => [...prev, newHabit])
    return newHabit
  }, [])

  const updateHabit = useCallback(async (habit) => {
    await put(STORE_NAMES.HABITS, habit)
    setHabits(prev => prev.map(h => h.id === habit.id ? habit : h))
  }, [])

  const deleteHabit = useCallback(async (id) => {
    await del(STORE_NAMES.HABITS, id)
    setHabits(prev => prev.filter(h => h.id !== id))
  }, [])

  // ===== 任务操作 =====
  const addTask = useCallback(async (task) => {
    const newTask = { ...task, id: generateId(), completed: false, timerTotal: 0, createTime: Date.now() }
    await put(STORE_NAMES.TASKS, newTask)
    setTasks(prev => [...prev, newTask])
    return newTask
  }, [])

  const updateTask = useCallback(async (task) => {
    await put(STORE_NAMES.TASKS, task)
    setTasks(prev => prev.map(t => t.id === task.id ? task : t))
  }, [])

  const deleteTask = useCallback(async (id) => {
    await del(STORE_NAMES.TASKS, id)
    setTasks(prev => prev.filter(t => t.id !== id))
  }, [])

  // ===== 账单操作 =====
  const addBill = useCallback(async (bill) => {
    const newBill = { ...bill, id: generateId(), createTime: Date.now() }
    await put(STORE_NAMES.BILLS, newBill)
    setBills(prev => [...prev, newBill])
    return newBill
  }, [])

  const updateBill = useCallback(async (bill) => {
    await put(STORE_NAMES.BILLS, bill)
    setBills(prev => prev.map(b => b.id === bill.id ? bill : b))
  }, [])

  const deleteBill = useCallback(async (id) => {
    await del(STORE_NAMES.BILLS, id)
    setBills(prev => prev.filter(b => b.id !== id))
  }, [])

  // ===== 分类操作 =====
  const addCategory = useCallback(async (cat) => {
    const newCat = { ...cat, id: generateId() }
    await put(STORE_NAMES.CATEGORIES, newCat)
    setCategories(prev => [...prev, newCat])
    return newCat
  }, [])

  const updateCategory = useCallback(async (cat) => {
    await put(STORE_NAMES.CATEGORIES, cat)
    setCategories(prev => prev.map(c => c.id === cat.id ? cat : c))
  }, [])

  const deleteCategory = useCallback(async (id) => {
    await del(STORE_NAMES.CATEGORIES, id)
    setCategories(prev => prev.filter(c => c.id !== id))
  }, [])

  // ===== 愿望操作 =====
  const addWish = useCallback(async (wish) => {
    const newWish = { ...wish, id: generateId(), exchanged: false }
    await put(STORE_NAMES.WISHES, newWish)
    setWishes(prev => [...prev, newWish])
    return newWish
  }, [])

  const updateWish = useCallback(async (wish) => {
    await put(STORE_NAMES.WISHES, wish)
    setWishes(prev => prev.map(w => w.id === wish.id ? wish : w))
  }, [])

  const deleteWish = useCallback(async (id) => {
    await del(STORE_NAMES.WISHES, id)
    setWishes(prev => prev.filter(w => w.id !== id))
  }, [])

  const exchangeWish = useCallback(async (wish) => {
    const currentScore = await getCurrentScore()
    if (currentScore < wish.cost) return false

    const newScore = Math.max(0, currentScore - wish.cost)
    await setGlobal('totalScore', newScore)
    setTotalScore(newScore)

    const record = { id: generateId(), wishName: wish.name, cost: wish.cost, time: Date.now() }
    await put(STORE_NAMES.EXCHANGE_RECORDS, record)
    setExchangeRecords(prev => [record, ...prev])

    wish.exchanged = true
    wish.exchangeTime = Date.now()
    await put(STORE_NAMES.WISHES, wish)
    setWishes(prev => prev.map(w => w.id === wish.id ? wish : w))

    // 检测成就
    const savedMax = await getGlobal('maxScore') || 0
    await checkAchievements(savedMax)
    scoreChangeCallbacks.current.forEach(fn => fn())

    return true
  }, [getCurrentScore, checkAchievements])

  // ===== 专注日记 =====
  const addFocusDiary = useCallback(async (entry) => {
    const newEntry = { ...entry, id: generateId(), createTime: Date.now() }
    await put(STORE_NAMES.FOCUS_DIARY, newEntry)
    setFocusDiary(prev => [newEntry, ...prev])
    return newEntry
  }, [])

  const deleteFocusDiary = useCallback(async (id) => {
    await del(STORE_NAMES.FOCUS_DIARY, id)
    setFocusDiary(prev => prev.filter(d => d.id !== id))
  }, [])

  // ===== 饮食记录 =====
  const addDietRecord = useCallback(async (record) => {
    const newRecord = { ...record, id: generateId() }
    await put(STORE_NAMES.DIET_RECORDS, newRecord)
    setDietRecords(prev => [...prev, newRecord])
    return newRecord
  }, [])

  const updateDietRecord = useCallback(async (record) => {
    await put(STORE_NAMES.DIET_RECORDS, record)
    setDietRecords(prev => prev.map(r => r.id === record.id ? record : r))
  }, [])

  const deleteDietRecord = useCallback(async (id) => {
    await del(STORE_NAMES.DIET_RECORDS, id)
    setDietRecords(prev => prev.filter(r => r.id !== id))
  }, [])

  // ===== 目标操作 =====
  const addGoal = useCallback(async (goal) => {
    const newGoal = { ...goal, id: generateId(), status: 'active', createTime: Date.now() }
    await put(STORE_NAMES.GOALS, newGoal)
    setGoals(prev => [...prev, newGoal])
    return newGoal
  }, [])

  const updateGoal = useCallback(async (goal) => {
    await put(STORE_NAMES.GOALS, goal)
    setGoals(prev => prev.map(g => g.id === goal.id ? goal : g))
  }, [])

  const deleteGoal = useCallback(async (id) => {
    await del(STORE_NAMES.GOALS, id)
    setGoals(prev => prev.filter(g => g.id !== id))
  }, [])

  // ===== 每周焦点挑战 =====
  const processFocusWeek = useCallback(async () => {
    const today = getToday()
    const weekKey = getWeekKey(today)

    if (lastProcessedWeekKey.current === weekKey) return

    // 检查是否需要结算上一周
    if (lastProcessedWeekKey.current) {
      const lastWeekData = await get(STORE_NAMES.FOCUS_WEEKS, lastProcessedWeekKey.current)
      if (lastWeekData && !lastWeekData.settled) {
        // 结算上一周
        const totalDays = lastWeekData.habitIds.length * 7
        lastWeekData.settled = true
        await put(STORE_NAMES.FOCUS_WEEKS, lastWeekData)
        // 奖励已在手动结算时发放
        setFocusWeeks(prev => prev.map(fw => fw.id === lastWeekData.id ? lastWeekData : fw))
      }
    }

    // 生成新的周焦点
    const existing = await get(STORE_NAMES.FOCUS_WEEKS, weekKey)
    if (!existing) {
      const positiveHabits = habits.filter(h => h.type === 'positive')
      if (positiveHabits.length > 0) {
        const shuffled = [...positiveHabits].sort(() => Math.random() - 0.5)
        const selected = shuffled.slice(0, 3).map(h => h.id)
        const newWeek = { id: weekKey, weekKey, habitIds: selected, settled: false }
        await put(STORE_NAMES.FOCUS_WEEKS, newWeek)
        setFocusWeeks(prev => [...prev, newWeek])
      }
    }

    lastProcessedWeekKey.current = weekKey
    await setGlobal('lastProcessedWeek', weekKey)
  }, [habits])

  // ===== 结算焦点挑战 =====
  const settleFocusWeek = useCallback(async (weekKey) => {
    const weekData = await get(STORE_NAMES.FOCUS_WEEKS, weekKey)
    if (!weekData || weekData.settled) return 0

    // 计算本周打卡总天数
    const today = getToday()
    let totalCheckedDays = 0
    const weekStart = new Date(today)
    const dayOfWeek = weekStart.getDay()
    const diff = (dayOfWeek === 0 ? 6 : dayOfWeek - 1)
    weekStart.setDate(weekStart.getDate() - diff)

    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart)
      date.setDate(weekStart.getDate() + i)
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

      const dayHabits = habits.filter(h => weekData.habitIds.includes(h.id))
      for (const habit of dayHabits) {
        const checkKey = `check_${dateStr}_${habit.id}`
        const checked = await getGlobal(checkKey)
        if (checked) totalCheckedDays++
      }
    }

    weekData.settled = true
    await put(STORE_NAMES.FOCUS_WEEKS, weekData)
    setFocusWeeks(prev => prev.map(fw => fw.id === weekKey ? weekData : fw))

    if (totalCheckedDays >= 18) {
      const newScore = await updateScore(30)
      return 30
    }
    return -1 // 未达标
  }, [habits, updateScore])

  // ===== 习惯打卡/破戒 =====
  const checkHabit = useCallback(async (habitId, dateStr) => {
    const habit = habits.find(h => h.id === habitId)
    if (!habit) return null

    const checkKey = `check_${dateStr}_${habitId}`

    if (habit.type === 'positive') {
      const alreadyChecked = await getGlobal(checkKey)
      if (alreadyChecked) return { already: true }
      await setGlobal(checkKey, true)
      const newScore = await updateScore(habit.score || 5)
      return { already: false, delta: habit.score || 5, newScore }
    } else {
      // 克制习惯 - 破戒
      const count = await getGlobal(checkKey) || 0
      await setGlobal(checkKey, count + 1)
      const delta = -(habit.score || 3)
      const newScore = await updateScore(delta)
      return { count: count + 1, delta, newScore }
    }
  }, [habits, updateScore])

  const uncheckHabit = useCallback(async (habitId, dateStr) => {
    const habit = habits.find(h => h.id === habitId)
    if (!habit) return
    const checkKey = `check_${dateStr}_${habitId}`

    if (habit.type === 'positive') {
      await delKey(checkKey)
      await updateScore(-(habit.score || 5))
    } else {
      const count = await getGlobal(checkKey) || 0
      if (count > 0) {
        await setGlobal(checkKey, count - 1)
        await updateScore(habit.score || 3)
      }
    }
  }, [habits, updateScore])

  const getHabitStatus = useCallback(async (habitId, dateStr) => {
    const habit = habits.find(h => h.id === habitId)
    if (!habit) return null
    const checkKey = `check_${dateStr}_${habitId}`
    const value = await getGlobal(checkKey)

    if (habit.type === 'positive') {
      return { checked: !!value }
    } else {
      return { count: value || 0 }
    }
  }, [habits])

  // ===== 初始化默认分类 =====
  useEffect(() => {
    if (!loaded) return
    if (categories.length === 0) {
      const initCategories = async () => {
        for (const cat of DEFAULT_CATEGORIES) {
          await addCategory(cat)
        }
      }
      initCategories()
    }
    // 处理每周焦点
    processFocusWeek()
  }, [loaded, categories.length])

  // 监听主题变化
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    setGlobal('theme', theme)
  }, [theme])

  // ===== 上下文值 =====
  const value = {
    loaded, habits, tasks, bills, categories, wishes, exchangeRecords,
    focusDiary, dietRecords, goals, achievements, focusWeeks,
    totalScore, maxScore, theme, greetingEnabled, chatCounter,
    currentDate, setCurrentDate, viewDate, setViewDate,
    updateScore, getCurrentScore, checkAchievements, onScoreChange,
    addHabit, updateHabit, deleteHabit,
    addTask, updateTask, deleteTask,
    addBill, updateBill, deleteBill,
    addCategory, updateCategory, deleteCategory,
    addWish, updateWish, deleteWish, exchangeWish,
    addFocusDiary, deleteFocusDiary,
    addDietRecord, updateDietRecord, deleteDietRecord,
    addGoal, updateGoal, deleteGoal,
    processFocusWeek, settleFocusWeek,
    checkHabit, uncheckHabit, getHabitStatus,
    setTheme, setGreetingEnabled, setChatCounter,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}



