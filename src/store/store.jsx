import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { get, getAll, put, del, clear, getGlobal, setGlobal, exportAllData, importAllData, clearAllData, deleteKey as delKey } from './db'
import { STORE_NAMES, ACHIEVEMENTS_CONFIG, DEFAULT_CATEGORIES, DEFAULT_SAVINGS_EMOJI, DEFAULT_COLOR } from '../utils/constants'
import { getWeekKey, getToday, generateId, makeCheckKey, parseCheckKey, countStreak } from '../utils/date'
import { round2, sumMoney } from '../utils/money'
import { PET_MARKET_ITEMS, PET_SPECIES } from '../utils/petConstants'
import { buildPlanDays, computePetView } from '../utils/petLogic'

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
  const [savingsGoals, setSavingsGoals] = useState([])
  const [savingsRecords, setSavingsRecords] = useState([])
  const [totalAssetsBase, setTotalAssetsBase] = useState(0)
  const [wishes, setWishes] = useState([])
  const [exchangeRecords, setExchangeRecords] = useState([])
  const [focusDiary, setFocusDiary] = useState([])
  const [dietRecords, setDietRecords] = useState([])
  const [goals, setGoals] = useState([])
  const [achievements, setAchievements] = useState([])
  const [focusWeeks, setFocusWeeks] = useState([])
  const [pets, setPets] = useState([])
  const [petPlans, setPetPlans] = useState([])
  const [petHistory, setPetHistory] = useState([])
  const [petInventory, setPetInventory] = useState([])
  const [petRations, setPetRations] = useState(0)
  const [petRevivePills, setPetRevivePills] = useState(0)
  const [petCatchupTickets, setPetCatchupTickets] = useState(0)
  const [petWidgetEnabled, setPetWidgetEnabled] = useState(false)
  const [totalScore, setTotalScore] = useState(0)
  const [maxScore, setMaxScore] = useState(0)
  const [theme, setTheme] = useState('light')
  const [greetingEnabled, setGreetingEnabled] = useState(true)
  const [habitLayout, setHabitLayoutState] = useState('grid')
  // 打卡索引：habitId -> 已打卡日期集合。算连续天数时不必逐个习惯去查库
  const [checkIndex, setCheckIndex] = useState({})
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
    const [h, t, b, c, w, e, f, d, g, a, fw, p, pp, ph, pi, sg, sr, gl] = await Promise.all([
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
      getAll(STORE_NAMES.PETS),
      getAll(STORE_NAMES.PET_PLANS),
      getAll(STORE_NAMES.PET_HISTORY),
      getAll(STORE_NAMES.PET_INVENTORY),
      getAll(STORE_NAMES.SAVINGS),
      getAll(STORE_NAMES.SAVINGS_RECORDS),
      getAll(STORE_NAMES.GLOBAL),
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
    setPets(p || [])
    setPetPlans(pp || [])
    setPetHistory(ph || [])
    setPetInventory(pi || [])
    setSavingsGoals(sg || [])
    setSavingsRecords(sr || [])

    // 从 global 表里一次性抽出全部打卡记录并按习惯归档
    // （值只取真值：克制习惯的破戒次数也算"有记录"，但只用于正向习惯的连续天数）
    const idx = {}
    for (const row of gl || []) {
      if (!row || typeof row.key !== 'string' || !row.value) continue
      const parsed = parseCheckKey(row.key)
      if (!parsed) continue
      if (!idx[parsed.habitId]) idx[parsed.habitId] = new Set()
      idx[parsed.habitId].add(parsed.dateStr)
    }
    setCheckIndex(idx)

    // 加载全局设置
    const savedScore = await getGlobal('totalScore')
    const savedMaxScore = await getGlobal('maxScore')
    const savedTheme = await getGlobal('theme')
    const savedGreeting = await getGlobal('greetingEnabled')
    const savedChatCounter = await getGlobal('chatCounter')
    const savedLastWeek = await getGlobal('lastProcessedWeek')
    const savedRations = await getGlobal('petRations')
    const savedRevivePills = await getGlobal('petRevivePills')
    const savedCatchupTickets = await getGlobal('petCatchupTickets')
    const savedPetWidget = await getGlobal('petWidgetEnabled')
    const savedTotalAssets = await getGlobal('totalAssets')
    const savedHabitLayout = await getGlobal('habitLayout')

    setTotalScore(savedScore || 0)
    setMaxScore(savedMaxScore || 0)
    if (savedTheme) setTheme(savedTheme)
    if (savedGreeting !== null) setGreetingEnabled(savedGreeting)
    else setGreetingEnabled(true)
    if (savedChatCounter) setChatCounter(savedChatCounter)
    if (savedLastWeek) lastProcessedWeekKey.current = savedLastWeek
    setPetRations(savedRations || 0)
    setPetRevivePills(savedRevivePills || 0)
    setPetCatchupTickets(savedCatchupTickets || 0)
    setPetWidgetEnabled(!!savedPetWidget)
    setTotalAssetsBase(round2(savedTotalAssets) || 0)
    if (savedHabitLayout === 'grid' || savedHabitLayout === 'list') setHabitLayoutState(savedHabitLayout)

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

  // ===== 资产 / 存钱罐 =====

  /**
   * 期初总资产（用户录入的基准值，存在 global 里）
   * 当前总资产 = 期初 + 累计收入 - 累计支出
   * 可用余额   = 当前总资产 - 存钱罐净额
   */
  const setTotalAssetsBaseValue = useCallback(async (v) => {
    const n = round2(v)
    await setGlobal('totalAssets', n)
    setTotalAssetsBase(n)
    return n
  }, [])

  /** 存钱目标 */
  const addSavingsGoal = useCallback(async (goal) => {
    const newGoal = {
      id: generateId(),
      name: (goal.name || '').trim() || '存钱计划',
      emoji: goal.emoji || DEFAULT_SAVINGS_EMOJI,
      color: goal.color || DEFAULT_COLOR,
      target: round2(goal.target) || 0,
      deadline: goal.deadline || null,
      note: (goal.note || '').trim(),
      status: 'active',
      createdAt: Date.now(),
      doneAt: null,
    }
    await put(STORE_NAMES.SAVINGS, newGoal)
    setSavingsGoals(prev => [...prev, newGoal])
    return newGoal
  }, [])

  const updateSavingsGoal = useCallback(async (goal) => {
    await put(STORE_NAMES.SAVINGS, goal)
    setSavingsGoals(prev => prev.map(g => g.id === goal.id ? goal : g))
  }, [])

  const deleteSavingsGoal = useCallback(async (id) => {
    const owned = savingsRecords.filter(r => r.goalId === id)
    for (const r of owned) await del(STORE_NAMES.SAVINGS_RECORDS, r.id)
    await del(STORE_NAMES.SAVINGS, id)
    setSavingsGoals(prev => prev.filter(g => g.id !== id))
    setSavingsRecords(prev => prev.filter(r => r.goalId !== id))
  }, [savingsRecords])

  /**
   * 存入 / 取出
   * 存入会把钱从「可用余额」划进存钱罐，取出则归还；总资产始终不变
   */
  const addSavingsRecord = useCallback(async (goalId, { amount, type = 'in', date, remark } = {}) => {
    const n = round2(amount)
    if (!(n > 0)) return null
    const goal = savingsGoals.find(g => g.id === goalId)
    if (!goal) return null

    const rec = {
      id: generateId(),
      goalId,
      amount: n,
      type: type === 'out' ? 'out' : 'in',
      date: date || getToday(),
      remark: (remark || '').trim(),
      createTime: Date.now(),
    }
    await put(STORE_NAMES.SAVINGS_RECORDS, rec)
    const nextRecords = [...savingsRecords, rec]
    setSavingsRecords(nextRecords)

    // 达成即自动标记完成（取出导致回落的，不会自动取消完成状态）
    const saved = round2(nextRecords
      .filter(r => r.goalId === goalId)
      .reduce((s, r) => s + (r.type === 'in' ? r.amount : -r.amount), 0))
    if (goal.status === 'active' && goal.target > 0 && saved >= goal.target) {
      const done = { ...goal, status: 'done', doneAt: Date.now() }
      await put(STORE_NAMES.SAVINGS, done)
      setSavingsGoals(prev => prev.map(g => g.id === goalId ? done : g))
    }
    return rec
  }, [savingsGoals, savingsRecords])

  const deleteSavingsRecord = useCallback(async (id) => {
    await del(STORE_NAMES.SAVINGS_RECORDS, id)
    setSavingsRecords(prev => prev.filter(r => r.id !== id))
  }, [])

  const toggleSavingsDone = useCallback(async (goal) => {
    const next = goal.status === 'done'
      ? { ...goal, status: 'active', doneAt: null }
      : { ...goal, status: 'done', doneAt: Date.now() }
    await put(STORE_NAMES.SAVINGS, next)
    setSavingsGoals(prev => prev.map(g => g.id === goal.id ? next : g))
    return next
  }, [])

  // ===== 资产派生值 =====
  const totalIncome = useMemo(() => sumMoney(bills.filter(b => b.type === 'income'), b => b.amount), [bills])
  const totalExpense = useMemo(() => sumMoney(bills.filter(b => b.type === 'expense'), b => b.amount), [bills])
  /** 当前总资产 = 期初 + 收入 - 支出 */
  const assetsTotal = useMemo(() => round2(totalAssetsBase + totalIncome - totalExpense), [totalAssetsBase, totalIncome, totalExpense])
  /** 存钱罐净额（已存进去的钱） */
  const savingsNet = useMemo(() => sumMoney(savingsRecords, r => r.type === 'in' ? r.amount : -r.amount), [savingsRecords])
  /** 可用余额 = 总资产 - 存钱罐 */
  const balance = useMemo(() => round2(assetsTotal - savingsNet), [assetsTotal, savingsNet])

  /** 按目标聚合的存钱情况：{ [goalId]: { saved, records } } */
  const savingsByGoal = useMemo(() => {
    const map = {}
    for (const g of savingsGoals) map[g.id] = { saved: 0, records: [] }
    for (const r of savingsRecords) {
      if (!map[r.goalId]) map[r.goalId] = { saved: 0, records: [] }
      const bucket = map[r.goalId]
      bucket.records.push(r)
      bucket.saved = round2(bucket.saved + (r.type === 'in' ? r.amount : -r.amount))
    }
    for (const key of Object.keys(map)) {
      map[key].records.sort((a, b) => (a.date === b.date ? (b.createTime || 0) - (a.createTime || 0) : (a.date < b.date ? 1 : -1)))
    }
    return map
  }, [savingsGoals, savingsRecords])

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

    const dayHabits = habits.filter(h => weekData.habitIds.includes(h.id))

    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart)
      date.setDate(weekStart.getDate() + i)
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

      for (const habit of dayHabits) {
        const checked = await getGlobal(makeCheckKey(dateStr, habit.id))
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

    const checkKey = makeCheckKey(dateStr, habitId)

    if (habit.type === 'positive') {
      const alreadyChecked = await getGlobal(checkKey)
      if (alreadyChecked) return { already: true }
      await setGlobal(checkKey, true)
      setCheckIndex(prev => {
        const next = new Set(prev[habitId] || [])
        next.add(dateStr)
        return { ...prev, [habitId]: next }
      })
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
    const checkKey = makeCheckKey(dateStr, habitId)

    if (habit.type === 'positive') {
      await delKey(checkKey)
      setCheckIndex(prev => {
        if (!prev[habitId]) return prev
        const next = new Set(prev[habitId])
        next.delete(dateStr)
        return { ...prev, [habitId]: next }
      })
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
    const value = await getGlobal(makeCheckKey(dateStr, habitId))

    if (habit.type === 'positive') {
      return { checked: !!value }
    } else {
      return { count: value || 0 }
    }
  }, [habits])

  /**
   * 习惯到 dateStr 为止的连续打卡天数。
   * 那天还没打卡时从它的前一天往前数 —— "今天还没打卡"不算断。
   */
  const getHabitStreak = useCallback((habitId, dateStr) => {
    return countStreak(checkIndex[habitId], dateStr || getToday())
  }, [checkIndex])

  // ===== 小可怜：数据与逻辑 =====
  const savePetWallet = useCallback(async (rations, pills, tickets) => {
    await setGlobal('petRations', rations)
    await setGlobal('petRevivePills', pills)
    await setGlobal('petCatchupTickets', tickets)
  }, [])

  const checkGraduate = useCallback((pet) => {
    if (pet.growth >= 1000 && pet.status !== 'memorialized' && pet.status !== 'graduated') {
      return { ...pet, status: 'graduated', graduateAt: Date.now(), growth: 1000 }
    }
    return pet
  }, [])

  const addPet = useCallback(async ({ species, name, planName, days, templateTasks }) => {
    const today = getToday()
    const pet = {
      id: generateId(),
      species,
      name: (name || '').trim() || PET_SPECIES[species]?.name || '小可怜',
      planName: (planName || '').trim() || '长期坚持计划',
      growth: 0,
      revivesLeft: 3,
      reviveCount: 0,
      status: 'active',
      createdAt: Date.now(),
      planStart: today,
      planDays: Math.max(1, Number(days) || 30),
      streak: 0,
    }
    const tasks = (templateTasks || []).filter(Boolean).slice(0, 20)
    const plan = { id: pet.id, days: buildPlanDays(today, pet.planDays, tasks) }
    await put(STORE_NAMES.PETS, pet)
    await put(STORE_NAMES.PET_PLANS, plan)
    setPets(prev => [...prev, pet])
    setPetPlans(prev => [...prev, plan])
    return pet
  }, [])

  const togglePetTask = useCallback(async (petId, date, taskId) => {
    const today = getToday()
    if (date !== today) return null
    const pet = pets.find(p => p.id === petId)
    const plan = petPlans.find(p => p.id === petId)
    if (!pet || !plan || pet.status === 'memorialized' || pet.status === 'graduated') return null
    const day = plan.days.find(d => d.date === date)
    if (!day) return null
    const task = day.tasks.find(t => t.id === taskId)
    if (!task) return null

    const wasOk = day.tasks.length > 0 && day.tasks.every(t => t.done)
    task.done = !task.done
    const nowOk = day.tasks.length > 0 && day.tasks.every(t => t.done)
    const newPet = { ...pet }
    const history = [...petHistory]
    let rations = petRations

    if (task.done) {
      newPet.growth = (newPet.growth || 0) + 1
      if (nowOk && !wasOk) {
        const daily = await getGlobal('petDailyRations') || { date: '', amount: 0 }
        if (daily.date !== today) { daily.date = today; daily.amount = 0 }
        const add = Math.min(10, 30 - daily.amount)
        if (add > 0) {
          daily.amount += add
          rations += add
          await setGlobal('petDailyRations', daily)
        }
        const h = history.find(x => x.petId === petId && x.date === date)
        if (h) { h.ok = true; h.viaTicket = false }
        else history.push({ id: `${petId}_${date}`, petId, date, ok: true, viaTicket: false })
      }
    } else {
      newPet.growth = Math.max(0, (newPet.growth || 0) - 1)
      if (wasOk && !nowOk) {
        const daily = await getGlobal('petDailyRations') || { date: '', amount: 0 }
        if (daily.date === today) {
          daily.amount = Math.max(0, daily.amount - 10)
          await setGlobal('petDailyRations', daily)
        }
        rations = Math.max(0, petRations - 10)
        const h = history.find(x => x.petId === petId && x.date === date)
        if (h) h.ok = false
      }
    }

    const finalPet = checkGraduate(newPet)
    const finalView = computePetView(finalPet, plan, history, today)
    const savedPet = { ...finalPet, totalDays: finalView.totalDays, okDays: finalView.okDays }
    await put(STORE_NAMES.PET_PLANS, plan)
    await put(STORE_NAMES.PETS, savedPet)
    await savePetWallet(rations, petRevivePills, petCatchupTickets)
    setPetPlans(prev => prev.map(p => p.id === plan.id ? plan : p))
    setPets(prev => prev.map(p => p.id === savedPet.id ? savedPet : p))
    setPetHistory(history)
    setPetRations(rations)
    return { growth: savedPet.growth, graduate: savedPet.status === 'graduated' }
  }, [pets, petPlans, petHistory, petRations, petRevivePills, petCatchupTickets, checkGraduate, savePetWallet])

  const useCatchupTicket = useCallback(async (petId, date) => {
    const today = getToday()
    if (date >= today) return false
    const pet = pets.find(p => p.id === petId)
    const plan = petPlans.find(p => p.id === petId)
    if (!pet || !plan || pet.status !== 'active') return false
    const view = computePetView(pet, plan, petHistory.filter(h => h.petId === petId), today)
    if (view.state === 'dead') return false
    const day = plan.days.find(d => d.date === date)
    if (!day || day.tasks.length === 0 || day.tasks.every(t => t.done)) return false
    if (petCatchupTickets < 1) return false

    const newPet = { ...pet, growth: pet.growth + day.tasks.length }
    const history = [...petHistory]
    const h = history.find(x => x.petId === petId && x.date === date)
    if (h) { h.ok = true; h.viaTicket = true }
    else history.push({ id: `${petId}_${date}`, petId, date, ok: true, viaTicket: true })

    const daily = await getGlobal('petDailyRations') || { date: '', amount: 0 }
    if (daily.date !== today) { daily.date = today; daily.amount = 0 }
    const add = Math.min(10, 30 - daily.amount)
    const rations = add > 0 ? petRations + add : petRations
    if (add > 0) { daily.amount += add; await setGlobal('petDailyRations', daily) }
    const tickets = petCatchupTickets - 1

    const finalPet = checkGraduate(newPet)
    const finalView = computePetView(finalPet, plan, history, today)
    const savedPet = { ...finalPet, totalDays: finalView.totalDays, okDays: finalView.okDays }
    await put(STORE_NAMES.PETS, savedPet)
    await savePetWallet(rations, petRevivePills, tickets)
    setPets(prev => prev.map(p => p.id === savedPet.id ? savedPet : p))
    setPetHistory(history)
    setPetRations(rations)
    setPetCatchupTickets(tickets)
    return true
  }, [pets, petPlans, petHistory, petRations, petRevivePills, petCatchupTickets, checkGraduate, savePetWallet])

  const revivePet = useCallback(async (petId) => {
    const pet = pets.find(p => p.id === petId)
    if (!pet || pet.status !== 'dead' || pet.revivesLeft <= 0 || petRevivePills < 1) return false
    const newPet = {
      ...pet,
      status: 'active',
      revivesLeft: pet.revivesLeft - 1,
      reviveCount: (pet.reviveCount || 0) + 1,
      deadAt: null,
      revivedAt: today,
      streak: 0,
    }
    const pills = petRevivePills - 1
    await put(STORE_NAMES.PETS, newPet)
    await savePetWallet(petRations, pills, petCatchupTickets)
    setPets(prev => prev.map(p => p.id === newPet.id ? newPet : p))
    setPetRevivePills(pills)
    return true
  }, [pets, petRations, petRevivePills, petCatchupTickets, savePetWallet])

  const buyMarketItem = useCallback(async (itemId) => {
    const item = PET_MARKET_ITEMS.find(i => i.id === itemId)
    if (!item || petRations < item.price) return false
    const rations = petRations - item.price
    await setGlobal('petRations', rations)
    setPetRations(rations)
    if (item.type === 'consumable') {
      if (item.target === 'revivePills') {
        const count = petRevivePills + 1
        await setGlobal('petRevivePills', count)
        setPetRevivePills(count)
      } else {
        const count = petCatchupTickets + 1
        await setGlobal('petCatchupTickets', count)
        setPetCatchupTickets(count)
      }
    } else {
      const owned = { id: generateId(), itemId, species: item.species || null, boughtAt: Date.now() }
      await put(STORE_NAMES.PET_INVENTORY, owned)
      setPetInventory(prev => [...prev, owned])
    }
    return true
  }, [petRations, petRevivePills, petCatchupTickets])

  const updatePetPlanDay = useCallback(async (petId, date, texts) => {
    const plan = petPlans.find(p => p.id === petId)
    if (!plan || date < getToday()) return
    const day = plan.days.find(d => d.date === date)
    if (!day) return
    day.tasks = texts.filter(Boolean).slice(0, 20).map((text, j) => ({
      id: `${date}_${j}`,
      text,
      done: day.tasks[j]?.done || false,
    }))
    await put(STORE_NAMES.PET_PLANS, plan)
    setPetPlans(prev => prev.map(p => p.id === plan.id ? plan : p))
  }, [petPlans])

  const togglePetWidget = useCallback(async () => {
    const v = !petWidgetEnabled
    await setGlobal('petWidgetEnabled', v)
    setPetWidgetEnabled(v)
  }, [petWidgetEnabled])

  // 打卡区布局：grid（三列格子，默认）/ list（紧凑列表）
  const setHabitLayout = useCallback(async (v) => {
    const next = v === 'list' ? 'list' : 'grid'
    await setGlobal('habitLayout', next)
    setHabitLayoutState(next)
  }, [])

  const evaluatePets = useCallback(async () => {
    if (!loaded) return
    const today = getToday()
    let changed = false
    const updatedPets = []
    for (const pet of pets) {
      if (pet.status !== 'active' && pet.status !== 'dead') {
        updatedPets.push(pet)
        continue
      }
      const plan = petPlans.find(p => p.id === pet.id)
      const history = petHistory.filter(h => h.petId === pet.id)
      const view = computePetView(pet, plan, history, today)
      let next = { ...pet, streak: view.streak, totalDays: view.totalDays, okDays: view.okDays }
      if (view.state === 'dead' && next.status === 'active') {
        next.status = 'dead'
        next.deadAt = today
      }
      if (next.status === 'dead' && next.revivesLeft <= 0) {
        next.status = 'memorialized'
        next.memorialAt = today
      }
      next = checkGraduate(next)
      if (JSON.stringify(next) !== JSON.stringify(pet)) {
        await put(STORE_NAMES.PETS, next)
        changed = true
      }
      updatedPets.push(next)
    }
    if (changed) setPets(updatedPets)
  }, [loaded, pets, petPlans, petHistory, checkGraduate])

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
    // 处理小可怜状态
    evaluatePets()
  }, [loaded, categories.length, evaluatePets])

  // 监听主题变化（支持 light / dark / system）
  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const resolve = () => (theme === 'system' ? (mql.matches ? 'dark' : 'light') : theme)

    const apply = () => document.documentElement.setAttribute('data-theme', resolve())
    apply()

    if (theme !== 'system') return
    // 跟随系统时，系统主题变化要实时生效
    mql.addEventListener('change', apply)
    return () => mql.removeEventListener('change', apply)
  }, [theme])

  // 主题偏好持久化（只存用户选择，不存解析结果，否则 system 会被固化）
  useEffect(() => {
    if (!loaded) return
    setGlobal('theme', theme)
    // localStorage 镜像：供 index.html 里的内联脚本在 React 挂载前消除主题闪烁
    try { localStorage.setItem('nep-theme', theme) } catch { /* 忽略 */ }
  }, [theme, loaded])

  // ===== 上下文值 =====
  const value = {
    loaded, habits, tasks, bills, categories, wishes, exchangeRecords,
    focusDiary, dietRecords, goals, achievements, focusWeeks,
    savingsGoals, savingsRecords, savingsByGoal, savingsNet,
    totalAssetsBase, assetsTotal, balance, totalIncome, totalExpense,
    pets, petPlans, petHistory, petInventory,
    petRations, petRevivePills, petCatchupTickets, petWidgetEnabled,
    totalScore, maxScore, theme, greetingEnabled, chatCounter, habitLayout,
    currentDate, setCurrentDate, viewDate, setViewDate,
    updateScore, getCurrentScore, checkAchievements, onScoreChange,
    addHabit, updateHabit, deleteHabit,
    addTask, updateTask, deleteTask,
    addBill, updateBill, deleteBill,
    addCategory, updateCategory, deleteCategory,
    setTotalAssetsBase: setTotalAssetsBaseValue,
    addSavingsGoal, updateSavingsGoal, deleteSavingsGoal,
    addSavingsRecord, deleteSavingsRecord, toggleSavingsDone,
    addWish, updateWish, deleteWish, exchangeWish,
    addFocusDiary, deleteFocusDiary,
    addDietRecord, updateDietRecord, deleteDietRecord,
    addGoal, updateGoal, deleteGoal,
    processFocusWeek, settleFocusWeek,
    checkHabit, uncheckHabit, getHabitStatus, getHabitStreak,
    addPet, togglePetTask, useCatchupTicket, revivePet,
    buyMarketItem, updatePetPlanDay, togglePetWidget, evaluatePets,
    setTheme, setGreetingEnabled, setChatCounter, setHabitLayout,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}



