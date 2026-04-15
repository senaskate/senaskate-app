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

export default function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    // #root가 position:fixed이므로 flex-shrink-0만으로 항상 하단에 고정됨
    // padding-bottom으로 홈 인디케이터 영역까지 배경을 채워서 탭이 진짜 맨 아래 붙음
    <nav
      className="flex items-center border-t border-gray-100 bg-white flex-shrink-0"
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
  )
}
