import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db'
import { useAppStore } from '../../stores/appStore'
import { generateId, formatKRW } from '../../rules/utils'
import { getTeacherByLocation } from '../../rules/teacherAssignment'
import { calcLessonFee, needsSemiConfirm } from '../../rules/pricing'
import { DEFAULT_PRICES, LOCATIONS, type LessonType, type TeacherId } from '../../types'
import { X, Plus, Trash2, ChevronDown } from 'lucide-react'

interface StudentRow {
  name: string
  minutes: string
  offIce: boolean
  offIceFee: string
  unpaid: boolean
}

export default function LessonInput() {
  const { inputModal, closeInputModal, selectedDate } = useAppStore()
  const teachers = useLiveQuery(() => db.teachers.toArray(), []) ?? []
  const config = useLiveQuery(() => db.config.get('default'), [])
  const prices = config ?? DEFAULT_PRICES

  const prefillDate = inputModal.prefillDate ?? selectedDate
  const editId = inputModal.editId

  const [date, setDate] = useState(prefillDate)
  const [startTime, setStartTime] = useState('')
  const [location, setLocation] = useState('')
  const [teacherId, setTeacherId] = useState<TeacherId | ''>('')
  const [teacherLocked, setTeacherLocked] = useState(false)
  const [lessonType, setLessonType] = useState<LessonType>('individual')
  const [semiConfirmShown, setSemiConfirmShown] = useState(false)
  const [students, setStudents] = useState<StudentRow[]>([{ name: '', minutes: '', offIce: false, offIceFee: '', unpaid: false }])
  const [note, setNote] = useState('')
  const [travelFee, setTravelFee] = useState('')
  const [accommodationFee, setAccommodationFee] = useState('')
  const [showStudentPicker, setShowStudentPicker] = useState<number | null>(null)

  // 수정 모드 로드
  useEffect(() => {
    if (editId) {
      db.lessons.get(editId).then(lesson => {
        if (!lesson) return
        setDate(lesson.date)
        setStartTime(lesson.startTime ?? '')
        setLocation(lesson.location)
        setTeacherId(lesson.teacherId)
        setLessonType(lesson.type)
        setStudents(lesson.students.map(s => ({
          name: s.name,
          minutes: String(s.minutes),
          offIce: !!s.offIceFee,
          offIceFee: s.offIceFee ? String(s.offIceFee) : '',
          unpaid: !!s.unpaid,
        })))
        setNote(lesson.note ?? '')
      })
    }
  }, [editId])

  // 장소 선택 시 선생님 자동배정
  function handleLocationChange(loc: string) {
    setLocation(loc)
    const auto = getTeacherByLocation(loc)
    if (auto) {
      setTeacherId(auto)
      setTeacherLocked(true)
    } else {
      setTeacherLocked(false)
    }
  }

  // 학생 수 변경 시 세미 판단
  function handleStudentCountChange(rows: StudentRow[]) {
    const filled = rows.filter(r => r.name.trim()).length
    if (needsSemiConfirm(filled) && !semiConfirmShown) {
      setSemiConfirmShown(true)
    }
  }

  function addStudent() {
    const next = [...students, { name: '', minutes: '', offIce: false, offIceFee: '', unpaid: false }]
    setStudents(next)
    handleStudentCountChange(next)
  }

  function removeStudent(i: number) {
    const next = students.filter((_, idx) => idx !== i)
    setStudents(next)
  }

  function updateStudent(i: number, field: keyof StudentRow, value: string | boolean) {
    const next = students.map((s, idx) => idx === i ? { ...s, [field]: value } : s)
    setStudents(next)
    if (field === 'name') handleStudentCountChange(next)
  }

  // 모든 선생님의 학생 목록 (자동완성용)
  const allStudents = teachers.flatMap(t => t.students).sort()
  const selectedTeacher = teachers.find(t => t.id === teacherId)
  const teacherStudents = selectedTeacher?.students ?? []

  // 실시간 금액 계산
  function calcFee(row: StudentRow): number {
    const min = parseInt(row.minutes) || 0
    if (min === 0) return 0
    const base = calcLessonFee(min, lessonType, prices)
    const offIce = row.offIce ? (parseInt(row.offIceFee) || 0) : 0
    return base + offIce
  }

  const totalFee = students.reduce((sum, s) => sum + calcFee(s), 0)

  async function handleSave() {
    const validStudents = students.filter(s => s.name.trim() && s.minutes.trim())
    if (!date || !location || !teacherId || validStudents.length === 0) return

    const lesson = {
      id: editId ?? generateId(),
      date,
      startTime: startTime || undefined,
      teacherId: teacherId as TeacherId,
      location,
      type: lessonType,
      note,
      travelFee: travelFee ? parseInt(travelFee) : undefined,
      accommodationFee: accommodationFee ? parseInt(accommodationFee) : undefined,
      students: validStudents.map(s => ({
        name: s.name.trim(),
        minutes: parseInt(s.minutes),
        fee: calcFee(s),
        unpaid: s.unpaid || undefined,
        offIceFee: s.offIce && s.offIceFee ? parseInt(s.offIceFee) : undefined,
      })),
      createdAt: Date.now(),
    }
    if (editId) {
      await db.lessons.put(lesson)
    } else {
      await db.lessons.add(lesson)
    }
    closeInputModal()
  }

  async function handleDelete() {
    if (editId && confirm('이 레슨을 삭제할까요?')) {
      await db.lessons.delete(editId)
      closeInputModal()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
        <button onClick={closeInputModal} className="p-1">
          <X size={22} className="text-gray-500" />
        </button>
        <h2 className="text-base font-semibold text-gray-800">{editId ? '레슨 수정' : '레슨 추가'}</h2>
        <button onClick={handleSave} className="text-emerald-600 font-semibold text-sm">저장</button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* 날짜 + 시작시간 */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs text-gray-400 font-medium mb-1 block">날짜</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-400"
            />
          </div>
          <div className="w-28">
            <label className="text-xs text-gray-400 font-medium mb-1 block">시작 시간</label>
            <input
              type="time"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-400"
            />
          </div>
        </div>

        {/* 위치 */}
        <div>
          <label className="text-xs text-gray-400 font-medium mb-1 block">위치</label>
          <div className="grid grid-cols-3 gap-2">
            {LOCATIONS.map(loc => (
              <button
                key={loc}
                onClick={() => handleLocationChange(loc)}
                className={`py-2 rounded-xl text-sm font-medium border transition-colors ${
                  location === loc
                    ? 'bg-emerald-500 text-white border-emerald-500'
                    : 'bg-gray-50 text-gray-600 border-gray-200'
                }`}
              >
                {loc}
              </button>
            ))}
          </div>
        </div>

        {/* 선생님 */}
        <div>
          <label className="text-xs text-gray-400 font-medium mb-1 block">
            선생님 {teacherLocked && <span className="text-emerald-500">(자동배정)</span>}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {teachers.filter(t => t.id !== 'jeonju').map(t => (
              <button
                key={t.id}
                onClick={() => !teacherLocked && setTeacherId(t.id as TeacherId)}
                disabled={teacherLocked && teacherId !== t.id}
                className={`py-2 rounded-xl text-sm font-medium border transition-colors ${
                  teacherId === t.id
                    ? 'text-white border-transparent'
                    : 'bg-gray-50 text-gray-500 border-gray-200'
                } ${teacherLocked && teacherId !== t.id ? 'opacity-40' : ''}`}
                style={teacherId === t.id ? { backgroundColor: t.color, borderColor: t.color } : {}}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        {/* 레슨 유형 */}
        <div>
          <label className="text-xs text-gray-400 font-medium mb-1 block">레슨 유형</label>
          <div className="flex gap-2">
            {([['individual', '개인 (1인)'], ['semi', '세미 (2-3인)'], ['group', '단체 (4인+)']] as const).map(([type, label]) => (
              <button
                key={type}
                onClick={() => setLessonType(type)}
                className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-colors ${
                  lessonType === type
                    ? 'bg-emerald-500 text-white border-emerald-500'
                    : 'bg-gray-50 text-gray-600 border-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {/* 세미 확인 팝업 */}
          {semiConfirmShown && lessonType === 'individual' && students.filter(s => s.name).length >= 2 && (
            <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between">
              <span className="text-xs text-amber-700">2명 이상인데 세미 레슨인가요?</span>
              <button
                onClick={() => { setLessonType('semi'); setSemiConfirmShown(false) }}
                className="text-xs font-semibold text-amber-600 ml-2"
              >
                세미로 변경
              </button>
            </div>
          )}
        </div>

        {/* 학생 목록 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-gray-400 font-medium">학생</label>
            <button onClick={addStudent} className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
              <Plus size={14} /> 학생 추가
            </button>
          </div>

          <div className="space-y-3">
            {students.map((student, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  {/* 이름 입력 */}
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={student.name}
                      onChange={e => updateStudent(i, 'name', e.target.value)}
                      onFocus={() => setShowStudentPicker(i)}
                      onBlur={() => setTimeout(() => setShowStudentPicker(null), 200)}
                      placeholder="학생 이름"
                      className="w-full border border-gray-200 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400"
                    />
                    {/* 학생 자동완성 */}
                    {showStudentPicker === i && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-20 max-h-40 overflow-y-auto mt-1">
                        {(teacherStudents.length > 0 ? teacherStudents : allStudents)
                          .filter(s => s.toLowerCase().includes(student.name.toLowerCase()))
                          .map(s => (
                            <button
                              key={s}
                              onMouseDown={() => updateStudent(i, 'name', s)}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                            >
                              {s}
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                  {/* 분 입력 */}
                  <div className="flex items-center gap-1 w-24">
                    <input
                      type="number"
                      value={student.minutes}
                      onChange={e => updateStudent(i, 'minutes', e.target.value)}
                      placeholder="분"
                      className="w-full border border-gray-200 bg-white rounded-lg px-2 py-2 text-sm text-center focus:outline-none focus:border-emerald-400"
                    />
                    <span className="text-xs text-gray-400">분</span>
                  </div>
                  {students.length > 1 && (
                    <button onClick={() => removeStudent(i)} className="text-gray-300 hover:text-red-400">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                {/* 금액 미리보기 */}
                {student.minutes && (
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={student.offIce}
                          onChange={e => updateStudent(i, 'offIce', e.target.checked)}
                          className="rounded"
                        />
                        오프아이스
                      </label>
                      {student.offIce && (
                        <input
                          type="number"
                          value={student.offIceFee}
                          onChange={e => updateStudent(i, 'offIceFee', e.target.value)}
                          placeholder="금액"
                          className="w-20 border border-gray-200 bg-white rounded px-2 py-0.5 text-xs focus:outline-none"
                        />
                      )}
                      <label className="flex items-center gap-1 text-xs text-red-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={student.unpaid}
                          onChange={e => updateStudent(i, 'unpaid', e.target.checked)}
                          className="rounded"
                        />
                        미납
                      </label>
                    </div>
                    <span className="text-sm font-semibold text-emerald-600">
                      {formatKRW(calcFee(student))}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 전주 전용: 출장비/숙소 */}
        {teacherId === 'jeonju' && (
          <div>
            <label className="text-xs text-gray-400 font-medium mb-2 block">전주 추가 비용</label>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-gray-400 mb-1 block">출장비</label>
                <input
                  type="number"
                  value={travelFee}
                  onChange={e => setTravelFee(e.target.value)}
                  placeholder="0"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-400"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-400 mb-1 block">숙소비</label>
                <input
                  type="number"
                  value={accommodationFee}
                  onChange={e => setAccommodationFee(e.target.value)}
                  placeholder="0"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>
          </div>
        )}

        {/* 메모 */}
        <div>
          <label className="text-xs text-gray-400 font-medium mb-1 block">메모</label>
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="메모 (선택)"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-400"
          />
        </div>
      </div>

      {/* 하단 */}
      <div className="px-4 py-4 border-t border-gray-100 space-y-2">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-500">합계</span>
          <span className="text-lg font-bold text-emerald-600">{formatKRW(totalFee)}</span>
        </div>
        <button
          onClick={handleSave}
          className="w-full bg-emerald-500 text-white rounded-xl py-3 font-semibold text-sm"
        >
          {editId ? '수정 완료' : '레슨 저장'}
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
