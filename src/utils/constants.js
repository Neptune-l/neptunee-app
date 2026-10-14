// 颜色常量 —— 20 组马卡龙填充色（真正的深同伴由 utils/palette.js 配对）
// 顺序与 palette.js 的 MACARON_KEYS 一致，改这里也要同步改那边
export const MACARON_COLORS = [
  '#FED9E5', // rose   粉
  '#FFD1BA', // peach  蜜桃
  '#FFF5D1', // butter 奶油
  '#C3EDE2', // mint   薄荷
  '#B7DDA4', // sage   鼠尾草
  '#CADCF4', // sky    淡蓝
  '#D5BDF1', // lilac  淡紫
  '#A2C1EC', // peri   中蓝
  '#FED5D5', // coral  珊瑚
  '#FEB5BE', // pink   玫粉
  '#CDF3F0', // teal   湖水
  '#CAEDF6', // aqua   晴空
  '#D4D5F2', // indigo 靛蓝
  '#EDD2F4', // mauve  藕荷
  '#F6D0EB', // berry  莓紫
  '#EAF4C7', // lime   嫩芽
  '#D7E7C5', // olive  橄榄
  '#EDDED4', // cocoa  可可
  '#DAE3E7', // slate  石板
  '#F0E9D6', // sand   暖沙
]

// 默认颜色
export const DEFAULT_COLOR = '#FED9E5'
export const DEFAULT_EMOJI = '💪'

// 存储键名
export const STORE_NAMES = {
  HABITS: 'habits',
  TASKS: 'tasks',
  BILLS: 'bills',
  CATEGORIES: 'categories',
  SAVINGS: 'savingsGoals',
  SAVINGS_RECORDS: 'savingsRecords',
  WISHES: 'wishes',
  EXCHANGE_RECORDS: 'exchangeRecords',
  FOCUS_DIARY: 'focusDiary',
  DIET_RECORDS: 'dietRecords',
  GOALS: 'goals',
  ACHIEVEMENTS: 'achievements',
  FOCUS_WEEKS: 'focusWeeks',
  PETS: 'pets',
  PET_PLANS: 'petPlans',
  PET_HISTORY: 'petHistory',
  PET_INVENTORY: 'petInventory',
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

// 默认分类（首次启动时写入；已有数据不会被覆盖）
// color 只存浅色填充，深同伴由 palette.js 配对
// icon 是 src/utils/icons.js 里的 slug；emoji 作为老数据/兜底保留
export const DEFAULT_CATEGORIES = [
  { name: '餐饮', emoji: '🍜', icon: 'noodle', color: '#FED9E5', type: 'expense' },
  { name: '交通', emoji: '🚗', icon: 'car', color: '#CADCF4', type: 'expense' },
  { name: '购物', emoji: '🛍️', icon: 'cart', color: '#D5BDF1', type: 'expense' },
  { name: '居住', emoji: '🏠', icon: 'sleep-bed', color: '#A2C1EC', type: 'expense' },
  { name: '娱乐', emoji: '🎮', icon: 'game', color: '#FFD1BA', type: 'expense' },
  { name: '医疗', emoji: '💊', icon: 'pills', color: '#C3EDE2', type: 'expense' },
  { name: '工资', emoji: '💰', icon: 'cash', color: '#B7DDA4', type: 'income' },
  { name: '兼职', emoji: '🧾', icon: 'laptop', color: '#FFF5D1', type: 'income' },
  { name: '红包', emoji: '🧧', icon: 'redpacket', color: '#FED5D5', type: 'income' },
]

// 新建分类时的占位图标
export const DEFAULT_CATEGORY_ICON = 'folder'
// 新建愿望时的占位图标
export const DEFAULT_WISH_ICON = 'gift'

// 餐段选项
export const MEAL_SLOTS = ['早', '午', '晚', '加餐']

// 存钱罐预设图标（slug，见 utils/icons.js）；原 SAVINGS_EMOJIS 已被图标取代
export const SAVINGS_ICON_PRESETS = [
  'piggy', 'cash', 'redpacket', 'growth', 'plane', 'car', 'phone-tap', 'laptop',
  'camera', 'game', 'headphone', 'bike', 'coffee', 'plant', 'gift', 'meditate',
]

// 存钱罐默认值（老数据兜底 emoji）
export const DEFAULT_SAVINGS_EMOJI = '🐷'

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
