import { useAppStore } from '../stores/appStore'
import MonthCalendar from '../components/calendar/MonthCalendar'
import DayView from '../components/calendar/DayView'
import BottomSheet from '../components/common/BottomSheet'
import LessonInput from '../components/lesson/LessonInput'
import ChoreoInput from '../components/lesson/ChoreoInput'
import PersonalEventInput from '../components/lesson/PersonalEventInput'
import { CalendarDays, List } from 'lucide-react'

export default function CalendarPage() {
  const { calendarView, setCalendarView, inputModal, closeInputModal } = useAppStore()

  return (
    <div className="flex flex-col h-full">
      {/* 상단 뷰 전환 탭 */}
      <div className="flex items-center justify-end px-4 py-2 border-b border-gray-100">
        <div className="flex bg-gray-100 rounded-xl p-0.5">
          <button
            onClick={() => setCalendarView('month')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              calendarView === 'month' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'
            }`}
          >
            <CalendarDays size={14} />
            월간
          </button>
          <button
            onClick={() => setCalendarView('day')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              calendarView === 'day' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'
            }`}
          >
            <List size={14} />
            일간
          </button>
        </div>
      </div>

      {/* 캘린더 콘텐츠 */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {calendarView === 'month' ? <MonthCalendar /> : <DayView />}
      </div>

      {/* 입력 바텀시트 */}
      <BottomSheet open={inputModal.open} onClose={closeInputModal}>
        {inputModal.type === 'lesson' && <LessonInput />}
        {inputModal.type === 'choreo' && <ChoreoInput />}
        {inputModal.type === 'personal' && <PersonalEventInput />}
      </BottomSheet>
    </div>
  )
}
