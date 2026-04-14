import { useAppStore } from '../stores/appStore'
import MonthCalendar from '../components/calendar/MonthCalendar'
import DayView from '../components/calendar/DayView'
import { Plus } from 'lucide-react'

export default function CalendarPage() {
  const { calendarView, setCalendarView, openInputModal, selectedDate } = useAppStore()

  return (
    <div className="flex flex-col h-full relative">
      {/* 캘린더 콘텐츠 */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {calendarView === 'month' ? <MonthCalendar /> : <DayView />}
      </div>

      {/* 월간 → 일간 전환 시 뒤로가기 버튼 (일간 뷰에서만) */}
      {calendarView === 'day' && (
        <button
          onClick={() => setCalendarView('month')}
          className="absolute top-3 left-3 text-xs text-emerald-600 font-medium bg-emerald-50 px-3 py-1.5 rounded-full z-10"
        >
          ← 월간
        </button>
      )}

      {/* FAB 버튼 - 월간 뷰에서만 */}
      {calendarView === 'month' && (
        <button
          onClick={() => openInputModal('lesson', selectedDate)}
          className="absolute bottom-4 right-4 w-14 h-14 bg-emerald-500 text-white rounded-full shadow-lg flex items-center justify-center z-10"
        >
          <Plus size={28} />
        </button>
      )}
    </div>
  )
}
