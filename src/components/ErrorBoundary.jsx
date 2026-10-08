import React from 'react'
import { exportAllData } from '../store/db'
import { showGlobalToast } from '../store/store'

/**
 * 错误边界。
 * 这是个纯离线、数据只存在浏览器里的应用，所以除了「重新加载」之外，
 * 还额外提供「导出数据」出口 —— 万一界面崩了，用户至少能把 IndexedDB
 * 里的原始数据抢救出来，不至于丢失。
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null, exporting: false }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', this.props.label || '', error, info?.componentStack)
  }

  handleReload = () => {
    this.setState({ error: null })
    window.location.reload()
  }

  handleExport = async () => {
    this.setState({ exporting: true })
    try {
      const data = await exportAllData()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `neptune-emergency-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      showGlobalToast('已导出，请妥善保存')
    } catch (e) {
      console.error('应急导出失败:', e)
      alert('导出失败，请勿清除浏览器数据，并尽快排查。')
    } finally {
      this.setState({ exporting: false })
    }
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div style={{ padding: 24, maxWidth: 420, margin: '0 auto', minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🥲</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>这里出了点问题</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {this.props.label ? `「${this.props.label}」` : '页面'}渲染失败。你的数据仍安全地存在本地，先导出一份备份再重试更稳妥。
          </div>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', wordBreak: 'break-all', fontFamily: 'ui-monospace, monospace', lineHeight: 1.5 }}>
            {String(error?.message || error)}
          </div>
        </div>

        <button className="btn btn-primary btn-block" style={{ marginBottom: 8 }} onClick={this.handleReload}>
          重新加载
        </button>
        <button className="btn btn-outline btn-block" disabled={this.state.exporting} onClick={this.handleExport}>
          {this.state.exporting ? '导出中…' : '导出数据备份'}
        </button>
      </div>
    )
  }
}
