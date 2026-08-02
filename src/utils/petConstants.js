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

export { PET_LINES, getTimePeriod } from './petLines'

export const PET_WIDGET_TEXT = {
  alive: '今天也要好好活着哦',
  wither: '昨天偷懒了，小可怜有点想你',
  weak: '再不来它就要撑不住了…',
  dead: '小可怜还在等你复活它',
}
