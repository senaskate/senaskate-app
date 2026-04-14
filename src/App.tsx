import { useState, useEffect } from 'react'
import { seedIfEmpty } from './db/seed'
import { seedHistoricalData } from './db/historicalSeed'
import { seedAprilData } from './db/aprilSeed'
import BottomNav from './components/common/BottomNav'
import BottomSheet from './components/common/BottomSheet'
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
  const { inputModal, closeInputModal } = useAppStore()

  useEffect(() => {
    seedIfEmpty().then(() => seedHistoricalData()).then(() => seedAprilData())
  }, [])

  return (
    <div className="flex flex-col h-dvh">
      <main className="flex-1 min-h-0 overflow-hidden flex flex-col">
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
  )
}
