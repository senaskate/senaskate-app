import { useEffect, useRef } from 'react'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  fullHeight?: boolean
}

export default function BottomSheet({ open, onClose, children, fullHeight = true }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ maxWidth: 430, margin: '0 auto' }}>
      {/* 배경 */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      {/* 시트 */}
      <div
        ref={sheetRef}
        className={`relative bg-white rounded-t-3xl shadow-2xl flex flex-col ${fullHeight ? 'h-[92dvh]' : 'max-h-[92dvh]'}`}
      >
        {/* 핸들 */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>
        <div className="flex-1 overflow-hidden flex flex-col">
          {children}
        </div>
      </div>
    </div>
  )
}
