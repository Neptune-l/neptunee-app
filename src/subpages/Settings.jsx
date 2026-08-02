import React, { useState } from 'react'
import { useApp, showGlobalToast } from '../store/store'
import { exportAllData, importAllData, clearAllData } from '../store/db'
import ConfirmModal from '../components/ConfirmModal'

export default function Settings({ onClose }) {
  const { theme, setTheme, greetingEnabled, setGreetingEnabled, petWidgetEnabled, togglePetWidget } = useApp()
  const [showThemePicker, setShowThemePicker] = useState(false)
  const [showImportConfirm, setShowImportConfirm] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [fileInputKey, setFileInputKey] = useState(0)

  const handleExport = async () => {
    try {
      const data = await exportAllData()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `neptune-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      showGlobalToast('数据导出成功')
    } catch (e) {
      showGlobalToast('导出失败，请重试')
    }
  }

  const handleImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      await importAllData(data)
      showGlobalToast('数据导入成功，请刷新页面')
      setShowImportConfirm(false)
      setTimeout(() => window.location.reload(), 1500)
    } catch (e) {
      showGlobalToast('导入失败，请检查文件格式')
    }
  }

  const handleClear = async () => {
    await clearAllData()
    showGlobalToast('已清空所有数据，请刷新页面')
    setShowClearConfirm(false)
    setTimeout(() => window.location.reload(), 1500)
  }

  return (
    <div className="subpage">
      <div className="subpage-header">
        <button className="back-btn" onClick={onClose}>‹</button>
        <span className="subpage-title">⚙️ 设置</span>
      </div>
      <div className="subpage-body">
        {/* 主题切换 */}
        <div className="settings-group">
          <div className="settings-group-title">外观</div>
          <div className="card" style={{ marginBottom: 6 }}>
            <label className="form-label">主题模式</label>
            <div className="theme-selector" style={{ marginTop: 8 }}>
              <button className={`theme-option${theme === 'light' ? ' active' : ''}`} onClick={() => setTheme('light')}>
                ☀️ 浅色
              </button>
              <button className={`theme-option${theme === 'dark' ? ' active' : ''}`} onClick={() => setTheme('dark')}>
                🌙 深色
              </button>
              <button className={`theme-option${theme === 'system' ? ' active' : ''}`} onClick={() => {
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
                setTheme(prefersDark ? 'dark' : 'light')
              }}>
                💻 跟随系统
              </button>
            </div>
          </div>
          <div className="settings-item" onClick={() => setGreetingEnabled(!greetingEnabled)}>
            <div className="settings-left">
              <span className="settings-icon">💬</span>
              <span className="settings-label">显示欢迎语</span>
            </div>
            <div className={`toggle-switch${greetingEnabled ? ' on' : ''}`} />
          </div>
          <div className="settings-item" onClick={() => togglePetWidget()}>
            <div className="settings-left">
              <span className="settings-icon">🐾</span>
              <span className="settings-label">首页置顶小可怜</span>
            </div>
            <div className={`toggle-switch${petWidgetEnabled ? ' on' : ''}`} />
          </div>
        </div>

        {/* 数据管理 */}
        <div className="settings-group">
          <div className="settings-group-title">数据管理</div>
          <div className="settings-item" onClick={handleExport}>
            <div className="settings-left">
              <span className="settings-icon">📤</span>
              <span className="settings-label">导出数据</span>
            </div>
            <span className="settings-arrow">›</span>
          </div>
          <div className="settings-item" onClick={() => setShowImportConfirm(true)}>
            <div className="settings-left">
              <span className="settings-icon">📥</span>
              <span className="settings-label">导入数据</span>
            </div>
            <span className="settings-arrow">›</span>
          </div>
          <div className="settings-item" style={{ color: 'var(--danger)' }} onClick={() => setShowClearConfirm(true)}>
            <div className="settings-left">
              <span className="settings-icon">🗑️</span>
              <span className="settings-label">清空所有数据</span>
            </div>
            <span className="settings-arrow">›</span>
          </div>
        </div>

        {/* 关于 */}
        <div className="settings-group">
          <div className="settings-group-title">关于</div>
          <div className="card" style={{ padding: '12px 16px' }}>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Neptune 自律百宝箱 v1.0.0<br />
              所有数据仅存储在你的浏览器本地，完全离线可用。<br />
              请定期导出备份以防数据丢失。
            </div>
          </div>
        </div>
      </div>

      {showImportConfirm && (
        <ConfirmModal
          message="导入将覆盖当前所有数据，请先导出备份当前数据。是否继续？"
          icon="⚠️"
          onConfirm={async () => {
            setShowImportConfirm(false)
            document.getElementById('import-file-input')?.click()
          }}
          onCancel={() => setShowImportConfirm(false)}
        />
      )}

      <input
        id="import-file-input"
        key={fileInputKey}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleImport}
      />

      {showClearConfirm && (
        <ConfirmModal
          message="此操作将清空所有数据且无法恢复，建议先导出备份。是否确认？"
          icon="⚠️"
          onConfirm={handleClear}
          onCancel={() => setShowClearConfirm(false)}
        />
      )}
    </div>
  )
}
