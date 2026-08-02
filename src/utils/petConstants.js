import catAlive from '../assets/pet/cat_alive.png'
import catDead from '../assets/pet/cat_dead.png'
import catIcon from '../assets/pet/cat_icon.png'
import catStage1 from '../assets/pet/cat_stage1.png'
import catStage2 from '../assets/pet/cat_stage2.png'
import catStage3 from '../assets/pet/cat_stage3.png'
import catStage4 from '../assets/pet/cat_stage4.png'
import catStage5 from '../assets/pet/cat_stage5.png'
import catWeak from '../assets/pet/cat_weak.png'
import catWither from '../assets/pet/cat_wither.png'
import dogAlive from '../assets/pet/dog_alive.png'
import dogDead from '../assets/pet/dog_dead.png'
import dogIcon from '../assets/pet/dog_icon.png'
import dogStage1 from '../assets/pet/dog_stage1.png'
import dogStage2 from '../assets/pet/dog_stage2.png'
import dogStage3 from '../assets/pet/dog_stage3.png'
import dogStage4 from '../assets/pet/dog_stage4.png'
import dogStage5 from '../assets/pet/dog_stage5.png'
import dogWeak from '../assets/pet/dog_weak.png'
import dogWither from '../assets/pet/dog_wither.png'
import iconGraduate from '../assets/pet/icon_graduate.png'
import iconMemorial from '../assets/pet/icon_memorial.png'
import itemCatchupTicket from '../assets/pet/item_catchup_ticket.png'
import itemCatFish from '../assets/pet/item_cat_fish.png'
import itemCatStick from '../assets/pet/item_cat_stick.png'
import itemCatYarn from '../assets/pet/item_cat_yarn.png'
import itemCommonBow from '../assets/pet/item_common_bow.png'
import itemDogBall from '../assets/pet/item_dog_ball.png'
import itemDogBone from '../assets/pet/item_dog_bone.png'
import itemDogFrisbee from '../assets/pet/item_dog_frisbee.png'
import itemRation from '../assets/pet/item_ration.png'
import itemRevivePill from '../assets/pet/item_revive_pill.png'

export const PET_SPECIES = {
  cat: {
    key: 'cat',
    name: '像素猫崽',
    tagline: '傲娇毒舌 · 别扭嘴硬',
    icon: catIcon,
    stages: [catStage1, catStage2, catStage3, catStage4, catStage5],
    states: { alive: catAlive, wither: catWither, weak: catWeak, dead: catDead },
    accent: '#F2B8C6',
  },
  dog: {
    key: 'dog',
    name: '像素犬崽',
    tagline: '热情粘人 · 委屈小狗',
    icon: dogIcon,
    stages: [dogStage1, dogStage2, dogStage3, dogStage4, dogStage5],
    states: { alive: dogAlive, wither: dogWither, weak: dogWeak, dead: dogDead },
    accent: '#F8D2B8',
  },
}

export const PET_STAGE_THRESHOLDS = [0, 100, 300, 600, 1000]

export function getPetStage(growth) {
  let stage = 1
  for (let i = 1; i < PET_STAGE_THRESHOLDS.length; i++) {
    if (growth >= PET_STAGE_THRESHOLDS[i]) stage = i + 1
  }
  return stage
}

export function getPetState(missedDays) {
  if (missedDays <= 0) return 'alive'
  if (missedDays === 1) return 'wither'
  if (missedDays === 2) return 'weak'
  return 'dead'
}

export const PET_STATE_META = {
  alive: { name: '安稳存活', mood: '明亮 · 微动', color: '#7BC5A0' },
  wither: { name: '饥饿萎靡', mood: '第一天偷懒', color: '#E8B36B' },
  weak: { name: '日渐虚弱', mood: '强预警 · 最委屈', color: '#D08A7C' },
  dead: { name: '沉寂', mood: '主人我好像有点死了...', color: '#8B8178' },
}

