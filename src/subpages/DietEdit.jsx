import React, { useState } from 'react'
import { useApp, showGlobalToast } from '../store/store'
import { MEAL_SLOTS } from '../utils/constants'
import ConfirmModal from '../components/ConfirmModal'

export default function DietEdit({ record, defaultDate, onClose }) {
  const isEdit = !!record?.id
  const { addDietRecord, updateDietRecord, deleteDietRecord } = useApp()

  const [date, setDate] = useState(record?.date || defaultDate || '')
  const [mealSlot, setMealSlot] = useState(record?.mealSlot || '早')
  const [foodName, setFoodName] = useState(record?.foodName || '')
  const [calories, setCalories] = useState(record?.calories || '')
  const [remark, setRemark] = useState(record?.remark || '')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleSave = async () => {
    if (!foodName.trim()) { showGlobalToast('请输入食物名称'); return }
    if (!date) { showGlobalToast('请选择日期'); return }

    const data = { date, mealSlot, foodName: foodName.trim(), calories: Number(calories) || 0, remark: remark.trim() }

    if (isEdit) {
      await updateDietRecord({ ...record, ...data })
      showGlobalToast('已更新')
    } else {
      await addDietRecord(data)
      showGlobalToast('添加成功')
    }
    onClose()
  }

  const handleDelete = async () => {
    await deleteDietRecord(record.id)
    showGlobalToast('已删除')
    setShowDeleteConfirm(false)
    onClose()
  }

  return (
    <div className="subpage">
      <div className="subpage-header">
        <button className="back-btn" onClick={onClose}>‹</button>
        <span className="subpage-title">{isEdit ? '编辑记录' : '新增记录'}</span>
        <button className="btn btn-primary btn-sm" onClick={handleSave}>保存</button>
      </div>
      <div className="subpage-body">
        <div className="card card-section">
          <div className="form-group">
            <label className="form-label">日期</label>
            <input className="form-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
        </div>
        <div className="card card-section">
          <label className="form-label">餐段</label>
          <div className="tab-bar" style={{ marginTop: 8 }}>
            {MEAL_SLOTS.map(slot => (
              <button key={slot} className={`tab-bar-item${mealSlot === slot ? ' active' : ''}`} onClick={() => setMealSlot(slot)}>
                {slot}餐
              </button>
            ))}
          </div>
        </div>
        <div className="card card-section">
          <div className="form-group">
            <label className="form-label">食物名称</label>
            <input className="form-input" placeholder="如：白米饭" value={foodName} onChange={e => setFoodName(e.target.value)} />
          </div>
        </div>
        <div className="card card-section">
          <div className="form-group">
            <label className="form-label">卡路里 (选填)</label>
            <input className="form-input" type="number" min="0" placeholder="0" value={calories} onChange={e => setCalories(e.target.value)} />
          </div>
        </div>
        <div className="card card-section">
          <div className="form-group">
            <label className="form-label">备注 (选填)</label>
            <input className="form-input" placeholder="可选备注" value={remark} onChange={e => setRemark(e.target.value)} />
          </div>
        </div>

        {isEdit && (
          <button className="delete-btn mt-16" onClick={() => setShowDeleteConfirm(true)}>删除该记录</button>
        )}
      </div>

      {showDeleteConfirm && (
        <ConfirmModal message="删除此记录？" icon="⚠️"
          onConfirm={handleDelete} onCancel={() => setShowDeleteConfirm(false)} />
      )}
    </div>
  )
}
