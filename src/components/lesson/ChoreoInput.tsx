import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db'
import { useAppStore } from '../../stores/appStore'
import { generateId, formatKRW } from '../../rules/utils'
import { DEFAULT_PRICES, CHOREO_LABELS, type ChoreoLevel, type TeacherId } from '../../types'
import { X } from 'lucide-react'

export default function ChoreoInput() {
  const { inputModal, closeInputModal, selectedDate } = useAppStore()
  const teachers = useLiveQuery(() => db.teachers.toArray(), []) ?? []
  const config = useLiveQuery(() => db.config.get('default'), [])
  const prices = config ?? DEFAULT_PRICES

  // 기존 미완료 안무 목록 (이월된 것 포함)
  const existingChoreos = useLiveQuery(() =>
    db.choreos.filter(c => !c.billedMonth).toArray()
  , []) ?? []

  const editId = inputModal.editId
  const prefillDate = inputModal.prefillDate ?? selectedDate

  // 모드: 'new' | 'continue'
  const [mode, setMode] = useState<'new' | 'continue'>('new')
  const [selectedChoreoId, setSelectedChoreoId] = useState('')

  const [date, setDate] = useState(prefillDate)
  const [studentName, setStudentName] = useState('')
  const [teacherId, setTeacherId] = useState<TeacherId | ''>('')
  const [level, setLevel] = useState<ChoreoLevel>('basic_novice_fs')
  const [sessionNum, setSessionNum] = useState<string>('1')
  const [sessionNote, setSessionNote] = useState('')

  // "끝" 처리 시 금액 확인
  const isEnd = sessionNum === 'end'
  const autoFee = prices.choreo[level]

  async function handleSave() {
    if (!date || !teacherId) return

    if (mode === 'new') {
      if (!studentName.trim()) return
      const sessions = [{
        sessionNum: isEnd ? ('end' as const) : parseInt(sessionNum),
        date,
        note: sessionNote || undefined,
      }]
      const choreo = {
        id: generateId(),
        studentName: studentName.trim(),
        teacherId: teacherId as TeacherId,
        level,
        sessions,
        totalFee: isEnd ? autoFee : 0,
        billedMonth: null,
        startMonth: date.substring(0, 7),
        createdAt: Date.now(),
      }
      await db.choreos.add(choreo)
    } else {
      // 기존 안무에 회차 추가
      const choreo = await db.choreos.get(selectedChoreoId)
      if (!choreo) return
      const newSession = {
        sessionNum: isEnd ? ('end' as const) : parseInt(sessionNum),
        date,
        note: sessionNote || undefined,
      }
      await db.choreos.update(selectedChoreoId, {
        sessions: [...choreo.sessions, newSession],
        totalFee: isEnd ? prices.choreo[choreo.level] : choreo.totalFee,
      })
    }
    closeInputModal()
  }

  const continueChoreo = existingChoreos.find(c => c.id === selectedChoreoId)

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
        <button onClick={closeInputModal} className="p-1">
          <X size={22} className="text-gray-500" />
        </button>
        <h2 className="text-base font-semibold text-gray-800">안무 추가</h2>
        <button onClick={handleSave} className="text-violet-600 font-semibold text-sm">저장</button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* 신규 / 이어가기 탭 */}
        {existingChoreos.length > 0 && (
          <div className="flex bg-gray-100 rounded-xl p-1">
            {(['new', 'continue'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === m ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'
                }`}
              >
                {m === 'new' ? '신규 안무' : '이어가기'}
              </button>
            ))}
          </div>
        )}

        {/* 날짜 */}
        <div>
          <label className="text-xs text-gray-400 font-medium mb-1 block">날짜</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-400"
          />
        </div>

        {mode === 'continue' ? (
          /* 이어가기 모드 */
          <div>
            <label className="text-xs text-gray-400 font-medium mb-1 block">진행 중인 안무 선택</label>
            <div className="space-y-2">
              {existingChoreos.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedChoreoId(c.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-colors ${
                    selectedChoreoId === c.id ? 'border-violet-400 bg-violet-50' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-800">{c.studentName}</span>
                    <span className="text-xs text-gray-500">{CHOREO_LABELS[c.level]}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {c.sessions.length}회차 진행 중 · {c.startMonth}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* 신규 모드 */
          <>
            {/* 학생 이름 */}
            <div>
              <label className="text-xs text-gray-400 font-medium mb-1 block">학생</label>
              <input
                type="text"
                value={studentName}
                onChange={e => setStudentName(e.target.value)}
                placeholder="학생 이름"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-400"
              />
            </div>

            {/* 선생님 */}
            <div>
              <label className="text-xs text-gray-400 font-medium mb-1 block">선생님</label>
              <div className="grid grid-cols-3 gap-2">
                {teachers.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTeacherId(t.id as TeacherId)}
                    className={`py-2 rounded-xl text-sm font-medium border transition-colors ${
                      teacherId === t.id ? 'text-white border-transparent' : 'bg-gray-50 text-gray-500 border-gray-200'
                    }`}
                    style={teacherId === t.id ? { backgroundColor: t.color } : {}}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 안무 종류 */}
            <div>
              <label className="text-xs text-gray-400 font-medium mb-1 block">안무 종류</label>
              <div className="space-y-2">
                {(Object.entries(CHOREO_LABELS) as [ChoreoLevel, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setLevel(key)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm transition-colors ${
                      level === key ? 'bg-violet-500 text-white border-violet-500' : 'bg-gray-50 text-gray-600 border-gray-200'
                    }`}
                  >
                    <span>{label}</span>
                    <span className={`float-right text-xs ${level === key ? 'text-violet-100' : 'text-gray-400'}`}>
                      {formatKRW(prices.choreo[key])}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* 회차 */}
        <div>
          <label className="text-xs text-gray-400 font-medium mb-2 block">회차</label>
          <div className="flex gap-2 flex-wrap">
            {['1','2','3','4','5','6','7','8','end'].map(n => (
              <button
                key={n}
                onClick={() => setSessionNum(n)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                  sessionNum === n
                    ? n === 'end' ? 'bg-red-500 text-white border-red-500' : 'bg-violet-500 text-white border-violet-500'
                    : 'bg-gray-50 text-gray-600 border-gray-200'
                }`}
              >
                {n === 'end' ? '끝' : `${n}회`}
              </button>
            ))}
          </div>

          {/* "끝" 시 안무비 확인 */}
          {isEnd && (
            <div className="mt-3 bg-violet-50 border border-violet-200 rounded-xl p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-violet-700 font-medium">안무비 청구 예정</span>
                <span className="text-lg font-bold text-violet-600">
                  {formatKRW(mode === 'continue' && continueChoreo ? prices.choreo[continueChoreo.level] : autoFee)}
                </span>
              </div>
              <p className="text-xs text-violet-500 mt-1">이번 달 정산에 포함됩니다</p>
            </div>
          )}
        </div>

        {/* 메모 */}
        <div>
          <label className="text-xs text-gray-400 font-medium mb-1 block">메모</label>
          <input
            type="text"
            value={sessionNote}
            onChange={e => setSessionNote(e.target.value)}
            placeholder="메모 (선택)"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-400"
          />
        </div>
      </div>

      <div className="px-4 py-4 border-t border-gray-100">
        <button
          onClick={handleSave}
          className="w-full bg-violet-500 text-white rounded-xl py-3 font-semibold text-sm"
        >
          안무 저장
        </button>
      </div>
    </div>
  )
}
