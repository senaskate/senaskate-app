import type { CSSProperties } from 'react'
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

// 공통 스타일
const BASE: CSSProperties = {
  position: 'fixed',
  left: 0,
  right: 0,
  maxWidth: 430,
  margin: '0 auto',
  zIndex: 40,
}

export default function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <>
      {/*
        nav 자체는 safe-area 위에 배치.
        브라우저 모드: safe-area-inset-bottom = 홈 인디케이터 높이 (보통 34px)
                      → nav 바로 아래에 홈 인디케이터 영역 → fill div가 채움
        PWA 모드:     동일하게 동작 — nav 버튼이 홈 인디케이터 위, fill이 그 아래를 흰색으로 채움
      */}
      <nav
        className="flex items-center border-t border-gray-100 bg-white"
        style={{
          ...BASE,
          bottom: 'env(safe-area-inset-bottom, 0px)',
        }}
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

      {/* 홈 인디케이터 영역(safe-area-inset-bottom)을 흰 배경으로 채워서
          PWA/브라우저 모두 nav 아래에 빈 공간이 안 보이도록 */}
      <div
        style={{
          ...BASE,
          bottom: 0,
          height: 'env(safe-area-inset-bottom, 0px)',
          background: 'white',
        }}
      />
    </>
  )
}
