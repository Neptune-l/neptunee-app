/**
 * 马卡龙功能色板
 *
 * 铁律：**浅色只做填充，深同伴管一切文字与描边。**
 * 亮青主色 #6AE6FA 压在纸底上只有 1.37:1，当文字/线条必然发飘；
 * 浅马卡龙同理。所以每组都给两个值，成对使用。
 *
 * 用法：元素上挂 data-mc="<key>"，CSS 侧在亮/暗两套主题里各配一组
 * `--m-fill` / `--m-ink`，元素直接用即可，不需要在 JSX 里拼颜色。
 */

/** 10 组马卡龙，顺序即调色板的排列顺序 */
export const MACARON_KEYS = ['rose', 'peach', 'butter', 'mint', 'sage', 'sky', 'lilac', 'peri', 'coral', 'pink']

/**
 * fill  亮色模式的填充
 * ink   亮色模式的深同伴（文字 / 描边 / 细条）
 * dFill 暗色模式的填充（深底）
 * dInk  暗色模式的深同伴（此时要反过来变浅，才压得住深底）
 */
export const MACARON = {
  rose: { fill: '#FED9E5', ink: '#BE4568', dFill: '#3B2230', dInk: '#FF9DBB' },
  peach: { fill: '#FFD1BA', ink: '#B25429', dFill: '#3E2A20', dInk: '#FFB483' },
  butter: { fill: '#FFF5D1', ink: '#8E7113', dFill: '#3A3320', dInk: '#E8C86A' },
  mint: { fill: '#C3EDE2', ink: '#1B7A65', dFill: '#173A35', dInk: '#6FE3C6' },
  sage: { fill: '#B7DDA4', ink: '#487528', dFill: '#26361F', dInk: '#A9DE8F' },
  sky: { fill: '#CADCF4', ink: '#335C9B', dFill: '#1D2C46', dInk: '#9CBDEE' },
  lilac: { fill: '#D5BDF1', ink: '#69419F', dFill: '#2C2242', dInk: '#C4A6F0' },
  peri: { fill: '#A2C1EC', ink: '#2C559E', dFill: '#1E2E4A', dInk: '#9BBCF0' },
  coral: { fill: '#FED5D5', ink: '#AE4343', dFill: '#3A2323', dInk: '#FF9E9E' },
  pink: { fill: '#FEB5BE', ink: '#B33A55', dFill: '#3A2029', dInk: '#FF9DB0' },
}

/** 旧版 20 色 → 新 key。老数据里存的都是这批值，显式映射比算距离准 */
const LEGACY = {
  '#F2B8C6': 'rose', '#F8D2B8': 'peach', '#FCE4BA': 'butter', '#B8E2D0': 'mint',
  '#C4D7F0': 'sky', '#DCC2F0': 'lilac', '#F4ACAC': 'coral', '#FAC8CD': 'pink',
  '#F5D5C5': 'peach', '#FFF0C5': 'butter', '#B8E0D0': 'mint', '#C8E0E8': 'sky',
  '#D8C8E8': 'lilac', '#E8C0C8': 'rose', '#E8D0B8': 'peach', '#C8D8B8': 'sage',
  '#B8D0E8': 'peri', '#E0B8D0': 'pink', '#F0D0B8': 'peach', '#D0E0B8': 'sage',
}

function hex2rgb(hex) {
  if (typeof hex !== 'string') return null
  let h = hex.trim()
  if (h[0] === '#') h = h.slice(1)
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
  if (h.length !== 6 || /[^0-9a-fA-F]/.test(h)) return null
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

/**
 * 把任意（含用户自定义的）颜色归到最近的一组马卡龙。
 * 归组而不是直接改用户数据 —— 数据库里存的颜色保持原样，
 * 只是渲染时统一成「浅填充 + 深同伴」，亮暗两套自动配对。
 */
export function macaronKeyOf(color, fallbackIndex = 0) {
  const fallback = MACARON_KEYS[((fallbackIndex % MACARON_KEYS.length) + MACARON_KEYS.length) % MACARON_KEYS.length]
  if (!color) return fallback
  const key = typeof color === 'string' ? color.toUpperCase() : ''
  if (LEGACY[key]) return LEGACY[key]
  if (MACARON[color]) return color
  const c = hex2rgb(color)
  if (!c) return fallback
  let best = fallback
  let bestD = Infinity
  for (const k of MACARON_KEYS) {
    const p = hex2rgb(MACARON[k].fill)
    const d = (c[0] - p[0]) ** 2 + (c[1] - p[1]) ** 2 + (c[2] - p[2]) ** 2
    if (d < bestD) { bestD = d; best = k }
  }
  return best
}

export function macaronOf(color, fallbackIndex = 0) {
  return MACARON[macaronKeyOf(color, fallbackIndex)]
}

/** canvas 之类的 JS 场景：直接取当前主题该用的填充 / 深同伴 */
export function macaronFill(color, theme, fallbackIndex = 0) {
  const m = macaronOf(color, fallbackIndex)
  return theme === 'dark' ? m.dFill : m.fill
}

export function macaronInk(color, theme, fallbackIndex = 0) {
  const m = macaronOf(color, fallbackIndex)
  return theme === 'dark' ? m.dInk : m.ink
}

/** 按顺序轮转取色，适合「一堆同类项但没有各自的颜色」的场景 */
export function macaronByIndex(i) {
  return MACARON[MACARON_KEYS[((i % MACARON_KEYS.length) + MACARON_KEYS.length) % MACARON_KEYS.length]]
}
