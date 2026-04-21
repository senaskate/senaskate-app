import { useState, useEffect, useRef } from 'react'
import { seedIfEmpty } from './db/seed'
import { seedHistoricalData } from './db/historicalSeed'
import { seedAprilData } from './db/aprilSeed'
import BottomNav from './components/common/BottomNav'
import BottomSheet from './components/common/BottomSheet'
import SplashScreen from './components/common/SplashScreen'
import CalendarPage from './pages/CalendarPage'
import StatsPage from './pages/StatsPage'
import TeacherPage from './pages/TeacherPage'
import ChoreoPage from './pages/ChoreoPage'
import SettingsPage from './pages/SettingsPage'
import LessonInput from './components/lesson/LessonInput'
import ChoreoInput from './components/lesson/ChoreoInput'
import PersonalEventInput from './components/lesson/PersonalEventInput'
import { useAppStore } from './stores/appStore'

export default function App() {
  const [activeTab, setActiveTab] = useState('calendar')
  const { inputModal, closeInputModal, currentMonth, setCurrentMonth } = useAppStore()

  // 전역 좌우 스와이프 → 이전/다음 달
  const swipeTouchStartX = useRef(0)
  const swipeTouchStartY = useRef(0)
  function handleSwipeTouchStart(e: React.TouchEvent) {
    swipeTouchStartX.current = e.touches[0].clientX
    swipeTouchStartY.current = e.touches[0].clientY
  }
  function handleSwipeTouchEnd(e: React.TouchEvent) {
    const dx = e.changedTouches[0].clientX - swipeTouchStartX.current
    const dy = e.changedTouches[0].clientY - swipeTouchStartY.current
    if (Math.abs(dx) > Math.abs(dy) * 1.2 && Math.abs(dx) > 40) {
      const [y, m] = currentMonth.split('-').map(Number)
      const d = dx > 0 ? new Date(y, m - 2, 1) : new Date(y, m, 1)
      setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    }
  }

  useEffect(() => {
    seedIfEmpty().then(() => seedHistoricalData()).then(() => seedAprilData())
  }, [])

  return (
    <>
      <SplashScreen />
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <main
          className="flex-1 min-h-0 overflow-hidden flex flex-col"
          style={{ touchAction: 'pan-y' }}
          onTouchStart={handleSwipeTouchStart}
          onTouchEnd={handleSwipeTouchEnd}
        >
          {activeTab === 'calendar' && <CalendarPage />}
          {activeTab === 'stats' && <StatsPage />}
          {activeTab === 'teacher' && <TeacherPage />}
          {activeTab === 'choreo' && <ChoreoPage />}
          {activeTab === 'settings' && <SettingsPage />}
        </main>
        <BottomNav active={activeTab} onChange={setActiveTab} />
        <BottomSheet open={inputModal.open} onClose={closeInputModal}>
          {inputModal.type === 'lesson' && <LessonInput />}
          {inputModal.type === 'choreo' && <ChoreoInput />}
          {inputModal.type === 'personal' && <PersonalEventInput />}
        </BottomSheet>
      </div>
    </>
  )
}
