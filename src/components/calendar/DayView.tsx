import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db'
import { useAppStore } from '../../stores/appStore'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { DAY_LABELS } from '../../rules/utils'

interface TimeBlock {
  id: string
  type: 'lesson' | 'personal'
  title: string
  subtitle?: string
  color: string
  startHour: number
  startMin: number
  durationMin: number
  raw: unknown
}

const HOUR_HEIGHT = 60 // px per hour

export default function DayView() {
  const { selectedDate, setSelectedDate, openInputModal } = useAppStore()

  const dateObj = useMemo(() => new Date(selectedDate + 'T00:00:00'), [selectedDate])
  const dow = DAY_LABELS[dateObj.getDay()]
  const dayNum = dateObj.getDate()
  const isToday = selectedDate === new Date().toISOString().split('T')[0]

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

  // 시간 블록 생성
  const blocks = useMemo<TimeBlock[]>(() => {
    const result: TimeBlock[] = []

    for (const lesson of lessons) {
      const teacher = teachers.find(t => t.id === lesson.teacherId)
      const maxMin = Math.max(...lesson.students.map(s => s.minutes), 60)
      const studentNames = lesson.students.map(s => s.name).join(', ')
      const [sh, sm] = lesson.startTime ? lesson.startTime.split(':').map(Number) : [9, 0]
      result.push({
        id: lesson.id,
        type: 'lesson',
        title: `${lesson.location} · ${studentNames}`,
        subtitle: teacher?.name,
        color: teacher?.color ?? '#10b981',
        startHour: sh,
        startMin: sm,
        durationMin: maxMin,
        raw: lesson,
      })
    }

    for (const p of personalEvents) {
      const [sh, sm] = p.startTime.split(':').map(Number)
      const [eh, em] = p.endTime.split(':').map(Number)
      const dur = (eh * 60 + em) - (sh * 60 + sm)
      result.push({
        id: p.id,
        type: 'personal',
        title: p.title,
        color: p.color,
        startHour: sh,
        startMin: sm,
        durationMin: dur,
        raw: p,
      })
    }

    return result
  }, [lessons, personalEvents, teachers])

  const hours = Array.from({ length: 24 }, (_, i) => i)

  return (
    <div className="flex flex-col h-full">
      {/* 날짜 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <button onClick={prevDay} className="p-1 rounded-full hover:bg-gray-100">
          <ChevronLeft size={20} className="text-gray-600" />
        </button>
        <div className="text-center">
          <span className={`text-2xl font-bold ${isToday ? 'text-emerald-500' : 'text-gray-800'}`}>{dayNum}</span>
          <span className="text-sm text-gray-500 ml-1">{dow}요일</span>
        </div>
        <button onClick={nextDay} className="p-1 rounded-full hover:bg-gray-100">
          <ChevronRight size={20} className="text-gray-600" />
        </button>
      </div>

      {/* 시간 그리드 */}
      <div className="flex-1 overflow-y-auto">
        <div className="relative" style={{ height: `${24 * HOUR_HEIGHT}px` }}>
          {/* 시간 라인 */}
          {hours.map(h => (
            <div key={h} className="absolute left-0 right-0 flex items-start" style={{ top: `${h * HOUR_HEIGHT}px` }}>
              <span className="w-12 text-right text-xs text-gray-400 pr-3 pt-0 leading-none -mt-2">
                {h === 0 ? '' : `${h}:00`}
              </span>
              <div className="flex-1 border-t border-gray-100" />
            </div>
          ))}

          {/* 이벤트 블록 */}
          {blocks.map(block => {
            const top = (block.startHour * 60 + block.startMin) / 60 * HOUR_HEIGHT
            const height = Math.max(block.durationMin / 60 * HOUR_HEIGHT, 30)
            return (
              <div
                key={block.id}
                onClick={() => openInputModal(block.type === 'lesson' ? 'lesson' : 'personal', selectedDate, block.id)}
                className="absolute left-14 right-2 rounded-lg px-2 py-1 cursor-pointer shadow-sm"
                style={{ top: `${top}px`, height: `${height}px`, backgroundColor: block.color + '22', borderLeft: `3px solid ${block.color}` }}
              >
                <p className="text-xs font-semibold truncate" style={{ color: block.color }}>{block.title}</p>
                {block.subtitle && <p className="text-xs text-gray-500 truncate">{block.subtitle}</p>}
              </div>
            )
          })}

          {/* 현재 시간 라인 */}
          {isToday && (() => {
            const now = new Date()
            const top = (now.getHours() * 60 + now.getMinutes()) / 60 * HOUR_HEIGHT
            return (
              <div className="absolute left-12 right-0 flex items-center" style={{ top: `${top}px` }}>
                <div className="w-2 h-2 rounded-full bg-red-500 -ml-1" />
                <div className="flex-1 border-t border-red-500" />
              </div>
            )
          })()}
        </div>
      </div>

      {/* 빠른 추가 버튼들 */}
      <div className="px-4 pb-4 pt-2 flex gap-2 border-t border-gray-100">
        <button
          onClick={() => openInputModal('lesson', selectedDate)}
          className="flex-1 flex items-center justify-center gap-1 bg-emerald-500 text-white rounded-xl py-2.5 text-sm font-medium"
        >
          <Plus size={16} />
          레슨
        </button>
        <button
          onClick={() => openInputModal('choreo', selectedDate)}
          className="flex-1 flex items-center justify-center gap-1 bg-violet-500 text-white rounded-xl py-2.5 text-sm font-medium"
        >
          <Plus size={16} />
          안무
        </button>
        <button
          onClick={() => openInputModal('personal', selectedDate)}
          className="flex items-center justify-center gap-1 bg-gray-100 text-gray-600 rounded-xl py-2.5 px-4 text-sm font-medium"
        >
          <Plus size={16} />
          개인
        </button>
      </div>
    </div>
  )
}
