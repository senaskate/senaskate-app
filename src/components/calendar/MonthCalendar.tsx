import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db'
import { useAppStore } from '../../stores/appStore'
import { DAY_LABELS, KR_HOLIDAYS, localDateStr } from '../../rules/utils'
import { ChevronDown } from 'lucide-react'

const TODAY = localDateStr()

type SpanPos = 'single' | 'start' | 'mid' | 'end'

interface Chip {
  id: string
  label: string
  bgColor: string
  textColor: string
  isMultiday: boolean
  spanPos: SpanPos
}

// 시간 범위 레이블 "태릉10-11반" (공백 없음)
function makeTimeRange(startTime: string | undefined, endTime: string | undefined, maxMin: number): string {
  if (!startTime) return ''
  const [sh, sm] = startTime.split(':').map(Number)
  let eh: number, em: number
  if (endTime) {
    ;[eh, em] = endTime.split(':').map(Number)
    if (eh < sh) eh += 24
  } else {
    const total = sh * 60 + sm + maxMin
    eh = Math.floor(total / 60)
    em = total % 60
  }
  const fmt = (h: number, m: number) => m === 30 ? `${h}반` : `${h}`
  return `${fmt(sh, sm)}-${fmt(eh, em)}`
}

// 날짜 범위 내 모든 날짜 배열
function dateRange(startDate: string, endDate: string): string[] {
  const result: string[] = []
  let cur = new Date(startDate + 'T00:00:00')
  const end = new Date(endDate + 'T00:00:00')
  while (cur <= end) {
    result.push(localDateStr(cur))
    cur.setDate(cur.getDate() + 1)
  }
  return result
}

