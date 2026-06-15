import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db'
import { useAppStore } from '../../stores/appStore'
import { generateId, formatKRW } from '../../rules/utils'
import { DEFAULT_PRICES, CHOREO_LABELS, type ChoreoLevel, type TeacherId, type ChoreoEntry, type ChoreoSession } from '../../types'
import { X, Trash2 } from 'lucide-react'

export default function ChoreoInput() {
  const { inputModal, closeInputModal, selectedDate } = useAppStore()
  const teachers = useLiveQuery(() => db.teachers.toArray(), []) ?? []
  const config = useLiveQuery(() => db.config.get('default'), [])
  const prices = config ?? DEFAULT_PRICES

  const editId = inputModal.editId

  // 기존 미완료 안무 목록 (이월된 것 포함)
  const existingChoreos = useLiveQuery(() =>
    db.choreos.filter(c => !c.billedMonth).toArray()
  , []) ?? []

  const prefillDate = inputModal.prefillDate ?? selectedDate

  // 모드: 'new' | 'continue'
  const [mode, setMode] = useState<'new' | 'continue'>('new')
  const [selectedChoreoId, setSelectedChoreoId] = useState('')

  const [date, setDate] = useState(prefillDate)
  const [studentName, setStudentName] = useState('')
  const [teacherId, setTeacherId] = useState<TeacherId | ''>('')
  const [level, setLevel] = useState<ChoreoLevel>('basic_novice_fs')
  const [location, setLocation] = useState('')
  const [sessionNum, setSessionNum] = useState<string>('1')
  const [sessionNote, setSessionNote] = useState('')

  // 수정 모드: 기존 안무 + 회차 목록
  const [loadedChoreo, setLoadedChoreo] = useState<ChoreoEntry | null>(null)
  const [sessions, setSessions] = useState<ChoreoSession[]>([])
  const [showAddSession, setShowAddSession] = useState(false)

  useEffect(() => {
    if (editId) {
      db.choreos.get(editId).then(c => {
        if (!c) return
        setLoadedChoreo(c)
        setStudentName(c.studentName)
        setTeacherId(c.teacherId)
        setLevel(c.level)
        setLocation(c.location ?? '')
        setSessions(c.sessions)
      })
    }
  }, [editId])

  // "끝" 처리 시 금액 확인
  const isEnd = sessionNum === 'end'
  const autoFee = prices.choreo[level]

  function removeSession(idx: number) {
    setSessions(sessions.filter((_, i) => i !== idx))
  }

  function updateSession(idx: number, field: 'date' | 'note', value: string) {
    setSessions(sessions.map((s, i) => i === idx ? { ...s, [field]: field === 'note' ? (value || undefined) : value } : s))
  }

  function addSessionToList() {
    const newSession: ChoreoSession = {
      sessionNum: isEnd ? ('end' as const) : parseInt(sessionNum),
      date,
      note: sessionNote || undefined,
    }
    setSessions([...sessions, newSession])
    setSessionNote('')
    setShowAddSession(false)
  }

  async function handleSave() {
    if (editId) {
      if (!studentName.trim() || !teacherId || !loadedChoreo) return
      const hasEnd = sessions.some(s => s.sessionNum === 'end')
      await db.choreos.put({
        ...loadedChoreo,
        studentName: studentName.trim(),
        teacherId: teacherId as TeacherId,
        level,
        sessions,
        totalFee: hasEnd ? prices.choreo[level] : loadedChoreo.totalFee,
        location: location || undefined,
      })
      closeInputModal()
      return
    }

    if (!date || !teacherId) return

    if (mode === 'new') {
      if (!studentName.trim()) return
      const newSessions = [{
        sessionNum: isEnd ? ('end' as const) : parseInt(sessionNum),
        date,
        note: sessionNote || undefined,
      }]
      const choreo = {
        id: generateId(),
        studentName: studentName.trim(),
        teacherId: teacherId as TeacherId,
        level,
        sessions: newSessions,
        totalFee: isEnd ? autoFee : 0,
        billedMonth: null,
        startMonth: date.substring(0, 7),
        location: location || undefined,
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

  async function handleDelete() {
    if (editId && confirm('이 안무를 삭제할까요?')) {
      await db.choreos.delete(editId)
      closeInputModal()
    }
  }

  const continueChoreo = existingChoreos.find(c => c.id === selectedChoreoId)

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
        <button onClick={closeInputModal} className="p-1">
          <X size={22} className="text-gray-500" />
        </button>
        <h2 className="text-base font-semibold text-gray-800">{editId ? '안무 수정' : '안무 추가'}</h2>
        <button onClick={handleSave} className="text-violet-600 font-semibold text-sm">저장</button>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 space-y-4">
        {editId ? (
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

            {/* 장소 / 링크 */}
            <div>
              <label className="text-xs text-gray-400 font-medium mb-1 block">장소 / 링크</label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="장소 또는 링크 (선택)"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-400"
              />
            </div>

            {/* 회차 목록 */}
            <div>
              <label className="text-xs text-gray-400 font-medium mb-2 block">회차 목록</label>
              <div className="space-y-2">
                {sessions.map((s, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-gray-50 rounded-xl p-2">
                    <span className={`flex-shrink-0 px-2 py-1 rounded-lg text-xs font-medium ${
                      s.sessionNum === 'end' ? 'bg-red-100 text-red-600' : 'bg-violet-100 text-violet-600'
                    }`}>
                      {s.sessionNum === 'end' ? '끝' : `${s.sessionNum}회`}
                    </span>
                    <input
                      type="date"
                      value={s.date}
                      onChange={e => updateSession(idx, 'date', e.target.value)}
                      className="flex-1 min-w-0 border border-gray-200 bg-white rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-violet-400"
                    />
                    <input
                      type="text"
                      value={s.note ?? ''}
                      onChange={e => updateSession(idx, 'note', e.target.value)}
                      placeholder="메모"
                      className="flex-1 min-w-0 border border-gray-200 bg-white rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-violet-400"
                    />
                    <button onClick={() => removeSession(idx)} className="text-gray-300 hover:text-red-400 flex-shrink-0">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {sessions.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-2">회차가 없습니다</p>
                )}
              </div>
            </div>

            {/* 회차 추가 */}
            <div>
              {!showAddSession ? (
                <button
                  onClick={() => setShowAddSession(true)}
                  className="w-full bg-violet-50 text-violet-600 rounded-xl py-2.5 text-sm font-medium border border-violet-200"
                >
                  + 회차 추가
                </button>
              ) : (
                <div>
                  <label className="text-xs text-gray-400 font-medium mb-2 block">회차 추가</label>
                  <div className="flex gap-2 flex-wrap mb-2">
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
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      className="flex-1 min-w-0 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-400"
                    />
                    <input
                      type="text"
                      value={sessionNote}
                      onChange={e => setSessionNote(e.target.value)}
                      placeholder="메모 (선택)"
                      className="flex-1 min-w-0 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-400"
                    />
                  </div>
                  {isEnd && (
                    <div className="mt-3 bg-violet-50 border border-violet-200 rounded-xl p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-violet-700 font-medium">안무비 청구 예정</span>
                        <span className="text-lg font-bold text-violet-600">{formatKRW(prices.choreo[level])}</span>
                      </div>
                      <p className="text-xs text-violet-500 mt-1">이번 달 정산에 포함됩니다</p>
                    </div>
                  )}
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => setShowAddSession(false)}
                      className="flex-1 bg-gray-50 text-gray-500 rounded-xl py-2 text-sm font-medium border border-gray-200"
                    >
                      취소
                    </button>
                    <button
                      onClick={addSessionToList}
                      className="flex-1 bg-violet-500 text-white rounded-xl py-2 text-sm font-medium"
                    >
                      추가
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
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

                {/* 장소 / 링크 */}
                <div>
                  <label className="text-xs text-gray-400 font-medium mb-1 block">장소 / 링크</label>
                  <input
                    type="text"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="장소 또는 링크 (선택)"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-400"
                  />
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
          </>
        )}
      </div>

      <div className="px-4 py-4 border-t border-gray-100 space-y-2">
        <button
          onClick={handleSave}
          className="w-full bg-violet-500 text-white rounded-xl py-3 font-semibold text-sm"
        >
          {editId ? '수정 완료' : '안무 저장'}
        </button>
        {editId && (
          <button onClick={handleDelete} className="w-full text-red-400 text-sm py-1">
            삭제
          </button>
        )}
      </div>
    </div>
  )
}
