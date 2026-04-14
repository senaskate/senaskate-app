import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db'
import { useAppStore } from '../../stores/appStore'
import { DAY_LABELS } from '../../rules/utils'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'

interface TimeBlock {
  id: string
  type: 'lesson' | 'personal'
  title: string
  subtitle?: string
  color: string
  startHour: number
  startMin: number
  endHour: number
  endMin: number
  allDay?: boolean
  raw: unknown
  teacherInitial?: string
  teacherColor?: string
}

function formatKoreanTime(hour: number, min: number) {
  const ampm = hour < 12 ? '오전' : '오후'
  const h = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${ampm} ${h}:${String(min).padStart(2, '0')}`
}

export default function DayView() {
  const { selectedDate, setSelectedDate, setCalendarView, openInputModal } = useAppStore()
  const [addMenuOpen, setAddMenuOpen] = useState(false)

  const dateObj = useMemo(() => new Date(selectedDate + 'T00:00:00'), [selectedDate])
  const month = dateObj.getMonth() + 1
  const dayNum = dateObj.getDate()
  const dow = DAY_LABELS[dateObj.getDay()]

  const lessons = useLiveQuery(() =>
    db.lessons.where('date').equals(selectedDate).toArray()
  , [selectedDate]) ?? []

  const personalEvents = useLiveQuery(() =>
    db.personalEvents.where('date').equals(selectedDate).toArray()
  , [selectedDate]) ?? []

  const teachers = useLiveQuery(() => db.teachers.toArray(), []) ?? []

  function prevDay() {
    const d = new Date(dateObj)
    d.setDate(d.getDate() - 1)
    setSelectedDate(d.toISOString().split('T')[0])
  }
  function nextDay() {
    const d = new Date(dateObj)
    d.setDate(d.getDate() + 1)
    setSelectedDate(d.toISOString().split('T')[0])
  }

  const blocks = useMemo<TimeBlock[]>(() => {
    const result: TimeBlock[] = []

    for (const lesson of lessons) {
      const teacher = teachers.find(t => t.id === lesson.teacherId)
      const maxMin = Math.max(...lesson.students.map(s => s.minutes), 60)
      const studentNames = lesson.students.map(s => s.name).join(', ')
      const [sh, sm] = lesson.startTime ? lesson.startTime.split(':').map(Number) : [9, 0]
      const totalEndMin = sh * 60 + sm + maxMin
      result.push({
        id: lesson.id,
        type: 'lesson',
        title: lesson.location,
        subtitle: studentNames,
        color: teacher?.color ?? '#10b981',
        startHour: sh,
        startMin: sm,
        endHour: Math.floor(totalEndMin / 60),
        endMin: totalEndMin % 60,
        raw: lesson,
        teacherInitial: teacher?.name.charAt(0),
        teacherColor: teacher?.color ?? '#10b981',
      })
    }

    for (const p of personalEvents) {
      if (p.allDay) {
        result.push({
          id: p.id,
          type: 'personal',
          title: p.title,
          color: p.color,
          startHour: -1,
          startMin: 0,
          endHour: -1,
          endMin: 0,
          allDay: true,
          raw: p,
        })
      } else {
        const [sh, sm] = p.startTime.split(':').map(Number)
        const [eh, em] = p.endTime.split(':').map(Number)
        result.push({
          id: p.id,
          type: 'personal',
          title: p.title,
          color: p.color,
          startHour: sh,
          startMin: sm,
          endHour: eh,
          endMin: em,
          raw: p,
        })
      }
    }

    return result.sort((a, b) => {
      if (a.allDay && !b.allDay) return -1
      if (!a.allDay && b.allDay) return 1
      return (a.startHour * 60 + a.startMin) - (b.startHour * 60 + b.startMin)
    })
  }, [lessons, personalEvents, teachers])

  const allDayBlocks = blocks.filter(b => b.allDay)
  const timedBlocks = blocks.filter(b => !b.allDay)

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 헤더 */}
      <div className="flex items-center px-4 pt-4 pb-2">
        <button
          onClick={() => setCalendarView('month')}
          className="text-emerald-600 text-sm font-medium bg-emerald-50 px-3 py-1.5 rounded-full mr-3 flex-shrink-0"
        >
          ← 월간
        </button>
        <div className="flex-1 flex items-center gap-1">
          <button onClick={prevDay} className="text-gray-400 px-1 text-xl leading-none">‹</button>
          <h1 className="text-xl font-bold text-gray-900">
            {month}월 {dayNum}일 {dow}요일
          </h1>
          <button onClick={nextDay} className="text-gray-400 px-1 text-xl leading-none">›</button>
        </div>
        {/* + 버튼 */}
        <div className="relative">
          <button
            onClick={() => setAddMenuOpen(!addMenuOpen)}
            className="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center"
          >
            <Plus size={20} style={{ transform: addMenuOpen ? 'rotate(45deg)' : 'none', transition: 'transform 0.15s' }} />
          </button>
          {addMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setAddMenuOpen(false)} />
              <div className="absolute right-0 top-12 z-20 flex flex-col gap-1.5 items-end">
                {[
                  { type: 'lesson' as const, label: '레슨', color: '#10b981' },
                  { type: 'choreo' as const, label: '안무', color: '#8b5cf6' },
                  { type: 'personal' as const, label: '개인 일정', color: '#60a5fa' },
                ].map(({ type, label, color }) => (
                  <button
                    key={type}
                    onClick={() => { openInputModal(type, selectedDate); setAddMenuOpen(false) }}
                    className="flex items-center gap-2 bg-white shadow-lg border border-gray-100 rounded-full px-4 py-2 text-sm font-medium text-gray-800 whitespace-nowrap"
                  >
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 하루종일 이벤트 */}
      {allDayBlocks.length > 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          {allDayBlocks.map(block => (
            <button
              key={block.id}
              onClick={() => openInputModal('personal', selectedDate, block.id)}
              className="rounded-full px-3 py-1 text-sm font-medium"
              style={{ backgroundColor: block.color + '22', color: block.color }}
            >
              {block.title}
            </button>
          ))}
        </div>
      )}

      {/* 구분선 */}
      <div className="mx-4 border-b border-gray-100 mb-1" />

      {/* 이벤트 목록 */}
      <div className="flex-1 overflow-y-auto">
        {timedBlocks.length === 0 && allDayBlocks.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">일정이 없습니다</div>
        ) : timedBlocks.length === 0 ? null : (
          timedBlocks.map(block => (
            <button
              key={block.id}
              onClick={() => openInputModal(block.type === 'lesson' ? 'lesson' : 'personal', selectedDate, block.id)}
              className="w-full flex items-stretch px-4 py-3 text-left active:bg-gray-50"
            >
              {/* 시간 열 */}
              <div className="w-20 flex-shrink-0 flex flex-col justify-center">
                <span className="text-sm font-semibold text-gray-800 leading-tight">
                  {formatKoreanTime(block.startHour, block.startMin)}
                </span>
                <span className="text-xs text-gray-400 mt-0.5 leading-tight">
                  {formatKoreanTime(block.endHour, block.endMin)}
                </span>
              </div>

              {/* 세로 바 */}
              <div
                className="w-1 rounded-full mx-3 flex-shrink-0 self-stretch"
                style={{ backgroundColor: '#10b981', minHeight: 40 }}
              />

              {/* 제목 영역 */}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <p className="text-base font-bold text-gray-900 truncate">{block.title}</p>
                {block.subtitle && (
                  <p className="text-sm text-gray-500 mt-0.5 truncate">{block.subtitle}</p>
                )}
              </div>

              {/* 선생님 아바타 (레슨만) */}
              {block.teacherInitial && (
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ml-3 flex-shrink-0 self-center"
                  style={{ backgroundColor: block.teacherColor }}
                >
                  {block.teacherInitial}
                </div>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  )
}
