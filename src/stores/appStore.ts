import { create } from 'zustand'
import { toYYYYMM, localDateStr } from '../rules/utils'

interface AppState {
  // 현재 선택된 날짜 / 월
  selectedDate: string       // YYYY-MM-DD
  currentMonth: string       // YYYY-MM
  setSelectedDate: (date: string) => void
  setCurrentMonth: (month: string) => void

  // 캘린더 뷰 모드
  calendarView: 'month' | 'day'
  setCalendarView: (v: 'month' | 'day') => void

  // 입력 모달
  inputModal: {
    open: boolean
    type: 'lesson' | 'choreo' | 'personal' | null
    editId: string | null
    prefillDate: string | null
  }
  openInputModal: (type: 'lesson' | 'choreo' | 'personal', date?: string, editId?: string) => void
  closeInputModal: () => void
}

const today = toYYYYMM(new Date())
const todayStr = localDateStr()

export const useAppStore = create<AppState>((set) => ({
  selectedDate: todayStr,
  currentMonth: today,
  setSelectedDate: (date) => set({ selectedDate: date, currentMonth: date.substring(0, 7) }),
  setCurrentMonth: (month) => set({ currentMonth: month }),

  calendarView: 'month',
  setCalendarView: (v) => set({ calendarView: v }),

  inputModal: { open: false, type: null, editId: null, prefillDate: null },
  openInputModal: (type, date, editId) =>
    set({ inputModal: { open: true, type, editId: editId ?? null, prefillDate: date ?? null } }),
  closeInputModal: () =>
    set({ inputModal: { open: false, type: null, editId: null, prefillDate: null } }),
}))
