import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { useAppStore } from '../stores/appStore'
import { CHOREO_LABELS } from '../types'
import { formatKRW } from '../rules/utils'
import { Music, CheckCircle, Clock } from 'lucide-react'

export default function ChoreoPage() {
  const { openInputModal } = useAppStore()
  const [filter, setFilter] = useState<'all' | 'active' | 'billed'>('all')

  const choreos = useLiveQuery(() => db.choreos.orderBy('createdAt').reverse().toArray(), []) ?? []
  const teachers = useLiveQuery(() => db.teachers.toArray(), []) ?? []

  const filtered = choreos.filter(c => {
    if (filter === 'active') return !c.billedMonth
    if (filter === 'billed') return !!c.billedMonth
    return true
  })

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Music size={20} className="text-violet-500" />
            안무 관리
          </h1>
          <button
            onClick={() => openInputModal('choreo')}
            className="bg-violet-500 text-white px-4 py-1.5 rounded-xl text-sm font-medium"
          >
            + 추가
          </button>
        </div>
        {/* 필터 탭 */}
        <div className="flex bg-gray-100 rounded-xl p-1">
          {(['all', 'active', 'billed'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'
              }`}
            >
              {f === 'all' ? '전체' : f === 'active' ? '진행중' : '청구완료'}
            </button>
          ))}
        </div>
      </div>

      {/* 목록 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">안무 내역이 없습니다</div>
        ) : (
          filtered.map(c => {
            const teacher = teachers.find(t => t.id === c.teacherId)
            const ended = c.sessions.some(s => s.sessionNum === 'end')
            return (
              <div key={c.id} className={`border rounded-2xl p-4 ${c.billedMonth ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200'}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-gray-800">{c.studentName}</span>
                      {c.billedMonth ? (
                        <CheckCircle size={16} className="text-emerald-500" />
                      ) : ended ? (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">끝 처리됨</span>
                      ) : (
                        <Clock size={16} className="text-gray-400" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">{CHOREO_LABELS[c.level]}</span>
                      {teacher && (
                        <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: teacher.color }}>
                          {teacher.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold" style={{ color: c.billedMonth ? '#6b7280' : '#8b5cf6' }}>
                      {formatKRW(c.totalFee)}
                    </div>
                    {c.billedMonth && (
                      <div className="text-xs text-gray-400">{c.billedMonth} 청구</div>
                    )}
                  </div>
                </div>

                {/* 회차 진행 현황 */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {c.sessions.map((s, i) => (
                    <div
                      key={i}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        s.sessionNum === 'end'
                          ? 'bg-red-100 text-red-600'
                          : 'bg-violet-100 text-violet-600'
                      }`}
                    >
                      {s.sessionNum === 'end' ? '끝' : `${s.sessionNum}회`}
                      <span className="text-xs ml-1 opacity-60">{s.date.slice(5).replace('-', '/')}</span>
                    </div>
                  ))}
                </div>

                {/* 이월 안내 */}
                {!ended && !c.billedMonth && (
                  <p className="text-xs text-gray-400 mt-2">진행 중 — "끝" 처리 시 청구됩니다</p>
                )}
              </div>
            )
          })
        )}
      </div>

    </div>
  )
}
