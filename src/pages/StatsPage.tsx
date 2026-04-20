import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { useAppStore } from '../stores/appStore'
import { formatKRW, toYYYYMM } from '../rules/utils'
import { getBillableChoreos } from '../rules/choreo'
import { CHOREO_LABELS } from '../types'
import { ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react'

export default function StatsPage() {
  const { currentMonth, setCurrentMonth } = useAppStore()
  const [year, month] = currentMonth.split('-').map(Number)

  const teachers = useLiveQuery(() => db.teachers.toArray(), []) ?? []
  const lessons = useLiveQuery(() =>
    db.lessons.where('date').between(`${currentMonth}-01`, `${currentMonth}-31`, true, true).toArray()
  , [currentMonth]) ?? []
  const allChoreos = useLiveQuery(() => db.choreos.toArray(), []) ?? []
  const monthCloses = useLiveQuery(() => db.monthClose.toArray(), []) ?? []

  function prevMonth() {
    const d = new Date(year, month - 2, 1)
    setCurrentMonth(toYYYYMM(d))
  }
  function nextMonth() {
    const d = new Date(year, month, 1)
    setCurrentMonth(toYYYYMM(d))
  }

  // 선생님별 레슨 합계
  const teacherTotals = teachers.map(t => {
    const tLessons = lessons.filter(l => l.teacherId === t.id)
    const total = tLessons.reduce((sum, l) =>
      sum + l.students.reduce((s, st) => s + st.fee + (st.offIceFee ?? 0), 0), 0)
    return { teacher: t, total }
  }).filter(t => t.total > 0 || t.teacher.id === 'shin')

  // 신쌤은 레슨 기반으로 계산 (이전 고정100만 제거)
  const lessonTotal = teacherTotals.reduce((sum, t) => sum + t.total, 0)

  // 이번 달 청구 안무
  const billableChoreos = getBillableChoreos(allChoreos, currentMonth)
  const choreoTotal = billableChoreos.reduce((sum, c) => sum + c.totalFee, 0)

  const monthTotal = lessonTotal + choreoTotal

  // 월별 누적 (마감된 달 기준)
  const monthlyData = monthCloses
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6)

  // 연간 총수익: 마감된 달 합계 + 현재 선택 달이 미마감이면 계산값 추가
  const isCurrentMonthClosed = monthCloses.some(c => c.month === currentMonth)
  const closedYearTotal = monthCloses
    .filter(c => c.month.startsWith(String(year)))
    .reduce((sum, c) => sum + c.grandTotal, 0)
  const yearTotal = closedYearTotal +
    (currentMonth.startsWith(String(year)) && !isCurrentMonthClosed ? monthTotal : 0)

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* 월 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <button onClick={prevMonth} className="p-1 rounded-full hover:bg-gray-100">
          <ChevronLeft size={20} className="text-gray-600" />
        </button>
        <span className="text-base font-semibold text-gray-800">{year}년 {month}월 수익 현황</span>
        <button onClick={nextMonth} className="p-1 rounded-full hover:bg-gray-100">
          <ChevronRight size={20} className="text-gray-600" />
        </button>
      </div>

      <div className="px-4 py-4 space-y-5">
        {/* 월 총수익 카드 */}
        <div className="bg-emerald-500 rounded-2xl p-5 text-white">
          <p className="text-sm opacity-80">{month}월 총 수익</p>
          <p className="text-3xl font-bold mt-1">{formatKRW(monthTotal)}</p>
          <div className="flex gap-4 mt-3 text-sm opacity-80">
            <span>레슨 {formatKRW(lessonTotal)}</span>
            <span>안무 {formatKRW(choreoTotal)}</span>
          </div>
        </div>

        {/* 선생님별 합계 */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 mb-3">선생님별 합계</h3>
          <div className="space-y-2">
            {teacherTotals.map(({ teacher, total }) => (
              <div key={teacher.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: teacher.color }} />
                  <span className="text-sm font-medium text-gray-800">{teacher.name}</span>
                </div>
                <span className="text-sm font-semibold text-gray-800">{formatKRW(total)}</span>
              </div>
            ))}
            <div className="flex justify-between px-4 py-3 bg-emerald-50 rounded-xl">
              <span className="text-sm font-bold text-emerald-800">레슨 소계</span>
              <span className="text-sm font-bold text-emerald-600">{formatKRW(lessonTotal)}</span>
            </div>
          </div>
        </div>

        {/* 안무 합계 */}
        {billableChoreos.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-3">안무 청구</h3>
            <div className="space-y-2">
              {billableChoreos.map(c => (
                <div key={c.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                  <div>
                    <span className="text-sm font-medium text-gray-800">{c.studentName}</span>
                    <span className="text-xs text-gray-400 ml-2">{CHOREO_LABELS[c.level]}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-800">{formatKRW(c.totalFee)}</span>
                </div>
              ))}
              <div className="flex justify-between px-4 py-3 bg-violet-50 rounded-xl">
                <span className="text-sm font-bold text-violet-800">안무 소계</span>
                <span className="text-sm font-bold text-violet-600">{formatKRW(choreoTotal)}</span>
              </div>
            </div>
          </div>
        )}

        {/* 월별 누적 바 차트 */}
        {monthlyData.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={16} className="text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-500">월별 수익</h3>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              {(() => {
                const maxVal = Math.max(...monthlyData.map(m => m.grandTotal), 1)
                return monthlyData.map(m => (
                  <div key={m.month} className="flex items-center gap-3 mb-2 last:mb-0">
                    <span className="text-xs text-gray-500 w-10">{m.month.slice(5)}월</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${(m.grandTotal / maxVal) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-700 w-16 text-right">
                      {(m.grandTotal / 10000).toFixed(0)}만
                    </span>
                  </div>
                ))
              })()}
            </div>
          </div>
        )}

        {/* 연간 총수익 */}
        <div className="bg-gray-800 rounded-2xl px-5 py-4 text-white">
          <div className="flex items-center gap-2">
            <p className="text-xs opacity-60">{year}년 총 수익</p>
            {!isCurrentMonthClosed && currentMonth.startsWith(String(year)) && (
              <span className="text-xs bg-white/20 rounded-full px-2 py-0.5">집계 중</span>
            )}
          </div>
          <p className="text-2xl font-bold mt-1">{formatKRW(yearTotal)}</p>
          {!isCurrentMonthClosed && currentMonth.startsWith(String(year)) && (
            <p className="text-xs opacity-50 mt-1">마감된 달 + {month}월 예상 포함</p>
          )}
        </div>
      </div>
    </div>
  )
}
