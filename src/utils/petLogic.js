import { getPetStage, getPetState } from './petConstants'
import { formatDate } from './date'

export function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return formatDate(d)
}

export function dateList(startDateStr, endDateStr) {
  const out = []
  let cur = startDateStr
  while (cur <= endDateStr) {
    out.push(cur)
    cur = addDays(cur, 1)
  }
  return out
}

export function buildPlanDays(startDate, days, templateTasks) {
  return Array.from({ length: days }, (_, i) => {
    const date = addDays(startDate, i)
    return {
      date,
      tasks: templateTasks.map((text, j) => ({ id: `${date}_${j}`, text, done: false })),
    }
  })
}

export function dayOk(plan, history, date) {
  const day = plan?.days?.find(d => d.date === date)
  if (!day || day.tasks.length === 0) return { ok: true, empty: true, viaTicket: false }
  if (day.tasks.every(t => t.done)) return { ok: true, empty: false, viaTicket: false }
  const h = history.find(x => x.date === date)
  if (h?.viaTicket) return { ok: true, empty: false, viaTicket: true }
  return { ok: false, empty: false, viaTicket: false }
}

export function computePetView(pet, plan, history, today) {
  if (!pet) return null
  const start = pet.planStart || formatDate(new Date(pet.createdAt))
  const allDates = dateList(start, today)
  const days = allDates.map(date => {
    const st = dayOk(plan, history, date)
    return { date, ok: st.ok, empty: st.empty, viaTicket: st.viaTicket }
  })
  const chainStart = pet.revivedAt ? addDays(pet.revivedAt, 1) : start

  let missed = 0
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].date < chainStart) break
    if (!days[i].ok) missed++
    else break
  }
  const state = getPetState(missed)

  let streak = 0
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].date < chainStart) break
    if (days[i].ok) streak++
    else break
  }

  const todayDay = plan?.days?.find(d => d.date === today)
  const todayTasks = todayDay?.tasks || []
  const todayDone = todayTasks.filter(t => t.done).length
  const todayOk = todayTasks.length === 0 || todayDone === todayTasks.length

  const stage = getPetStage(pet.growth)
  const graduate = pet.growth >= 1000

  return {
    pet,
    state,
    missed,
    streak,
    totalDays: days.length,
    okDays: days.filter(d => d.ok).length,
    days,
    todayTasks,
    todayDone,
    todayOk,
    stage,
    graduate,
  }
}
