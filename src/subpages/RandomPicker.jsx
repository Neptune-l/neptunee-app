import React, { useState, useEffect, useRef } from 'react'
import { showGlobalToast } from '../store/store'
import { MAX_PICKER_OPTIONS } from '../utils/constants'
import ConfirmModal from '../components/ConfirmModal'

const COLORS = ['#F2B8C6','#F8D2B8','#FCE4BA','#B8E2D0','#C4D7F0','#DCC2F0','#F4ACAC','#FAC8CD','#F5D5C5','#FFF0C5','#B8E0D0','#C8E0E8','#D8C8E8','#E8C0C8','#E8D0B8','#C8D8B8','#B8D0E8','#E0B8D0','#F0D0B8','#D0E0B8']

function loadScenarios() {
  try { return JSON.parse(localStorage.getItem('pickerScenarios') || '[]') }
  catch { return [] }
}
function saveScenarios(scenarios) {
  localStorage.setItem('pickerScenarios', JSON.stringify(scenarios))
}
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

function ScenarioPicker({ scenarios, onEnter, onDelete, onCreate }) {
  const [name, setName] = useState('')
  const [confirmDel, setConfirmDel] = useState(null)

  const handleCreate = () => {
    if (!name.trim()) { showGlobalToast('请输入场景名称'); return }
    const ns = { id: genId(), name: name.trim(), options: ['', ''] }
    const updated = [...scenarios, ns]
    saveScenarios(updated)
    onCreate(updated)
    setName('')
    onEnter(ns.id)
  }

  return (
    <div>
      <div className="settings-group">
        <div className="settings-group-title">创建新场景</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input className="form-input" placeholder="输入场景名称" value={name} onChange={e => setName(e.target.value)} maxLength={20} />
          <button className="btn btn-primary" onClick={handleCreate}>创建并编辑选项</button>
        </div>
      </div>
      <div className="settings-group">
        <div className="settings-group-title">已有场景</div>
        {scenarios.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">🎲</div><div className="empty-text">还没有场景，创建一个吧</div></div>
        ) : (
          scenarios.map(scene => (
            <div key={scene.id} className="settings-item" onClick={() => onEnter(scene.id)}>
              <div className="settings-left"><span className="settings-label">{scene.name}</span></div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{scene.options.filter(o => o.trim()).length} 项</span>
                <button className="btn btn-sm btn-danger" onClick={(e) => { e.stopPropagation(); setConfirmDel(scene.id) }}>删除</button>
              </div>
            </div>
          ))
        )}
      </div>
      {confirmDel && <ConfirmModal message="删除此场景？" icon="⚠️" onConfirm={() => { const u = scenarios.filter(s => s.id !== confirmDel); saveScenarios(u); onDelete(u); setConfirmDel(null) }} onCancel={() => setConfirmDel(null)} />}
    </div>
  )
}

