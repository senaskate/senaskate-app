import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db'
import { useAppStore } from '../../stores/appStore'
import { generateId } from '../../rules/utils'
import { X, Trash2 } from 'lucide-react'

const PRESET_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280']

export default function PersonalEventInput() {
  const { inputModal, closeInputModal, selectedDate } = useAppStore()
  const editId = inputModal.editId
  const prefillDate = inputModal.prefillDate ?? selectedDate

  const [date, setDate] = useState(prefillDate)
  const [title, setTitle] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [color, setColor] = useState('#3b82f6')
  const [note, setNote] = useState('')
  const [allDay, setAllDay] = useState(false)

  useEffect(() => {
    if (editId) {
      db.personalEvents.get(editId).then(e => {
        if (!e) return
        setDate(e.date)
        setTitle(e.title)
        setStartTime(e.startTime)
        setEndTime(e.endTime)
        setColor(e.color)
        setNote(e.note ?? '')
        setAllDay(e.allDay ?? false)
      })
    }
  }, [editId])

  async function handleSave() {
    if (!title.trim() || !date) return
    const event = {
      id: editId ?? generateId(),
      date,
      title: title.trim(),
      startTime,
      endTime,
      color,
      note: note || undefined,
      allDay,
      createdAt: Date.now(),
    }
    if (editId) {
      await db.personalEvents.put(event)
    } else {
      await db.personalEvents.add(event)
    }
    closeInputModal()
  }

  async function handleDelete() {
    if (editId && confirm('일정을 삭제할까요?')) {
      await db.personalEvents.delete(editId)
      closeInputModal()
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
        <button onClick={closeInputModal} className="p-1">
          <X size={22} className="text-gray-500" />
        </button>
        <h2 className="text-base font-semibold text-gray-800">{editId ? '일정 수정' : '개인 일정 추가'}</h2>
        <button onClick={handleSave} className="text-blue-600 font-semibold text-sm">저장</button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* 제목 */}
        <div>
          <label className="text-xs text-gray-400 font-medium mb-1 block">제목</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="일정 제목"
            autoFocus
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
          />
        </div>

        {/* 색상 */}
        <div>
          <label className="text-xs text-gray-400 font-medium mb-2 block">색상</label>
          <div className="flex gap-2">
            {PRESET_COLORS.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-offset-2' : ''}`}
                style={{ backgroundColor: c, ringColor: c }}
              />
            ))}
          </div>
        </div>

        {/* 날짜 */}
        <div>
          <label className="text-xs text-gray-400 font-medium mb-1 block">날짜</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
          />
        </div>

        {/* 종일 여부 */}
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => setAllDay(!allDay)}
            className={`w-11 h-6 rounded-full transition-colors relative ${allDay ? 'bg-blue-500' : 'bg-gray-200'}`}
          >
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${allDay ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </div>
          <span className="text-sm text-gray-700">종일</span>
        </label>

        {/* 시간 */}
        {!allDay && (
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-gray-400 font-medium mb-1 block">시작</label>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-400 font-medium mb-1 block">종료</label>
              <input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>
        )}

        {/* 메모 */}
        <div>
          <label className="text-xs text-gray-400 font-medium mb-1 block">메모</label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="메모 (선택)"
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 resize-none"
          />
        </div>
      </div>

      <div className="px-4 py-4 border-t border-gray-100 space-y-2">
        <button
          onClick={handleSave}
          className="w-full text-white rounded-xl py-3 font-semibold text-sm"
          style={{ backgroundColor: color }}
        >
          {editId ? '수정 완료' : '일정 저장'}
        </button>
        {editId && (
          <button onClick={handleDelete} className="w-full text-red-400 text-sm py-1 flex items-center justify-center gap-1">
            <Trash2 size={14} /> 삭제
          </button>
        )}
      </div>
    </div>
  )
}
