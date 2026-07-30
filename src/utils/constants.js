// 颜色常量 - 20个暖调马卡龙色
export const MACARON_COLORS = [
  '#F2B8C6', // 柔粉
  '#F8D2B8', // 蜜桃橙
  '#FCE4BA', // 浅黄
  '#B8E2D0', // 薄荷绿
  '#C4D7F0', // 天蓝
  '#DCC2F0', // 淡紫
  '#F4ACAC', // 豆沙红
  '#FAC8CD', // 粉红
  '#F5D5C5', // 杏色
  '#FFF0C5', // 奶油黄
  '#B8E0D0', // 浅绿
  '#C8E0E8', // 青蓝
  '#D8C8E8', // 紫罗兰
  '#E8C0C8', // 玫瑰粉
  '#E8D0B8', // 浅棕
  '#C8D8B8', // 草绿
  '#B8D0E8', // 雾蓝
  '#E0B8D0', // 紫粉
  '#F0D0B8', // 橘色
  '#D0E0B8', // 嫩绿
]

// 默认颜色
export const DEFAULT_COLOR = '#F2B8C6'
export const DEFAULT_EMOJI = '💪'

// 存储键名
export const STORE_NAMES = {
  HABITS: 'habits',
  TASKS: 'tasks',
  BILLS: 'bills',
  CATEGORIES: 'categories',
  WISHES: 'wishes',
  EXCHANGE_RECORDS: 'exchangeRecords',
  FOCUS_DIARY: 'focusDiary',
  DIET_RECORDS: 'dietRecords',
  GOALS: 'goals',
  ACHIEVEMENTS: 'achievements',
  FOCUS_WEEKS: 'focusWeeks',
  GLOBAL: 'global',
}

// 成就徽章配置（固定）
export const ACHIEVEMENTS_CONFIG = [
  { id: 'score_100', name: '积分新芽', emoji: '🌱', condition: '历史最高积分首次达 100', check: (maxScore) => maxScore >= 100 },
  { id: 'score_500', name: '积分成长', emoji: '🌿', condition: '历史最高积分首次达 500', check: (maxScore) => maxScore >= 500 },
  { id: 'score_1000', name: '积分达人', emoji: '🌳', condition: '历史最高积分首次达 1000', check: (maxScore) => maxScore >= 1000 },
  { id: 'score_5000', name: '积分王者', emoji: '👑', condition: '历史最高积分首次达 5000', check: (maxScore) => maxScore >= 5000 },
]

// Toast 持续时间
export const TOAST_DURATION = 3000

// 定时器配置
export const TIMER_TICK_MS = 1000

// 随机选择器最大选项数
export const MAX_PICKER_OPTIONS = 20

// 每周焦点挑战配置
export const FOCUS_WEEK_HABIT_COUNT = 3
export const FOCUS_WEEK_TARGET_DAYS = 18
export const FOCUS_WEEK_REWARD = 30

// 习惯遗忘预警阈值
export const FORGET_DAYS_WARN = 3
export const FORGET_DAYS_CRITICAL = 7

// 默认分类
export const DEFAULT_CATEGORIES = [
  { name: '餐饮', emoji: '🍜', color: '#F2B8C6', type: 'expense' },
  { name: '交通', emoji: '🚗', color: '#F8D2B8', type: 'expense' },
  { name: '购物', emoji: '🛍️', color: '#FCE4BA', type: 'expense' },
]

// 餐段选项
export const MEAL_SLOTS = ['早', '午', '晚', '加餐']

// Emoji 分类列表
export const EMOJI_CATEGORIES = [
  {
    name: '表情',
    items: ['😀','😊','🥰','😎','🤩','😌','🤗','😤','😴','🥺','😂','🤣','😅','🙂','😇','🤔','😏','🙄','😬','😮','😯','😳','🥵','😰','🤯','😭','😈','👻','💀','☠️','👽','🤖']
  },
  {
    name: '物品',
    items: ['📱','💻','⌚️','📷','🎧','🖥️','⌨️','🖱️','💡','🔑','📚','✏️','📝','📌','📎','✂️','🔧','🔨','💎','🎁','📦','🧸','🪴','🖼️','🎨','🧩','🎯','🏆','🥇','📀']
  },
  {
    name: '活动',
    items: ['🏃','🚶','🧘','🏋️','🤸','⛹️','🚴','🏊','🧗','⛷️','🏄','🎮','📖','🎵','🎬','✈️','🚗','🚲','🏕️','🎪','🎭','🎤','🎸','🎹','🎲','♟️','🧶','📺','🎳','⛳']
  },
  {
    name: '食物',
    items: ['🍎','🍊','🍋','🍌','🍇','🍓','🫐','🍑','🍒','🥝','🍅','🥑','🥦','🥕','🌽','🍞','🧀','🥚','🍳','🥘','🍲','🥗','🍣','🍜','🍝','🍔','🌭','🍕','🥤','🧋','☕️','🍺','🍷','🧁','🍰']
  },
  {
    name: '符号',
    items: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','💖','💝','✨','🌟','⭐️','🔥','💪','✅','❌','💯','🔴','🟠','🟡','🟢','🔵','🟣','🟤','⚫️','⚪️','🆗','🆕','🚫','🛑','💤']
  },
  {
    name: '自然',
    items: ['🌞','🌈','🌤️','⛅️','🌦️','☁️','🌧️','⛈️','❄️','🌪️','🔥','🌋','🏔️','🏖️','🏜️','🏝️','🌲','🌳','🌴','🌵','🌸','🌺','🌻','🌹','🌷','🌿','🍀','☘️','🍄','🐚']
  },
  {
    name: '动物',
    items: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🐔','🐧','🐦','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🐛','🦋','🐌','🐞','🐜','🐪','🦒','🦘','🐕','🐈']
  },
]
