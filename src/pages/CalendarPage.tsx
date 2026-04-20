import { useState } from 'react'
import { useAppStore } from '../stores/appStore'
import MonthCalendar from '../components/calendar/MonthCalendar'
import DayView from '../components/calendar/DayView'
import { Plus } from 'lucide-react'

export default function CalendarPage() {
  const { calendarView, openInputModal, selectedDate } = useAppStore()
  const [fabOpen, setFabOpen] = useState(false)

  return (
    <div className="flex flex-col h-full relative">
      {/* 캘린더 콘텐츠 */}
      <div className="flex-1 flex flex-col min-h-0">
        {calendarView === 'month' ? <MonthCalendar /> : <DayView />}
      </div>

      {/* FAB 버튼 - 월간 뷰에서만 */}
      {calendarView === 'month' && (
        <>
          {fabOpen && (
            <>
              <div className="absolute inset-0 z-10" onClick={() => setFabOpen(false)} />
              <div className="absolute bottom-20 right-4 z-20 flex flex-col gap-2 items-end">
                {[
                  { type: 'lesson' as const, label: '레슨', color: '#10b981' },
                  { type: 'choreo' as const, label: '안무', color: '#8b5cf6' },
                  { type: 'personal' as const, label: '개인 일정', color: '#60a5fa' },
                ].map(({ type, label, color }) => (
                  <button
                    key={type}
                    onClick={() => { openInputModal(type, selectedDate); setFabOpen(false) }}
                    className="flex items-center gap-2 bg-white shadow-lg border border-gray-100 rounded-full px-4 py-2.5 text-sm font-medium text-gray-800 whitespace-nowrap"
                  >
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}
          <button
            onClick={() => setFabOpen(!fabOpen)}
            className="absolute bottom-4 right-4 w-14 h-14 bg-emerald-500 text-white rounded-full shadow-lg flex items-center justify-center z-10"
          >
            <Plus
              size={28}
              style={{ transform: fabOpen ? 'rotate(45deg)' : 'none', transition: 'transform 0.15s' }}
            />
          </button>
        </>
      )}
    </div>
  )
}