function ScenarioEditor({ scenario, onBack, onUpdate }) {
  const [mode, setMode] = useState('list')
  const [options, setOptions] = useState(scenario?.options || ['', ''])
  const [result, setResult] = useState('')
  const [isSpinning, setIsSpinning] = useState(false)
  const [sceneName, setSceneName] = useState(scenario?.name || '')
  const canvasRef = useRef(null)
  const rotRef = useRef(0)
  const animRef = useRef(null)

  useEffect(() => { if (mode === 'wheel' && options.some(o => o.trim())) drawWheel(0) }, [mode, options])

  const save = () => {
    const ss = loadScenarios(); const idx = ss.findIndex(s => s.id === scenario.id)
    if (idx >= 0) { ss[idx].options = options; ss[idx].name = sceneName; saveScenarios(ss); if (onUpdate) onUpdate(ss) }
  }
  useEffect(() => { const t = setTimeout(save, 1000); return () => clearTimeout(t) }, [options, sceneName])

  const drawWheel = (rot) => {
    const c = canvasRef.current; if (!c) return
    const ctx = c.getContext('2d'), dpr = window.devicePixelRatio || 1
    c.width = 280 * dpr; c.height = 280 * dpr; ctx.scale(dpr, dpr)
    const valid = options.filter(o => o.trim())
    if (valid.length === 0) return
    const cx = 140, cy = 140, r = 130, sa = (2 * Math.PI) / valid.length
    valid.forEach((opt, i) => {
      const a = rot + i * sa
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, a, a + sa); ctx.closePath()
      ctx.fillStyle = COLORS[i % COLORS.length]; ctx.fill()
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke()
      const ta = a + sa / 2
      ctx.save(); ctx.translate(cx + Math.cos(ta) * r * 0.65, cy + Math.sin(ta) * r * 0.65); ctx.rotate(ta)
      ctx.fillStyle = '#443E46'; ctx.font = '12px sans-serif'; ctx.textAlign = 'right'; ctx.fillText(opt, 0, 4)
      ctx.restore()
    })
    ctx.beginPath(); ctx.arc(cx, cy, 20, 0, Math.PI * 2)
    ctx.fillStyle = '#FFF7F4'; ctx.fill(); ctx.strokeStyle = '#F2B8C6'; ctx.lineWidth = 2; ctx.stroke()
  }

  const handleSpin = () => {
    const valid = options.filter(o => o.trim())
    if (valid.length < 2) { showGlobalToast('至少需要2个选项'); return }
    if (isSpinning) return
    setIsSpinning(true); setResult('')
    const dur = 3000, total = Math.PI * 2 * (5 + Math.random() * 3), start = performance.now(), startRot = rotRef.current
    const anim = (t) => {
      const p = Math.min((t - start) / dur, 1), eased = 1 - Math.pow(1 - p, 3), cur = startRot + total * eased
      rotRef.current = cur; drawWheel(cur)
      if (p < 1) { animRef.current = requestAnimationFrame(anim) }
      else {
        setIsSpinning(false)
        const sa = (2 * Math.PI) / valid.length, nr = ((cur % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
        setResult(valid[Math.floor(((Math.PI * 2 - nr + Math.PI / 2) % (Math.PI * 2)) / sa) % valid.length])
      }
    }
    animRef.current = requestAnimationFrame(anim)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <button className="back-btn" onClick={() => { save(); onBack() }}>‹</button>
        <input className="form-input" value={sceneName} onChange={e => setSceneName(e.target.value)} maxLength={20} style={{ fontWeight: 600 }} />
        <button className="btn btn-primary btn-sm" onClick={save}>保存</button>
      </div>
      <div className="tab-bar" style={{ marginBottom: 16 }}>
        <button className={`tab-bar-item${mode === 'list' ? ' active' : ''}`} onClick={() => setMode('list')}>列表</button>
        <button className={`tab-bar-item${mode === 'wheel' ? ' active' : ''}`} onClick={() => setMode('wheel')}>转盘</button>
      </div>
      <div className="picker-options" style={{ marginBottom: 12 }}>
        {options.map((opt, i) => (
          <div key={i} className="picker-option-row">
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', width: 20 }}>{i + 1}</span>
            <input className="form-input" placeholder={'选项 ' + (i + 1)} value={opt} onChange={e => { const n = [...options]; n[i] = e.target.value; setOptions(n) }} maxLength={20} />
            <button className="remove-opt" onClick={() => options.length > 1 && setOptions(prev => prev.filter((_, j) => j !== i))}>✕</button>
          </div>
        ))}
        <button className="picker-add-btn" onClick={() => { if (options.length >= MAX_PICKER_OPTIONS) { showGlobalToast('最多20个选项'); return }; setOptions(prev => [...prev, '']) }}>+ 添加选项</button>
      </div>

      {mode === 'list' ? (
        <button className="btn btn-primary btn-block" onClick={() => {
          const valid = options.filter(o => o.trim())
          if (valid.length === 0) { showGlobalToast('请先输入选项'); return }
          setResult(valid[Math.floor(Math.random() * valid.length)])
        }}>🎲 随机抽取</button>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <div style={{ position: 'relative', width: 280, height: 280, margin: '0 auto' }}>
            <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', fontSize: 24, zIndex: 5 }}>▼</div>
            <canvas ref={canvasRef} style={{ width: 280, height: 280 }} />
          </div>
          <button className="btn btn-primary btn-block mt-8" onClick={handleSpin} disabled={isSpinning}>{isSpinning ? '转动中...' : '🎰 旋转'}</button>
        </div>
      )}

      {result && <div className="wheel-result" style={{ fontSize: 22, marginTop: 8 }}>🎉 {result}</div>}
    </div>
  )
}

export default function RandomPicker({ onClose }) {
  const [scenarios, setScenarios] = useState(loadScenarios)
  const [currentId, setCurrentId] = useState(null)
  const current = currentId ? scenarios.find(s => s.id === currentId) : null

  return (
    <div className="subpage">
      <div className="subpage-header">
        <button className="back-btn" onClick={onClose}>‹</button>
        <span className="subpage-title">🎲 随机选择器</span>
      </div>
      <div className="subpage-body">
        {current ? (
          <ScenarioEditor scenario={current} onBack={() => { setScenarios(loadScenarios()); setCurrentId(null) }} onUpdate={setScenarios} />
        ) : (
          <ScenarioPicker scenarios={scenarios} onEnter={(id) => setCurrentId(id)} onDelete={setScenarios} onCreate={(updated) => setScenarios(updated)} />
        )}
      </div>
    </div>
  )
}
