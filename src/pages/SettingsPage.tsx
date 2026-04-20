import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { useAppStore } from '../stores/appStore'
import { DEFAULT_PRICES, CHOREO_LABELS, type ChoreoLevel } from '../types'
import { formatKRW, generateId } from '../rules/utils'
import { getBillableChoreos } from '../rules/choreo'
import { Lock, Unlock, Download, Plus, Pencil, Check, X, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import html2canvas from 'html2canvas'
import JSZip from 'jszip'

const TEACHER_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#f97316',
  '#84cc16', '#64748b',
]

export default function SettingsPage() {
  const { currentMonth } = useAppStore()
  const [year, month] = currentMonth.split('-').map(Number)
  const [activeTab, setActiveTab] = useState<'close' | 'teachers' | 'prices'>('close')

  const teachers = useLiveQuery(() => db.teachers.toArray(), []) ?? []
  const config = useLiveQuery(() => db.config.get('default'), [])
  const prices = config ?? DEFAULT_PRICES
  const monthCloses = useLiveQuery(() => db.monthClose.toArray(), []) ?? []
  const isClosed = monthCloses.some(c => c.month === currentMonth)

  const lessons = useLiveQuery(() =>
    db.lessons.where('date').between(`${currentMonth}-01`, `${currentMonth}-31`, true, true).toArray()
  , [currentMonth]) ?? []
  const allChoreos = useLiveQuery(() => db.choreos.toArray(), []) ?? []
  const billableChoreos = getBillableChoreos(allChoreos, currentMonth)

  const lessonTotal = lessons.reduce((sum, l) =>
    sum + l.students.reduce((s, st) => s + st.fee + (st.offIceFee ?? 0), 0), 0)
  const choreoTotal = billableChoreos.reduce((sum, c) => sum + c.totalFee, 0)

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

  // ─── 월 마감 ───────────────────────────────────────────
  async function handleCloseMonth() {
    if (isClosed) {
      if (!confirm('마감을 취소할까요?')) return
      await db.monthClose.where('month').equals(currentMonth).delete()
      return
    }
    if (!confirm(`${year}년 ${month}월을 마감할까요? 안무 청구가 확정됩니다.`)) return
    for (const c of billableChoreos) {
      await db.choreos.update(c.id, { billedMonth: currentMonth })
    }
    await db.monthClose.add({
      id: generateId(),
      month: currentMonth,
      closedAt: Date.now(),
      lessonTotal,
      choreoTotal,
      grandTotal: lessonTotal + choreoTotal,
    })
  }

  async function renderTeacherCanvas(teacher: typeof teachers[0]) {
    const tLessons = lessons.filter(l => l.teacherId === teacher.id)
    if (tLessons.length === 0) return null
    const div = document.createElement('div')
    div.style.cssText = 'position:fixed;top:-9999px;left:-9999px;background:white;width:400px;padding:20px;font-family:sans-serif;'
    div.innerHTML = `
      <h2 style="font-size:16px;font-weight:bold;margin-bottom:12px;color:#1a1a1a">${teacher.name} · ${year}년 ${month}월</h2>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead><tr style="background:#f9fafb">
          <th style="padding:8px;text-align:left;border-bottom:1px solid #e5e7eb">날짜</th>
          <th style="padding:8px;text-align:left;border-bottom:1px solid #e5e7eb">장소</th>
          <th style="padding:8px;text-align:left;border-bottom:1px solid #e5e7eb">이름</th>
          <th style="padding:8px;text-align:right;border-bottom:1px solid #e5e7eb">분</th>
          <th style="padding:8px;text-align:right;border-bottom:1px solid #e5e7eb">금액</th>
        </tr></thead>
        <tbody>
          ${tLessons.sort((a, b) => a.date.localeCompare(b.date)).flatMap(l =>
            l.students.map((s, i) => `<tr style="border-bottom:1px solid #f3f4f6">
              <td style="padding:6px 8px;color:#6b7280">${i === 0 ? l.date.slice(5).replace('-', '/') : ''}</td>
              <td style="padding:6px 8px;color:#6b7280">${i === 0 ? l.location : ''}</td>
              <td style="padding:6px 8px;font-weight:500">${s.name}${s.unpaid ? ' (미납)' : ''}</td>
              <td style="padding:6px 8px;text-align:right;color:#6b7280">${s.minutes}분</td>
              <td style="padding:6px 8px;text-align:right;font-weight:600">${(s.fee + (s.offIceFee ?? 0)).toLocaleString()}</td>
            </tr>`)
          ).join('')}
        </tbody>
      </table>
    `
    document.body.appendChild(div)
    const canvas = await html2canvas(div, { scale: 2, backgroundColor: '#ffffff' })
    document.body.removeChild(div)
    return { canvas, name: teacher.name }
  }

  async function handleBulkDownload() {
    const results = (await Promise.all(teachers.map(t => renderTeacherCanvas(t)))).filter(Boolean) as { canvas: HTMLCanvasElement; name: string }[]
    if (results.length === 0) return

    // iOS: Web Share API로 모든 이미지 공유 — canShare 체크 없이 바로 시도
    if (typeof navigator.share === 'function') {
      try {
        const files = await Promise.all(
          results.map(async ({ canvas, name }) => {
            const blob = await new Promise<Blob>(res => canvas.toBlob(b => res(b!), 'image/png'))
            return new File([blob], `${currentMonth}_${name}.png`, { type: 'image/png' })
          })
        )
        await navigator.share({ files, title: `${currentMonth} 레슨비` })
        return
      } catch (e) {
        if ((e as Error).name === 'AbortError') return
        // share 실패 시 fallback으로 내려감
      }
    }

    // 일반 브라우저: ZIP 다운로드
    const zip = new JSZip()
    for (const { canvas, name } of results) {
      const blob = await new Promise<Blob>(res => canvas.toBlob(b => res(b!), 'image/png'))
      zip.file(`${currentMonth}_${name}.png`, blob)
    }
    const content = await zip.generateAsync({ type: 'blob' })
    const link = document.createElement('a')
    link.download = `${currentMonth}_레슨비_전체.zip`
    link.href = URL.createObjectURL(content)
    link.click()
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 py-4 border-b border-gray-100">
        <h1 className="text-lg font-bold text-gray-800">설정</h1>
      </div>

      {/* 탭 */}
      <div className="flex border-b border-gray-100">
        {(['close', 'teachers', 'prices'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500'
            }`}
          >
            {tab === 'close' ? '월 마감' : tab === 'teachers' ? '선생님/학생' : '단가'}
          </button>
        ))}
      </div>

      <div className="px-4 py-4 space-y-4">

        {/* ── 월 마감 탭 ──────────────────────────────── */}
        {activeTab === 'close' && (
          <>
            <div className={`rounded-2xl p-4 border ${isClosed ? 'bg-gray-50 border-gray-200' : 'bg-amber-50 border-amber-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                {isClosed ? <Lock size={18} className="text-gray-500" /> : <Unlock size={18} className="text-amber-600" />}
                <span className="font-semibold text-sm text-gray-800">
                  {year}년 {month}월 {isClosed ? '마감됨' : '정산 예정'}
                </span>
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>레슨 합계</span>
                  <span className="font-medium">{formatKRW(lessonTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>안무 합계 ({billableChoreos.length}건)</span>
                  <span className="font-medium">{formatKRW(choreoTotal)}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-800 pt-1 border-t border-gray-200 mt-1">
                  <span>총계</span>
                  <span className="text-emerald-600">{formatKRW(lessonTotal + choreoTotal)}</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleCloseMonth}
              className={`w-full py-3.5 rounded-xl font-semibold text-sm ${
                isClosed ? 'bg-gray-200 text-gray-600' : 'bg-emerald-500 text-white'
              }`}
            >
              {isClosed ? '마감 취소' : `${month}월 마감 확정`}
            </button>
            <button
              onClick={handleBulkDownload}
              className="w-full flex items-center justify-center gap-2 bg-gray-800 text-white rounded-xl py-3.5 text-sm font-medium"
            >
              <Download size={16} />
              선생님별 이미지 전체 다운로드 (ZIP)
            </button>
          </>
        )}

        {/* ── 선생님/학생 탭 ────────────────────────── */}
        {activeTab === 'teachers' && (
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

        {/* ── 단가 탭 ─────────────────────────────── */}
        {activeTab === 'prices' && (
          <div className="space-y-3">
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-500 border-b border-gray-200">레슨 단가 (원/분)</div>
              {[
                ['개인 (1인)', prices.individual],
                ['세미 (2-3인)', prices.semi],
                ['단체 (4인+)', prices.group],
              ].map(([label, value]) => (
                <div key={String(label)} className="flex justify-between px-3 py-3 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-gray-700">{label}</span>
                  <span className="text-sm font-semibold text-gray-800">{Number(value).toLocaleString()}원/분</span>
                </div>
              ))}
            </div>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-500 border-b border-gray-200">안무 단가</div>
              {(Object.entries(CHOREO_LABELS) as [ChoreoLevel, string][]).map(([key, label]) => (
                <div key={key} className="flex justify-between px-3 py-3 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-gray-700">{label}</span>
                  <span className="text-sm font-semibold text-gray-800">{formatKRW(prices.choreo[key])}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
