import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db'
import { useAppStore } from '../../stores/appStore'
import { DAY_LABELS } from '../../rules/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface DayCell {
  date: string       // YYYY-MM-DD
  day: number
  inMonth: boolean
  isToday: boolean
  isSelected: boolean
  isSunday: boolean
  isSaturday: boolean
}

export default function MonthCalendar() {
  const { currentMonth, selectedDate, setSelectedDate, setCurrentMonth, setCalendarView } = useAppStore()

  const [year, month] = currentMonth.split('-').map(Number)
  const today = new Date().toISOString().split('T')[0]

  const lessons = useLiveQuery(() =>
    db.lessons.where('date').between(`${currentMonth}-01`, `${currentMonth}-31`, true, true).toArray()
  , [currentMonth]) ?? []

  const personalEvents = useLiveQuery(() =>
    db.personalEvents.where('date').between(`${currentMonth}-01`, `${currentMonth}-31`, true, true).toArray()
  , [currentMonth]) ?? []

  const choreos = useLiveQuery(() =>
    db.choreos.toArray()
  , []) ?? []

  // 날짜별 도트 색상 계산
  const dotMap = useMemo(() => {
    const map: Record<string, string[]> = {}
    for (const l of lessons) {
      if (!map[l.date]) map[l.date] = []
      // 중복 제거
      if (!map[l.date].includes('#10b981')) map[l.date].push('#10b981')
    }
    for (const p of personalEvents) {
      if (!map[p.date]) map[p.date] = []
      if (!map[p.date].includes(p.color)) map[p.date].push(p.color)
    }
    return map
  }, [lessons, personalEvents])

  const days = useMemo<DayCell[]>(() => {
    const firstDay = new Date(year, month - 1, 1)
    const lastDay = new Date(year, month, 0)
    const startDow = firstDay.getDay() // 0=일
    const cells: DayCell[] = []

    // 이전 달 채우기
    for (let i = startDow - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, -i)
      const dateStr = d.toISOString().split('T')[0]
      cells.push({ date: dateStr, day: d.getDate(), inMonth: false, isToday: false, isSelected: false, isSunday: d.getDay() === 0, isSaturday: d.getDay() === 6 })
    }
    // 현재 달
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateObj = new Date(year, month - 1, d)
      const dateStr = dateObj.toISOString().split('T')[0]
      cells.push({
        date: dateStr, day: d, inMonth: true,
        isToday: dateStr === today,
        isSelected: dateStr === selectedDate,
        isSunday: dateObj.getDay() === 0,
        isSaturday: dateObj.getDay() === 6,
      })
    }
    // 다음 달 채우기 (6주 고정)
    const remaining = 42 - cells.length
    for (let d = 1; d <= remaining; d++) {
      const dateObj = new Date(year, month, d)
      const dateStr = dateObj.toISOString().split('T')[0]
      cells.push({ date: dateStr, day: d, inMonth: false, isToday: false, isSelected: false, isSunday: dateObj.getDay() === 0, isSaturday: dateObj.getDay() === 6 })
    }
    return cells
  }, [year, month, selectedDate, today])

  function prevMonth() {
    const d = new Date(year, month - 2, 1)
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  function nextMonth() {
    const d = new Date(year, month, 1)
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  return (
    <div className="bg-white">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={prevMonth} className="p-1 rounded-full hover:bg-gray-100">
          <ChevronLeft size={20} className="text-gray-600" />
        </button>
        <span className="text-base font-semibold text-gray-800">
          {year}년 {month}월
        </span>
        <button onClick={nextMonth} className="p-1 rounded-full hover:bg-gray-100">
          <ChevronRight size={20} className="text-gray-600" />
        </button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 px-2 pb-1">
        {DAY_LABELS.map((d, i) => (
          <div key={d} className={`text-center text-xs font-medium py-1 ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'}`}>
            {d}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 px-2 pb-3">
        {days.map((cell) => {
          const dots = dotMap[cell.date] ?? []
          return (
            <div
              key={cell.date}
              onClick={() => {
                if (cell.inMonth) {
                  setSelectedDate(cell.date)
                  setCalendarView('day')
                }
              }}
              className={`flex flex-col items-center py-1 cursor-pointer select-none`}
            >
              <div className={`
                w-8 h-8 flex items-center justify-center rounded-full text-sm
                ${!cell.inMonth ? 'text-gray-300' : ''}
                ${cell.isToday && !cell.isSelected ? 'border border-emerald-500 text-emerald-600 font-semibold' : ''}
                ${cell.isSelected ? 'bg-emerald-500 text-white font-semibold' : ''}
                ${cell.inMonth && !cell.isToday && !cell.isSelected && cell.isSunday ? 'text-red-400' : ''}
                ${cell.inMonth && !cell.isToday && !cell.isSelected && cell.isSaturday ? 'text-blue-400' : ''}
                ${cell.inMonth && !cell.isToday && !cell.isSelected && !cell.isSunday && !cell.isSaturday ? 'text-gray-700' : ''}
              `}>
                {cell.day}
              </div>
              {/* 이벤트 도트 */}
              <div className="flex gap-0.5 mt-0.5 min-h-[6px]">
                {dots.slice(0, 3).map((color, i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
