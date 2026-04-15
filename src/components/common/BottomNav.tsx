import { Calendar, BarChart2, Users, Music, Settings } from 'lucide-react'

interface BottomNavProps {
  active: string
  onChange: (tab: string) => void
}

const TABS = [
  { id: 'calendar', icon: Calendar, label: '캘린더' },
  { id: 'stats', icon: BarChart2, label: '통계' },
  { id: 'teacher', icon: Users, label: '내역' },
  { id: 'choreo', icon: Music, label: '안무' },
  { id: 'settings', icon: Settings, label: '설정' },
]

// 탭바 고유 높이 (pt-2.5 10 + icon 24 + gap 4 + text 16 + pb-1 4 = 58px)
const NAV_H = 58

export default function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <>
      {/* position:fixed 로 항상 하단에 고정 */}
      <nav
        className="fixed bottom-0 left-0 right-0 flex items-center border-t border-gray-100 bg-white z-50"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {TABS.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`flex-1 flex flex-col items-center pt-2.5 pb-1 gap-1 transition-colors ${
              active === id ? 'text-emerald-500' : 'text-gray-400'
            }`}
          >
            <Icon size={24} strokeWidth={active === id ? 2.5 : 1.8} />
            <span className={`text-xs ${active === id ? 'font-semibold' : 'font-normal'}`}>{label}</span>
          </button>
        ))}
      </nav>
      {/* 고정 네비바만큼 플로우 공간 확보 (콘텐츠가 탭 뒤로 숨지 않도록) */}
      <div
        aria-hidden
        className="flex-shrink-0 w-full"
        style={{ height: `calc(${NAV_H}px + env(safe-area-inset-bottom, 0px))` }}
      />
    </>
  )
}
