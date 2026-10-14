import { useCallback, useEffect, useRef } from 'react'
import { back, dismissLayer, pushLayer } from '../utils/navStack'

/**
 * 把一个「层」接入浏览器历史栈 —— 弹窗 / 抽屉 / 内联二级页都适用。
 *
 * @param isOpen  是否处于打开状态：false→true 压层，true→false 弹层
 * @param onClose 返回键弹到这一层时要做的关闭动作（也就是组件真正的 onClose）
 * @returns requestClose —— UI 上主动关闭时调它（点 X、点遮罩、点取消），
 *          不要直接调 onClose，这样历史条目才会被一起撤掉。
 */
export function useBackLayer(isOpen, onClose) {
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  const poppedRef = useRef(false) // 这一层是被「返回键」弹掉的吗
  const closingRef = useRef(false) // 是否已经发起过回退，避免重复
  const idRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return

    poppedRef.current = false
    closingRef.current = false
    idRef.current = pushLayer(() => {
      poppedRef.current = true
      if (closeRef.current) closeRef.current()
    })

    return () => {
      const id = idRef.current
      idRef.current = null
      // 组件已卸载：若这层不是被返回键弹掉的（即 UI 主动关闭），
      // 补一次回退把刚压的条目撤掉；先标 dismissed，免得这次 popstate 又调一遍 onClose。
      if (!poppedRef.current && !closingRef.current) {
        if (id != null) dismissLayer(id)
        back()
      }
    }
  }, [isOpen])

  return useCallback(() => {
    if (closingRef.current) return
    closingRef.current = true
    // 交给 popstate 统一驱动 onClose；没有层可退时直接关（理论上不会发生）
    if (!back() && closeRef.current) closeRef.current()
  }, [])
}
