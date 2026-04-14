import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db'
import { useAppStore } from '../../stores/appStore'
import { DAY_LABELS } from '../../rules/utils'
import { ChevronDown } from 'lucide-react'

const TODAY = new Date().toISOString().split('T')[0]

export default function MonthCalendar() {
  const { currentMonth, selectedDate, setSelectedDate, setCalendarView, setCurrentMonth } = useAppStore()
  const [year, month] = currentMonth.split('-').map(Number)

  const rangeStart = `${year}-${String(month).padStart(2,'0')}-01`
  const rangeEnd   = `${year}-${String(month).padStart(2,'0')}-31`

  const lessons = useLiveQuery(() =>
    db.lessons.where('date').between(rangeStart, rangeEnd, true, true).toArray()
  , [currentMonth]) ?? []

  const personalEvents = useLiveQuery(() =>
    db.personalEvents.where('date').between(rangeStart, rangeEnd, true, true).toArray()
  , [currentMonth]) ?? []

  const teachers = useLiveQuery(() => db.teachers.toArray(), []) ?? []

  // 날짜별 이벤트 맵
  const eventMap = useMemo(() => {
    const map: Record<string, { label: string; color: string; id: string }[]> = {}
    for (const l of lessons) {
      if (!map[l.date]) map[l.date] = []
      const teacher = teachers.find(t => t.id === l.teacherId)
      const time = l.startTime ? ` ${l.startTime}` : ''
      const label = `${l.location}${time}`
      map[l.date].push({ label, color: teacher?.color ?? '#10b981', id: l.id })
    }
    for (const p of personalEvents) {
      if (!map[p.date]) map[p.date] = []
      const time = p.allDay ? '' : ` ${p.startTime}`
      map[p.date].push({ label: `${p.title}${time}`, color: p.color, id: p.id })
    }
    return map
  }, [lessons, personalEvents, teachers])

  // 달력 그리드 생성
  const cells = useMemo(() => {
    const firstDow = new Date(year, month - 1, 1).getDay()
    const lastDate = new Date(year, month, 0).getDate()
    const result: { date: string; day: number; inMonth: boolean }[] = []

    // 이전 달
    for (let i = firstDow - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, -i)
      result.push({ date: d.toISOString().split('T')[0], day: d.getDate(), inMonth: false })
    }
    // 이번 달
    for (let d = 1; d <= lastDate; d++) {
      const dateObj = new Date(year, month - 1, d)
      result.push({ date: dateObj.toISOString().split('T')[0], day: d, inMonth: true })
    }
    // 다음 달 (6주 고정)
    const remaining = 42 - result.length
    for (let d = 1; d <= remaining; d++) {
      const dateObj = new Date(year, month, d)
      result.push({ date: dateObj.toISOString().split('T')[0], day: d, inMonth: false })
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

      {/* 날짜 그리드 */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full table-fixed border-collapse">
          <tbody>
            {weeks.map((week, wi) => (
              <tr key={wi} className="border-b border-gray-100 last:border-0">
                {week.map((cell, di) => {
                  const isToday    = cell.date === TODAY
                  const isSelected = cell.date === selectedDate && cell.inMonth
                  const isSun      = di === 0
                  const isSat      = di === 6
                  const events     = eventMap[cell.date] ?? []

                  return (
                    <td
                      key={cell.date}
                      onClick={() => handleDayTap(cell)}
                      className={`align-top px-0.5 py-0.5 border-r border-gray-100 last:border-0 cursor-pointer select-none
                        ${cell.inMonth ? '' : 'opacity-30'}`}
                      style={{ minHeight: 72 }}
                    >
                      {/* 날짜 번호 */}
                      <div className="flex justify-center mb-0.5 pt-1">
                        <span className={`
                          text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full
                          ${isToday ? 'bg-gray-900 text-white' : ''}
                          ${isSelected && !isToday ? 'bg-emerald-500 text-white' : ''}
                          ${!isToday && !isSelected && isSun ? 'text-red-400' : ''}
                          ${!isToday && !isSelected && isSat ? 'text-blue-400' : ''}
                          ${!isToday && !isSelected && !isSun && !isSat ? 'text-gray-700' : ''}
                        `}>
                          {cell.day}
                        </span>
                      </div>

                      {/* 이벤트 칩 */}
                      <div className="space-y-0.5 px-0.5">
                        {events.slice(0, 3).map((ev, ei) => (
                          <div
                            key={ei}
                            className="rounded text-white truncate"
                            style={{ backgroundColor: ev.color, fontSize: 9, padding: '1px 3px', lineHeight: '14px' }}
                          >
                            {ev.label}
                          </div>
                        ))}
                        {events.length > 3 && (
                          <div className="text-gray-400 pl-0.5" style={{ fontSize: 9 }}>
                            +{events.length - 3}
                          </div>
                        )}
                      </div>
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