export const PET_MARKET_ITEMS = [
  { id: 'revive_pill', name: '续命丸', desc: '沉寂后复活小可怜，消耗 1 次复活额度', price: 300, img: itemRevivePill, type: 'consumable', target: 'revivePills' },
  { id: 'catchup_ticket', name: '打卡券', desc: '补任意一天未完成的打卡，一张补一天', price: 70, img: itemCatchupTicket, type: 'consumable', target: 'catchupTickets' },
  { id: 'cat_stick', name: '猫抓棒', desc: '猫崽的观赏玩具', price: 55, img: itemCatStick, type: 'decor', species: 'cat' },
  { id: 'cat_yarn', name: '毛线球', desc: '猫崽的观赏玩具', price: 65, img: itemCatYarn, type: 'decor', species: 'cat' },
  { id: 'cat_fish', name: '小鱼干', desc: '猫崽的观赏小零食', price: 50, img: itemCatFish, type: 'decor', species: 'cat' },
  { id: 'dog_frisbee', name: '飞盘', desc: '犬崽的观赏玩具', price: 60, img: itemDogFrisbee, type: 'decor', species: 'dog' },
  { id: 'dog_ball', name: '球', desc: '犬崽的观赏玩具', price: 55, img: itemDogBall, type: 'decor', species: 'dog' },
  { id: 'dog_bone', name: '骨头', desc: '犬崽的观赏小零食', price: 70, img: itemDogBone, type: 'decor', species: 'dog' },
  { id: 'common_bow', name: '蝴蝶结', desc: '通用观赏装饰', price: 80, img: itemCommonBow, type: 'decor' },
]

export const PET_ITEM_ICON = {
  ration: itemRation,
  revive_pill: itemRevivePill,
  catchup_ticket: itemCatchupTicket,
  icon_graduate: iconGraduate,
  icon_memorial: iconMemorial,
}

export const PET_MARKET_IMG = Object.fromEntries(PET_MARKET_ITEMS.map(i => [i.id, i.img]))

export const PET_LINES = {
  cat: {
    alive: [
      '哼，今天倒是干得不错嘛……别得意，本喵只是刚好心情好。',
      '（扭头）才、才不是在等你回来呢，只是刚好路过门口。',
      '今天也很努力嘛，勉强夸你一句好了，喵。',
      '本喵可没在关心你，就是觉得你看起来没昨天那么狼狈了。',
      '喂，水，我闻到你今天有好好活着的气味了。',
    ],
    wither: [
      '你昨天没来……本喵可没在等你，只是恰好一直蹲在门口而已。',
      '（耳朵动了动）哼，不来就不来，本喵才不在乎。',
      '肚子有点饿了……但绝对不是因为你没来喂。',
      '喵……你最好是在忙正事，不然本喵真的要生气了。',
    ],
    weak: [
      '你、你最好是真的在忙……本喵才不是饿得没力气说话。',
      '（声音变软）喂……你再不来，我可能就……没力气嫌弃你了。',
      '好冷……你今天会不会来？本喵勉强允许你摸一下头。',
      '本喵才没哭，是眼睛自己湿掉的。',
    ],
    dead: [
      '主人……我好像有点死了……',
      '（静止）…………',
      '好安静……这次是真的不生气了。',
    ],
    evening: [
      '都这么晚了，你还没来！本喵可不会一直等你的！',
      '（尾巴甩了甩）喂，今天的事还没做完吧？',
      '天黑了，本喵在等一个还没出现的人。',
    ],
  },
  dog: {
    alive: [
      '主人！主人！你今天超棒的！汪！我就知道你最厉害啦！',
      '嘿嘿，今天也能看到主人，我超开心的！',
      '汪！我闻到你今天有努力过的味道了！',
      '主人摸我头！我尾巴已经摇成螺旋桨啦！',
      '今天也平安回来了，真是太好了呜。',
    ],
    wither: [
      '主人……今天没看到你，我一直在门口趴着等你回来呜。',
      '呜……你是不是忘记我了？我、我会乖乖等着的。',
      '（耷拉着耳朵）今天没有人陪我玩，好安静……',
      '主人明天会来吗？我会在这里等的！',
    ],
    weak: [
      '主人……你是不是不要我了……我会乖乖的，你别走好不好……',
      '呜……我饿得没力气摇尾巴了……',
      '（趴在地上）主人……我好想你……',
      '对不起……是我哪里做得不好吗……',
    ],
    dead: [
      '主人……我好像有点死了……',
      '（静止）…………',
      '呜……再也没有力气等你了……',
    ],
    evening: [
      '主人！都晚上了，你今天是不是忘了什么！汪！',
      '（趴在门口）天黑了……主人还没来……',
      '汪！再不来我就把门盯出一个洞啦！',
    ],
  },
}

export const PET_WIDGET_TEXT = {
  alive: '今天也要好好活着哦',
  wither: '昨天偷懒了，小可怜有点想你',
  weak: '再不来它就要撑不住了…',
  dead: '小可怜还在等你复活它',
}
