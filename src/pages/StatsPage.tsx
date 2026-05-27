import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { useAppStore } from '../stores/appStore'
import { formatKRW } from '../rules/utils'
import { getBillableChoreos } from '../rules/choreo'
import { ChevronLeft, ChevronRight, Lock } from 'lucide-react'

export default function StatsPage() {
  const { currentMonth, setCurrentMonth } = useAppStore()
  const [selYear, selMonth] = currentMonth.split('-').map(Number)

  const teachers = useLiveQuery(() => db.teachers.toArray(), []) ?? []
  const allLessons = useLiveQuery(() =>
    db.lessons.where('date').between(`${selYear}-01-01`, `${selYear}-12-31`, true, true).toArray()
  , [selYear]) ?? []
  const allChoreos = useLiveQuery(() => db.choreos.toArray(), []) ?? []
  const monthCloses = useLiveQuery(() => db.monthClose.toArray(), []) ?? []

  function prevYear() {
    setCurrentMonth(`${selYear - 1}-${String(selMonth).padStart(2, '0')}`)
  }
  function nextYear() {
    setCurrentMonth(`${selYear + 1}-${String(selMonth).padStart(2, '0')}`)
  }
  function selectMonth(m: number) {
    setCurrentMonth(`${selYear}-${String(m).padStart(2, '0')}`)
  }

  // 현재 실제 날짜 (오늘 기준 미래 달은 표시하되 회색)
  const todayYYYYMM = new Date().toISOString().slice(0, 7)

  // 월별 집계
  const monthRows = useMemo(() => {
    return Array.from({ length: 12 }, (_, idx) => {
      const m = idx + 1
      const yyyymm = `${selYear}-${String(m).padStart(2, '0')}`
      const isClosed = monthCloses.some(c => c.month === yyyymm)
      const closedData = monthCloses.find(c => c.month === yyyymm)

      if (isClosed && closedData) {
        return {
          month: m,
          yyyymm,
          lessonTotal: closedData.lessonTotal,
          choreoTotal: closedData.choreoTotal,
          grandTotal: closedData.grandTotal,
          isClosed: true,
          isFuture: yyyymm > todayYYYYMM,
        }
      }

      // 미마감: 실시간 계산
      const mLessons = allLessons.filter(l => l.date.startsWith(yyyymm))
      const lessonTotal = mLessons.reduce((sum, l) =>
        sum + l.students.reduce((s, st) => s + st.fee + (st.offIceFee ?? 0), 0), 0)
      const billable = getBillableChoreos(allChoreos, yyyymm)
      const choreoTotal = billable.reduce((s, c) => s + c.totalFee, 0)

      return {
        month: m,
        yyyymm,
        lessonTotal,
        choreoTotal,
        grandTotal: lessonTotal + choreoTotal,
        isClosed: false,
        isFuture: yyyymm > todayYYYYMM,
      }
    })
  }, [selYear, allLessons, allChoreos, monthCloses, todayYYYYMM])

  const yearTotal = monthRows.reduce((sum, r) => sum + r.grandTotal, 0)
  const maxVal = Math.max(...monthRows.map(r => r.grandTotal), 1)

  // 선택된 달 상세 (하단 카드)
  const selected = monthRows.find(r => r.month === selMonth)

  // 선택된 달 선생님별 합계
  const selectedTeacherTotals = useMemo(() => {
    if (!selected) return []
    const mLessons = allLessons.filter(l => l.date.startsWith(selected.yyyymm))
    return teachers.map(t => {
      const tLessons = mLessons.filter(l => l.teacherId === t.id)
      const total = tLessons.reduce((sum, l) =>
        sum + l.students.reduce((s, st) => s + st.fee + (st.offIceFee ?? 0), 0), 0)
      return { teacher: t, total }
    }).filter(t => t.total > 0)
  }, [selected, allLessons, teachers])

  return (
    <div className="flex flex-col h-full overflow-y-auto overflow-x-hidden">
      {/* 년도 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
        <button onClick={prevYear} className="p-1 rounded-full hover:bg-gray-100">
          <ChevronLeft size={20} className="text-gray-600" />
        </button>
        <span className="text-base font-semibold text-gray-800">{selYear}년 수익 현황</span>
        <button onClick={nextYear} className="p-1 rounded-full hover:bg-gray-100">
          <ChevronRight size={20} className="text-gray-600" />
        </button>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* 연간 총수익 카드 */}
        <div className="bg-gray-800 rounded-2xl px-5 py-4 text-white">
          <p className="text-xs opacity-60">{selYear}년 총 수익</p>
          <p className="text-2xl font-bold mt-1">{formatKRW(yearTotal)}</p>
        </div>

        {/* 월별 목록 */}
        <div className="space-y-2">
          {monthRows.map(row => {
            const isSelected = row.month === selMonth
            const isEmpty = row.grandTotal === 0
            return (
              <button
                key={row.month}
                onClick={() => selectMonth(row.month)}
                className={`w-full rounded-xl px-4 py-3 text-left transition-colors ${
                  isSelected
                    ? 'bg-emerald-500 text-white'
                    : row.isFuture
                    ? 'bg-gray-50 text-gray-300'
                    : 'bg-gray-50 text-gray-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* 월 이름 */}
                  <div className="flex items-center gap-1.5 w-12 flex-shrink-0">
                    <span className={`text-sm font-bold ${isSelected ? 'text-white' : row.isFuture ? 'text-gray-300' : 'text-gray-900'}`}>
                      {row.month}월
                    </span>
                    {row.isClosed && (
                      <Lock size={10} className={isSelected ? 'text-white/70' : 'text-gray-400'} />
                    )}
                  </div>

                  {/* 바 차트 */}
                  <div className="flex-1 bg-black/10 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isSelected ? 'bg-white/80' : row.isFuture ? 'bg-gray-200' : 'bg-emerald-400'}`}
                      style={{ width: isEmpty ? '0%' : `${(row.grandTotal / maxVal) * 100}%` }}
                    />
                  </div>

                  {/* 금액 */}
                  <span className={`text-sm font-semibold w-20 text-right flex-shrink-0 ${
                    isSelected ? 'text-white' : isEmpty ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {isEmpty ? '-' : `${(row.grandTotal / 10000).toFixed(0)}만`}
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        {/* 선택된 달 상세 카드 */}
        {selected && selected.grandTotal > 0 && (
          <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-800">{selYear}년 {selMonth}월 상세</span>
              {selected.isClosed && <Lock size={12} className="text-gray-400" />}
            </div>

            {/* 레슨 + 안무 소계 */}
            <div className="flex gap-3">
              <div className="flex-1 bg-emerald-50 rounded-xl px-3 py-2.5">
                <p className="text-xs text-emerald-600 mb-0.5">레슨</p>
                <p className="text-base font-bold text-emerald-700">{formatKRW(selected.lessonTotal)}</p>
              </div>
              {selected.choreoTotal > 0 && (
                <div className="flex-1 bg-violet-50 rounded-xl px-3 py-2.5">
                  <p className="text-xs text-violet-600 mb-0.5">안무</p>
                  <p className="text-base font-bold text-violet-700">{formatKRW(selected.choreoTotal)}</p>
                </div>
              )}
            </div>

            {/* 선생님별 */}
            {selectedTeacherTotals.length > 0 && (
              <div className="space-y-1.5">
                {selectedTeacherTotals.map(({ teacher, total }) => (
                  <div key={teacher.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: teacher.color }} />
                      <span className="text-sm text-gray-700">{teacher.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-800">{formatKRW(total)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* 합계 */}
            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
              <span className="text-sm font-bold text-gray-800">합계</span>
              <span className="text-lg font-extrabold text-emerald-600">{formatKRW(selected.grandTotal)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
