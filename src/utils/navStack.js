/**
 * 浏览器历史「层栈」—— 让手机返回键逐层回退应用内部导航，而不是直接退出。
 *
 * 背景：本项目是离线 PWA（manifest 里 display: standalone），装到桌面后是独立窗口、
 * 没有浏览器工具栏，安卓的系统返回手势只能走浏览器历史。而内部导航原先全是 React state，
 * 浏览器历史里永远只有 1 条 → 一按返回就直接退出整个应用。
 *
 * 模型：全应用共用这一套层栈，每一「层」对应一条真实历史记录。
 *   打开一层（弹窗 / 抽屉 / 二级页 / 切 tab）→ history.pushState
 *   按返回键 → popstate → 弹出最上层
 *   UI 上主动关闭 → 也走 history.back()，让内存栈与浏览器历史永远对称，
 *   否则会留下「幽灵条目」—— 用户以为退到头了，其实还得连按好几次返回。
 *
 * depth 0 = 打开应用时那一页（base）。退无可退时再按返回 = 真的退出应用。
 */

const BASE = { __appDepth: 0, __appBase: true }

let layers = [] // [{ id, onBack, dismissed }]，下标即层序
let seq = 0
let wired = false

function onPop(e) {
  const s = e.state
  const d = s && typeof s.__appDepth === 'number' ? s.__appDepth : 0
  // 一次退多层也要正确（长按返回键 / history.go(-n)）
  while (layers.length > d) {
    const layer = layers.pop()
    if (layer && !layer.dismissed && typeof layer.onBack === 'function') {
      try {
        layer.onBack()
      } catch (err) {
        console.error('[nav] 层回退回调出错：', err)
      }
    }
  }
}

function wire() {
  if (wired) return
  wired = true
  window.addEventListener('popstate', onPop)
}

/**
 * 应用挂载时调用一次：把当前历史条目标成 base，
 * 并清掉刷新 / Service Worker 热更新可能残留的旧层（否则用户会莫名多按几次返回）。
 */
export function initNav() {
  wire()
  const st = window.history.state
  const stale = st && typeof st.__appDepth === 'number' ? st.__appDepth : 0
  layers = []
  if (stale > 0) {
    window.history.go(-stale)
  } else {
    window.history.replaceState(BASE, '')
  }
}

/**
 * 压入一层。
 * @param onBack 这一层被返回键弹掉时要执行的动作（关闭弹窗 / 退二级页 / 切回上个 tab）
 * @returns 层 id，交给 dismissLayer / useBackLayer 管理
 */
export function pushLayer(onBack) {
  wire()
  const layer = { id: ++seq, onBack, dismissed: false }
  layers.push(layer)
  window.history.pushState({ __appDepth: layers.length }, '')
  return layer.id
}

/** 标记某层已由 UI 主动关闭，popstate 弹到它时不再触发 onBack */
export function dismissLayer(id) {
  const i = layers.findIndex(l => l.id === id)
  if (i !== -1) layers[i].dismissed = true
}

/**
 * 请求回退一层，优先交给浏览器历史（保证对称）。
 * @returns true 已交给 history；false 表示当前没有层可退（调用方自行处理）
 */
export function back() {
  if (layers.length > 0) {
    window.history.back()
    return true
  }
  return false
}

/** 当前层数（调试与自动化测试用） */
export function layerDepth() {
  return layers.length
}
