import React, { useState, useCallback, useEffect } from 'react'
import { TOAST_DURATION } from '../utils/constants'
import { setGlobalToast } from '../store/store'

let toastIdCounter = 0

export default function ToastManager() {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((msg) => {
    const id = ++toastIdCounter
    setToasts(prev => [...prev, { id, msg, leaving: false }])
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, leaving: true } : t))
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, 200)
    }, TOAST_DURATION)
  }, [])

  useEffect(() => {
    setGlobalToast(addToast)
  }, [addToast])

  if (toasts.length === 0) return null

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast${t.leaving ? ' leaving' : ''}`}>{t.msg}</div>
      ))}
    </div>
  )
}
