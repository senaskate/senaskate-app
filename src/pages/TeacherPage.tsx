import { useState, useRef } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { useAppStore } from '../stores/appStore'
import { formatKRW, toYYYYMM } from '../rules/utils'
import { Download, ChevronLeft, ChevronRight, Lock } from 'lucide-react'
import html2canvas from 'html2canvas'

export default function TeacherPage() {
  const { currentMonth, setCurrentMonth } = useAppStore()
  const [year, month] = currentMonth.split('-').map(Number)
  const [activeTeacherId, setActiveTeacherId] = useState<string>('')

  const teachers = useLiveQuery(() => db.teachers.toArray(), []) ?? []
  const closedMonths = useLiveQuery(() => db.monthClose.toArray(), []) ?? []
  const isClosed = closedMonths.some(c => c.month === currentMonth)

  const lessons = useLiveQuery(() =>
    db.lessons.where('date').between(`${currentMonth}-01`, `${currentMonth}-31`, true, true).toArray()
  , [currentMonth]) ?? []

  const printRef = useRef<HTMLDivElement>(null)

  const activeTeacher = teachers.find(t => t.id === activeTeacherId) ?? teachers[0]

  const teacherLessons = lessons.filter(l => l.teacherId === activeTeacher?.id)

  // 날짜별 그룹
  const grouped = teacherLessons.reduce<Record<string, typeof teacherLessons>>((acc, l) => {
    if (!acc[l.date]) acc[l.date] = []
    acc[l.date].push(l)
    return acc
  }, {})

  // 학생별 합계
  const studentTotals = teacherLessons.reduce<Record<string, number>>((acc, l) => {
    for (const s of l.students) {
      acc[s.name] = (acc[s.name] ?? 0) + s.fee + (s.offIceFee ?? 0)
    }
    return acc
  }, {})

  const total = Object.values(studentTotals).reduce((a, b) => a + b, 0)

  function prevMonth() {
    const d = new Date(year, month - 2, 1)
    setCurrentMonth(toYYYYMM(d))
  }
  function nextMonth() {
    const d = new Date(year, month, 1)
    setCurrentMonth(toYYYYMM(d))
  }

  async function handleDownloadImage() {
    if (!printRef.current) return
    const canvas = await html2canvas(printRef.current, { scale: 2, backgroundColor: '#ffffff' })
    const dataUrl = canvas.toDataURL('image/png')
    const filename = `${currentMonth}_${activeTeacher?.name ?? '선생님'}_레슨비.png`

    // iOS: Web Share API로 공유 (카메라롤 저장 가능) — canShare 체크 없이 바로 시도
    if (typeof navigator.share === 'function') {
      try {
        const blob = await (await fetch(dataUrl)).blob()
        const file = new File([blob], filename, { type: 'image/png' })
        await navigator.share({ files: [file], title: filename })
        return
      } catch (e) {
        if ((e as Error).name === 'AbortError') return // 사용자가 취소
        // share 실패 시 fallback으로 내려감
      }
    }

    // iOS Safari fallback: 새 탭에서 이미지 열어 길게 눌러 저장
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      const w = window.open()
      if (w) {
        w.document.write(`<img src="${dataUrl}" style="max-width:100%;display:block">`)
        w.document.title = filename
      }
      return
    }

    // 데스크톱: 링크 다운로드
    const link = document.createElement('a')
    link.download = filename
    link.href = dataUrl
    link.click()
  }

  if (!activeTeacher) return null

  return (
    <div className="flex flex-col h-full">
      {/* 월 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <button onClick={prevMonth} className="p-1 rounded-full hover:bg-gray-100">
          <ChevronLeft size={20} className="text-gray-600" />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold text-gray-800">{year}년 {month}월</span>
          {isClosed && <Lock size={14} className="text-gray-400" />}
        </div>
        <button onClick={nextMonth} className="p-1 rounded-full hover:bg-gray-100">
          <ChevronRight size={20} className="text-gray-600" />
        </button>
      </div>

      {/* 선생님 탭 */}
      <div className="overflow-x-auto border-b border-gray-100">
        <div className="flex px-3 py-2 gap-2 min-w-max">
          {teachers.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTeacherId(t.id)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                (activeTeacherId === t.id || (!activeTeacherId && teachers[0]?.id === t.id))
                  ? 'text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
              style={(activeTeacherId === t.id || (!activeTeacherId && teachers[0]?.id === t.id))
                ? { backgroundColor: t.color }
                : {}}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {/* 내역 */}
      <div className="flex-1 overflow-y-auto">
        <div ref={printRef} className="px-4 py-4 space-y-4 bg-white">
          {/* 헤더 (캡처용) */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">{activeTeacher.name}</h2>
            <span className="text-sm text-gray-500">{year}년 {month}월</span>
          </div>

          {/* 레슨 테이블 */}
          {Object.keys(grouped).length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">이번 달 레슨 없음</div>
          ) : (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-3 py-2 text-xs text-gray-500 font-medium">날짜</th>
                    <th className="text-left px-3 py-2 text-xs text-gray-500 font-medium">장소</th>
                    <th className="text-left px-3 py-2 text-xs text-gray-500 font-medium">이름</th>
                    <th className="text-right px-3 py-2 text-xs text-gray-500 font-medium">시간</th>
                    <th className="text-right px-3 py-2 text-xs text-gray-500 font-medium">금액</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([date, ls]) =>
                    ls.flatMap((l, li) =>
                      l.students.map((s, si) => {
                        const isFirstInGroup = li === 0 && si === 0
                        const dateLabel = isFirstInGroup ? date.replace(/^\d{4}-/, '').replace('-', '/') : ''
                        const locationLabel = si === 0 ? l.location : ''
                        return (
                          <tr key={`${l.id}-${si}`} className="border-b border-gray-100 last:border-0">
                            <td className="px-3 py-2 text-gray-600">{dateLabel}</td>
                            <td className="px-3 py-2 text-gray-600">{locationLabel}</td>
                            <td className="px-3 py-2 text-gray-800 font-medium">
                              {s.name}
                              {s.unpaid && <span className="ml-1 text-xs text-red-400">(미납)</span>}
                            </td>
                            <td className="px-3 py-2 text-right text-gray-600">
                              {s.minutes !== 0 ? `${s.minutes}분` : '-'}
                            </td>
                            <td className="px-3 py-2 text-right font-medium text-gray-800">
                              {(s.fee + (s.offIceFee ?? 0)).toLocaleString()}
                            </td>
                          </tr>
                        )
                      })
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* 총계 */}
          {Object.keys(studentTotals).length > 0 && (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-500 border-b border-gray-200">총계</div>
              {Object.entries(studentTotals).map(([name, amt]) => (
                <div key={name} className="flex justify-between px-3 py-2 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-gray-800 font-medium">{name}</span>
                  <span className="text-sm font-semibold text-gray-800">{amt.toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between px-3 py-3 bg-gray-50">
                <span className="text-sm font-bold text-gray-800">합계</span>
                <span className="text-base font-bold text-emerald-600">{formatKRW(total)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 다운로드 버튼 */}
      <div className="px-4 py-4 border-t border-gray-100">
        <button
          onClick={handleDownloadImage}
          className="w-full flex items-center justify-center gap-2 bg-gray-800 text-white rounded-xl py-3 text-sm font-medium"
        >
          <Download size={16} />
          이미지로 저장
        </button>
      </div>
    </div>
  )
}
