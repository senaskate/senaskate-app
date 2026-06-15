import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { DEFAULT_PRICES, CHOREO_LABELS, LOCATIONS, type ChoreoLevel } from '../types'
import { generateId, formatComma, parseComma } from '../rules/utils'
import { Plus, Pencil, Check, X, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'

const TEACHER_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#f97316',
  '#84cc16', '#64748b',
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'members' | 'locations' | 'prices'>('members')

  const teachers = useLiveQuery(() => db.teachers.toArray(), []) ?? []
  const config = useLiveQuery(() => db.config.get('default'), [])
  const prices = config ?? DEFAULT_PRICES
  const locations = prices.locations ?? [...LOCATIONS]

  // ─── 선생님/학생 관리 상태 ──────────────────────────────
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  const [newStudentText, setNewStudentText] = useState<Record<string, string>>({})
  const [addingTeacher, setAddingTeacher] = useState(false)
  const [newTeacherName, setNewTeacherName] = useState('')
  const [newTeacherColor, setNewTeacherColor] = useState(TEACHER_COLORS[0])

  function startEdit(teacher: { id: string; name: string; color: string }) {
    setEditingId(teacher.id)
    setEditName(teacher.name)
    setEditColor(teacher.color)
  }

  async function saveEdit(id: string) {
    if (!editName.trim()) return
    await db.teachers.update(id, { name: editName.trim(), color: editColor })
    setEditingId(null)
  }

  async function addStudent(teacherId: string) {
    const name = (newStudentText[teacherId] ?? '').trim()
    if (!name) return
    const teacher = teachers.find(t => t.id === teacherId)
    if (!teacher) return
    if (teacher.students.includes(name)) return
    await db.teachers.update(teacherId, { students: [...teacher.students, name] })
    setNewStudentText(prev => ({ ...prev, [teacherId]: '' }))
  }

  async function removeStudent(teacherId: string, studentName: string) {
    const teacher = teachers.find(t => t.id === teacherId)
    if (!teacher) return
    await db.teachers.update(teacherId, { students: teacher.students.filter(s => s !== studentName) })
  }

  async function addTeacher() {
    if (!newTeacherName.trim()) return
    await db.teachers.add({
      id: generateId(),
      name: newTeacherName.trim(),
      color: newTeacherColor,
      students: [],
    })
    setNewTeacherName('')
    setNewTeacherColor(TEACHER_COLORS[0])
    setAddingTeacher(false)
  }

  async function deleteTeacher(id: string) {
    if (!confirm('선생님을 삭제할까요? 레슨 기록은 유지됩니다.')) return
    await db.teachers.delete(id)
    if (expandedId === id) setExpandedId(null)
  }

  // ─── 위치 관리 ──────────────────────────────────────────
  const [newLocationText, setNewLocationText] = useState('')

  async function addLocation() {
    const name = newLocationText.trim()
    if (!name || locations.includes(name)) return
    await db.config.put({ ...prices, id: 'default', locations: [...locations, name] })
    setNewLocationText('')
  }

  async function removeLocation(name: string) {
    await db.config.put({ ...prices, id: 'default', locations: locations.filter(l => l !== name) })
  }

  // ─── 단가 관리 ──────────────────────────────────────────
  const [individual, setIndividual] = useState(formatComma(String(DEFAULT_PRICES.individual)))
  const [semi, setSemi] = useState(formatComma(String(DEFAULT_PRICES.semi)))
  const [group, setGroup] = useState(formatComma(String(DEFAULT_PRICES.group)))
  const [choreoPrices, setChoreoPrices] = useState<Record<ChoreoLevel, string>>(
    Object.fromEntries(Object.entries(DEFAULT_PRICES.choreo).map(([k, v]) => [k, formatComma(String(v))])) as Record<ChoreoLevel, string>
  )

  useEffect(() => {
    if (!config) return
    setIndividual(formatComma(String(config.individual)))
    setSemi(formatComma(String(config.semi)))
    setGroup(formatComma(String(config.group)))
    setChoreoPrices(Object.fromEntries(Object.entries(config.choreo).map(([k, v]) => [k, formatComma(String(v))])) as Record<ChoreoLevel, string>)
  }, [config])

  async function savePrices() {
    await db.config.put({
      ...prices,
      id: 'default',
      individual: parseComma(individual),
      semi: parseComma(semi),
      group: parseComma(group),
      choreo: Object.fromEntries(
        (Object.keys(CHOREO_LABELS) as ChoreoLevel[]).map(k => [k, parseComma(choreoPrices[k] ?? '0')])
      ) as Record<ChoreoLevel, number>,
    })
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto overflow-x-hidden">
      <div className="px-4 py-4 border-b border-gray-100">
        <h1 className="text-lg font-bold text-gray-800">회원관리</h1>
      </div>

      {/* 탭 */}
      <div className="flex border-b border-gray-100">
        {(['members', 'locations', 'prices'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500'
            }`}
          >
            {tab === 'members' ? '선생님/학생' : tab === 'locations' ? '위치' : '단가'}
          </button>
        ))}
      </div>

      <div className="px-4 py-4 space-y-4">

        {/* ── 선생님/학생 탭 ────────────────────────── */}
        {activeTab === 'members' && (
          <div className="space-y-3">
            {/* 선생님 추가 버튼 */}
            {!addingTeacher ? (
              <button
                onClick={() => setAddingTeacher(true)}
                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-emerald-300 text-emerald-600 rounded-xl py-3 text-sm font-medium"
              >
                <Plus size={16} />
                선생님 추가
              </button>
            ) : (
              <div className="border-2 border-emerald-300 rounded-xl p-4 space-y-3 bg-emerald-50">
                <p className="text-sm font-semibold text-emerald-700">새 선생님</p>
                <input
                  type="text"
                  placeholder="이름 (예: 홍쌤)"
                  value={newTeacherName}
                  onChange={e => setNewTeacherName(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-emerald-400"
                />
                <div>
                  <p className="text-xs text-gray-500 mb-2">색상</p>
                  <div className="flex flex-wrap gap-2">
                    {TEACHER_COLORS.map(c => (
                      <button
                        key={c}
                        onClick={() => setNewTeacherColor(c)}
                        className="w-8 h-8 rounded-full border-2 transition-all"
                        style={{
                          backgroundColor: c,
                          borderColor: newTeacherColor === c ? '#1a1a1a' : 'transparent',
                          transform: newTeacherColor === c ? 'scale(1.15)' : 'scale(1)',
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setAddingTeacher(false); setNewTeacherName('') }}
                    className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-600 bg-white"
                  >
                    취소
                  </button>
                  <button
                    onClick={addTeacher}
                    className="flex-1 py-2.5 rounded-lg bg-emerald-500 text-white text-sm font-semibold"
                  >
                    추가
                  </button>
                </div>
              </div>
            )}

            {/* 선생님 목록 */}
            {teachers.map(t => (
              <div key={t.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                {/* 선생님 헤더 */}
                {editingId === t.id ? (
                  // 수정 모드
                  <div className="p-4 space-y-3 bg-gray-50">
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-emerald-400"
                    />
                    <div className="flex flex-wrap gap-2">
                      {TEACHER_COLORS.map(c => (
                        <button
                          key={c}
                          onClick={() => setEditColor(c)}
                          className="w-8 h-8 rounded-full border-2 transition-all"
                          style={{
                            backgroundColor: c,
                            borderColor: editColor === c ? '#1a1a1a' : 'transparent',
                            transform: editColor === c ? 'scale(1.15)' : 'scale(1)',
                          }}
                        />
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingId(null)}
                        className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-600 bg-white flex items-center justify-center gap-1"
                      >
                        <X size={14} /> 취소
                      </button>
                      <button
                        onClick={() => saveEdit(t.id)}
                        className="flex-1 py-2.5 rounded-lg bg-emerald-500 text-white text-sm font-semibold flex items-center justify-center gap-1"
                      >
                        <Check size={14} /> 저장
                      </button>
                    </div>
                  </div>
                ) : (
                  // 보기 모드
                  <button
                    onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
                  >
                    <div className="w-5 h-5 rounded-full flex-shrink-0" style={{ backgroundColor: t.color }} />
                    <span className="flex-1 font-semibold text-sm text-gray-800">{t.name}</span>
                    <span className="text-xs text-gray-400 mr-1">{t.students.length}명</span>
                    {expandedId === t.id
                      ? <ChevronUp size={16} className="text-gray-400" />
                      : <ChevronDown size={16} className="text-gray-400" />
                    }
                  </button>
                )}

                {/* 펼쳐진 학생 목록 */}
                {expandedId === t.id && editingId !== t.id && (
                  <div className="border-t border-gray-100 px-4 pt-3 pb-4 space-y-3">
                    {/* 학생 태그 목록 */}
                    <div className="flex flex-wrap gap-1.5 min-h-[28px]">
                      {t.students.length === 0 ? (
                        <span className="text-xs text-gray-400">학생이 없습니다</span>
                      ) : (
                        t.students.map(name => (
                          <span
                            key={name}
                            className="flex items-center gap-1 bg-gray-100 rounded-full px-2.5 py-1 text-xs text-gray-700"
                          >
                            {name}
                            <button
                              onClick={() => removeStudent(t.id, name)}
                              className="text-gray-400 hover:text-red-500 ml-0.5"
                            >
                              <X size={11} />
                            </button>
                          </span>
                        ))
                      )}
                    </div>

                    {/* 학생 추가 입력 */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="학생 이름 추가"
                        value={newStudentText[t.id] ?? ''}
                        onChange={e => setNewStudentText(prev => ({ ...prev, [t.id]: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && addStudent(t.id)}
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400"
                      />
                      <button
                        onClick={() => addStudent(t.id)}
                        className="px-3 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium"
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    {/* 수정 / 삭제 */}
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => startEdit(t)}
                        className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 rounded-lg py-2 text-xs text-gray-600"
                      >
                        <Pencil size={13} />
                        선생님 정보 수정
                      </button>
                      <button
                        onClick={() => deleteTeacher(t.id)}
                        className="flex items-center justify-center gap-1.5 border border-red-200 rounded-lg py-2 px-3 text-xs text-red-500"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── 위치 탭 ─────────────────────────────── */}
        {activeTab === 'locations' && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5 min-h-[28px]">
              {locations.length === 0 ? (
                <span className="text-xs text-gray-400">위치가 없습니다</span>
              ) : (
                locations.map(loc => (
                  <span
                    key={loc}
                    className="flex items-center gap-1 bg-gray-100 rounded-full px-2.5 py-1 text-xs text-gray-700"
                  >
                    {loc}
                    <button
                      onClick={() => removeLocation(loc)}
                      className="text-gray-400 hover:text-red-500 ml-0.5"
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="위치 이름 추가"
                value={newLocationText}
                onChange={e => setNewLocationText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addLocation()}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400"
              />
              <button
                onClick={addLocation}
                className="px-3 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ── 단가 탭 ─────────────────────────────── */}
        {activeTab === 'prices' && (
          <div className="space-y-3">
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-500 border-b border-gray-200">레슨 단가 (원/분)</div>
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100 gap-3">
                <span className="text-sm text-gray-700">개인 (1인)</span>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={individual}
                    onChange={e => setIndividual(formatComma(e.target.value))}
                    className="w-24 text-right border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-emerald-400"
                  />
                  <span className="text-xs text-gray-400">원/분</span>
                </div>
              </div>
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100 gap-3">
                <span className="text-sm text-gray-700">세미 (2-3인)</span>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={semi}
                    onChange={e => setSemi(formatComma(e.target.value))}
                    className="w-24 text-right border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-emerald-400"
                  />
                  <span className="text-xs text-gray-400">원/분</span>
                </div>
              </div>
              <div className="flex items-center justify-between px-3 py-2.5 gap-3">
                <span className="text-sm text-gray-700">단체 (4인+)</span>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={group}
                    onChange={e => setGroup(formatComma(e.target.value))}
                    className="w-24 text-right border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-emerald-400"
                  />
                  <span className="text-xs text-gray-400">원/분</span>
                </div>
              </div>
            </div>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-500 border-b border-gray-200">안무 단가</div>
              {(Object.entries(CHOREO_LABELS) as [ChoreoLevel, string][]).map(([key, label], i, arr) => (
                <div
                  key={key}
                  className={`flex items-center justify-between px-3 py-2.5 gap-3 ${i < arr.length - 1 ? 'border-b border-gray-100' : ''}`}
                >
                  <span className="text-sm text-gray-700">{label}</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={choreoPrices[key] ?? ''}
                      onChange={e => setChoreoPrices(prev => ({ ...prev, [key]: formatComma(e.target.value) }))}
                      className="w-28 text-right border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-emerald-400"
                    />
                    <span className="text-xs text-gray-400">원</span>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={savePrices}
              className="w-full py-3 rounded-xl bg-emerald-500 text-white text-sm font-semibold"
            >
              저장
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
