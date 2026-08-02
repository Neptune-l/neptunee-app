import React, { useState } from 'react'
import { useApp, showGlobalToast } from '../store/store'
import { PET_SPECIES } from '../utils/petConstants'

export default function PetNew({ onClose }) {
  const { addPet } = useApp()
  const [species, setSpecies] = useState('cat')
  const [name, setName] = useState('')
  const [planName, setPlanName] = useState('')
  const [days, setDays] = useState(30)
  const [tasks, setTasks] = useState([''])

  const handleCreate = async () => {
    const valid = tasks.filter(t => t.trim())
    if (valid.length === 0) { showGlobalToast('请至少添加一个每日任务'); return }
    if (!name.trim()) { showGlobalToast('给小可怜起个名字吧'); return }
    await addPet({ species, name, planName, days, templateTasks: valid })
    showGlobalToast('活命指标已创建，小可怜入住啦')
    onClose()
  }

  return (
    <div className="subpage">
      <div className="subpage-header">
        <button className="back-btn" onClick={onClose}>‹</button>
        <span className="subpage-title">新建活命指标</span>
        <button className="btn btn-primary btn-sm" onClick={handleCreate}>创建</button>
      </div>

      <div className="subpage-body">
        <div className="card card-section">
          <label className="form-label">选择小可怜</label>
          <div className="pet-species-row">
            {Object.keys(PET_SPECIES).map(k => (
              <div key={k} className={'pet-species' + (species === k ? ' active' : '')} onClick={() => setSpecies(k)}>
                <img src={PET_SPECIES[k].icon} alt={PET_SPECIES[k].name} />
                <div className="pet-species-name">{PET_SPECIES[k].name}</div>
                <div className="pet-species-tag">{PET_SPECIES[k].tagline}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card card-section">
          <div className="form-group">
            <label className="form-label">小可怜名字</label>
            <input className="form-input" placeholder="比如：肥橘" value={name} onChange={e => setName(e.target.value)} maxLength={12} />
          </div>
          <div className="form-group">
            <label className="form-label">活命指标名称</label>
            <input className="form-input" placeholder="比如：考研上岸计划" value={planName} onChange={e => setPlanName(e.target.value)} maxLength={20} />
          </div>
          <div className="form-group">
            <label className="form-label">计划天数</label>
            <input className="form-input" type="number" min="1" max="365" value={days} onChange={e => setDays(e.target.value)} />
          </div>
        </div>

        <div className="card card-section">
          <label className="form-label">每日任务（每天都会重复，后续可按天调整）</label>
          {tasks.map((t, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <input className="form-input" placeholder="比如：背 50 个单词" value={t} onChange={e => {
                const next = [...tasks]; next[i] = e.target.value; setTasks(next)
              }} />
              <button className="btn btn-sm btn-outline" onClick={() => setTasks(tasks.filter((_, j) => j !== i))}>删</button>
            </div>
          ))}
          <button className="btn btn-outline btn-block" onClick={() => setTasks([...tasks, ''])}>+ 添加任务</button>
        </div>
      </div>
    </div>
  )
}
