import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { useAppStore } from '../stores/appStore'
import { DEFAULT_PRICES, CHOREO_LABELS, type ChoreoLevel } from '../types'
import { formatKRW } from '../rules/utils'
import { getBillableChoreos } from '../rules/choreo'
import { Lock, Unlock, Download } from 'lucide-react'
import html2canvas from 'html2canvas'
import JSZip from 'jszip'
import { generateId } from '../rules/utils'

export default function SettingsPage() {
  const { currentMonth } = useAppStore()
  const [year, month] = currentMonth.split('-').map(Number)
  const [activeTab, setActiveTab] = useState<'close' | 'teachers' | 'prices'>('close')

  const teachers = useLiveQuery(() => db.teachers.toArray(), []) ?? []
  const config = useLiveQuery(() => db.config.get('default'), [])
  const prices = config ?? DEFAULT_PRICES
  const monthCloses = useLiveQuery(() => db.monthClose.toArray(), []) ?? []
  const isClosed = monthCloses.some(c => c.month === currentMonth)

  const lessons = useLiveQuery(() =>
    db.lessons.where('date').between(`${currentMonth}-01`, `${currentMonth}-31`, true, true).toArray()
  , [currentMonth]) ?? []
  const allChoreos = useLiveQuery(() => db.choreos.toArray(), []) ?? []

  const billableChoreos = getBillableChoreos(allChoreos, currentMonth)

  const lessonTotal = lessons.reduce((sum, l) =>
    sum + l.students.reduce((s, st) => s + st.fee + (st.offIceFee ?? 0), 0), 0)
  const choreoTotal = billableChoreos.reduce((sum, c) => sum + c.totalFee, 0)

  async function handleCloseMonth() {
    if (isClosed) {
      if (!confirm('마감을 취소할까요?')) return
      await db.monthClose.where('month').equals(currentMonth).delete()
      return
    }
    if (!confirm(`${year}년 ${month}월을 마감할까요? 안무 청구가 확정됩니다.`)) return

    // 안무 billedMonth 설정
    for (const c of billableChoreos) {
      await db.choreos.update(c.id, { billedMonth: currentMonth })
    }

    await db.monthClose.add({
      id: generateId(),
      month: currentMonth,
      closedAt: Date.now(),
      lessonTotal,
      choreoTotal,
      grandTotal: lessonTotal + choreoTotal,
    })
  }

  async function handleBulkDownload() {
    const zip = new JSZip()
    // 각 선생님별 임시 div 생성 후 캡처
    for (const teacher of teachers) {
      const tLessons = lessons.filter(l => l.teacherId === teacher.id)
      if (tLessons.length === 0) continue

      const div = document.createElement('div')
      div.style.cssText = 'position:fixed;top:-9999px;left:-9999px;background:white;width:400px;padding:20px;font-family:sans-serif;'
      div.innerHTML = `
        <h2 style="font-size:16px;font-weight:bold;margin-bottom:12px;color:#1a1a1a">${teacher.name} · ${year}년 ${month}월</h2>
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead><tr style="background:#f9fafb">
            <th style="padding:8px;text-align:left;border-bottom:1px solid #e5e7eb">날짜</th>
            <th style="padding:8px;text-align:left;border-bottom:1px solid #e5e7eb">장소</th>
            <th style="padding:8px;text-align:left;border-bottom:1px solid #e5e7eb">이름</th>
            <th style="padding:8px;text-align:right;border-bottom:1px solid #e5e7eb">분</th>
            <th style="padding:8px;text-align:right;border-bottom:1px solid #e5e7eb">금액</th>
          </tr></thead>
          <tbody>
            ${tLessons.sort((a, b) => a.date.localeCompare(b.date)).flatMap(l =>
              l.students.map((s, i) => `<tr style="border-bottom:1px solid #f3f4f6">
                <td style="padding:6px 8px;color:#6b7280">${i === 0 ? l.date.slice(5).replace('-', '/') : ''}</td>
                <td style="padding:6px 8px;color:#6b7280">${i === 0 ? l.location : ''}</td>
                <td style="padding:6px 8px;font-weight:500">${s.name}${s.unpaid ? ' (미납)' : ''}</td>
                <td style="padding:6px 8px;text-align:right;color:#6b7280">${s.minutes}분</td>
                <td style="padding:6px 8px;text-align:right;font-weight:600">${(s.fee + (s.offIceFee ?? 0)).toLocaleString()}</td>
              </tr>`)
            ).join('')}
          </tbody>
        </table>
      `
      document.body.appendChild(div)
      const canvas = await html2canvas(div, { scale: 2, backgroundColor: '#ffffff' })
      document.body.removeChild(div)
      const blob = await new Promise<Blob>(res => canvas.toBlob(b => res(b!), 'image/png'))
      zip.file(`${currentMonth}_${teacher.name}.png`, blob)
    }
    const content = await zip.generateAsync({ type: 'blob' })
    const link = document.createElement('a')
    link.download = `${currentMonth}_레슨비_전체.zip`
    link.href = URL.createObjectURL(content)
    link.click()
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 py-4 border-b border-gray-100">
        <h1 className="text-lg font-bold text-gray-800">설정</h1>
      </div>

      {/* 탭 */}
      <div className="flex border-b border-gray-100">
        {(['close', 'teachers', 'prices'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500'
            }`}
          >
            {tab === 'close' ? '월 마감' : tab === 'teachers' ? '선생님/학생' : '단가'}
          </button>
        ))}
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* 월 마감 탭 */}
        {activeTab === 'close' && (
          <>
            <div className={`rounded-2xl p-4 border ${isClosed ? 'bg-gray-50 border-gray-200' : 'bg-amber-50 border-amber-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                {isClosed ? <Lock size={18} className="text-gray-500" /> : <Unlock size={18} className="text-amber-600" />}
                <span className="font-semibold text-sm text-gray-800">
                  {year}년 {month}월 {isClosed ? '마감됨' : '정산 예정'}
                </span>
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>레슨 합계</span>
                  <span className="font-medium">{formatKRW(lessonTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>안무 합계 ({billableChoreos.length}건)</span>
                  <span className="font-medium">{formatKRW(choreoTotal)}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-800 pt-1 border-t border-gray-200 mt-1">
                  <span>총계</span>
                  <span className="text-emerald-600">{formatKRW(lessonTotal + choreoTotal)}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleCloseMonth}
              className={`w-full py-3 rounded-xl font-semibold text-sm ${
                isClosed ? 'bg-gray-200 text-gray-600' : 'bg-emerald-500 text-white'
              }`}
            >
              {isClosed ? '마감 취소' : `${month}월 마감 확정`}
            </button>

            <button
              onClick={handleBulkDownload}
              className="w-full flex items-center justify-center gap-2 bg-gray-800 text-white rounded-xl py-3 text-sm font-medium"
            >
              <Download size={16} />
              선생님별 이미지 전체 다운로드 (ZIP)
            </button>
          </>
        )}

        {/* 선생님/학생 탭 */}
        {activeTab === 'teachers' && (
          <div className="space-y-3">
            {teachers.map(t => (
              <div key={t.id} className="border border-gray-200 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.color }} />
                  <span className="font-semibold text-sm text-gray-800">{t.name}</span>
                  <span className="text-xs text-gray-400">({t.students.length}명)</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{t.students.join(', ') || '학생 없음'}</p>
              </div>
            ))}
          </div>
        )}

        {/* 단가 탭 */}
        {activeTab === 'prices' && (
          <div className="space-y-3">
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-500 border-b border-gray-200">레슨 단가 (원/분)</div>
              {[
                ['개인 (1인)', prices.individual],
                ['세미 (2-3인)', prices.semi],
                ['단체 (4인+)', prices.group],
              ].map(([label, value]) => (
                <div key={String(label)} className="flex justify-between px-3 py-2.5 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-gray-700">{label}</span>
                  <span className="text-sm font-semibold text-gray-800">{Number(value).toLocaleString()}원/분</span>
                </div>
              ))}
            </div>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-500 border-b border-gray-200">안무 단가</div>
              {(Object.entries(CHOREO_LABELS) as [ChoreoLevel, string][]).map(([key, label]) => (
                <div key={key} className="flex justify-between px-3 py-2.5 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-gray-700">{label}</span>
                  <span className="text-sm font-semibold text-gray-800">{formatKRW(prices.choreo[key])}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