export default function MonthCalendar() {
  const { currentMonth, selectedDate, setSelectedDate, setCalendarView, setCurrentMonth } = useAppStore()
  const [year, month] = currentMonth.split('-').map(Number)

  const rangeStart = `${year}-${String(month).padStart(2,'0')}-01`
  const rangeEnd   = `${year}-${String(month).padStart(2,'0')}-31`
  // 이전달 말일도 포함 (다중일 일정이 이전달에 시작할 수 있음)
  const prevStart  = new Date(year, month - 2, 15).toISOString().split('T')[0]

  const lessons = useLiveQuery(() =>
    db.lessons.where('date').between(rangeStart, rangeEnd, true, true).toArray()
  , [currentMonth]) ?? []

  const personalEvents = useLiveQuery(() =>
    db.personalEvents.where('date').between(prevStart, rangeEnd, true, true).toArray()
  , [currentMonth]) ?? []

  const teachers = useLiveQuery(() => db.teachers.toArray(), []) ?? []

  // 날짜별 칩 맵
  const chipMap = useMemo(() => {
    const map: Record<string, Chip[]> = {}

    const ensure = (d: string) => { if (!map[d]) map[d] = [] }

    // ① 다중일 개인 일정 (먼저 추가, unshift로 상단 배치)
    for (const p of personalEvents) {
      if (!p.allDay || !p.endDate || p.endDate === p.date) continue
      const dates = dateRange(p.date, p.endDate)
      const total = dates.length
      dates.forEach((d, i) => {
        if (d < rangeStart || d > rangeEnd) return
        ensure(d)
        const spanPos: SpanPos = total === 1 ? 'single' : i === 0 ? 'start' : i === total - 1 ? 'end' : 'mid'
        map[d].unshift({
          id: p.id + '-' + d,
          label: p.title,
          bgColor: p.color + '33',
          textColor: p.color,
          isMultiday: true,
          spanPos,
        })
      })
    }

    // ② 레슨
    for (const l of lessons) {
      ensure(l.date)
      const maxMin = l.students.length > 0 ? Math.max(...l.students.map(s => s.minutes)) : 60
      const range = makeTimeRange(l.startTime, l.endTime, maxMin)
      map[l.date].push({
        id: l.id,
        label: `${l.location}${range}`,
        bgColor: '#d1fae5',
        textColor: '#059669',
        isMultiday: false,
        spanPos: 'single',
      })
    }

    // ③ 단일 개인 일정
    for (const p of personalEvents) {
      if (p.allDay && p.endDate && p.endDate !== p.date) continue // 다중일은 위에서 처리
      if (p.date < rangeStart || p.date > rangeEnd) continue
      ensure(p.date)
      const timeLabel = p.allDay ? '' : ` ${p.startTime}`
      map[p.date].push({
        id: p.id,
        label: `${p.title}${timeLabel}`,
        bgColor: p.color + '33',
        textColor: p.color,
        isMultiday: false,
        spanPos: 'single',
      })
    }

    return map
  }, [lessons, personalEvents, teachers, rangeStart, rangeEnd])

  // 달력 그리드
  const cells = useMemo(() => {
    const firstDow = new Date(year, month - 1, 1).getDay()
    const lastDate = new Date(year, month, 0).getDate()
    const result: { date: string; day: number; inMonth: boolean }[] = []
    for (let i = firstDow - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, -i)
      result.push({ date: localDateStr(d), day: d.getDate(), inMonth: false })
    }
    for (let d = 1; d <= lastDate; d++) {
      const dateObj = new Date(year, month - 1, d)
      result.push({ date: localDateStr(dateObj), day: d, inMonth: true })
    }
    const remaining = 42 - result.length
    for (let d = 1; d <= remaining; d++) {
      const dateObj = new Date(year, month, d)
      result.push({ date: localDateStr(dateObj), day: d, inMonth: false })
    }
    return result
  }, [year, month])

  function prevMonth() {
    const d = new Date(year, month - 2, 1)
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}`)
  }
  function nextMonth() {
    const d = new Date(year, month, 1)
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}`)
  }
  function handleDayTap(cell: typeof cells[0]) {
    if (!cell.inMonth) return
    setSelectedDate(cell.date)
    setCalendarView('day')
  }

  const weeks: typeof cells[] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-white">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center text-gray-400 text-lg font-light">‹</button>
        <button className="flex items-center gap-1" onClick={() => {}}>
          <span className="text-lg font-bold text-gray-900">{year}년 {month}월</span>
          <ChevronDown size={16} className="text-gray-400" />
        </button>
        <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center text-gray-400 text-lg font-light">›</button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {DAY_LABELS.map((d, i) => (
          <div key={d} className={`text-center text-xs py-1.5 font-medium
            ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'}`}>
            {d}
          </div>
        ))}
      </div>

      {/* 날짜 그리드: 화면 전체 채우기 */}
      <div className="flex-1 overflow-hidden">
        <table className="w-full table-fixed border-collapse" style={{ height: '100%' }}>
          <tbody>
            {weeks.map((week, wi) => (
              // 모든 행이 동일한 높이로 화면을 꽉 채움
              <tr key={wi} className="border-b border-gray-100 last:border-0" style={{ height: `${100 / weeks.length}%` }}>
                {week.map((cell, di) => {
                  const isToday    = cell.date === TODAY
                  const isSelected = cell.date === selectedDate && cell.inMonth
                  const isSun      = di === 0
                  const isSat      = di === 6
                  const holiday    = KR_HOLIDAYS[cell.date]
                  const chips      = chipMap[cell.date] ?? []
                  const multidayChips = chips.filter(c => c.isMultiday)
                  const regularChips  = chips.filter(c => !c.isMultiday)

                  return (
                    <td
                      key={cell.date}
                      onClick={() => handleDayTap(cell)}
                      className={`align-top p-0 border-r border-gray-100 last:border-0 cursor-pointer select-none
                        ${cell.inMonth ? '' : 'opacity-30'}`}
                    >
                      {/* 셀 높이 = 행 높이(%), 내용이 넘치면 hidden */}
                      <div style={{ height: '100%', overflow: 'hidden' }} className="py-0.5">
                      {/* 날짜 번호 + 공휴일 */}
                      <div className="flex flex-col items-center mb-0.5 pt-1">
                        <span className={`
                          text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full
                          ${isToday ? 'bg-gray-900 text-white' : ''}
                          ${isSelected && !isToday ? 'bg-emerald-500 text-white' : ''}
                          ${!isToday && !isSelected && (isSun || holiday) ? 'text-red-400' : ''}
                          ${!isToday && !isSelected && isSat && !holiday ? 'text-blue-400' : ''}
                          ${!isToday && !isSelected && !isSun && !isSat && !holiday ? 'text-gray-700' : ''}
                        `}>
                          {cell.day}
                        </span>
                        {holiday && cell.inMonth && (
                          <span style={{ fontSize: 7, lineHeight: '10px', color: '#ef4444', marginTop: 1 }} className="font-medium truncate w-full text-center px-0.5">
                            {holiday}
                          </span>
                        )}
                      </div>

                      {/* 다중일 이벤트 배너 — 셀 경계선을 음수 마진으로 덮어 끊김 없이 연결 */}
                      {multidayChips.length > 0 && (
                        <div className="space-y-0.5 mb-0.5">
                          {multidayChips.map(chip => {
                            const isMid   = chip.spanPos === 'mid'
                            const isEnd   = chip.spanPos === 'end'
                            const isStart = chip.spanPos === 'start'
                            return (
                              <div
                                key={chip.id}
                                style={{
                                  backgroundColor: chip.bgColor,
                                  color: chip.textColor,
                                  fontSize: 8,
                                  lineHeight: '13px',
                                  textAlign: 'center',
                                  fontWeight: 600,
                                  overflow: 'hidden',
                                  whiteSpace: 'nowrap',
                                  // 왼쪽 경계선(1px)을 덮어서 끊김 없이 이어붙임
                                  marginLeft:  (isMid || isEnd)   ? -1 : 0,
                                  // 오른쪽 경계선도 덮어서 다음 셀과 연결
                                  marginRight: (isMid || isStart) ? -1 : 0,
                                  paddingTop: 1,
                                  paddingBottom: 1,
                                  paddingLeft:  (isMid || isEnd)   ? 0 : 3,
                                  paddingRight: (isMid || isStart) ? 0 : 3,
                                  borderRadius:
                                    isStart ? '3px 0 0 3px' :
                                    isEnd   ? '0 3px 3px 0' :
                                    isMid   ? 0 : 3,
                                }}
                              >
                                {isMid ? '\u00A0' : chip.label}
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* 일반 이벤트 칩 (텍스트 중앙정렬) */}
                      <div className="space-y-0.5 px-0.5">
                        {regularChips.map((chip) => (
                          <div
                            key={chip.id}
                            style={{
                              backgroundColor: chip.bgColor,
                              color: chip.textColor,
                              fontSize: 8,
                              padding: '1px 2px',
                              lineHeight: '13px',
                              textAlign: 'center',
                              borderRadius: 3,
                              overflow: 'hidden',
                              whiteSpace: 'nowrap',
                              fontWeight: 500,
                            }}
                          >
                            {chip.label}
                          </div>
                        ))}
                      </div>
                      </div>{/* 셀 div 닫기 */}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
