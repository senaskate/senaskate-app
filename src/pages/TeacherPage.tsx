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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)

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
  const showGrandTotal = activeTeacher?.name === '나희쌤'

  function prevMonth() {
    const d = new Date(year, month - 2, 1)
    setCurrentMonth(toYYYYMM(d))
  }
  function nextMonth() {
    const d = new Date(year, month, 1)
    setCurrentMonth(toYYYYMM(d))
  }

  async function handleDownloadImage() {
    if (isDownloading || !activeTeacher) return
    setIsDownloading(true)
    try {
      // Tailwind 클래스 의존성 없이 인라인 스타일 div로 생성 (html2canvas 안정성↑)
      const div = document.createElement('div')
      div.style.cssText = 'position:fixed;top:-9999px;left:-9999px;background:#fff;width:390px;padding:20px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;color:#1a1a1a;'

      // 레슨 내역 행: 작고 연한 글씨
      const rows = Object.entries(grouped)
        .sort(([a], [b]) => a.localeCompare(b))
        .flatMap(([date, ls]) =>
          ls.flatMap((l, li) =>
            l.students.map((s, si) => {
              const isFirst = li === 0 && si === 0
              return `<tr style="border-bottom:1px solid #f3f4f6">
                <td style="padding:4px 8px;font-size:11px;color:#9ca3af">${isFirst ? date.slice(5).replace('-', '/') : ''}</td>
                <td style="padding:4px 8px;font-size:11px;color:#9ca3af">${si === 0 ? l.location : ''}</td>
                <td style="padding:4px 8px;font-size:11px;color:#9ca3af">${s.name}${s.unpaid ? ' (미납)' : ''}</td>
                <td style="padding:4px 8px;font-size:11px;text-align:right;color:#9ca3af">${s.minutes}분</td>
                <td style="padding:4px 8px;font-size:11px;text-align:right;color:#9ca3af">${(s.fee + (s.offIceFee ?? 0)).toLocaleString()}</td>
              </tr>`
            })
          )
        ).join('')

      // 총계 행: 크고 굵은 글씨
      const totalsRows = Object.entries(studentTotals)
        .map(([name, amt]) => `<tr style="border-bottom:1px solid #f3f4f6">
          <td style="padding:8px 8px;font-size:14px;font-weight:700;color:#1a1a1a">${name}</td>
          <td style="padding:8px 8px;font-size:14px;text-align:right;font-weight:700;color:#1a1a1a">${amt.toLocaleString()}</td>
        </tr>`).join('')

      const showTotal = activeTeacher.name === '나희쌤'

      div.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <span style="font-size:16px;font-weight:700">${activeTeacher.name}</span>
          <span style="color:#6b7280">${year}년 ${month}월</span>
        </div>
        ${rows ? `<table style="width:100%;border-collapse:collapse;margin-bottom:16px">
          <thead><tr style="background:#f9fafb">
            <th style="padding:6px 8px;text-align:left;border-bottom:1px solid #e5e7eb;font-size:10px;color:#9ca3af">날짜</th>
            <th style="padding:6px 8px;text-align:left;border-bottom:1px solid #e5e7eb;font-size:10px;color:#9ca3af">장소</th>
            <th style="padding:6px 8px;text-align:left;border-bottom:1px solid #e5e7eb;font-size:10px;color:#9ca3af">이름</th>
            <th style="padding:6px 8px;text-align:right;border-bottom:1px solid #e5e7eb;font-size:10px;color:#9ca3af">시간</th>
            <th style="padding:6px 8px;text-align:right;border-bottom:1px solid #e5e7eb;font-size:10px;color:#9ca3af">금액</th>
          </thead><tbody>${rows}</tbody></table>` : ''}
        ${totalsRows ? `<table style="width:100%;border-collapse:collapse">
          <thead><tr style="background:#f9fafb">
            <th colspan="2" style="padding:7px 8px;text-align:left;border-bottom:1px solid #e5e7eb;font-size:11px;color:#6b7280;font-weight:600">총계</th>
          </tr></thead>
          <tbody>${totalsRows}</tbody>
          ${showTotal ? `<tfoot><tr style="background:#f0fdf4">
            <td style="padding:10px 8px;font-size:15px;font-weight:700">합계</td>
            <td style="padding:10px 8px;text-align:right;font-weight:800;color:#059669;font-size:17px">${total.toLocaleString()}원</td>
          </tr></tfoot>` : ''}
        </table>` : ''}
      `
      document.body.appendChild(div)
      const canvas = await html2canvas(div, { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false })
      document.body.removeChild(div)

      const dataUrl = canvas.toDataURL('image/png')
      const filename = `${currentMonth}_${activeTeacher.name}_레슨비.png`

      // Web Share API 시도
      if (typeof navigator.share === 'function') {
        try {
          const blob = await (await fetch(dataUrl)).blob()
          const file = new File([blob], filename, { type: 'image/png' })
          await navigator.share({ files: [file], title: filename })
          return
        } catch (e) {
          if ((e as Error).name === 'AbortError') return
        }
      }

      // iOS fallback: 인앱 미리보기
      if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        setPreviewUrl(dataUrl)
        return
      }

      // 데스크톱 다운로드
      const link = document.createElement('a')
      link.download = filename
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('이미지 저장 실패:', err)
      alert('이미지 생성에 실패했습니다.')
    } finally {
      setIsDownloading(false)
    }
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
                            <td className="px-3 py-1.5 text-xs text-gray-400">{dateLabel}</td>
                            <td className="px-3 py-1.5 text-xs text-gray-400">{locationLabel}</td>
                            <td className="px-3 py-1.5 text-xs text-gray-400">
                              {s.name}
                              {s.unpaid && <span className="ml-1 text-red-300">(미납)</span>}
                            </td>
                            <td className="px-3 py-1.5 text-right text-xs text-gray-400">
                              {s.minutes !== 0 ? `${s.minutes}분` : '-'}
                            </td>
                            <td className="px-3 py-1.5 text-right text-xs text-gray-400">
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
                <div key={name} className="flex justify-between px-3 py-2.5 border-b border-gray-100 last:border-0">
                  <span className="text-base font-bold text-gray-900">{name}</span>
                  <span className="text-base font-bold text-gray-900">{amt.toLocaleString()}</span>
                </div>
              ))}
              {showGrandTotal && (
                <div className="flex justify-between px-3 py-3 bg-gray-50">
                  <span className="text-base font-bold text-gray-800">합계</span>
                  <span className="text-lg font-extrabold text-emerald-600">{formatKRW(total)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 다운로드 버튼 */}
      <div className="px-4 py-4 border-t border-gray-100">
        <button
          onClick={handleDownloadImage}
          disabled={isDownloading}
          className="w-full flex items-center justify-center gap-2 bg-gray-800 text-white rounded-xl py-3 text-sm font-medium disabled:opacity-50"
        >
          <Download size={16} />
          {isDownloading ? '이미지 생성 중...' : '이미지로 저장'}
        </button>
      </div>

      {/* iOS 인앱 이미지 미리보기 — 길게 눌러 저장 */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 px-4"
          onClick={() => setPreviewUrl(null)}
        >
          <p className="text-white text-sm font-medium mb-3 text-center">
            이미지를 길게 눌러 저장하세요
          </p>
          <img
            src={previewUrl}
            alt="레슨비 내역"
            className="rounded-xl shadow-2xl"
            style={{ maxWidth: '100%', maxHeight: '72vh', objectFit: 'contain' }}
            onClick={e => e.stopPropagation()}
          />
          <button
            onClick={() => setPreviewUrl(null)}
            className="mt-4 text-white/60 text-xs"
          >
            닫기
          </button>
        </div>
      )}
    </div>
  )
}
